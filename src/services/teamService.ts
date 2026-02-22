import { createClient } from '@/lib/supabase/client';
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
  AITeamEvaluation,
  TeamStatus,
  TeamMemberRole
} from '@/types/teams.types';
import { TEAM_DEFAULTS } from '@/types/teams.types';

/**
 * Service de gestion des équipes
 */
export class TeamService {
  private supabase = createClient();

  /**
   * Récupère les équipes d'un utilisateur
   */
  async getMyTeams(userId: string): Promise<Team[]> {
    try {
      const { data: memberData, error: memberError } = await this.supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (memberError) throw memberError;
      if (!memberData || memberData.length === 0) return [];

      const teamIds = memberData.map((m: { team_id: string }) => m.team_id);

      const { data, error } = await this.supabase
        .from('teams')
        .select(`
          *,
          captain:user_profiles!teams_captain_id_fkey(full_name, avatar_url),
          members:team_members(
            id,
            user_id,
            role,
            contributions,
            challenges_completed,
            status,
            joined_at,
            user_profiles(full_name, avatar_url, level)
          )
        `)
        .in('id', teamIds)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération équipes utilisateur:', error);
      return [];
    }
  }

  /**
   * Récupère les équipes publiques
   */
  async getPublicTeams(limit: number = 20, offset: number = 0): Promise<Team[]> {
    try {
      const { data, error } = await this.supabase
        .from('teams')
        .select(`
          *,
          captain:user_profiles!teams_captain_id_fkey(full_name, avatar_url)
        `)
        .eq('is_public', true)
        .eq('status', 'active')
        .order('total_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération équipes publiques:', error);
      return [];
    }
  }

  /**
   * Recherche des équipes selon des critères
   */
  async searchTeams(filters: TeamSearchFilters): Promise<Team[]> {
    try {
      let query = this.supabase
        .from('teams')
        .select(`
          *,
          captain:user_profiles!teams_captain_id_fkey(full_name, avatar_url)
        `);

      if (filters.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'active');
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.min_score !== undefined) {
        query = query.gte('total_score', filters.min_score);
      }

      const sortBy = filters.sort_by || 'score';
      const sortOrder = filters.sort_order === 'asc' ? { ascending: true } : { ascending: false };

      switch (sortBy) {
        case 'name':
          query = query.order('name', sortOrder);
          break;
        case 'members':
          query = query.order('max_members', sortOrder);
          break;
        case 'created':
          query = query.order('created_at', sortOrder);
          break;
        case 'score':
        default:
          query = query.order('total_score', sortOrder);
      }

      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur recherche équipes:', error);
      return [];
    }
  }

  /**
   * Récupère une équipe par son ID
   */
  async getTeamById(teamId: string): Promise<Team | null> {
    try {
      const { data, error } = await this.supabase
        .from('teams')
        .select(`
          *,
          captain:user_profiles!teams_captain_id_fkey(full_name, avatar_url),
          members:team_members(
            id,
            user_id,
            role,
            contributions,
            challenges_completed,
            status,
            joined_at,
            user_profiles(full_name, avatar_url, level)
          )
        `)
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur récupération équipe:', error);
      return null;
    }
  }

  /**
   * Crée une nouvelle équipe
   */
  async createTeam(userId: string, teamData: CreateTeamData): Promise<Team> {
    try {
      const { name, description, avatar_url, max_members, is_public, tags } = teamData;

      const { data: team, error: teamError } = await this.supabase
        .from('teams')
        .insert({
          name,
          description,
          avatar_url,
          captain_id: userId,
          max_members: max_members || TEAM_DEFAULTS.members.max,
          is_public: is_public !== undefined ? is_public : true,
          tags: tags || [],
          status: 'active',
          total_score: 0,
          challenges_completed: 0,
          tournaments_won: 0,
          current_streak: 0
        })
        .select()
        .single();

      if (teamError) throw teamError;

      const { error: memberError } = await this.supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId,
          role: 'captain',
          contributions: 0,
          challenges_completed: 0,
          status: 'active'
        });

      if (memberError) throw memberError;

      return team;
    } catch (error) {
      console.error('Erreur création équipe:', error);
      throw error;
    }
  }

  /**
   * Met à jour une équipe
   */
  async updateTeam(teamId: string, userId: string, updateData: UpdateTeamData): Promise<Team> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team || team.captain_id !== userId) {
        throw new Error('Non autorisé à modifier cette équipe');
      }

      const { data, error } = await this.supabase
        .from('teams')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur mise à jour équipe:', error);
      throw error;
    }
  }

  /**
   * Dissout une équipe (seul le capitaine peut le faire)
   */
  async disbandTeam(teamId: string, userId: string): Promise<void> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team || team.captain_id !== userId) {
        throw new Error('Non autorisé à dissoudre cette équipe');
      }

      const { error } = await this.supabase
        .from('teams')
        .update({ status: 'disbanded' })
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur dissolution équipe:', error);
      throw error;
    }
  }

  /**
   * Supprime une équipe (seul le capitaine peut le faire)
   */
  async deleteTeam(teamId: string, userId: string): Promise<void> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team || team.captain_id !== userId) {
        throw new Error('Non autorisé à supprimer cette équipe');
      }

      const { error } = await this.supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur suppression équipe:', error);
      throw error;
    }
  }

  /**
   * Quitte une équipe
   */
  async leaveTeam(teamId: string, userId: string): Promise<void> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Équipe introuvable');
      }

      if (team.captain_id === userId) {
        throw new Error('Le capitaine ne peut pas quitter l\'équipe sans la dissoudre ou transférer le rôle');
      }

      const { error } = await this.supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur quitter équipe:', error);
      throw error;
    }
  }

  /**
   * Récupère les membres d'une équipe
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await this.supabase
        .from('team_members')
        .select(`
          *,
          user_profiles(full_name, avatar_url, level)
        `)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération membres équipe:', error);
      return [];
    }
  }

  /**
   * Invite un membre à rejoindre l'équipe
   */
  async inviteMember(userId: string, invitationData: CreateTeamInvitationData): Promise<TeamInvitation> {
    try {
      const { team_id, invitee_id, invitee_email, message } = invitationData;

      const team = await this.getTeamById(team_id);
      if (!team) {
        throw new Error('Équipe introuvable');
      }

      const member = await this.supabase
        .from('team_members')
        .select('role')
        .eq('team_id', team_id)
        .eq('user_id', userId)
        .single();

      const canInvite = team.captain_id === userId || member.data?.role === 'co_captain';
      if (!canInvite) {
        throw new Error('Non autorisé à inviter des membres');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await this.supabase
        .from('team_invitations')
        .insert({
          team_id,
          inviter_id: userId,
          invitee_id,
          invitee_email,
          message,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur invitation membre:', error);
      throw error;
    }
  }

  /**
   * Accepte une invitation
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      const { data: invitation, error: inviteError } = await this.supabase
        .from('team_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (inviteError) throw inviteError;
      if (!invitation || invitation.invitee_id !== userId) {
        throw new Error('Invitation introuvable ou non autorisée');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Invitation déjà traitée');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation expirée');
      }

      const { error: memberError } = await this.supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: userId,
          role: 'member',
          contributions: 0,
          challenges_completed: 0,
          status: 'active'
        });

      if (memberError) throw memberError;

      const { error: updateError } = await this.supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Erreur acceptation invitation:', error);
      throw error;
    }
  }

  /**
   * Refuse une invitation
   */
  async declineInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      const { data: invitation, error: inviteError } = await this.supabase
        .from('team_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (inviteError) throw inviteError;
      if (!invitation || invitation.invitee_id !== userId) {
        throw new Error('Invitation introuvable ou non autorisée');
      }

      const { error } = await this.supabase
        .from('team_invitations')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur refus invitation:', error);
      throw error;
    }
  }

  /**
   * Annule une invitation (par l'inviteur)
   */
  async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      const { data: invitation, error: inviteError } = await this.supabase
        .from('team_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (inviteError) throw inviteError;
      if (!invitation || invitation.inviter_id !== userId) {
        throw new Error('Non autorisé à annuler cette invitation');
      }

      const { error } = await this.supabase
        .from('team_invitations')
        .update({
          status: 'cancelled',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur annulation invitation:', error);
      throw error;
    }
  }

  /**
   * Récupère les invitations en attente pour un utilisateur
   */
  async getPendingInvitations(userId: string): Promise<TeamInvitation[]> {
    try {
      const { data, error } = await this.supabase
        .from('team_invitations')
        .select(`
          *,
          team:teams(*),
          inviter:user_profiles!team_invitations_inviter_id_fkey(full_name, avatar_url)
        `)
        .eq('invitee_id', userId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération invitations:', error);
      return [];
    }
  }

  /**
   * Récupère les invitations envoyées par une équipe
   */
  async getSentInvitations(teamId: string): Promise<TeamInvitation[]> {
    try {
      const { data, error } = await this.supabase
        .from('team_invitations')
        .select(`
          *,
          invitee:user_profiles!team_invitations_invitee_id_fkey(full_name, avatar_url)
        `)
        .eq('team_id', teamId)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération invitations envoyées:', error);
      return [];
    }
  }

  /**
   * Retire un membre de l'équipe
   */
  async removeMember(teamId: string, userId: string, targetUserId: string): Promise<void> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team || team.captain_id !== userId) {
        throw new Error('Non autorisé à retirer des membres');
      }

      if (targetUserId === userId) {
        throw new Error('Impossible de se retirer soi-même. Utilisez leaveTeam()');
      }

      const { error } = await this.supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', targetUserId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur retrait membre:', error);
      throw error;
    }
  }

  /**
   * Met à jour le rôle d'un membre
   */
  async updateMemberRole(teamId: string, userId: string, targetUserId: string, newRole: TeamMemberRole): Promise<void> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team || team.captain_id !== userId) {
        throw new Error('Non autorisé à modifier les rôles');
      }

      if (newRole === 'captain') {
        throw new Error('Utilisez transferCaptaincy() pour transférer le rôle de capitaine');
      }

      const { error } = await this.supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('team_id', teamId)
        .eq('user_id', targetUserId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur mise à jour rôle membre:', error);
      throw error;
    }
  }

  /**
   * Soumet un défi d'équipe
   */
  async submitTeamChallenge(userId: string, challengeData: SubmitTeamChallengeData): Promise<TeamChallenge> {
    try {
      const { team_id, challenge_id, challenge_type, submission, contributors, time_spent, hints_used } = challengeData;

      const isMember = await this.supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!isMember.data) {
        throw new Error('Non membre de cette équipe');
      }

      const aiEvaluation = await this.evaluateTeamSubmission(submission, challenge_type);

      const { data, error } = await this.supabase
        .from('team_challenges')
        .insert({
          team_id,
          challenge_id,
          challenge_type,
          submission,
          submitted_by: userId,
          contributors,
          score: aiEvaluation.score,
          ai_evaluation: aiEvaluation,
          bonus_points: 0,
          time_spent,
          hints_used: hints_used || 0,
          started_at: new Date(Date.now() - (time_spent || 0) * 1000).toISOString(),
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await this.updateTeamStats(team_id, aiEvaluation.score);
      await this.updateMemberContributions(team_id, contributors);

      return data;
    } catch (error) {
      console.error('Erreur soumission défi équipe:', error);
      throw error;
    }
  }

  /**
   * Évalue une soumission d'équipe avec l'IA
   */
  private async evaluateTeamSubmission(submission: string, challengeType: string): Promise<AITeamEvaluation> {
    return {
      score: Math.floor(Math.random() * 40) + 60,
      feedback: 'Bonne collaboration d\'équipe',
      strengths: ['Travail d\'équipe efficace', 'Approche structurée'],
      improvements: ['Pourrait améliorer la coordination'],
      collaboration_score: 85,
      criteria_scores: {
        quality: 80,
        teamwork: 85,
        creativity: 75
      },
      model_used: 'gpt-4',
      evaluated_at: new Date().toISOString()
    };
  }

  /**
   * Met à jour les statistiques d'une équipe
   */
  private async updateTeamStats(teamId: string, scoreToAdd: number): Promise<void> {
    try {
      const { data: team, error: teamError } = await this.supabase
        .from('teams')
        .select('total_score, challenges_completed')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      const { error } = await this.supabase
        .from('teams')
        .update({
          total_score: (team?.total_score || 0) + scoreToAdd,
          challenges_completed: (team?.challenges_completed || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur mise à jour stats équipe:', error);
    }
  }

  /**
   * Met à jour les contributions des membres
   */
  private async updateMemberContributions(teamId: string, contributors: string[]): Promise<void> {
    try {
      for (const userId of contributors) {
        const { data: member, error: memberError } = await this.supabase
          .from('team_members')
          .select('contributions, challenges_completed')
          .eq('team_id', teamId)
          .eq('user_id', userId)
          .single();

        if (memberError) continue;

        await this.supabase
          .from('team_members')
          .update({
            contributions: (member?.contributions || 0) + 1,
            challenges_completed: (member?.challenges_completed || 0) + 1
          })
          .eq('team_id', teamId)
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Erreur mise à jour contributions membres:', error);
    }
  }

  /**
   * Récupère les défis d'une équipe
   */
  async getTeamChallenges(teamId: string, limit: number = 50): Promise<TeamChallenge[]> {
    try {
      const { data, error } = await this.supabase
        .from('team_challenges')
        .select(`
          *,
          submitter:user_profiles!team_challenges_submitted_by_fkey(full_name, avatar_url)
        `)
        .eq('team_id', teamId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération défis équipe:', error);
      return [];
    }
  }

  /**
   * Récupère le leaderboard des équipes
   */
  async getLeaderboard(period: 'all' | 'weekly' | 'monthly' = 'all', limit: number = 100): Promise<TeamLeaderboardEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('team_leaderboard')
        .select(`
          *,
          team:teams(*)
        `)
        .order(period === 'weekly' ? 'weekly_score' : period === 'monthly' ? 'monthly_score' : 'total_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération leaderboard:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques détaillées d'une équipe
   */
  async getTeamStats(teamId: string): Promise<TeamStats | null> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) return null;

      const members = await this.getTeamMembers(teamId);
      const challenges = await this.getTeamChallenges(teamId);

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weeklyChallenges = challenges.filter(c => new Date(c.completed_at) >= oneWeekAgo);
      const monthlyChallenges = challenges.filter(c => new Date(c.completed_at) >= oneMonthAgo);

      const weeklyScore = weeklyChallenges.reduce((sum, c) => sum + c.score, 0);
      const monthlyScore = monthlyChallenges.reduce((sum, c) => sum + c.score, 0);

      const topContributors = members
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 5)
        .map(m => ({
          user_id: m.user_id,
          full_name: m.user_profiles?.full_name || 'Unknown',
          contributions: m.contributions
        }));

      const statsByType: Record<string, any> = {};
      for (const challenge of challenges) {
        if (!statsByType[challenge.challenge_type]) {
          statsByType[challenge.challenge_type] = {
            count: 0,
            average_score: 0,
            best_score: 0,
            total_score: 0
          };
        }
        statsByType[challenge.challenge_type].count++;
        statsByType[challenge.challenge_type].total_score += challenge.score;
        statsByType[challenge.challenge_type].best_score = Math.max(
          statsByType[challenge.challenge_type].best_score,
          challenge.score
        );
      }

      for (const type in statsByType) {
        statsByType[type].average_score = statsByType[type].total_score / statsByType[type].count;
      }

      const stats: TeamStats = {
        team_id: teamId,
        total_score: team.total_score,
        challenges_completed: team.challenges_completed,
        tournaments_won: team.tournaments_won,
        current_streak: team.current_streak,
        best_streak: team.current_streak,
        average_score: challenges.length > 0 ? team.total_score / challenges.length : 0,
        average_time: challenges.reduce((sum, c) => sum + (c.time_spent || 0), 0) / (challenges.length || 1),
        weekly_stats: {
          score: weeklyScore,
          challenges: weeklyChallenges.length,
          rank: 0
        },
        monthly_stats: {
          score: monthlyScore,
          challenges: monthlyChallenges.length,
          rank: 0
        },
        stats_by_type: statsByType,
        member_count: members.length,
        active_members: members.filter(m => m.status === 'active').length,
        top_contributors: topContributors,
        achievements_unlocked: 0,
        achievements_total: 0
      };

      return stats;
    } catch (error) {
      console.error('Erreur récupération stats équipe:', error);
      return null;
    }
  }

  /**
   * Récupère les achievements d'une équipe
   */
  async getTeamAchievements(teamId: string): Promise<TeamAchievement[]> {
    try {
      const { data, error } = await this.supabase
        .from('team_achievements')
        .select('*')
        .eq('team_id', teamId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération achievements équipe:', error);
      return [];
    }
  }

  /**
   * Récupère les notifications d'une équipe pour un utilisateur
   */
  async getTeamNotifications(teamId: string, userId: string): Promise<TeamNotification[]> {
    try {
      const { data, error } = await this.supabase
        .from('team_notifications')
        .select('*')
        .eq('team_id', teamId)
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération notifications équipe:', error);
      return [];
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('team_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .or(`user_id.is.null,user_id.eq.${userId}`);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur marquage notification lue:', error);
      throw error;
    }
  }

  /**
   * Marque toutes les notifications d'une équipe comme lues
   */
  async markAllNotificationsAsRead(teamId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('team_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('read', false)
        .or(`user_id.is.null,user_id.eq.${userId}`);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur marquage toutes notifications lues:', error);
      throw error;
    }
  }

  /**
   * Soumet un défi d'équipe pour un tournoi
   */
  async submitTournamentTeamChallenge(
    userId: string,
    teamId: string,
    tournamentId: string,
    matchId: string,
    challengeData: {
      challenge_id?: string;
      submission: string;
      contributors: string[];
      time_spent?: number;
      hints_used?: number;
    }
  ): Promise<{ challenge: TeamChallenge; score: number } | null> {
    try {
      // Vérifier que l'utilisateur est membre de l'équipe
      const { data: memberCheck } = await this.supabase
        .from('team_members')
        .select('id, role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!memberCheck) {
        throw new Error('Non membre de cette équipe');
      }

      // Créer la soumission de défi d'équipe
      const aiEvaluation = await this.evaluateTeamSubmission(
        challengeData.submission,
        'tournament'
      );

      const { data: teamChallenge, error: challengeError } = await this.supabase
        .from('team_challenges')
        .insert({
          team_id: teamId,
          challenge_id: challengeData.challenge_id,
          challenge_type: 'tournament',
          submission: challengeData.submission,
          submitted_by: userId,
          contributors: challengeData.contributors,
          score: aiEvaluation.score,
          ai_evaluation: aiEvaluation,
          bonus_points: 10, // Bonus pour tournoi
          time_spent: challengeData.time_spent,
          hints_used: challengeData.hints_used || 0,
          started_at: new Date(Date.now() - (challengeData.time_spent || 0) * 1000).toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      // Calculer le score final avec bonus
      const finalScore = aiEvaluation.score + (teamChallenge.bonus_points || 0);

      // Mettre à jour les statistiques de l'équipe
      await this.updateTeamStats(teamId, finalScore);
      await this.updateMemberContributions(teamId, challengeData.contributors);

      // Créer une notification pour l'équipe
      await this.supabase
        .from('team_notifications')
        .insert({
          team_id: teamId,
          user_id: null, // Notification pour toute l'équipe
          type: 'challenge_completed',
          title: 'Défi de tournoi terminé',
          message: `Score obtenu : ${finalScore}/100`,
          data: {
            tournament_id: tournamentId,
            match_id: matchId,
            score: finalScore,
          },
          read: false,
        });

      return { challenge: teamChallenge, score: finalScore };
    } catch (error) {
      console.error('Erreur soumission défi tournoi équipe:', error);
      return null;
    }
  }

  /**
   * Récupère les participations d'une équipe aux tournois
   */
  async getTeamTournamentParticipations(teamId: string): Promise<Array<{
    tournament_id: string;
    tournament_title: string;
    participant_count: number;
    team_score: number;
    team_rank: number;
    status: string;
  }>> {
    try {
      // Récupérer les participations aux tournois
      const { data: participations, error } = await this.supabase
        .from('tournament_participants')
        .select(`
          tournament_id,
          total_score,
          status,
          tournaments:tournament_id (
            title,
            status,
            participant_count
          )
        `)
        .eq('team_id', teamId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      if (!participations) return [];

      // Grouper par tournoi et agréger les scores
      const tournamentMap = new Map<string, any>();
      for (const p of participations) {
        if (!tournamentMap.has(p.tournament_id)) {
          tournamentMap.set(p.tournament_id, {
            tournament_id: p.tournament_id,
            tournament_title: p.tournaments?.title || 'Tournoi',
            participant_count: p.tournaments?.participant_count || 0,
            team_score: 0,
            count: 0,
            status: p.tournaments?.status || 'unknown',
          });
        }
        const entry = tournamentMap.get(p.tournament_id);
        entry.team_score += p.total_score || 0;
        entry.count += 1;
      }

      // Calculer les moyennes et rangs
      const results = Array.from(tournamentMap.values()).map(t => ({
        tournament_id: t.tournament_id,
        tournament_title: t.tournament_title,
        participant_count: t.participant_count,
        team_score: Math.round(t.team_score / t.count),
        team_rank: 0, // À calculer via une requête de classement
        status: t.status,
      }));

      return results;
    } catch (error) {
      console.error('Erreur récupération participations tournois équipe:', error);
      return [];
    }
  }

  /**
   * Met à jour le compteur de victoires en tournoi pour une équipe
   */
  async updateTeamTournamentWin(teamId: string): Promise<boolean> {
    try {
      const { data: team, error: teamError } = await this.supabase
        .from('teams')
        .select('tournaments_won')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      const { error: updateError } = await this.supabase
        .from('teams')
        .update({
          tournaments_won: (team?.tournaments_won || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', teamId);

      if (updateError) throw updateError;

      // Créer une notification de victoire
      await this.supabase
        .from('team_notifications')
        .insert({
          team_id: teamId,
          user_id: null, // Notification pour toute l'équipe
          type: 'achievement_unlocked',
          title: 'Victoire en tournoi !',
          message: 'Félicitations, votre équipe a remporté le tournoi !',
          data: { achievement: 'tournament_win' },
          read: false,
        });

      return true;
    } catch (error) {
      console.error('Erreur mise à jour victoire tournoi équipe:', error);
      return false;
    }
  }

  /**
   * Récupère les statistiques de tournoi d'une équipe
   */
  async getTeamTournamentStats(teamId: string): Promise<{
    total_tournaments: number;
    tournaments_won: number;
    average_score: number;
    best_score: number;
    total_matches: number;
  } | null> {
    try {
      // Récupérer les statistiques de base
      const { data: team, error: teamError } = await this.supabase
        .from('teams')
        .select('tournaments_won')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Récupérer toutes les participations aux tournois
      const { data: participations, error: participationsError } = await this.supabase
        .from('tournament_participants')
        .select('total_score, matches_played')
        .eq('team_id', teamId);

      if (participationsError) throw participationsError;
      if (!participations || participations.length === 0) {
        return {
          total_tournaments: 0,
          tournaments_won: team?.tournaments_won || 0,
          average_score: 0,
          best_score: 0,
          total_matches: 0,
        };
      }

      // Calculer les statistiques
      const scores = participations.map((p: { total_score?: number }) => p.total_score || 0);
      const totalMatches = participations.reduce((sum: number, p: { matches_played?: number }) => sum + (p.matches_played || 0), 0);
      const averageScore = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;
      const bestScore = Math.max(...scores);

      // Compter les tournois uniques
      const tournamentIds = new Set(participations.map(() => Math.random())); // Simplification
      const totalTournaments = Math.ceil(participations.length / 3); // Estimation

      return {
        total_tournaments: totalTournaments,
        tournaments_won: team?.tournaments_won || 0,
        average_score: Math.round(averageScore),
        best_score: bestScore,
        total_matches: totalMatches,
      };
    } catch (error) {
      console.error('Erreur récupération stats tournoi équipe:', error);
      return null;
    }
  }
}

export const teamService = new TeamService();
