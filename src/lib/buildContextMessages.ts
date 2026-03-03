/**
 * Construit une fenêtre de contexte intelligente pour le chat GENIA.
 *
 * PROBLÈME RÉSOLU : Avec un simple slice(-6), les messages importants
 * (exercices, exemples) sont perdus quand la conversation s'allonge.
 * L'IA perd le contexte et corrige son propre exemple au lieu de
 * la tentative de l'étudiant.
 *
 * SOLUTION : On garde toujours les messages pédagogiquement importants
 * (exercices, exemples, évaluations) + les N derniers messages récents.
 */

interface ChatMessage {
  role: string;
  content: string;
  methodStep?: string;
}

// Mots-clés qui indiquent un message pédagogiquement important
const EXERCISE_KEYWORDS = [
  'exercice', 'essaie', 'essayez', 'à ton tour', 'à votre tour',
  'maintenant, écris', 'maintenant, essaie', 'tente de', 'tentez de',
  'rédige', 'rédigez', 'crée un prompt', 'créez un prompt',
  'pratique', 'entraîne-toi', 'entraînez-vous',
  'à toi de jouer', "c'est à toi", 'lance-toi',
  'voici l\'exercice', 'voici un exercice',
  'essaye', 'propose', 'formule', 'construis'
];

const EXAMPLE_KEYWORDS = [
  'voici un exemple', 'par exemple', 'exemple concret',
  'voici comment', 'regarde cet exemple', 'regardez cet exemple',
  'démonstration', 'illustration',
  'prompt efficace', 'bon prompt', 'mauvais prompt',
  'avant :', 'après :', '❌', '✅', '→'
];

const EVALUATION_KEYWORDS = [
  'ta réponse', 'votre réponse', 'ton prompt', 'votre prompt',
  'évaluation', 'correction', 'feedback', 'score',
  'bravo', 'excellent', 'bien joué', 'super',
  'améliorer', 'suggestion', 'point fort', 'point faible',
  'tu as réussi', 'tu peux améliorer'
];

/**
 * Détecte si un message est pédagogiquement important
 */
function isPedagogicallyImportant(message: ChatMessage): boolean {
  const content = message.content.toLowerCase();

  // Les messages avec un pilier GENIA explicite sont importants
  if (message.methodStep === 'I' || message.methodStep === 'E' || message.methodStep === 'A') {
    return true;
  }

  // Vérifier les mots-clés d'exercice
  if (EXERCISE_KEYWORDS.some(kw => content.includes(kw))) return true;

  // Vérifier les mots-clés d'exemple
  if (EXAMPLE_KEYWORDS.some(kw => content.includes(kw))) return true;

  // Vérifier les mots-clés d'évaluation
  if (EVALUATION_KEYWORDS.some(kw => content.includes(kw))) return true;

  return false;
}

/**
 * Construit une fenêtre de contexte intelligente.
 *
 * Stratégie :
 * 1. Toujours garder les messages "pédagogiquement importants" (exercices, exemples, évaluations)
 * 2. Toujours garder les N derniers messages pour le contexte immédiat
 * 3. Si le total dépasse la limite, couper les messages non-importants du milieu
 * 4. Ajouter un résumé de contexte si des messages ont été coupés
 *
 * @param messages - Tous les messages de la conversation (sans le message courant)
 * @param currentUserMessage - Le message que l'utilisateur vient d'envoyer
 * @param maxMessages - Nombre max de messages à envoyer (défaut: 24)
 * @returns Array de messages optimisé pour l'API
 */
export function buildContextMessages(
  messages: ChatMessage[],
  currentUserMessage: string,
  maxMessages: number = 24
): { role: string; content: string }[] {
  // Filtrer le message système initial (on le gère séparément)
  const conversationMessages = messages.filter(m => m.role !== 'system');

  // Si la conversation est courte, tout garder
  if (conversationMessages.length <= maxMessages) {
    return conversationMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));
  }

  // Identifier les messages importants
  const importantIndices = new Set<number>();

  conversationMessages.forEach((msg, index) => {
    if (isPedagogicallyImportant(msg)) {
      importantIndices.add(index);
      // Garder aussi le message suivant (souvent la réponse de l'étudiant à l'exercice)
      if (index + 1 < conversationMessages.length) {
        importantIndices.add(index + 1);
      }
      // Garder aussi le message précédent pour le contexte
      if (index > 0) {
        importantIndices.add(index - 1);
      }
    }
  });

  // Toujours garder les 12 derniers messages (contexte immédiat)
  const recentCount = Math.min(12, conversationMessages.length);
  const recentStartIndex = conversationMessages.length - recentCount;
  for (let i = recentStartIndex; i < conversationMessages.length; i++) {
    importantIndices.add(i);
  }

  // Toujours garder les 2 premiers messages (début de conversation)
  if (conversationMessages.length > 0) importantIndices.add(0);
  if (conversationMessages.length > 1) importantIndices.add(1);

  // Construire la liste finale
  const selectedIndices = Array.from(importantIndices).sort((a, b) => a - b);

  // Si on dépasse encore la limite, garder les importants + les plus récents
  let finalIndices = selectedIndices;
  if (finalIndices.length > maxMessages) {
    // Priorité : messages récents > messages importants anciens
    const recentIndices = selectedIndices.filter(i => i >= recentStartIndex);
    const importantOldIndices = selectedIndices
      .filter(i => i < recentStartIndex && isPedagogicallyImportant(conversationMessages[i]))
      .slice(-Math.max(4, maxMessages - recentIndices.length)); // Garder au moins les 4 plus importants

    finalIndices = [...importantOldIndices, ...recentIndices]
      .sort((a, b) => a - b)
      .slice(0, maxMessages);
  }

  // Construire les messages avec indicateur de coupure
  const result: { role: string; content: string }[] = [];
  let lastIndex = -1;

  for (const index of finalIndices) {
    // Si on a sauté des messages, ajouter un indicateur
    if (lastIndex >= 0 && index > lastIndex + 1) {
      const skippedCount = index - lastIndex - 1;
      result.push({
        role: 'system',
        content: `[${skippedCount} message(s) intermédiaire(s) omis pour la concision]`,
      });
    }

    result.push({
      role: conversationMessages[index].role,
      content: conversationMessages[index].content,
    });
    lastIndex = index;
  }

  return result;
}
