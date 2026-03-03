// src/lib/smart-suggestions.ts
// Context-aware smart suggestion generator for GENIA chat

import type { SmartSuggestion } from '@/types/chat.types';

interface SuggestionRule {
  /** Keywords in assistant response that trigger this suggestion */
  triggers: RegExp;
  /** Suggestions to show when triggered */
  suggestions: SmartSuggestion[];
}

const SUGGESTION_RULES: SuggestionRule[] = [
  {
    triggers: /\[G\s*-\s*Guide/i,
    suggestions: [
      { text: 'Montre-moi un exemple concret', category: 'explore', icon: '🔍' },
      { text: 'Peux-tu simplifier cette explication ?', category: 'deepen', icon: '💡' },
      { text: 'Donne-moi un exercice pour pratiquer', category: 'practice', icon: '⚡' },
    ],
  },
  {
    triggers: /\[E\s*-\s*Exemple/i,
    suggestions: [
      { text: 'Montre-moi une variante plus avancée', category: 'deepen', icon: '🚀' },
      { text: 'Je veux essayer par moi-même', category: 'practice', icon: '✏️' },
      { text: 'Comment adapter cet exemple à mon cas ?', category: 'explore', icon: '🎯' },
    ],
  },
  {
    triggers: /\[I\s*-\s*Interaction/i,
    suggestions: [
      { text: 'Évalue ma réponse', category: 'assess', icon: '✅' },
      { text: 'Donne-moi un indice', category: 'explore', icon: '💡' },
      { text: 'Un exercice plus difficile', category: 'practice', icon: '🔥' },
    ],
  },
  {
    triggers: /\[A\s*-\s*Assessment/i,
    suggestions: [
      { text: 'Comment améliorer mon score ?', category: 'deepen', icon: '📈' },
      { text: 'Passons au concept suivant', category: 'explore', icon: '➡️' },
      { text: 'Un autre exercice sur ce thème', category: 'practice', icon: '🔄' },
    ],
  },
  {
    triggers: /\[N\s*-\s*Niveau/i,
    suggestions: [
      { text: 'Je veux un défi plus complexe', category: 'practice', icon: '🏆' },
      { text: 'Révise les bases avec moi', category: 'explore', icon: '📘' },
      { text: 'Évalue mon niveau actuel', category: 'assess', icon: '📊' },
    ],
  },
  {
    triggers: /score|évaluation|bravo|félicitations/i,
    suggestions: [
      { text: 'Passons au sujet suivant', category: 'explore', icon: '➡️' },
      { text: 'Je veux approfondir ce point', category: 'deepen', icon: '🔬' },
      { text: 'Un exercice similaire pour consolider', category: 'practice', icon: '🔄' },
    ],
  },
  {
    triggers: /prompt|template|structure/i,
    suggestions: [
      { text: 'Comment optimiser ce prompt ?', category: 'deepen', icon: '⚙️' },
      { text: 'Montre-moi le pattern few-shot', category: 'explore', icon: '🔍' },
      { text: 'Teste ce prompt avec un cas réel', category: 'practice', icon: '🧪' },
    ],
  },
];

const LEVEL_SUGGESTIONS: Record<string, SmartSuggestion[]> = {
  beginner: [
    { text: "C'est quoi le prompt engineering ?", category: 'explore', icon: '❓' },
    { text: 'Montre-moi un exemple simple', category: 'explore', icon: '🔍' },
    { text: 'Donne-moi un exercice facile', category: 'practice', icon: '⚡' },
    { text: 'Explique-moi la méthode GENIA', category: 'explore', icon: '📘' },
  ],
  intermediate: [
    { text: 'Comment utiliser le few-shot prompting ?', category: 'explore', icon: '🔍' },
    { text: 'Donne-moi un exercice pratique', category: 'practice', icon: '⚡' },
    { text: 'Explique le Chain-of-Thought', category: 'deepen', icon: '🧠' },
    { text: 'Comment améliorer ce prompt ?', category: 'deepen', icon: '⚙️' },
  ],
  advanced: [
    { text: 'Analysons les edge cases', category: 'deepen', icon: '🔬' },
    { text: 'Meta-prompting et auto-évaluation', category: 'explore', icon: '🚀' },
    { text: 'Optimisation coût/performance', category: 'deepen', icon: '📊' },
    { text: 'Patterns multi-agents', category: 'explore', icon: '🤖' },
  ],
};

const CONCEPT_SUGGESTIONS: Record<string, SmartSuggestion[]> = {
  'Prompt Engineering': [
    { text: 'Les bonnes pratiques du prompting', category: 'explore', icon: '📋' },
    { text: 'Exercice : rédiger un prompt structuré', category: 'practice', icon: '✏️' },
  ],
  'Few-Shot': [
    { text: 'Comment choisir les bons exemples ?', category: 'deepen', icon: '🎯' },
    { text: 'Exercice few-shot en contexte business', category: 'practice', icon: '💼' },
  ],
  'Chain-of-Thought': [
    { text: 'Quand utiliser le CoT ?', category: 'explore', icon: '🤔' },
    { text: 'Exercice CoT avec raisonnement', category: 'practice', icon: '🧠' },
  ],
};

/**
 * Generate context-aware smart suggestions based on conversation state
 */
export function generateSmartSuggestions(
  lastAssistantContent: string,
  lastUserQuery: string,
  userLevel: string,
  concepts: string[]
): SmartSuggestion[] {
  const matched: SmartSuggestion[] = [];

  // 1. Check rules against assistant response
  for (const rule of SUGGESTION_RULES) {
    if (rule.triggers.test(lastAssistantContent)) {
      matched.push(...rule.suggestions);
      break; // Only match first rule
    }
  }

  // 2. If no rule matched, use level-based suggestions
  if (matched.length === 0) {
    const levelSugs = LEVEL_SUGGESTIONS[userLevel] || LEVEL_SUGGESTIONS.beginner;
    matched.push(...levelSugs);
  }

  // 3. Add concept-specific suggestions if available
  for (const concept of concepts) {
    const conceptSugs = CONCEPT_SUGGESTIONS[concept];
    if (conceptSugs) {
      matched.push(...conceptSugs);
    }
  }

  // 4. Deduplicate and limit to 4 suggestions
  const seen = new Set<string>();
  const unique = matched.filter(s => {
    if (seen.has(s.text)) return false;
    // Don't suggest what user just asked
    if (lastUserQuery && s.text.toLowerCase().includes(lastUserQuery.toLowerCase().slice(0, 20))) return false;
    seen.add(s.text);
    return true;
  });

  return unique.slice(0, 4);
}
