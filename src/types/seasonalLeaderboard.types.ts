/**
 * Types pour le système de classements saisonniers
 * Basés sur la migration 029_seasonal_leaderboards.sql
 */

/**
 * Types de saisons
 */
export type SeasonType = 'monthly' | 'quarterly';

/**
 * Statuts de saisons
 */
export type SeasonStatus = 'upcoming' | 'active' | 'completed' | 'archived';

/**
 * Types de récompenses saisonnières
 */
export type SeasonalRewardType = 'top_rank' | 'participation' | 'milestone' | 'team_achievement';

/**
 * Niveaux de rareté des récompenses
 */
export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Définition d'une saison (mensuelle ou trimestrielle)
 */
export interface Season {
  id: string;
  season_name: string;
  season_type: SeasonType;

  // Période
  start_date: string;
  end_date: string;

  // Statut
  status: SeasonStatus;

  // Métadonnées
  total_participants: number;
  total_entries: number;
  archived_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Entrée de classement saisonnier pour un utilisateur
 */
export interface SeasonalLeaderboardEntry {
  id: string;
  season_id: string;
  user_id: string;

  // Scores
  total_score: number;
  challenges_completed: number;
  tournaments_won: number;
  xp_earned: number;
  skill_nodes_unlocked: number;

  // Classement
  rank: number | null;
  previous_rank: number | null;

  // Métadonnées
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Archive d'une entrée de classement saisonnier
 */
export interface SeasonalLeaderboardArchive {
  id: string;
  season_id: string;
  user_id: string;

  // Snapshot des données finales
  final_rank: number;
  final_score: number;
  challenges_completed: number;
  tournaments_won: number;
  xp_earned: number;
  skill_nodes_unlocked: number;

  // Récompenses
  rewards_claimed: boolean;
  reward_data: Record<string, any> | null;

  // Période de la saison (dénormalisé)
  season_start_date: string;
  season_end_date: string;
  season_type: SeasonType;
  season_name: string;

  // Timestamps
  archived_at: string;
  created_at: string;
}

/**
 * Entrée de classement saisonnier pour une équipe
 */
export interface TeamSeasonalLeaderboardEntry {
  id: string;
  season_id: string;
  team_id: string;

  // Scores d'équipe
  total_score: number;
  team_challenges_completed: number;
  tournaments_participated: number;
  average_member_xp: number;

  // Classement
  rank: number | null;
  previous_rank: number | null;

  // Métadonnées
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Définition d'une récompense saisonnière
 */
export interface SeasonalReward {
  id: string;
  season_id: string;

  // Critères
  reward_type: SeasonalRewardType;
  min_rank: number | null;
  max_rank: number | null;
  required_score: number | null;

  // Récompense
  reward_name: string;
  reward_description: string | null;
  reward_data: Record<string, any> | null;

  // Métadonnées
  icon_emoji: string | null;
  rarity: RewardRarity | null;

  created_at: string;
}

/**
 * Entrée de classement avec informations utilisateur
 */
export interface LeaderboardEntryWithUser extends SeasonalLeaderboardEntry {
  user_profile?: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  };
}

/**
 * Entrée de classement d'équipe avec informations équipe
 */
export interface TeamLeaderboardEntryWithTeam extends TeamSeasonalLeaderboardEntry {
  team?: {
    name: string;
    avatar_emoji: string | null;
    member_count: number;
  };
}

/**
 * Statistiques de saison pour un utilisateur
 */
export interface UserSeasonStats {
  season_id: string;
  user_id: string;
  rank: number | null;
  total_score: number;
  challenges_completed: number;
  tournaments_won: number;
  xp_earned: number;
  skill_nodes_unlocked: number;
  rank_change: number | null; // previous_rank - current_rank (positif = amélioration)
  percentile: number | null; // Position en percentile (0-100)
}

/**
 * Données pour mettre à jour le score saisonnier d'un utilisateur
 */
export interface UpdateSeasonalScoreData {
  user_id: string;
  score_increment?: number;
  challenges_increment?: number;
  tournaments_increment?: number;
  xp_increment?: number;
  skills_increment?: number;
}

/**
 * Options pour récupérer le classement saisonnier
 */
export interface GetLeaderboardOptions {
  season_id?: string;
  season_type?: SeasonType;
  limit?: number;
  offset?: number;
  include_user_profile?: boolean;
}

/**
 * Options pour récupérer le classement d'équipe
 */
export interface GetTeamLeaderboardOptions {
  season_id?: string;
  season_type?: SeasonType;
  limit?: number;
  offset?: number;
  include_team_info?: boolean;
}

/**
 * Résultat paginé du classement
 */
export interface LeaderboardResult {
  entries: LeaderboardEntryWithUser[];
  total_count: number;
  current_season: Season;
  user_rank: number | null;
}

/**
 * Résultat paginé du classement d'équipe
 */
export interface TeamLeaderboardResult {
  entries: TeamLeaderboardEntryWithTeam[];
  total_count: number;
  current_season: Season;
  team_rank: number | null;
}

/**
 * Saisons historiques avec statistiques
 */
export interface HistoricalSeason extends Season {
  user_final_rank?: number;
  user_final_score?: number;
  rewards_claimed?: boolean;
}

/**
 * Options du hook useSeasonalLeaderboard
 */
export interface UseSeasonalLeaderboardOptions {
  autoLoad?: boolean;
  seasonType?: SeasonType;
  includeTeamLeaderboard?: boolean;
  includeHistoricalSeasons?: boolean;
}

/**
 * État du hook useSeasonalLeaderboard
 */
export interface SeasonalLeaderboardState {
  // Saison actuelle
  currentSeason: Season | null;

  // Classements
  leaderboard: LeaderboardEntryWithUser[];
  teamLeaderboard: TeamLeaderboardEntryWithTeam[];

  // Stats utilisateur
  userSeasonStats: UserSeasonStats | null;

  // Historique
  historicalSeasons: HistoricalSeason[];

  // Top performers
  topPerformers: LeaderboardEntryWithUser[];

  // UI State
  isLoading: boolean;
  isLoadingTeams: boolean;
  isLoadingHistory: boolean;
  error: string | null;

  // Pagination
  totalCount: number;
  teamTotalCount: number;
}

/**
 * Actions du hook useSeasonalLeaderboard
 */
export interface SeasonalLeaderboardActions {
  // Chargement des données
  loadCurrentSeason: (seasonType?: SeasonType) => Promise<void>;
  loadLeaderboard: (options?: GetLeaderboardOptions) => Promise<void>;
  loadTeamLeaderboard: (options?: GetTeamLeaderboardOptions) => Promise<void>;
  loadUserStats: (userId?: string, seasonId?: string) => Promise<void>;
  loadHistoricalSeasons: (seasonType?: SeasonType, limit?: number) => Promise<void>;
  loadTopPerformers: (seasonId?: string, limit?: number) => Promise<void>;

  // Changement de saison
  switchSeason: (seasonId: string) => Promise<void>;
  switchSeasonType: (seasonType: SeasonType) => Promise<void>;

  // Récompenses
  claimRewards: (seasonId: string) => Promise<boolean>;

  // Rafraîchissement
  refresh: () => Promise<void>;
}

/**
 * Type complet du hook
 */
export type UseSeasonalLeaderboard = SeasonalLeaderboardState & SeasonalLeaderboardActions;
