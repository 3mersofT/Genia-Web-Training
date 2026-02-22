/**
 * Types pour le système de défis quotidiens
 */

export type ChallengeType = 'transform' | 'create' | 'speed' | 'analysis' | 'creative';
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ChallengeStatus = 'active' | 'completed' | 'expired' | 'upcoming';

/**
 * Défi quotidien
 */
export interface DailyChallenge {
  id: string;
  challenge_date: string; // Date du défi (YYYY-MM-DD)
  challenge_type: ChallengeType;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  base_prompt?: string; // Prompt de base pour les défis de transformation
  success_criteria: Record<string, any>; // Critères de réussite
  max_score: number;
  time_limit?: number; // En secondes (pour les défis speed)
  active: boolean;
  created_at: string;
  updated_at: string;
  
  // Métadonnées
  category?: string;
  tags?: string[];
  hints?: string[];
  resources?: string[];
}

/**
 * Participation à un défi
 */
export interface ChallengeParticipation {
  id: string;
  user_id: string;
  challenge_id: string;
  submission: string;
  score?: number;
  time_spent: number; // En secondes
  completed_at: string;
  
  // Évaluation
  peer_reviews?: PeerReview[];
  ai_evaluation?: AIEvaluation;
  final_score?: number;
  
  // Métadonnées
  attempts?: number;
  hints_used?: number;
  created_at: string;
}

/**
 * Résultat de la soumission d'un défi avec XP et récompenses
 */
export interface ChallengeSubmissionResult {
  participation: ChallengeParticipation;
  xp_awarded: number;
  leveled_up: boolean;
  new_level?: number;
  skills_unlocked: string[];
  level_up_notification?: {
    from_level_rank: number;
    to_level_rank: number;
    from_level_name?: string;
    to_level_name?: string;
  };
}

/**
 * Évaluation par les pairs
 */
export interface PeerReview {
  id: string;
  participation_id: string;
  reviewer_id: string;
  rating: number; // 1-5
  comment?: string;
  helpful_vote?: boolean;
  created_at: string;
}

/**
 * Évaluation par l'IA
 */
export interface AIEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  criteria_scores: Record<string, number>;
  model_used: string;
  evaluated_at: string;
}

/**
 * Entrée du leaderboard
 */
export interface LeaderboardEntry {
  challenge_id: string;
  user_id: string;
  rank: number;
  score: number;
  time_spent: number;
  
  // Relations
  user_profiles?: {
    full_name: string;
    avatar_url?: string;
    level?: string;
  };
  challenge?: DailyChallenge;
}

/**
 * Statistiques utilisateur pour les défis
 */
export interface ChallengeUserStats {
  user_id: string;
  total_participations: number;
  total_wins: number;
  current_streak: number;
  best_streak: number;
  total_score: number;
  average_score: number;
  average_time: number;
  
  // Par type de défi
  stats_by_type: Record<ChallengeType, {
    count: number;
    average_score: number;
    best_score: number;
  }>;
  
  // Badges et achievements
  badges_earned: string[];
  achievements: Achievement[];
  
  // Rankings
  global_rank?: number;
  monthly_rank?: number;
  weekly_rank?: number;
}

/**
 * Achievement débloqué
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked_at: string;
  progress?: number;
  max_progress?: number;
}

/**
 * Configuration de génération de défi
 */
export interface ChallengeTemplate {
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  templates: string[];
  variables: Record<string, string[]>;
  success_criteria: Record<string, any>;
  scoring_rules: ScoringRule[];
}

/**
 * Règle de scoring
 */
export interface ScoringRule {
  criterion: string;
  weight: number;
  max_points: number;
  evaluation_method: 'regex' | 'length' | 'keywords' | 'ai' | 'time';
  parameters?: Record<string, any>;
}

/**
 * Notification de défi
 */
export interface ChallengeNotification {
  id: string;
  user_id: string;
  type: 'new_challenge' | 'challenge_ending' | 'achievement' | 'leaderboard_update';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

/**
 * Options du hook useDailyChallenges
 */
export interface UseDailyChallengesOptions {
  autoLoad?: boolean;
  includeHistory?: boolean;
  includeStat?: boolean;
  notificationsEnabled?: boolean;
}

/**
 * État du hook useDailyChallenges
 */
export interface DailyChallengesState {
  // Défi actuel
  todayChallenge: DailyChallenge | null;
  participation: ChallengeParticipation | null;
  
  // Historique
  recentChallenges: DailyChallenge[];
  participations: ChallengeParticipation[];
  
  // Leaderboard
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  
  // Stats
  userStats: ChallengeUserStats | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
}

/**
 * Actions du hook useDailyChallenges
 */
export interface DailyChallengesActions {
  // Participation
  submitChallenge: (submission: string) => Promise<ChallengeParticipation | null>;
  saveProgress: (submission: string) => Promise<void>;
  
  // Peer Review
  reviewSubmission: (participationId: string, rating: number, comment?: string) => Promise<void>;
  
  // Données
  loadTodayChallenge: () => Promise<void>;
  loadLeaderboard: (challengeId?: string) => Promise<void>;
  loadUserStats: () => Promise<void>;
  
  // Notifications
  markNotificationRead: (notificationId: string) => Promise<void>;
  
  // Hints
  useHint: (hintIndex: number) => Promise<string | null>;
}

/**
 * Type complet du hook
 */
export type UseDailyChallenges = DailyChallengesState & DailyChallengesActions;

/**
 * Props pour les composants de défis
 */
export interface ChallengeCardProps {
  challenge: DailyChallenge;
  participation?: ChallengeParticipation | null;
  compact?: boolean;
  showLeaderboard?: boolean;
  onParticipate?: () => void;
  onViewDetails?: () => void;
}

export interface ChallengeLeaderboardProps {
  challengeId: string;
  limit?: number;
  showUserRank?: boolean;
  compact?: boolean;
}

export interface ChallengeStatsProps {
  stats: ChallengeUserStats;
  showAchievements?: boolean;
  showBadges?: boolean;
  compact?: boolean;
}

export interface ChallengeHistoryProps {
  participations: ChallengeParticipation[];
  challenges: DailyChallenge[];
  limit?: number;
  onViewChallenge?: (challengeId: string) => void;
}

/**
 * Constantes
 */
export const CHALLENGE_POINTS = {
  PARTICIPATION: 10,
  COMPLETION: 50,
  SPEED_BONUS: 20,
  PERFECT_SCORE: 100,
  PEER_REVIEW: 5,
  STREAK_BONUS: 10
} as const;

export const ACHIEVEMENT_THRESHOLDS = {
  FIRST_CHALLENGE: 1,
  WEEK_STREAK: 7,
  MONTH_STREAK: 30,
  HUNDRED_CHALLENGES: 100,
  TOP_THREE: 3,
  PERFECT_WEEK: 7
} as const;

export const CHALLENGE_TIME_LIMITS = {
  speed: 600, // 10 minutes
  normal: 1800, // 30 minutes
  extended: 3600 // 1 hour
} as const;
