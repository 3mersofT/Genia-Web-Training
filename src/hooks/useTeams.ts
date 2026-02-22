'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { teamService } from '@/services/teamService';
import type {
  Team,
  TeamMember,
  TeamInvitation,
  TeamChallenge,
  TeamLeaderboardEntry,
  TeamAchievement,
  TeamNotification,
  TeamStats,
  CreateTeamData,
  UpdateTeamData,
  CreateTeamInvitationData,
  SubmitTeamChallengeData,
  TeamSearchFilters,
  TeamMemberRole,
  UseTeamsOptions,
  UseTeamsResult
} from '@/types/teams.types';

/**
 * Hook pour gérer les équipes
 */
export function useTeams(
  options: UseTeamsOptions = {
    autoLoad: true,
    includeMembers: false,
    includeStats: false,
    notificationsEnabled: true
  }
): UseTeamsResult {
  // États
  const [user, setUser] = useState<User | null>(null);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);
  const [publicTeams, setPublicTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<TeamInvitation[]>([]);
  const [teamChallenges, setTeamChallenges] = useState<TeamChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<TeamLeaderboardEntry[]>([]);
  const [myTeamRank, setMyTeamRank] = useState<TeamLeaderboardEntry | null>(null);
  const [teamAchievements, setTeamAchievements] = useState<TeamAchievement[]>([]);
  const [notifications, setNotifications] = useState<TeamNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Gestion de l'authentification
  useEffect(() => {
    // Charger l'utilisateur actuel
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      setUser(user);
    });

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Charge les équipes de l'utilisateur
   */
  const loadMyTeams = useCallback(async (): Promise<Team[]> => {
    if (!user?.id) return [];

    setLoading(true);
    setError(null);

    try {
      const teams = await teamService.getMyTeams(user.id);
      setMyTeams(teams);
      return teams;
    } catch (err) {
      setError('Impossible de charger vos équipes');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Charge les équipes publiques
   */
  const loadPublicTeams = useCallback(async (): Promise<Team[]> => {
    setLoading(true);
    setError(null);

    try {
      const teams = await teamService.getPublicTeams();
      setPublicTeams(teams);
      return teams;
    } catch (err) {
      setError('Impossible de charger les équipes publiques');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Recherche des équipes
   */
  const searchTeams = useCallback(async (filters: TeamSearchFilters): Promise<Team[]> => {
    setLoading(true);
    setError(null);

    try {
      const teams = await teamService.searchTeams(filters);
      return teams;
    } catch (err) {
      setError('Erreur lors de la recherche d\'équipes');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Définit l'équipe courante
   */
  const setCurrentTeam = useCallback(async (teamId: string) => {
    setLoading(true);
    setError(null);

    try {
      const team = await teamService.getTeamById(teamId);
      setCurrentTeamState(team);

      if (team && options.includeMembers) {
        const members = await teamService.getTeamMembers(teamId);
        setTeamMembers(members);
      }

      if (team && options.includeStats) {
        const stats = await teamService.getTeamStats(teamId);
        setTeamStats(stats);
      }

      if (team && user?.id && options.notificationsEnabled) {
        const notifs = await teamService.getTeamNotifications(teamId, user.id);
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    } catch (err) {
      setError('Impossible de charger l\'équipe');
    } finally {
      setLoading(false);
    }
  }, [user?.id, options]);

  /**
   * Crée une nouvelle équipe
   */
  const createTeam = useCallback(async (data: CreateTeamData): Promise<Team> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      const team = await teamService.createTeam(user.id, data);

      // Recharger les équipes
      await loadMyTeams();

      // Définir comme équipe courante
      setCurrentTeamState(team);

      return team;
    } catch (err) {
      setError('Impossible de créer l\'équipe');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadMyTeams]);

  /**
   * Met à jour une équipe
   */
  const updateTeam = useCallback(async (teamId: string, data: UpdateTeamData): Promise<Team> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedTeam = await teamService.updateTeam(teamId, user.id, data);

      // Mettre à jour dans la liste
      setMyTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));

      // Mettre à jour l'équipe courante si c'est celle-ci
      if (currentTeam?.id === teamId) {
        setCurrentTeamState(updatedTeam);
      }

      return updatedTeam;
    } catch (err) {
      setError('Impossible de mettre à jour l\'équipe');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id]);

  /**
   * Supprime une équipe
   */
  const deleteTeam = useCallback(async (teamId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      await teamService.deleteTeam(teamId, user.id);

      // Retirer de la liste
      setMyTeams(prev => prev.filter(t => t.id !== teamId));

      // Réinitialiser l'équipe courante si c'est celle-ci
      if (currentTeam?.id === teamId) {
        setCurrentTeamState(null);
      }
    } catch (err) {
      setError('Impossible de supprimer l\'équipe');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id]);

  /**
   * Dissout une équipe
   */
  const disbandTeam = useCallback(async (teamId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      await teamService.disbandTeam(teamId, user.id);

      // Recharger les équipes
      await loadMyTeams();

      // Réinitialiser l'équipe courante si c'est celle-ci
      if (currentTeam?.id === teamId) {
        setCurrentTeamState(null);
      }
    } catch (err) {
      setError('Impossible de dissoudre l\'équipe');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id, loadMyTeams]);

  /**
   * Quitte une équipe
   */
  const leaveTeam = useCallback(async (teamId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      await teamService.leaveTeam(teamId, user.id);

      // Retirer de la liste
      setMyTeams(prev => prev.filter(t => t.id !== teamId));

      // Réinitialiser l'équipe courante si c'est celle-ci
      if (currentTeam?.id === teamId) {
        setCurrentTeamState(null);
      }
    } catch (err) {
      setError('Impossible de quitter l\'équipe');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id]);

  /**
   * Invite un membre
   */
  const inviteMember = useCallback(async (data: CreateTeamInvitationData): Promise<TeamInvitation> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      const invitation = await teamService.inviteMember(user.id, data);

      // Recharger les invitations envoyées si on est sur l'équipe
      if (currentTeam?.id === data.team_id) {
        const invitations = await teamService.getSentInvitations(data.team_id);
        setSentInvitations(invitations);
      }

      return invitation;
    } catch (err) {
      setError('Impossible d\'inviter le membre');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id]);

  /**
   * Accepte une invitation
   */
  const acceptInvitation = useCallback(async (invitationId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      await teamService.acceptInvitation(invitationId, user.id);

      // Retirer de la liste des invitations en attente
      setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));

      // Recharger les équipes
      await loadMyTeams();
    } catch (err) {
      setError('Impossible d\'accepter l\'invitation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadMyTeams]);

  /**
   * Refuse une invitation
   */
  const declineInvitation = useCallback(async (invitationId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      await teamService.declineInvitation(invitationId, user.id);

      // Retirer de la liste des invitations en attente
      setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));
    } catch (err) {
      setError('Impossible de refuser l\'invitation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Annule une invitation
   */
  const cancelInvitation = useCallback(async (invitationId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      await teamService.cancelInvitation(invitationId, user.id);

      // Retirer de la liste des invitations envoyées
      setSentInvitations(prev => prev.filter(i => i.id !== invitationId));
    } catch (err) {
      setError('Impossible d\'annuler l\'invitation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Retire un membre
   */
  const removeMember = useCallback(async (teamId: string, targetUserId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      await teamService.removeMember(teamId, user.id, targetUserId);

      // Recharger les membres si on est sur cette équipe
      if (currentTeam?.id === teamId) {
        const members = await teamService.getTeamMembers(teamId);
        setTeamMembers(members);
      }
    } catch (err) {
      setError('Impossible de retirer le membre');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id]);

  /**
   * Met à jour le rôle d'un membre
   */
  const updateMemberRole = useCallback(async (teamId: string, targetUserId: string, role: TeamMemberRole): Promise<void> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      await teamService.updateMemberRole(teamId, user.id, targetUserId, role);

      // Recharger les membres si on est sur cette équipe
      if (currentTeam?.id === teamId) {
        const members = await teamService.getTeamMembers(teamId);
        setTeamMembers(members);
      }
    } catch (err) {
      setError('Impossible de mettre à jour le rôle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id]);

  /**
   * Soumet un défi d'équipe
   */
  const submitTeamChallenge = useCallback(async (data: SubmitTeamChallengeData): Promise<TeamChallenge> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      const challenge = await teamService.submitTeamChallenge(user.id, data);

      // Recharger les défis si on est sur cette équipe
      if (currentTeam?.id === data.team_id) {
        const challenges = await teamService.getTeamChallenges(data.team_id);
        setTeamChallenges(challenges);

        // Recharger les stats si activées
        if (options.includeStats) {
          const stats = await teamService.getTeamStats(data.team_id);
          setTeamStats(stats);
        }
      }

      return challenge;
    } catch (err) {
      setError('Impossible de soumettre le défi');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id, options.includeStats]);

  /**
   * Charge les défis d'une équipe
   */
  const loadTeamChallenges = useCallback(async (teamId: string): Promise<TeamChallenge[]> => {
    setLoading(true);
    setError(null);

    try {
      const challenges = await teamService.getTeamChallenges(teamId);
      setTeamChallenges(challenges);
      return challenges;
    } catch (err) {
      setError('Impossible de charger les défis');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charge le leaderboard
   */
  const loadLeaderboard = useCallback(async (period: 'all' | 'weekly' | 'monthly' = 'all'): Promise<TeamLeaderboardEntry[]> => {
    setLoading(true);
    setError(null);

    try {
      const board = await teamService.getLeaderboard(period);
      setLeaderboard(board);

      // Trouver le rang de l'équipe courante
      if (currentTeam?.id) {
        const rank = board.find(entry => entry.team_id === currentTeam.id);
        setMyTeamRank(rank || null);
      }

      return board;
    } catch (err) {
      setError('Impossible de charger le leaderboard');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentTeam?.id]);

  /**
   * Charge les statistiques d'une équipe
   */
  const loadTeamStats = useCallback(async (teamId: string): Promise<TeamStats> => {
    setLoading(true);
    setError(null);

    try {
      const stats = await teamService.getTeamStats(teamId);
      if (!stats) {
        throw new Error('Statistiques non disponibles');
      }
      setTeamStats(stats);
      return stats;
    } catch (err) {
      setError('Impossible de charger les statistiques');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Marque une notification comme lue
   */
  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<void> => {
    if (!user?.id) return;

    try {
      await teamService.markNotificationAsRead(notificationId, user.id);

      // Mettre à jour localement
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError('Impossible de marquer la notification comme lue');
    }
  }, [user?.id]);

  /**
   * Marque toutes les notifications comme lues
   */
  const markAllNotificationsAsRead = useCallback(async (): Promise<void> => {
    if (!user?.id || !currentTeam?.id) return;

    try {
      await teamService.markAllNotificationsAsRead(currentTeam.id, user.id);

      // Mettre à jour localement
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: now }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError('Impossible de marquer toutes les notifications comme lues');
    }
  }, [user?.id, currentTeam?.id]);

  /**
   * Rafraîchit toutes les données
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Recharger les équipes
      await loadMyTeams();

      // Recharger les invitations en attente
      const invitations = await teamService.getPendingInvitations(user.id);
      setPendingInvitations(invitations);

      // Recharger l'équipe courante si elle existe
      if (currentTeam?.id) {
        await setCurrentTeam(currentTeam.id);
      }
    } catch (err) {
      setError('Impossible de rafraîchir les données');
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id, loadMyTeams, setCurrentTeam]);

  // Chargement automatique
  useEffect(() => {
    if (options.autoLoad && user?.id) {
      loadMyTeams();

      // Charger les invitations en attente
      teamService.getPendingInvitations(user.id).then(invitations => {
        setPendingInvitations(invitations);
      });
    }
  }, [options.autoLoad, user?.id, loadMyTeams]);

  return {
    state: {
      myTeams,
      currentTeam,
      publicTeams,
      teamMembers,
      pendingInvitations,
      sentInvitations,
      teamChallenges,
      leaderboard,
      myTeamRank,
      teamAchievements,
      notifications,
      unreadCount,
      teamStats,
      loading,
      error
    },
    actions: {
      createTeam,
      updateTeam,
      deleteTeam,
      disbandTeam,
      leaveTeam,
      setCurrentTeam,
      inviteMember,
      acceptInvitation,
      declineInvitation,
      cancelInvitation,
      removeMember,
      updateMemberRole,
      submitTeamChallenge,
      loadTeamChallenges,
      searchTeams,
      loadPublicTeams,
      loadMyTeams,
      loadLeaderboard,
      loadTeamStats,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      refresh
    }
  };
}
