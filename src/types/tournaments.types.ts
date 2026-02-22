/**
 * Types pour le système de tournois
 */

export type TournamentType = 'weekly' | 'special' | 'seasonal';
export type TournamentStatus = 'upcoming' | 'registration' | 'active' | 'completed' | 'cancelled';
export type BracketType = 'single_elimination' | 'double_elimination' | 'round_robin';
export type ParticipantStatus = 'registered' | 'active' | 'eliminated' | 'winner' | 'disqualified' | 'withdrew';
export type RoundStatus = 'pending' | 'active' | 'completed';
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'forfeit' | 'cancelled';
export type EvaluationMethod = 'ai' | 'peer' | 'judge' | 'auto';
export type TournamentNotificationType =
  | 'registration_open'
  | 'registration_closing'
  | 'tournament_starting'
  | 'match_ready'
  | 'match_result'
  | 'round_advance'
  | 'tournament_complete'
  | 'tournament_victory'
  | 'prize_awarded';

/**
 * Configuration des récompenses d'un tournoi
 */
export interface PrizePool {
  first: number;
  second: number;
  third: number;
}

/**
 * Configuration des récompenses XP
 */
export interface XPRewards {
  first: number;
  second: number;
  third: number;
  participant: number;
}

/**
 * Tournoi hebdomadaire avec système d'élimination
 */
export interface Tournament {
  id: string;
  title: string;
  description?: string;

  // Planification
  tournament_type: TournamentType;
  status: TournamentStatus;
  start_date: string;
  end_date: string;
  registration_deadline: string;

  // Configuration
  max_participants: number;
  min_participants: number;
  bracket_type: BracketType;

  // Règles du tournoi
  challenge_type?: 'transform' | 'create' | 'speed' | 'analysis' | 'creative' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed';
  time_limit?: number; // En secondes par match

  // Récompenses
  prize_pool: PrizePool;
  xp_rewards: XPRewards;

  // Métadonnées
  category?: string;
  tags?: string[];
  banner_image_url?: string;
  rules?: string;

  // Statistiques
  participant_count: number;
  current_round: number;
  total_rounds?: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Participation d'un utilisateur à un tournoi
 */
export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  team_id?: string; // NULL pour tournoi individuel

  // Statut
  status: ParticipantStatus;
  seed_position?: number; // Position de tête de série

  // Statistiques
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  total_score: number;

  // Timestamps
  registered_at: string;
  eliminated_at?: string;

  // Relations
  user_profiles?: {
    full_name: string;
    avatar_url?: string;
    level?: string;
  };
  tournament?: Tournament;
}

/**
 * Round d'un tournoi (quarts, demi-finales, finale)
 */
export interface TournamentRound {
  id: string;
  tournament_id: string;

  round_number: number;
  round_name: string; // 'Round of 64', 'Round of 32', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Finals'

  // Statut
  status: RoundStatus;

  // Configuration
  matches_count: number;
  best_of: 1 | 3 | 5; // Best of 1, 3, ou 5

  // Timestamps
  start_time?: string;
  end_time?: string;
  created_at: string;

  // Relations
  tournament?: Tournament;
  matches?: TournamentMatch[];
}

/**
 * Match individuel dans un tournoi
 */
export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_id: string;

  // Participants
  participant1_id?: string;
  participant2_id?: string;
  winner_id?: string;

  // Configuration
  match_number: number;
  bracket_position?: string; // Pour affichage visuel du bracket

  // Statut
  status: MatchStatus;

  // Challenge
  challenge_prompt?: string;
  challenge_criteria?: Record<string, any>;

  // Scores
  participant1_score: number;
  participant2_score: number;
  participant1_submission?: string;
  participant2_submission?: string;
  participant1_time?: number; // Temps en secondes
  participant2_time?: number;

  // Évaluation
  evaluation_method: EvaluationMethod;
  evaluation_details?: Record<string, any>;

  // Métadonnées
  next_match_id?: string; // Match suivant en cas de victoire

  // Timestamps
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;

  // Relations
  participant1?: TournamentParticipant;
  participant2?: TournamentParticipant;
  winner?: TournamentParticipant;
  round?: TournamentRound;
}

/**
 * Résultat final d'un participant dans un tournoi
 */
export interface TournamentResult {
  id: string;
  tournament_id: string;
  participant_id: string;

  // Classement
  final_rank: number;
  placement_name?: string; // 'Champion', 'Runner-up', 'Semi-finalist', etc.

  // Statistiques
  total_matches: number;
  matches_won: number;
  matches_lost: number;
  total_score: number;
  average_score?: number;
  total_time?: number; // Temps total en secondes

  // Récompenses
  xp_earned: number;
  prize_amount: number;
  badges_earned: string[];
  achievements_unlocked: string[];

  // Timestamps
  created_at: string;

  // Relations
  participant?: TournamentParticipant;
  tournament?: Tournament;
}

/**
 * Notification liée à un tournoi
 */
export interface TournamentNotification {
  id: string;
  user_id: string;
  tournament_id?: string;

  type: TournamentNotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;

  read: boolean;
  created_at: string;
  read_at?: string;

  // Relations
  tournament?: Tournament;
}

/**
 * Vue du bracket pour affichage
 */
export interface TournamentBracketView {
  tournament_id: string;
  tournament_title: string;
  round_number: number;
  round_name: string;
  match_number: number;
  match_id: string;
  match_status: MatchStatus;
  participant1_user_id?: string;
  participant2_user_id?: string;
  participant1_score: number;
  participant2_score: number;
  winner_user_id?: string;
  scheduled_time?: string;
  completed_at?: string;
}

/**
 * Statistiques d'un utilisateur dans les tournois
 */
export interface TournamentUserStats {
  user_id: string;
  total_tournaments: number;
  tournaments_won: number;
  tournaments_completed: number;
  total_matches: number;
  matches_won: number;
  matches_lost: number;
  win_rate: number;
  average_score: number;
  total_xp_earned: number;
  total_prizes: number;
  best_placement: number;
  current_streak: number;
  best_streak: number;

  // Par type de tournoi
  stats_by_type: Record<TournamentType, {
    count: number;
    wins: number;
    average_placement: number;
  }>;

  // Rankings
  global_rank?: number;
  monthly_rank?: number;
  seasonal_rank?: number;
}

/**
 * Configuration pour créer un tournoi
 */
export interface CreateTournamentInput {
  title: string;
  description?: string;
  tournament_type: TournamentType;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants?: number;
  min_participants?: number;
  bracket_type?: BracketType;
  challenge_type?: 'transform' | 'create' | 'speed' | 'analysis' | 'creative' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed';
  time_limit?: number;
  prize_pool?: PrizePool;
  xp_rewards?: XPRewards;
  category?: string;
  tags?: string[];
  banner_image_url?: string;
  rules?: string;
}

/**
 * Options du hook useTournaments
 */
export interface UseTournamentsOptions {
  autoLoad?: boolean;
  includeHistory?: boolean;
  includeStats?: boolean;
  filter?: {
    status?: TournamentStatus[];
    tournament_type?: TournamentType[];
  };
}

/**
 * État du hook useTournaments
 */
export interface TournamentsState {
  // Tournois
  tournaments: Tournament[];
  activeTournaments: Tournament[];
  userTournaments: TournamentParticipant[];
  currentTournament: Tournament | null;

  // Bracket
  currentBracket: TournamentBracketView[];
  currentRound: TournamentRound | null;
  userMatches: TournamentMatch[];

  // Statistiques
  userStats: TournamentUserStats | null;
  leaderboard: TournamentResult[];

  // État
  loading: boolean;
  error: string | null;

  // Actions
  loadTournaments: () => Promise<void>;
  loadTournament: (tournamentId: string) => Promise<void>;
  registerForTournament: (tournamentId: string) => Promise<void>;
  withdrawFromTournament: (tournamentId: string) => Promise<void>;
  submitMatch: (matchId: string, submission: string) => Promise<void>;
  loadBracket: (tournamentId: string) => Promise<void>;
  loadUserStats: () => Promise<void>;
  refreshTournaments: () => Promise<void>;
}

/**
 * Données pour soumettre un match
 */
export interface SubmitMatchInput {
  match_id: string;
  submission: string;
  time_spent?: number;
}

/**
 * Résultat d'une évaluation de match
 */
export interface MatchEvaluation {
  participant1_score: number;
  participant2_score: number;
  winner_id: string;
  evaluation_details: {
    criteria_scores: Record<string, number>;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  model_used?: string;
  evaluated_at: string;
}

/**
 * Données pour créer une notification de tournoi
 */
export interface CreateTournamentNotificationInput {
  user_id: string;
  tournament_id?: string;
  type: TournamentNotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}
