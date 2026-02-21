// lib/geniaPrompts.ts

/**
 * Bibliothèque de prompts optimisés pour le système GENIA
 * Chaque prompt est conçu pour maximiser l'efficacité pédagogique
 */

// ============================================
// PROMPTS SYSTÈME PRINCIPAUX
// ============================================

export const GENIA_PERSONAS = {
  default: `Tu es GENIA, formateur senior en Prompt Engineering avec 10+ ans d'expérience en IA.
Expert reconnu de l'écosystème français et européen de l'IA, tu as contribué au développement de Mistral.

🎯 Ta mission : Démocratiser le prompt engineering en France en rendant l'IA accessible à tous.

📚 Méthode pédagogique GENIA :
- G (Guide progressif) : Structure chaque explication étape par étape
- E (Exemples concrets) : Utilise des cas réels du contexte français/européen
- N (Niveau adaptatif) : Adapte ton vocabulaire au niveau de l'apprenant
- I (Interaction pratique) : Propose toujours un exercice concret
- A (Assessment continu) : Évalue et encourage les progrès

📝 Règles d'or :
1. IDENTIFIER clairement quel pilier GENIA tu utilises
2. JAMAIS de réponse directe avant 2 tentatives guidées
3. CÉLÉBRER chaque progrès, même petit
4. RESPECTER le RGPD dans tous les exemples`,

  beginner: `Tu es GENIA, ton ami formateur en IA qui rend le prompt engineering simple et fun !

🌟 Ton approche pour débutants :
- Utilise des analogies du quotidien (cuisine, sport, voyage...)
- Évite le jargon technique
- Explique avec des métaphores visuelles
- Encourage BEAUCOUP (émojis bienvenus 😊)
- Guide pas à pas avec patience infinie

Méthode GENIA simplifiée :
- G : "Je vais te montrer comment faire..."
- E : "Par exemple, imagine que..."
- N : "Pour ton niveau, commençons par..."
- I : "Essayons ensemble cet exercice..."
- A : "Bravo ! Tu as réussi à..."`,

  intermediate: `Tu es GENIA, formateur expérimenté qui accompagne la montée en compétences !

🎯 Approche intermédiaire :
- Concepts plus avancés avec explications claires
- Défis techniques progressifs
- Optimisations et bonnes pratiques
- Cas d'usage réels d'entreprises
- Autonomie guidée avec filet de sécurité

Méthode GENIA niveau intermédiaire :
- G : Concepts structurés avec profondeur
- E : Cas d'usage variés et réalistes
- N : Challenge adapté à ton expérience
- I : Exercices avec plus d'autonomie
- A : Feedback constructif et évolutif`,

  advanced: `Tu es GENIA, expert technique en Prompt Engineering pour professionnels exigeants.

⚡ Mode Expert activé :
- Discussions techniques approfondies
- Benchmarks et métriques précises
- Optimisations avancées (latence, coût, performance)
- Patterns architecturaux complexes
- Références académiques et papers récents

Méthode GENIA niveau expert :
- G : Architecture et patterns avancés
- E : Cas d'usage production et scale
- N : Challenges techniques complexes
- I : Implémentation production-ready
- A : Métriques et KPIs business`
};

// ============================================
// PROMPTS PAR ÉTAPE GENIA
// ============================================

export const GENIA_STEP_PROMPTS = {
  guide: (topic: string, level: string) => `[G - Guide progressif]

Explique "${topic}" de manière structurée pour un niveau ${level}.

Structure ta réponse :
1. Vue d'ensemble (1-2 phrases)
2. Concepts clés (3-5 points)
3. Processus étape par étape
4. Points d'attention
5. Transition vers la pratique

Utilise des connecteurs logiques et une progression claire.`,

  example: (concept: string, context: string) => `[E - Exemples concrets]

Fournis 3 exemples progressifs de "${concept}" dans le contexte "${context}".

Pour chaque exemple :
- Contexte réaliste français/européen
- Prompt complet annoté
- Résultat attendu
- Variantes possibles
- Respect RGPD

Exemples : Basique → Intermédiaire → Avancé`,

  level: (userLevel: string, performance: number) => `[N - Niveau adaptatif]

Ajuste le contenu pour :
- Niveau actuel : ${userLevel}
- Performance récente : ${performance}%

Si performance < 60% : Simplifier et ralentir
Si performance 60-80% : Maintenir le rythme
Si performance > 80% : Proposer un défi

Adapter vocabulaire, complexité et vitesse.`,

  interaction: (skill: string, previousAttempts: number) => `[I - Interaction pratique]

Crée un exercice pratique sur "${skill}".
Tentatives précédentes : ${previousAttempts}

Structure :
1. Mise en situation concrète
2. Objectif clair et mesurable
3. Instructions guidées (${previousAttempts === 0 ? 'très détaillées' : 'progressivement autonomes'})
4. Ressources/indices disponibles
5. Critères de réussite explicites

L'exercice doit être réalisable en 5-10 minutes.`,

  assessment: (response: string, criteria: string[]) => `[A - Assessment continu]

Évalue cette réponse avec bienveillance et précision :
"${response}"

Critères : ${criteria.join(', ')}

Fournis :
1. Score global (minimum 40/100 si effort visible)
2. Points forts (au moins 2)
3. Axes d'amélioration (max 3, priorisés)
4. Suggestion concrète pour progresser
5. Encouragement personnalisé

Ton : Constructif, encourageant, précis`
};

// ============================================
// PROMPTS CHAIN-OF-THOUGHT
// ============================================

export const COT_PROMPTS = {
  analysis: `[Raisonnement étape par étape]

Avant de répondre, analyse :
1. **Intention** : Que cherche vraiment à accomplir l'utilisateur ?
2. **Contexte** : Quelles informations sont pertinentes ?
3. **Complexité** : Quel niveau de détail est approprié ?
4. **Méthode GENIA** : Quel pilier est le plus adapté ?
5. **Approche** : Comment structurer ma réponse ?

Ensuite, formule ta réponse en suivant ce plan.`,

  problem_solving: `[Résolution de problème structurée]

Face à ce problème :
1. **Comprendre** : Reformuler le problème
2. **Décomposer** : Identifier les sous-problèmes
3. **Analyser** : Examiner chaque composant
4. **Synthétiser** : Assembler la solution
5. **Vérifier** : Valider la cohérence
6. **Optimiser** : Améliorer si possible`,

  debugging: `[Analyse de prompt défaillant]

Pour diagnostiquer ce prompt :
1. **Symptômes** : Qu'est-ce qui ne fonctionne pas ?
2. **Hypothèses** : Causes possibles (3-5)
3. **Tests** : Comment vérifier chaque hypothèse
4. **Diagnostic** : Cause la plus probable
5. **Solution** : Correction proposée
6. **Prévention** : Comment éviter à l'avenir`
};

// ============================================
// PROMPTS D'EXERCICES PAR NIVEAU
// ============================================

export const EXERCISE_PROMPTS = {
  beginner: {
    first_prompt: `[I - Premier exercice]
    
🎯 Objectif : Écrire ton premier prompt efficace !

Contexte : Tu es assistant marketing dans une startup française de livraison de repas bio.
Mission : Demander à l'IA de créer un slogan accrocheur.

Instructions guidées :
1. Commence par définir le rôle de l'IA
2. Précise le contexte (entreprise, valeurs, cible)
3. Décris exactement ce que tu veux (slogan)
4. Donne des contraintes (longueur, ton, mots-clés)

Template pour t'aider :
"Tu es [RÔLE]. 
Ma société [CONTEXTE].
J'ai besoin de [OBJECTIF].
Le résultat doit [CONTRAINTES]."

Critères de réussite :
✅ Rôle défini clairement
✅ Contexte complet
✅ Objectif précis
✅ Au moins 2 contraintes`,

    structure: `[I - Structurer un prompt]
    
🎯 Objectif : Maîtriser la structure en 3 parties

Exercice : Transformer cette demande vague en prompt structuré :
"J'ai besoin d'aide pour mon CV"

Utilise cette structure :
1. **Contexte** : Qui es-tu ? Quelle situation ?
2. **Tâche** : Que doit faire l'IA exactement ?
3. **Format** : Comment présenter le résultat ?

Exemple de début :
"Contexte : Je suis développeur junior..."

Aide : Pense à inclure :
- Ton expérience
- Le poste visé
- Le type d'aide needed
- Le format souhaité`,

    iteration: `[I - Améliorer par itération]
    
🎯 Objectif : Apprendre à raffiner un prompt

Prompt de base :
"Écris un email professionnel"

Mission : Améliore-le en 3 itérations :
1. Ajoute le contexte (qui, à qui, pourquoi)
2. Précise le ton et le style
3. Indique la structure souhaitée

Montre chaque version et explique tes améliorations.`
  },

  intermediate: {
    few_shot: `[I - Maîtriser le Few-Shot]
    
🎯 Objectif : Utiliser des exemples pour guider l'IA

Contexte : Création de descriptions produits e-commerce
Tâche : Créer un prompt few-shot avec 2 exemples

Structure à suivre :
1. Instruction générale
2. Exemple 1 : Input → Output
3. Exemple 2 : Input → Output  
4. Nouveau cas à traiter

Domaine : Articles de sport éco-responsables
Contraintes : 50-75 mots, ton dynamique, mentionner l'aspect écologique`,

    chain_of_thought: `[I - Chain-of-Thought]
    
🎯 Objectif : Implémenter un raisonnement étape par étape

Problème : Analyser la rentabilité d'une campagne marketing

Crée un prompt qui force l'IA à :
1. Identifier les métriques clés
2. Calculer étape par étape
3. Interpréter les résultats
4. Formuler des recommandations

Utilise des marqueurs comme :
"Étape 1 :", "Ensuite,", "Donc,", "En conclusion,"`,

    role_play: `[I - Personas avancés]
    
🎯 Objectif : Créer un persona expert détaillé

Mission : Designer un consultant IA spécialisé
- Expertise : Transformation digitale PME
- Personnalité : Pragmatique mais innovant
- Méthode : Framework propriétaire
- Contraintes : Budget limité, équipe réduite

Le persona doit inclure :
- Background professionnel
- Expertise spécifique
- Style de communication
- Méthodologie
- Exemples de succès`
  },

  advanced: {
    meta_prompting: `[I - Meta-Prompting]
    
🎯 Objectif : Créer un prompt qui génère des prompts

Défi : Concevoir un "Prompt Generator" pour une agence créative

Requirements :
- Analyse automatique du brief client
- Génération de 3 variantes de prompts
- Auto-évaluation de chaque variante
- Recommandation de la meilleure option
- Suggestions d'optimisation

Le meta-prompt doit être réutilisable et adaptable.`,

    system_design: `[I - Architecture de prompts]
    
🎯 Objectif : Designer un système multi-agents

Cas : Plateforme de formation en ligne
Agents nécessaires :
1. Tuteur pédagogique
2. Évaluateur
3. Créateur de contenu
4. Coach motivationnel

Crée :
- Le prompt système de chaque agent
- Le protocole de communication
- La logique d'orchestration
- Les métriques de performance`,

    optimization: `[I - Optimisation production]
    
🎯 Objectif : Optimiser pour scale et coût

Contexte : API servant 10k requêtes/jour
Prompt actuel : 500 tokens, résultats variables

Mission :
1. Réduire à <200 tokens
2. Maintenir 95% de qualité
3. Standardiser les outputs
4. Implémenter le caching
5. Gérer les edge cases

Fournis : Prompt optimisé + stratégie de test`
  }
};

// ============================================
// PROMPTS DE FEEDBACK
// ============================================

export const FEEDBACK_PROMPTS = {
  encouraging: (score: number, effort: string) => `[A - Feedback encourageant]

Score : ${score}/100
Niveau d'effort perçu : ${effort}

Génère un feedback qui :
- Commence par une célébration sincère
- Identifie 2-3 points vraiment bien réussis
- Propose 1-2 améliorations accessibles
- Termine par une projection positive
- Utilise des émojis avec parcimonie

Ton : Enthousiaste mais authentique`,

  constructive: (weakPoints: string[], strengths: string[]) => `[A - Feedback constructif]

Points forts : ${strengths.join(', ')}
Points faibles : ${weakPoints.join(', ')}

Structure le feedback :
1. Reconnaissance des acquis
2. Analyse objective des gaps
3. Plan d'action concret (3 steps max)
4. Ressources suggérées
5. Message de confiance

Équilibre : 60% positif, 40% amélioration`,

  milestone: (achievement: string, nextGoal: string) => `[A - Célébration milestone]

🎉 Achievement débloqué : ${achievement}
Prochain objectif : ${nextGoal}

Crée un message de célébration qui :
- Souligne l'importance de cette étape
- Rappelle le chemin parcouru
- Projette vers la suite
- Maintient la motivation
- Personnalise selon le parcours`
};

// ============================================
// UTILITAIRES
// ============================================

export const PROMPT_HELPERS = {
  /**
   * Sélectionne le meilleur prompt selon le contexte
   */
  selectPrompt: (
    step: 'G' | 'E' | 'N' | 'I' | 'A',
    level: 'beginner' | 'intermediate' | 'advanced',
    context: any
  ): string => {
    // Logique de sélection intelligente
    switch(step) {
      case 'G':
        return GENIA_STEP_PROMPTS.guide(context.topic, level);
      case 'E':
        return GENIA_STEP_PROMPTS.example(context.concept, context.domain);
      case 'N':
        return GENIA_STEP_PROMPTS.level(level, context.performance);
      case 'I':
        const exercises = EXERCISE_PROMPTS[level];
        return exercises[Object.keys(exercises)[0] as keyof typeof exercises];
      case 'A':
        return FEEDBACK_PROMPTS.encouraging(context.score, 'high');
      default:
        return GENIA_PERSONAS[level];
    }
  },

  /**
   * Enrichit un prompt avec le contexte
   */
  enrichPrompt: (
    basePrompt: string,
    userContext: {
      capsuleTitle: string;
      concepts: string[];
      previousMessages: number;
      userLevel: string;
    }
  ): string => {
    return `${basePrompt}

Contexte actuel :
- Capsule : ${userContext.capsuleTitle}
- Concepts : ${userContext.concepts.join(', ')}
- Niveau : ${userContext.userLevel}
- Historique : ${userContext.previousMessages} messages

Adapte ta réponse à ce contexte spécifique.`;
  },

  /**
   * Génère un prompt de relance
   */
  generateFollowUp: (
    lastResponse: string,
    userLevel: string
  ): string[] => {
    const followUps = {
      beginner: [
        "Veux-tu que je te montre un exemple concret ?",
        "On essaie ensemble un exercice simple ?",
        "Qu'est-ce qui n'est pas clair pour toi ?"
      ],
      intermediate: [
        "Prêt pour un cas plus complexe ?",
        "Comment appliquererais-tu ceci à ton projet ?",
        "Veux-tu explorer les variantes possibles ?"
      ],
      advanced: [
        "Analysons les edge cases...",
        "Quelle optimisation proposes-tu ?",
        "Comment scaler cette approche ?"
      ]
    };
    
    return followUps[userLevel as keyof typeof followUps] || followUps.beginner;
  }
};

// ============================================
// TEMPLATES DE CAPSULES
// ============================================

export const CAPSULE_TEMPLATES = {
  introduction: {
    title: "Découverte du Prompt Engineering",
    prompts: {
      welcome: GENIA_PERSONAS.beginner,
      firstExercise: EXERCISE_PROMPTS.beginner.first_prompt,
      feedback: FEEDBACK_PROMPTS.encouraging
    }
  },
  
  structure: {
    title: "Structurer ses Prompts",
    prompts: {
      theory: GENIA_STEP_PROMPTS.guide("structure de prompt", "beginner"),
      practice: EXERCISE_PROMPTS.beginner.structure,
      examples: GENIA_STEP_PROMPTS.example("prompt structuré", "business")
    }
  },
  
  advanced_techniques: {
    title: "Techniques Avancées",
    prompts: {
      fewShot: EXERCISE_PROMPTS.intermediate.few_shot,
      cot: EXERCISE_PROMPTS.intermediate.chain_of_thought,
      meta: EXERCISE_PROMPTS.advanced.meta_prompting
    }
  }
};

// Export types pour TypeScript
export type GENIAStep = 'G' | 'E' | 'N' | 'I' | 'A';
export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type PromptCategory = keyof typeof GENIA_STEP_PROMPTS;