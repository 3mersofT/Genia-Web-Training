// src/services/mistralService.ts

import {
  MODELS_CONFIG,
  GENIA_FULL_PERSONA,
  type ModelName,
  type MistralRequest,
  type MistralResponse,
  type UserQuota
} from '@/lib/ai-config';

import {
  checkUserQuota,
  incrementQuota,
  extractGENIAStep,
  calculateCost
} from '@/lib/ai-utils';

// Re-export types for backwards compatibility
export type { MistralRequest, MistralResponse, UserQuota }

// ============================================
// SÉLECTION INTELLIGENTE DU MODÈLE
// ============================================

export function selectOptimalModel(
  query: string,
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  quotas: Record<string, { used: number; limit: number }>
): ModelName {
  const needsReasoning = /comment|pourquoi|explique|comprendre|analyser/i.test(query);
  const isSimpleQuestion = query.split(' ').length < 10;
  const needsExample = /exemple|montre|illustre/i.test(query);

  if (needsReasoning && quotas['magistral-medium'].used < quotas['magistral-medium'].limit) {
    return 'magistral-medium';
  }

  if (!isSimpleQuestion && quotas['mistral-medium-3'].used < quotas['mistral-medium-3'].limit) {
    return 'mistral-medium-3';
  }

  return 'mistral-small';
}

// ============================================
// FONCTION PRINCIPALE D'APPEL À MISTRAL
// ============================================

export async function callMistralAPI(request: MistralRequest): Promise<MistralResponse> {
  const config = MODELS_CONFIG[request.model];

  const quota = await checkUserQuota(request.userId, request.model, config.dailyQuota);
  if (!quota.canUse) {
    throw new Error(`Quota dépassé pour ${request.model}. Limite: ${quota.limit}/jour`);
  }

  let finalPrompt = request.prompt;
  if (request.reasoning === 'explicit' && request.model === 'magistral-medium') {
    finalPrompt = `${request.prompt}

[IMPORTANT] Utilise un raisonnement étape par étape (Chain-of-Thought) :
1. Analyse d'abord la question
2. Identifie les concepts clés
3. Détermine le pilier GENIA approprié
4. Explique ton raisonnement
5. Donne ta réponse structurée`;
  }

  const messages = [
    { role: 'system', content: request.systemPrompt || GENIA_FULL_PERSONA },
    { role: 'user', content: finalPrompt }
  ];

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages,
        max_tokens: request.maxTokens || config.maxTokens,
        temperature: request.temperature || config.defaultTemperature,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur Mistral API: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const usage = data.usage;

    const cost = calculateCost(
      {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      },
      {
        costPerMillionInput: config.costPerMillionInput,
        costPerMillionOutput: config.costPerMillionOutput
      }
    );

    let reasoning: string | undefined;
    if (request.reasoning === 'explicit' && content.includes('[Raisonnement]')) {
      const reasoningMatch = content.match(/\[Raisonnement\](.*?)\[\/Raisonnement\]/s);
      reasoning = reasoningMatch ? reasoningMatch[1].trim() : undefined;
    }

    const methodStep = extractGENIAStep(content);

    await incrementQuota(
      request.userId,
      request.model,
      usage.total_tokens,
      cost
    );

    return {
      content,
      model: request.model,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cost
      },
      reasoning,
      methodStep,
      quotaRemaining: quota.limit - quota.used - 1
    };

  } catch (error) {
    throw error;
  }
}

// ============================================
// GÉNÉRATION D'EXERCICES ADAPTÉS
// ============================================

export async function generateExercise(
  capsuleTitle: string,
  concepts: string[],
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  userId: string
): Promise<string> {
  const levelPrompts = {
    beginner: "un exercice simple avec guidage pas à pas",
    intermediate: "un exercice pratique avec aide contextuelle",
    advanced: "un défi complexe avec peu d'indices"
  };
  
  const prompt = `[I - Interaction pratique]
  
Crée ${levelPrompts[userLevel]} sur le thème "${capsuleTitle}".
Concepts à couvrir : ${concepts.join(', ')}

L'exercice doit :
- Être concret et applicable immédiatement
- Utiliser un contexte français/européen
- Respecter le RGPD
- Avoir une difficulté progressive
- Inclure des critères de réussite clairs`;

  const response = await callMistralAPI({
    model: 'mistral-medium-3',
    prompt,
    systemPrompt: GENIA_FULL_PERSONA,
    userId,
    reasoning: 'implicit'
  });
  
  return response.content;
}

// ============================================
// ÉVALUATION DES RÉPONSES
// ============================================

export async function evaluateResponse(
  userResponse: string,
  expectedCriteria: string[],
  userId: string
): Promise<{
  score: number;
  feedback: string;
  suggestions: string[];
}> {
  const prompt = `[A - Assessment continu]
  
Évalue cette réponse d'apprenant :
"${userResponse}"

Critères attendus :
${expectedCriteria.map(c => `- ${c}`).join('\n')}

Fournis :
1. Un score sur 100
2. Un feedback constructif et encourageant
3. 3 suggestions d'amélioration concrètes`;

  const response = await callMistralAPI({
    model: 'mistral-medium-3',
    prompt,
    systemPrompt: GENIA_FULL_PERSONA,
    userId,
    reasoning: 'implicit'
  });
  
  const scoreMatch = response.content.match(/score.*?(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;
  
  return {
    score,
    feedback: response.content,
    suggestions: [
      "Approfondir la structure du prompt",
      "Ajouter plus d'exemples concrets",
      "Tester avec différents modèles"
    ]
  };
}

// Re-export for backwards compatibility
export { MODELS_CONFIG, GENIA_FULL_PERSONA };