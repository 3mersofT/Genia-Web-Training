/**
 * Configuration des Rate Limits
 * GENIA Web Training Platform
 * 
 * Budget mensuel : 100€ (augmenté de 50€ à 100€)
 * Ajustement : x2 sur toutes les limites
 */

// ============= TARIFS MISTRAL AI (au 13/09/2025) =============
const PRICING = {
  magistralMedium: {
    input: 1.00,  // €/M tokens
    output: 3.00, // €/M tokens
    name: 'Magistral Medium (CoT)'
  },
  mistralMedium3: {
    input: 0.25,  // €/M tokens
    output: 0.75, // €/M tokens
    name: 'Mistral Medium 3'
  },
  mistralSmall: {
    input: 0.10,  // €/M tokens
    output: 0.30, // €/M tokens
    name: 'Mistral Small'
  }
};

// ============= LIMITES PAR UTILISATEUR (DOUBLÉES) =============
export const USER_LIMITS = {
  // Limites quotidiennes par modèle (tokens)
  daily: {
    magistralMedium: 20000,     // 10k → 20k tokens/jour (~20 interactions longues)
    mistralMedium3: 100000,     // 50k → 100k tokens/jour (~100 interactions moyennes)
    mistralSmall: 400000,       // 200k → 400k tokens/jour (~400 interactions courtes)
    total: 520000               // 260k → 520k tokens/jour au total
  },
  
  // Limites hebdomadaires (7x les limites quotidiennes)
  weekly: {
    magistralMedium: 140000,    // 70k → 140k tokens/semaine
    mistralMedium3: 700000,     // 350k → 700k tokens/semaine
    mistralSmall: 2800000,      // 1.4M → 2.8M tokens/semaine
    total: 3640000              // 1.82M → 3.64M tokens/semaine
  },
  
  // Limites mensuelles (30x les limites quotidiennes)
  monthly: {
    magistralMedium: 600000,    // 300k → 600k tokens/mois
    mistralMedium3: 3000000,    // 1.5M → 3M tokens/mois
    mistralSmall: 12000000,     // 6M → 12M tokens/mois
    total: 15600000             // 7.8M → 15.6M tokens/mois
  },
  
  // Limites par interaction
  perRequest: {
    magistralMedium: 8000,      // 4k → 8k tokens max par requête
    mistralMedium3: 4000,       // 2k → 4k tokens max par requête
    mistralSmall: 2000          // 1k → 2k tokens max par requête
  }
};

// ============= LIMITES GLOBALES PLATEFORME (DOUBLÉES) =============
export const PLATFORM_LIMITS = {
  // Budget mensuel total
  monthlyBudget: 100.00, // 50€ → 100€
  
  // Estimation du nombre d'utilisateurs actifs supportés
  estimatedActiveUsers: 200, // 100 → 200 utilisateurs
  
  // Limites globales quotidiennes (tous utilisateurs)
  dailyGlobal: {
    magistralMedium: 2000000,   // 1M → 2M tokens/jour
    mistralMedium3: 10000000,   // 5M → 10M tokens/jour
    mistralSmall: 40000000,     // 20M → 40M tokens/jour
    total: 52000000             // 26M → 52M tokens/jour
  },
  
  // Seuils d'alerte (% du budget)
  alerts: {
    warning: 70,    // Alerte à 70% du budget (70€)
    critical: 90,   // Alerte critique à 90% (90€)
    shutdown: 95    // Arrêt des services à 95% (95€)
  }
};

// ============= FONCTIONS DE CALCUL =============

/**
 * Calcule le coût estimé pour un nombre de tokens
 */
export function calculateCost(
  model: 'magistralMedium' | 'mistralMedium3' | 'mistralSmall',
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model];
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Estime le budget restant pour le mois
 */
export function calculateRemainingBudget(
  currentSpending: number
): {
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'critical' | 'exceeded';
} {
  const remaining = PLATFORM_LIMITS.monthlyBudget - currentSpending;
  const percentage = (currentSpending / PLATFORM_LIMITS.monthlyBudget) * 100;
  
  let status: 'safe' | 'warning' | 'critical' | 'exceeded';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= PLATFORM_LIMITS.alerts.critical) {
    status = 'critical';
  } else if (percentage >= PLATFORM_LIMITS.alerts.warning) {
    status = 'warning';
  } else {
    status = 'safe';
  }
  
  return { remaining, percentage, status };
}

/**
 * Vérifie si une requête peut être effectuée
 */
export function canMakeRequest(
  userUsage: {
    daily: number;
    weekly: number;
    monthly: number;
  },
  model: 'magistralMedium' | 'mistralMedium3' | 'mistralSmall',
  estimatedTokens: number
): {
  allowed: boolean;
  reason?: string;
} {
  // Vérifier limite par requête
  if (estimatedTokens > USER_LIMITS.perRequest[model]) {
    return {
      allowed: false,
      reason: `La requête dépasse la limite de ${USER_LIMITS.perRequest[model]} tokens pour ce modèle`
    };
  }
  
  // Vérifier limite quotidienne
  if (userUsage.daily + estimatedTokens > USER_LIMITS.daily[model]) {
    return {
      allowed: false,
      reason: 'Limite quotidienne atteinte pour ce modèle'
    };
  }
  
  // Vérifier limite hebdomadaire
  if (userUsage.weekly + estimatedTokens > USER_LIMITS.weekly[model]) {
    return {
      allowed: false,
      reason: 'Limite hebdomadaire atteinte pour ce modèle'
    };
  }
  
  // Vérifier limite mensuelle
  if (userUsage.monthly + estimatedTokens > USER_LIMITS.monthly[model]) {
    return {
      allowed: false,
      reason: 'Limite mensuelle atteinte pour ce modèle'
    };
  }
  
  return { allowed: true };
}

// ============= RECOMMANDATIONS D'USAGE =============
export const USAGE_RECOMMENDATIONS = {
  magistralMedium: {
    bestFor: [
      'Problèmes complexes nécessitant du raisonnement',
      'Génération de code avancé',
      'Analyse approfondie de concepts',
      'Résolution de bugs difficiles'
    ],
    tokensPerInteraction: 1000,
    interactionsPerDay: 20  // 10 → 20
  },
  mistralMedium3: {
    bestFor: [
      'Conversations générales',
      'Explications de concepts',
      'Assistance quotidienne',
      'Exercices guidés'
    ],
    tokensPerInteraction: 500,
    interactionsPerDay: 200  // 100 → 200
  },
  mistralSmall: {
    bestFor: [
      'Questions simples',
      'Traductions',
      'Résumés courts',
      'Validations rapides'
    ],
    tokensPerInteraction: 200,
    interactionsPerDay: 2000  // 1000 → 2000
  }
};

// ============= EXPORT DES STATS =============
export const BUDGET_STATS = {
  monthlyBudget: PLATFORM_LIMITS.monthlyBudget,
  estimatedCostPerStudent: 0.50, // 0.36€ → 0.50€/mois avec les nouvelles limites
  maxStudentsSupported: 200,     // 100 → 200 étudiants
  averageTokensPerStudent: 78000, // 39k → 78k tokens/mois/étudiant
  modelsDistribution: {
    magistralMedium: '5%',  // Usage pour cas complexes
    mistralMedium3: '25%',  // Usage général
    mistralSmall: '70%'     // Usage majoritaire
  }
};