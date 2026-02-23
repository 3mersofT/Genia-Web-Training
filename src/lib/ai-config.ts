// src/lib/ai-config.ts
/**
 * Configuration centralisée des modèles IA et persona GENIA
 * Source unique de vérité pour éviter la duplication entre services
 */

// ============================================
// TYPES ET INTERFACES
// ============================================

export type ModelName = 'magistral-medium' | 'mistral-medium-3' | 'mistral-small';

export type GENIAStep = 'G' | 'E' | 'N' | 'I' | 'A';

export interface MistralRequest {
  model: ModelName;
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
  methodStep?: GENIAStep;
  quotaRemaining: number;
}

export interface UserQuota {
  userId: string;
  date: string;
  model: string;
  used: number;
  limit: number;
}

export interface ModelConfig {
  endpoint: string;
  modelName: string;
  costPerMillionInput: number;
  costPerMillionOutput: number;
  maxTokens: number;
  defaultTemperature: number;
  features: string[];
  dailyQuota: number;
  description: string;
}

export type ModelsConfig = Record<ModelName, ModelConfig>;

// ============================================
// CONFIGURATION DES MODÈLES
// ============================================

export const MODELS_CONFIG: ModelsConfig = {
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

export const GENIA_FULL_PERSONA = `
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
