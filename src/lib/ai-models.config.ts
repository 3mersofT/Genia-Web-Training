// src/lib/ai-models.config.ts
// Configuration centralisee des modeles IA et quotas

export const MODELS_CONFIG = {
  'magistral-medium': {
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    modelName: 'mistral-large-latest',
    costPerMillionInput: 2.0,
    costPerMillionOutput: 6.0,
    maxTokens: 3000,
    defaultTemperature: 0.2,
    features: ['reasoning', 'cot', 'complex-analysis'],
    dailyQuota: 60,
    description: 'Modele expert pour demonstrations et raisonnement complexe'
  },
  'mistral-medium-3': {
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    modelName: 'mistral-medium-latest',
    costPerMillionInput: 1.5,
    costPerMillionOutput: 4.5,
    maxTokens: 1500,
    defaultTemperature: 0.4,
    features: ['general', 'exercises', 'quick-answers'],
    dailyQuota: 300,
    description: 'Modele polyvalent pour pratique quotidienne'
  },
  'mistral-small': {
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    modelName: 'mistral-small-latest',
    costPerMillionInput: 0.25,
    costPerMillionOutput: 0.25,
    maxTokens: 1000,
    defaultTemperature: 0.5,
    features: ['basic', 'quick'],
    dailyQuota: 1000,
    description: 'Modele rapide pour questions simples'
  }
} as const;

export type ModelKey = keyof typeof MODELS_CONFIG;
