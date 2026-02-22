/**
 * Types pour le système d'équipes
 */

export type TeamStatus = 'active' | 'inactive' | 'disbanded';
export type TeamMemberRole = 'captain' | 'co_captain' | 'member';
export type TeamMemberStatus = 'active' | 'inactive';
export type TeamInvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
export type TeamChallengeType = 'collaborative' | 'tournament' | 'custom';
export type TeamAchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type TeamNotificationType =
  | 'new_member'
  | 'member_left'
  | 'invitation_received'
  | 'invitation_accepted'
  | 'challenge_completed'
  | 'achievement_unlocked'
  | 'rank_changed'
  | 'captain_changed';

/**
 * Équipe de 2 à 5 membres
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;

  // Métadonnées de l'équipe
  captain_id: string;
  max_members: number;
  is_public: boolean;

  // Statistiques de l'équipe
  total_score: number;
  challenges_completed: number;
  tournaments_won: number;
  current_streak: number;

  // Tags et catégories
  tags: string[];

  // Statut
  status: TeamStatus;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Relations (pour les requêtes avec jointures)
  members?: TeamMember[];
  captain?: {
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Membre d'une équipe
 */
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;

  // Rôle dans l'équipe
  role: TeamMemberRole;

  // Statistiques individuelles dans l'équipe
  contributions: number;
  challenges_completed: number;

  // Statut
  status: TeamMemberStatus;

  // Timestamp
  joined_at: string;

  // Relations
  user_profiles?: {
    full_name: string;
    avatar_url?: string;
    level?: string;
  };
  team?: Team;
}

/**
 * Invitation à rejoindre une équipe
 */
export interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  invitee_id?: string;
  invitee_email?: string;

  // Message d'invitation
  message?: string;

  // Statut de l'invitation
  status: TeamInvitationStatus;

  // Expiration
  expires_at: string;

  // Timestamps
  created_at: string;
  responded_at?: string;

  // Relations
  team?: Team;
  inviter?: {
    full_name: string;
    avatar_url?: string;
  };
  invitee?: {
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Défi d'équipe
 */
export interface TeamChallenge {
  id: string;
  team_id: string;
  challenge_id?: string;

  // Type de défi d'équipe
  challenge_type: TeamChallengeType;

  // Soumission d'équipe
  submission: string;
  submitted_by?: string;

  // Membres contributeurs
  contributors: string[];

  // Évaluation
  score: number;
  ai_evaluation?: AITeamEvaluation;
  bonus_points: number;

  // Métadonnées
  time_spent?: number; // En secondes
  hints_used: number;

  // Timestamps
  started_at: string;
  completed_at: string;
  created_at: string;

  // Relations
  team?: Team;
  challenge?: {
    title: string;
    difficulty: string;
    max_score: number;
  };
  submitter?: {
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Évaluation IA pour un défi d'équipe
 */
export interface AITeamEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  collaboration_score: number;
  criteria_scores: Record<string, number>;
  model_used: string;
  evaluated_at: string;
}

/**
 * Entrée du leaderboard d'équipes
 */
export interface TeamLeaderboardEntry {
  team_id: string;
  rank: number;
  total_score: number;
  challenges_completed: number;
  tournaments_won: number;
  average_score: number;
  member_count: number;

  // Périodes de temps
  weekly_score: number;
  monthly_score: number;

  // Métadonnées
  updated_at: string;

  // Relations
  team?: Team;
}

/**
 * Achievement d'équipe
 */
export interface TeamAchievement {
  id: string;
  team_id: string;

  achievement_type: string;
  achievement_name: string;
  achievement_description?: string;
  icon_emoji?: string;
  rarity?: TeamAchievementRarity;

  progress: number;
  max_progress?: number;

  unlocked_at: string;

  // Relations
  team?: Team;
}

/**
 * Notification d'équipe
 */
export interface TeamNotification {
  id: string;
  team_id: string;
  user_id?: string;

  type: TeamNotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;

  read: boolean;
  created_at: string;
  read_at?: string;

  // Relations
  team?: Team;
}

/**
 * Statistiques d'équipe détaillées
 */
export interface TeamStats {
  team_id: string;

  // Statistiques globales
  total_score: number;
  challenges_completed: number;
  tournaments_won: number;
  current_streak: number;
  best_streak: number;
  average_score: number;
  average_time: number;

  // Statistiques par période
  weekly_stats: {
    score: number;
    challenges: number;
    rank: number;
  };
  monthly_stats: {
    score: number;
    challenges: number;
    rank: number;
  };

  // Statistiques par type de défi
  stats_by_type: Record<TeamChallengeType, {
    count: number;
    average_score: number;
    best_score: number;
  }>;

  // Membres
  member_count: number;
  active_members: number;
  top_contributors: {
    user_id: string;
    full_name: string;
    contributions: number;
  }[];

  // Achievements
  achievements_unlocked: number;
  achievements_total: number;

  // Rankings
  global_rank?: number;
  weekly_rank?: number;
  monthly_rank?: number;
}

/**
 * Données pour créer une équipe
 */
export interface CreateTeamData {
  name: string;
  description?: string;
  avatar_url?: string;
  max_members?: number;
  is_public?: boolean;
  tags?: string[];
}

/**
 * Données pour mettre à jour une équipe
 */
export interface UpdateTeamData {
  name?: string;
  description?: string;
  avatar_url?: string;
  max_members?: number;
  is_public?: boolean;
  tags?: string[];
  status?: TeamStatus;
}

/**
 * Données pour inviter un membre
 */
export interface CreateTeamInvitationData {
  team_id: string;
  invitee_id?: string;
  invitee_email?: string;
  message?: string;
}

/**
 * Données pour soumettre un défi d'équipe
 */
export interface SubmitTeamChallengeData {
  team_id: string;
  challenge_id?: string;
  challenge_type: TeamChallengeType;
  submission: string;
  contributors: string[];
  time_spent?: number;
  hints_used?: number;
}

/**
 * Filtres pour la recherche d'équipes
 */
export interface TeamSearchFilters {
  query?: string;
  is_public?: boolean;
  status?: TeamStatus;
  tags?: string[];
  min_members?: number;
  max_members?: number;
  min_score?: number;
  sort_by?: 'score' | 'members' | 'created' | 'name';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Options du hook useTeams
 */
export interface UseTeamsOptions {
  autoLoad?: boolean;
  includeMembers?: boolean;
  includeStats?: boolean;
  notificationsEnabled?: boolean;
}

/**
 * État du hook useTeams
 */
export interface TeamsState {
  // Équipes
  myTeams: Team[];
  currentTeam: Team | null;
  publicTeams: Team[];

  // Membres
  teamMembers: TeamMember[];

  // Invitations
  pendingInvitations: TeamInvitation[];
  sentInvitations: TeamInvitation[];

  // Défis
  teamChallenges: TeamChallenge[];

  // Leaderboard
  leaderboard: TeamLeaderboardEntry[];
  myTeamRank: TeamLeaderboardEntry | null;

  // Achievements
  teamAchievements: TeamAchievement[];

  // Notifications
  notifications: TeamNotification[];
  unreadCount: number;

  // Stats
  teamStats: TeamStats | null;

  // État de chargement
  loading: boolean;
  error: string | null;
}

/**
 * Actions du hook useTeams
 */
export interface TeamsActions {
  // Gestion des équipes
  createTeam: (data: CreateTeamData) => Promise<Team>;
  updateTeam: (teamId: string, data: UpdateTeamData) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  disbandTeam: (teamId: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
  setCurrentTeam: (teamId: string) => void;

  // Gestion des membres
  inviteMember: (data: CreateTeamInvitationData) => Promise<TeamInvitation>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  updateMemberRole: (teamId: string, userId: string, role: TeamMemberRole) => Promise<void>;

  // Gestion des défis
  submitTeamChallenge: (data: SubmitTeamChallengeData) => Promise<TeamChallenge>;
  loadTeamChallenges: (teamId: string) => Promise<TeamChallenge[]>;

  // Recherche et découverte
  searchTeams: (filters: TeamSearchFilters) => Promise<Team[]>;
  loadPublicTeams: () => Promise<Team[]>;
  loadMyTeams: () => Promise<Team[]>;

  // Leaderboard
  loadLeaderboard: (period?: 'all' | 'weekly' | 'monthly') => Promise<TeamLeaderboardEntry[]>;
  loadTeamStats: (teamId: string) => Promise<TeamStats>;

  // Notifications
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
}

/**
 * Résultat du hook useTeams
 */
export interface UseTeamsResult {
  state: TeamsState;
  actions: TeamsActions;
}

/**
 * Événement de mise à jour d'équipe (pour Realtime)
 */
export interface TeamRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'teams' | 'team_members' | 'team_invitations' | 'team_challenges' | 'team_leaderboard';
  new?: any;
  old?: any;
  eventType: string;
}

/**
 * Configuration de validation pour les équipes
 */
export interface TeamValidationRules {
  name: {
    minLength: number;
    maxLength: number;
    pattern?: RegExp;
  };
  description: {
    maxLength: number;
  };
  members: {
    min: number;
    max: number;
  };
  tags: {
    maxCount: number;
    maxLength: number;
  };
}

/**
 * Constantes par défaut pour les équipes
 */
export const TEAM_DEFAULTS: TeamValidationRules = {
  name: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
  },
  description: {
    maxLength: 500,
  },
  members: {
    min: 2,
    max: 5,
  },
  tags: {
    maxCount: 5,
    maxLength: 20,
  },
};

/**
 * Permissions d'équipe
 */
export interface TeamPermissions {
  canUpdateTeam: boolean;
  canDeleteTeam: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canSubmitChallenges: boolean;
  canViewStats: boolean;
  canUpdateRoles: boolean;
}

/**
 * Helper pour obtenir les permissions d'un utilisateur dans une équipe
 */
export function getTeamPermissions(
  team: Team | null,
  userId: string | undefined,
  memberRole?: TeamMemberRole
): TeamPermissions {
  if (!team || !userId) {
    return {
      canUpdateTeam: false,
      canDeleteTeam: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canSubmitChallenges: false,
      canViewStats: false,
      canUpdateRoles: false,
    };
  }

  const isCaptain = team.captain_id === userId;
  const isCoCaptain = memberRole === 'co_captain';
  const isMember = !!memberRole;

  return {
    canUpdateTeam: isCaptain,
    canDeleteTeam: isCaptain,
    canInviteMembers: isCaptain || isCoCaptain,
    canRemoveMembers: isCaptain,
    canSubmitChallenges: isMember,
    canViewStats: isMember,
    canUpdateRoles: isCaptain,
  };
}
