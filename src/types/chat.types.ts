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
}

/**
 * Contexte d'une conversation avec GENIA
 */
export interface ChatContext {
  currentCapsule: {
    id: string;
    title: string;
    concepts: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  userLevel: 'beginner' | 'intermediate' | 'advanced';
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
