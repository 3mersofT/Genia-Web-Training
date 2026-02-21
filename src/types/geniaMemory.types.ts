/**
 * Types pour le système de mémoire augmentée GENIA
 */

export type LearningStyle = 'visual' | 'textual' | 'practical' | 'mixed';
export type ExplanationLength = 'concise' | 'detailed' | 'very_detailed';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type InteractionType = 'question' | 'exercise' | 'feedback' | 'hint' | 'correction';

/**
 * Mémoire de session pour un utilisateur
 */
export interface SessionMemory {
  id: string;
  user_id: string;
  session_id: string;
  module_id?: string;
  capsule_id?: string;
  
  // Analyse de l'apprentissage
  difficulty_points: string[];
  successful_patterns: string[];
  common_mistakes: string[];
  
  // Style d'apprentissage
  learning_style?: LearningStyle;
  preferred_explanation_length?: ExplanationLength;
  
  // Contexte enrichi
  context_summary?: string;
  topics_covered: string[];
  skill_level: SkillLevel;
  
  // Métriques
  interactions_count: number;
  successful_exercises: number;
  failed_exercises: number;
  average_response_time?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_interaction_at: string;
}

/**
 * Insights d'apprentissage global de l'utilisateur
 */
export interface LearningInsights {
  id: string;
  user_id: string;
  
  // Analyse forces/faiblesses
  weakness_areas: Record<string, number>;
  strength_areas: Record<string, number>;
  improvement_velocity: Record<string, number>;
  
  // Recommandations
  recommended_focus: string[];
  recommended_exercises: string[];
  recommended_capsules: string[];
  
  // Préférences
  preferred_time_of_day?: string;
  average_session_duration?: number;
  optimal_difficulty_level?: number;
  prefers_examples: boolean;
  prefers_theory: boolean;
  prefers_practice: boolean;
  preferred_learning_style?: LearningStyle;
  
  // Historique
  total_sessions: number;
  total_learning_time: number;
  streak_days: number;
  best_streak_days: number;
  
  // Métriques
  overall_progress: number;
  average_success_rate: number;
  consistency_score: number;
  
  // IA Insights
  ai_generated_profile?: string;
  ai_learning_recommendations?: string;
  ai_motivational_message?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_analyzed: string;
}

/**
 * Pattern de prompt sauvegardé
 */
export interface PromptPattern {
  id: string;
  user_id?: string;
  pattern_type: string;
  pattern_template: string;
  success_rate: number;
  usage_count: number;
  applicable_modules: string[];
  applicable_capsules: string[];
  difficulty_level?: string;
  is_public: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Log d'interaction pour analyse
 */
export interface InteractionLog {
  id: string;
  user_id: string;
  session_id: string;
  message_id?: string;
  interaction_type: InteractionType;
  user_input?: string;
  ai_response?: string;
  response_quality_score?: number;
  user_satisfaction_score?: number;
  was_helpful?: boolean;
  module_context?: string;
  capsule_context?: string;
  exercise_id?: string;
  response_time_ms?: number;
  tokens_used?: number;
  model_used?: string;
  created_at: string;
}

/**
 * Contexte enrichi pour l'IA
 */
export interface MemoryContext {
  // Sessions
  currentSession: SessionMemory | null;
  recentSessions: SessionMemory[];
  
  // Insights
  learningInsights: LearningInsights | null;
  availablePatterns: PromptPattern[];
  
  // Analyse
  keyDifficulties: string[];
  successfulApproaches: string[];
  recommendedFocus: string[];
  
  // Personnalisation
  learningStyle: LearningStyle;
  currentProgress: number;
  streakDays: number;
  preferredExplanationLength: ExplanationLength;
  prefersExamples: boolean;
  skillLevel: SkillLevel;
}

/**
 * Configuration pour le chat GENIA augmenté
 */
export interface EnhancedGENIAConfig {
  userId: string;
  sessionId?: string;
  moduleId?: string;
  capsuleId?: string;
  enableMemory: boolean;
  enableInsights: boolean;
  enablePatternSuggestions: boolean;
  autoAnalyzeStyle: boolean;
  persistSession: boolean;
}

/**
 * Message enrichi avec contexte
 */
export interface EnhancedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  context?: {
    difficulty_detected?: boolean;
    pattern_suggested?: string;
    mistake_corrected?: string;
    topic?: string;
    quality_score?: number;
  };
  metadata?: {
    timestamp: string;
    tokens?: number;
    model?: string;
    response_time_ms?: number;
  };
}

/**
 * Réponse du service de mémoire
 */
export interface MemoryServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    cached: boolean;
    timestamp: string;
    version: string;
  };
}

/**
 * Options pour enrichir le prompt
 */
export interface PromptEnrichmentOptions {
  includeSessionHistory: boolean;
  includeLearningStyle: boolean;
  includeSuccessPatterns: boolean;
  includeDifficultyAreas: boolean;
  includeRecommendations: boolean;
  maxHistoryItems: number;
}

/**
 * Résultat de l'enrichissement de prompt
 */
export interface EnrichedPrompt {
  originalPrompt: string;
  enrichedPrompt: string;
  context: MemoryContext | null;
  systemInstructions: string[];
  suggestedPatterns: PromptPattern[];
}

/**
 * Métriques de performance de session
 */
export interface SessionMetrics {
  duration: number;
  interactions: number;
  successRate: number;
  topics: string[];
  difficulties: string[];
  improvements: string[];
}

/**
 * Feedback sur une interaction
 */
export interface InteractionFeedback {
  sessionId: string;
  messageId: string;
  wasHelpful: boolean;
  satisfactionScore?: number;
  comment?: string;
  suggestedImprovement?: string;
}

/**
 * État du hook useEnhancedGENIA
 */
export interface EnhancedGENIAState {
  // Sessions
  sessionId: string | null;
  sessionMemory: SessionMemory | null;
  
  // Insights
  learningInsights: LearningInsights | null;
  
  // Messages
  messages: EnhancedMessage[];
  
  // État
  isLoading: boolean;
  isInitialized: boolean;
  hasMemoryEnabled: boolean;
  
  // Contexte
  currentContext: MemoryContext | null;
  
  // Métriques
  sessionMetrics: SessionMetrics | null;
  
  // Erreurs
  error: string | null;
}

/**
 * Actions du hook useEnhancedGENIA
 */
export interface EnhancedGENIAActions {
  // Session
  initializeSession: () => Promise<void>;
  endSession: () => Promise<void>;
  
  // Messages
  sendMessage: (message: string, options?: PromptEnrichmentOptions) => Promise<void>;
  regenerateResponse: (messageId: string) => Promise<void>;
  
  // Feedback
  provideFeedback: (feedback: InteractionFeedback) => Promise<void>;
  markDifficulty: (topic: string) => Promise<void>;
  
  // Patterns
  savePattern: (pattern: Omit<PromptPattern, 'id' | 'created_at'>) => Promise<void>;
  loadPublicPatterns: () => Promise<PromptPattern[]>;
  
  // Context
  refreshContext: () => Promise<void>;
  updateLearningStyle: (style: LearningStyle) => Promise<void>;
}

/**
 * Type complet du hook
 */
export type UseEnhancedGENIA = EnhancedGENIAState & EnhancedGENIAActions;
