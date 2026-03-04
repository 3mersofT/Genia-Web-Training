/**
 * Types pour le système de chat GENIA
 */

/**
 * Message dans une conversation avec GENIA
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: 'magistral-medium' | 'mistral-medium-3';
  methodStep?: 'G' | 'E' | 'N' | 'I' | 'A';
  tokens?: number;
  reasoning?: string; // Pour CoT avec Magistral
  isStreaming?: boolean; // True while streaming content
  provider?: string; // AI provider used (mistral, openai, anthropic, deepseek)
  feedback?: 'up' | 'down' | null; // User feedback on message
}

/**
 * Contexte d'une conversation avec GENIA
 */
export interface ChatContext {
  currentCapsule: {
    id: string;
    title: string;
    concepts: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  userLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  completedCapsules: number;
  totalCapsules: number;
  lastExerciseScore?: number;
  streakDays: number;
}

/**
 * Informations sur les quotas d'utilisation des modèles IA
 */
export interface QuotaInfo {
  magistralMedium: { used: number; daily: number; };
  mistralMedium3: { used: number; daily: number; };
}

/**
 * SSE stream event types
 */
export interface StreamEvent {
  type: 'start' | 'content' | 'done' | 'metadata' | 'error';
  content?: string;
  provider?: string;
  methodStep?: string;
  quotaUsed?: { used: number; limit: number };
  conversationId?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  error?: string;
}

/**
 * Smart suggestion type
 */
export interface SmartSuggestion {
  text: string;
  category: 'explore' | 'practice' | 'deepen' | 'assess';
  icon: string;
}
