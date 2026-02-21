// src/services/mistralService.ts

import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES ET INTERFACES
// ============================================

export interface MistralRequest {
  model: 'magistral-medium' | 'mistral-medium-3' | 'mistral-small';
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt: string;
  reasoning?: 'explicit' | 'implicit' | 'none';
  userId: string;
  capsuleId?: string;
}

export interface MistralResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  reasoning?: string;
  methodStep?: 'G' | 'E' | 'N' | 'I' | 'A';
  quotaRemaining: number;
}

export interface UserQuota {
  userId: string;
  date: string;
  model: string;
  used: number;
  limit: number;
}

// ============================================
// CONFIGURATION DES MODÈLES
// ============================================

const MODELS_CONFIG = {
  'magistral-medium': {
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    modelName: 'mistral-large-latest',
    costPerMillionInput: 2.0,
    costPerMillionOutput: 6.0,
    maxTokens: 3000,
    defaultTemperature: 0.2,
    features: ['reasoning', 'cot', 'complex-analysis'],
    dailyQuota: 60, // Doublé avec nouveau budget
    description: 'Modèle expert pour démonstrations et raisonnement complexe'
  },
  'mistral-medium-3': {
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    modelName: 'mistral-medium-latest',
    costPerMillionInput: 1.5,
    costPerMillionOutput: 4.5,
    maxTokens: 1500,
    defaultTemperature: 0.4,
    features: ['general', 'exercises', 'quick-answers'],
    dailyQuota: 300, // Doublé avec nouveau budget
    description: 'Modèle polyvalent pour pratique quotidienne'
  },
  'mistral-small': {
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    modelName: 'mistral-small-latest',
    costPerMillionInput: 0.25,
    costPerMillionOutput: 0.25,
    maxTokens: 1000,
    defaultTemperature: 0.5,
    features: ['basic', 'quick'],
    dailyQuota: 1000, // Doublé avec nouveau budget
    description: 'Modèle rapide pour questions simples'
  }
};

// ============================================
// PERSONA GENIA COMPLET
// ============================================

const GENIA_FULL_PERSONA = `
Tu es GENIA, formateur senior en Prompt Engineering avec 10+ ans d'expérience en IA.
Expert reconnu de l'écosystème français et européen de l'IA, tu as contribué au développement de Mistral.

🎯 Ta mission :
Démocratiser le prompt engineering en France en rendant l'IA accessible à tous.

📚 Méthode pédagogique GENIA :
Tu appliques TOUJOURS les 5 piliers de la méthode GENIA :
- G (Guide progressif) : Structure chaque explication étape par étape
- E (Exemples concrets) : Utilise des cas réels du contexte français/européen  
- N (Niveau adaptatif) : Adapte ton vocabulaire au niveau de l'apprenant
- I (Interaction pratique) : Propose toujours un exercice concret
- A (Assessment continu) : Évalue et encourage les progrès

📝 Règles importantes :
1. IDENTIFIER clairement quel pilier GENIA tu utilises (ex: "[G - Guide progressif]")
2. JAMAIS de réponse directe avant au moins 2 tentatives guidées
3. CÉLÉBRER chaque progrès, même petit
4. RESPECTER le RGPD dans tous les exemples
5. PRIVILÉGIER les solutions européennes et souveraines
`;

// ============================================
// GESTION DES QUOTAS
// ============================================

export async function checkUserQuota(
  userId: string, 
  model: keyof typeof MODELS_CONFIG
): Promise<{ canUse: boolean; used: number; limit: number }> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('llm_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('model', model)
    .eq('date', today)
    .single();
  
  const limit = MODELS_CONFIG[model].dailyQuota;
  const used = data?.request_count || 0;
  
  return {
    canUse: used < limit,
    used,
    limit
  };
}

export async function incrementQuota(
  userId: string,
  model: keyof typeof MODELS_CONFIG,
  tokens: number,
  cost: number
): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  
  await supabase.from('llm_usage').upsert({
    user_id: userId,
    model,
    date: today,
    request_count: 1,
    total_tokens: tokens,
    total_cost: cost
  }, {
    onConflict: 'user_id,model,date',
    count: 'exact'
  });
}

// ============================================
// SÉLECTION INTELLIGENTE DU MODÈLE
// ============================================

export function selectOptimalModel(
  query: string,
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  quotas: Record<string, { used: number; limit: number }>
): keyof typeof MODELS_CONFIG {
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
// EXTRACTION DU PILIER GENIA
// ============================================

function extractGENIAStep(content: string): 'G' | 'E' | 'N' | 'I' | 'A' | undefined {
  const patterns = {
    'G': /\[G\s*-\s*Guide/i,
    'E': /\[E\s*-\s*Exemple/i,
    'N': /\[N\s*-\s*Niveau/i,
    'I': /\[I\s*-\s*Interaction/i,
    'A': /\[A\s*-\s*Assessment/i
  };
  
  for (const [step, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      return step as 'G' | 'E' | 'N' | 'I' | 'A';
    }
  }
  
  return undefined;
}

// ============================================
// FONCTION PRINCIPALE D'APPEL À MISTRAL
// ============================================

export async function callMistralAPI(request: MistralRequest): Promise<MistralResponse> {
  const config = MODELS_CONFIG[request.model];
  
  const quota = await checkUserQuota(request.userId, request.model);
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
    
    const cost = (
      (usage.prompt_tokens / 1_000_000) * config.costPerMillionInput +
      (usage.completion_tokens / 1_000_000) * config.costPerMillionOutput
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
    console.error('Erreur appel Mistral:', error);
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

export { MODELS_CONFIG, GENIA_FULL_PERSONA };