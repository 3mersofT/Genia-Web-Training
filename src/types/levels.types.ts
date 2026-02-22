/**
 * Types pour le système de progression de niveau et XP
 */

export type LevelName = 'Novice' | 'Apprentice' | 'Expert' | 'Master' | 'Legend';
export type LevelNameFr = 'Novice' | 'Apprenti' | 'Expert' | 'Maître' | 'Légende';
export type XPSourceType =
  | 'challenge_complete'
  | 'tournament_win'
  | 'daily_streak'
  | 'peer_review'
  | 'team_challenge'
  | 'skill_unlock'
  | 'manual_award';

/**
 * Définition d'un niveau
 */
export interface LevelDefinition {
  id: string;
  level_rank: number;
  level_name: LevelName;
  level_name_fr: LevelNameFr;

  // Exigences XP
  xp_required: number;
  xp_next_level: number | null; // null pour le niveau maximum

  // Visuel
  icon_emoji?: string;
  color_hex?: string;
  badge_image_url?: string;

  // Récompenses
  rewards?: Record<string, any>;

  // Métadonnées
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Niveau actuel d'un utilisateur
 */
export interface UserLevel {
  user_id: string;

  // Niveau actuel
  current_level_id: string;
  current_level_rank: number;

  // XP
  total_xp: number;
  current_level_xp: number;

  // Statistiques
  total_level_ups: number;

  // Timestamps
  last_xp_gain_at?: string;
  last_level_up_at?: string;
  created_at: string;
  updated_at: string;

  // Relations (populated via joins)
  level_definition?: LevelDefinition;
}

/**
 * Transaction XP (historique)
 */
export interface XPTransaction {
  id: string;
  user_id: string;

  // Transaction
  xp_amount: number;
  source_type: XPSourceType;
  source_id?: string;

  // Contexte
  description?: string;
  metadata?: Record<string, any>;

  // Timestamp
  created_at: string;
}

/**
 * Notification de montée de niveau
 */
export interface LevelUpNotification {
  id: string;
  user_id: string;

  // Niveaux
  from_level_rank: number;
  to_level_rank: number;
  from_level_name?: string;
  to_level_name?: string;

  // Récompenses
  rewards_unlocked?: Record<string, any>;
  skills_unlocked?: string[];

  // Statut
  shown: boolean;
  shown_at?: string;

  created_at: string;
}

/**
 * Progression de niveau calculée
 */
export interface LevelProgress {
  current_level: LevelDefinition;
  next_level: LevelDefinition | null;

  current_xp: number;
  total_xp: number;

  xp_to_next_level: number;
  progress_percentage: number;

  level_rank: number;
  level_name: LevelName;
  level_name_fr: LevelNameFr;
}

/**
 * Résultat de l'attribution d'XP
 */
export interface AwardXPResult {
  success: boolean;
  xp_awarded: number;
  total_xp: number;
  current_level_rank: number;
  current_level_name: string;
  leveled_up: boolean;
  old_level_rank: number;
  new_level_rank: number;

  // Données supplémentaires (frontend)
  level_up_notification?: LevelUpNotification;
  new_skills_unlocked?: string[];
}

/**
 * Entrée pour attribuer de l'XP
 */
export interface AwardXPInput {
  user_id: string;
  xp_amount: number;
  source_type: XPSourceType;
  source_id?: string;
  description?: string;
}

/**
 * Statistiques de niveau utilisateur
 */
export interface UserLevelStats {
  user_id: string;
  current_level: LevelDefinition;
  total_xp: number;
  total_level_ups: number;

  // XP par source
  xp_by_source: Record<XPSourceType, number>;

  // Timeline
  recent_xp_gains: XPTransaction[];
  level_up_history: LevelUpNotification[];

  // Classements
  global_rank?: number;
  percentile?: number;
}

/**
 * Options du hook useLevelProgression
 */
export interface UseLevelProgressionOptions {
  autoLoad?: boolean;
  includeHistory?: boolean;
  includeNotifications?: boolean;
  realtimeEnabled?: boolean;
}

/**
 * État du hook useLevelProgression
 */
export interface LevelProgressionState {
  // Données actuelles
  userLevel: UserLevel | null;
  levelProgress: LevelProgress | null;
  levelDefinitions: LevelDefinition[];

  // Historique
  xpHistory: XPTransaction[];
  levelUpNotifications: LevelUpNotification[];
  unshownNotifications: LevelUpNotification[];

  // État de chargement
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

/**
 * Actions du hook useLevelProgression
 */
export interface LevelProgressionActions {
  awardXP: (input: Omit<AwardXPInput, 'user_id'>) => Promise<AwardXPResult>;
  refresh: () => Promise<void>;
  markNotificationShown: (notificationId: string) => Promise<void>;
  getLevelDefinition: (rank: number) => LevelDefinition | undefined;
  getXPForLevel: (rank: number) => number;
  calculateProgressToNextLevel: () => number;
}

/**
 * Résultat complet du hook useLevelProgression
 */
export interface UseLevelProgressionResult extends LevelProgressionState, LevelProgressionActions {}

/**
 * Événement temps réel pour les niveaux
 */
export interface LevelRealtimeEvent {
  type: 'xp_gained' | 'level_up' | 'notification_created';
  user_id: string;
  data: XPTransaction | UserLevel | LevelUpNotification;
  timestamp: string;
}

/**
 * Configuration des niveaux
 */
export interface LevelConfiguration {
  levels: LevelDefinition[];
  xp_sources: Record<XPSourceType, {
    default_amount: number;
    min_amount: number;
    max_amount: number;
    description: string;
  }>;
}

/**
 * Constantes pour les niveaux par défaut
 */
export const DEFAULT_LEVELS: Readonly<Array<{
  rank: number;
  name: LevelName;
  name_fr: LevelNameFr;
  xp_required: number;
  xp_next_level: number | null;
  icon_emoji: string;
  color_hex: string;
}>> = [
  {
    rank: 1,
    name: 'Novice',
    name_fr: 'Novice',
    xp_required: 0,
    xp_next_level: 1000,
    icon_emoji: '🌱',
    color_hex: '#94A3B8'
  },
  {
    rank: 2,
    name: 'Apprentice',
    name_fr: 'Apprenti',
    xp_required: 1000,
    xp_next_level: 5000,
    icon_emoji: '📚',
    color_hex: '#60A5FA'
  },
  {
    rank: 3,
    name: 'Expert',
    name_fr: 'Expert',
    xp_required: 5000,
    xp_next_level: 15000,
    icon_emoji: '⚡',
    color_hex: '#F59E0B'
  },
  {
    rank: 4,
    name: 'Master',
    name_fr: 'Maître',
    xp_required: 15000,
    xp_next_level: 50000,
    icon_emoji: '🔥',
    color_hex: '#EF4444'
  },
  {
    rank: 5,
    name: 'Legend',
    name_fr: 'Légende',
    xp_required: 50000,
    xp_next_level: null,
    icon_emoji: '👑',
    color_hex: '#8B5CF6'
  }
] as const;

/**
 * Helper pour obtenir le nom du niveau en français
 */
export function getLevelNameFr(levelName: LevelName): LevelNameFr {
  const map: Record<LevelName, LevelNameFr> = {
    'Novice': 'Novice',
    'Apprentice': 'Apprenti',
    'Expert': 'Expert',
    'Master': 'Maître',
    'Legend': 'Légende'
  };
  return map[levelName];
}

/**
 * Helper pour calculer le niveau basé sur l'XP total
 */
export function calculateLevelFromXP(totalXP: number, levels: LevelDefinition[]): LevelDefinition | null {
  if (levels.length === 0) return null;

  // Trier par rang décroissant
  const sortedLevels = [...levels].sort((a, b) => b.level_rank - a.level_rank);

  // Trouver le premier niveau dont l'XP requis est <= totalXP
  for (const level of sortedLevels) {
    if (totalXP >= level.xp_required) {
      return level;
    }
  }

  // Si aucun niveau trouvé, retourner le premier niveau
  return levels.find(l => l.level_rank === 1) || levels[0];
}

/**
 * Helper pour calculer la progression vers le prochain niveau
 */
export function calculateProgressPercentage(
  currentXP: number,
  currentLevelXP: number,
  nextLevelXP: number | null
): number {
  if (nextLevelXP === null) return 100; // Niveau max atteint

  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

  if (xpNeededForNextLevel <= 0) return 100;

  const percentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
  return Math.min(Math.max(percentage, 0), 100);
}
