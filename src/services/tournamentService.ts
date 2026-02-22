import { createClient } from '@/lib/supabase/client';
import type {
  Tournament,
  TournamentParticipant,
  TournamentRound,
  TournamentMatch,
  TournamentResult,
  TournamentBracketView,
  TournamentUserStats,
  CreateTournamentInput,
  SubmitMatchInput,
  MatchEvaluation,
  CreateTournamentNotificationInput,
  TournamentStatus,
  ParticipantStatus,
  RoundStatus,
  MatchStatus,
  TournamentType,
} from '@/types/tournaments.types';

/**
 * Service de gestion des tournois
 */
export class TournamentService {
  private supabase = createClient();

  /**
   * Récupère tous les tournois actifs
   */
  async getActiveTournaments(): Promise<Tournament[]> {
    try {
      const { data, error } = await this.supabase
        .from('tournaments')
        .select('*')
        .in('status', ['registration', 'active'])
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération tournois actifs:', error);
      return [];
    }
  }

  /**
   * Récupère un tournoi par ID
   */
  async getTournament(tournamentId: string): Promise<Tournament | null> {
    try {
      const { data, error } = await this.supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur récupération tournoi:', error);
      return null;
    }
  }

  /**
   * Crée un nouveau tournoi
   */
  async createTournament(input: CreateTournamentInput): Promise<Tournament | null> {
    try {
      const tournamentData = {
        title: input.title,
        description: input.description,
        tournament_type: input.tournament_type,
        status: 'upcoming' as TournamentStatus,
        start_date: input.start_date,
        end_date: input.end_date,
        registration_deadline: input.registration_deadline,
        max_participants: input.max_participants || 64,
        min_participants: input.min_participants || 8,
        bracket_type: input.bracket_type || 'single_elimination',
        challenge_type: input.challenge_type,
        difficulty: input.difficulty,
        time_limit: input.time_limit,
        prize_pool: input.prize_pool || { first: 1000, second: 500, third: 250 },
        xp_rewards: input.xp_rewards || { first: 500, second: 300, third: 150, participant: 50 },
        category: input.category,
        tags: input.tags,
        banner_image_url: input.banner_image_url,
        rules: input.rules,
        participant_count: 0,
        current_round: 0,
      };

      const { data, error } = await this.supabase
        .from('tournaments')
        .insert(tournamentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur création tournoi:', error);
      return null;
    }
  }

  /**
   * Inscrit un participant à un tournoi
   */
  async registerParticipant(
    tournamentId: string,
    userId: string,
    teamId?: string
  ): Promise<TournamentParticipant | null> {
    try {
      // Vérifier que le tournoi accepte encore les inscriptions
      const tournament = await this.getTournament(tournamentId);
      if (!tournament || tournament.status !== 'registration') {
        throw new Error('Tournoi non disponible pour inscription');
      }

      // Vérifier que l'utilisateur n'est pas déjà inscrit
      const { data: existing } = await this.supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('Déjà inscrit à ce tournoi');
      }

      // Vérifier la limite de participants
      if (tournament.participant_count >= tournament.max_participants) {
        throw new Error('Tournoi complet');
      }

      // Créer la participation
      const participantData = {
        tournament_id: tournamentId,
        user_id: userId,
        team_id: teamId,
        status: 'registered' as ParticipantStatus,
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        total_score: 0,
      };

      const { data, error } = await this.supabase
        .from('tournament_participants')
        .insert(participantData)
        .select(`
          *,
          user_profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Créer une notification
      await this.createNotification({
        user_id: userId,
        tournament_id: tournamentId,
        type: 'registration_open',
        title: 'Inscription confirmée',
        message: `Vous êtes inscrit au tournoi "${tournament.title}"`,
        data: { tournament_id: tournamentId },
      });

      return data;
    } catch (error) {
      console.error('Erreur inscription tournoi:', error);
      return null;
    }
  }

  /**
   * Inscrit une équipe à un tournoi
   */
  async registerTeam(
    tournamentId: string,
    teamId: string,
    userId: string
  ): Promise<TournamentParticipant[]> {
    try {
      // Vérifier que le tournoi accepte encore les inscriptions
      const tournament = await this.getTournament(tournamentId);
      if (!tournament || tournament.status !== 'registration') {
        throw new Error('Tournoi non disponible pour inscription');
      }

      // Récupérer les membres actifs de l'équipe
      const { data: members, error: membersError } = await this.supabase
        .from('team_members')
        .select('user_id, role')
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (membersError) throw membersError;
      if (!members || members.length === 0) {
        throw new Error('Aucun membre actif dans l\'équipe');
      }

      // Vérifier que l'utilisateur est capitaine de l'équipe
      const userMember = members.find((m: { user_id: string; role: string }) => m.user_id === userId);
      if (!userMember || (userMember.role !== 'captain' && userMember.role !== 'co_captain')) {
        throw new Error('Seuls les capitaines peuvent inscrire l\'équipe');
      }

      // Vérifier la limite de participants
      if (tournament.participant_count + members.length > tournament.max_participants) {
        throw new Error('Pas assez de places disponibles pour toute l\'équipe');
      }

      // Inscrire tous les membres
      const participants: TournamentParticipant[] = [];
      for (const member of members) {
        const participantData = {
          tournament_id: tournamentId,
          user_id: member.user_id,
          team_id: teamId,
          status: 'registered' as ParticipantStatus,
          matches_played: 0,
          matches_won: 0,
          matches_lost: 0,
          total_score: 0,
        };

        const { data, error } = await this.supabase
          .from('tournament_participants')
          .insert(participantData)
          .select(`
            *,
            user_profiles:user_id (
              full_name,
              avatar_url
            )
          `)
          .single();

        if (error) {
          // Si une inscription échoue, on continue mais on le signale
          console.error(`Erreur inscription membre ${member.user_id}:`, error);
          continue;
        }

        if (data) {
          participants.push(data);

          // Notifier chaque membre
          await this.createNotification({
            user_id: member.user_id,
            tournament_id: tournamentId,
            type: 'registration_open',
            title: 'Équipe inscrite au tournoi',
            message: `Votre équipe est inscrite au tournoi "${tournament.title}"`,
            data: { tournament_id: tournamentId, team_id: teamId },
          });
        }
      }

      return participants;
    } catch (error) {
      console.error('Erreur inscription équipe au tournoi:', error);
      return [];
    }
  }

  /**
   * Récupère les participants d'une équipe dans un tournoi
   */
  async getTeamParticipants(
    tournamentId: string,
    teamId: string
  ): Promise<TournamentParticipant[]> {
    try {
      const { data, error } = await this.supabase
        .from('tournament_participants')
        .select(`
          *,
          user_profiles:user_id (
            full_name,
            avatar_url,
            level
          )
        `)
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId)
        .order('total_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération participants équipe:', error);
      return [];
    }
  }

  /**
   * Agrège le score d'une équipe dans un tournoi
   */
  async aggregateTeamScore(
    tournamentId: string,
    teamId: string
  ): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('tournament_participants')
        .select('total_score')
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId);

      if (error) throw error;
      if (!data) return 0;

      // Calculer la moyenne ou la somme des scores
      const totalScore = data.reduce((sum: number, p: { total_score?: number }) => sum + (p.total_score || 0), 0);
      return Math.round(totalScore / data.length); // Moyenne
    } catch (error) {
      console.error('Erreur agrégation score équipe:', error);
      return 0;
    }
  }

  /**
   * Met à jour les statistiques d'équipe après un match
   */
  async updateTeamTournamentStats(
    tournamentId: string,
    teamId: string,
    matchResult: { won: boolean; score: number }
  ): Promise<boolean> {
    try {
      // Mettre à jour les participants de l'équipe
      const { error } = await this.supabase
        .from('tournament_participants')
        .update({
          matches_played: this.supabase.rpc('increment', { x: 1 }),
          matches_won: matchResult.won
            ? this.supabase.rpc('increment', { x: 1 })
            : undefined,
          matches_lost: !matchResult.won
            ? this.supabase.rpc('increment', { x: 1 })
            : undefined,
          total_score: this.supabase.rpc('increment', { x: matchResult.score }),
        })
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur mise à jour stats équipe:', error);
      return false;
    }
  }

  /**
   * Génère les brackets pour un tournoi
   */
  async generateBrackets(tournamentId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('generate_initial_bracket', {
        p_tournament_id: tournamentId,
      });

      if (error) throw error;

      // Mettre à jour le statut du tournoi
      await this.supabase
        .from('tournaments')
        .update({ status: 'active' as TournamentStatus })
        .eq('id', tournamentId);

      return true;
    } catch (error) {
      console.error('Erreur génération brackets:', error);
      return false;
    }
  }

  /**
   * Récupère le bracket d'un tournoi
   */
  async getTournamentBracket(tournamentId: string): Promise<TournamentBracketView[]> {
    try {
      const { data, error } = await this.supabase
        .from('tournament_bracket_view')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération bracket:', error);
      return [];
    }
  }

  /**
   * Récupère les rounds d'un tournoi
   */
  async getTournamentRounds(tournamentId: string): Promise<TournamentRound[]> {
    try {
      const { data, error } = await this.supabase
        .from('tournament_rounds')
        .select(`
          *,
          matches:tournament_matches(*)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération rounds:', error);
      return [];
    }
  }

  /**
   * Récupère les matchs d'un utilisateur dans un tournoi
   */
  async getUserMatches(tournamentId: string, userId: string): Promise<TournamentMatch[]> {
    try {
      // Récupérer le participant
      const { data: participant } = await this.supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .single();

      if (!participant) return [];

      // Récupérer les matchs
      const { data, error } = await this.supabase
        .from('tournament_matches')
        .select(`
          *,
          round:tournament_rounds(*)
        `)
        .eq('tournament_id', tournamentId)
        .or(`participant1_id.eq.${participant.id},participant2_id.eq.${participant.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération matchs utilisateur:', error);
      return [];
    }
  }

  /**
   * Enregistre le résultat d'un match
   */
  async recordMatch(
    matchId: string,
    evaluation: MatchEvaluation
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('tournament_matches')
        .update({
          participant1_score: evaluation.participant1_score,
          participant2_score: evaluation.participant2_score,
          winner_id: evaluation.winner_id,
          evaluation_details: evaluation.evaluation_details,
          status: 'completed' as MatchStatus,
          completed_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (error) throw error;

      // Récupérer le match pour obtenir l'ID du round et du tournoi
      const { data: match } = await this.supabase
        .from('tournament_matches')
        .select('tournament_id, round_id')
        .eq('id', matchId)
        .single();

      if (match) {
        // Vérifier si tous les matchs du round sont terminés
        const { data: roundMatches } = await this.supabase
          .from('tournament_matches')
          .select('id, status')
          .eq('round_id', match.round_id);

        const allCompleted = roundMatches?.every((m: { id: string; status: string }) => m.status === 'completed');

        if (allCompleted) {
          // Marquer le round comme terminé
          await this.supabase
            .from('tournament_rounds')
            .update({ status: 'completed' as RoundStatus })
            .eq('id', match.round_id);
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur enregistrement match:', error);
      return false;
    }
  }

  /**
   * Soumet une réponse pour un match
   */
  async submitMatch(input: SubmitMatchInput, userId: string): Promise<boolean> {
    try {
      // Récupérer le match
      const { data: match, error: matchError } = await this.supabase
        .from('tournament_matches')
        .select(`
          *,
          participant1:tournament_participants!participant1_id(user_id),
          participant2:tournament_participants!participant2_id(user_id)
        `)
        .eq('id', input.match_id)
        .single();

      if (matchError || !match) throw new Error('Match introuvable');

      // Déterminer si l'utilisateur est participant1 ou participant2
      const isParticipant1 = match.participant1?.user_id === userId;
      const isParticipant2 = match.participant2?.user_id === userId;

      if (!isParticipant1 && !isParticipant2) {
        throw new Error('Utilisateur non participant à ce match');
      }

      // Mettre à jour la soumission
      const updateData: any = {
        status: 'in_progress' as MatchStatus,
        started_at: match.started_at || new Date().toISOString(),
      };

      if (isParticipant1) {
        updateData.participant1_submission = input.submission;
        if (input.time_spent) {
          updateData.participant1_time = input.time_spent;
        }
      } else {
        updateData.participant2_submission = input.submission;
        if (input.time_spent) {
          updateData.participant2_time = input.time_spent;
        }
      }

      const { error } = await this.supabase
        .from('tournament_matches')
        .update(updateData)
        .eq('id', input.match_id);

      if (error) throw error;

      // Si les deux participants ont soumis, déclencher l'évaluation
      if (
        (isParticipant1 && match.participant2_submission) ||
        (isParticipant2 && match.participant1_submission)
      ) {
        // TODO: Déclencher l'évaluation AI
        console.log('Les deux participants ont soumis, évaluation en attente...');
      }

      return true;
    } catch (error) {
      console.error('Erreur soumission match:', error);
      return false;
    }
  }

  /**
   * Avance au round suivant
   */
  async advanceRound(tournamentId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('advance_to_next_round', {
        p_tournament_id: tournamentId,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur avancement round:', error);
      return false;
    }
  }

  /**
   * Récupère le classement d'un tournoi
   */
  async getTournamentStandings(tournamentId: string): Promise<TournamentResult[]> {
    try {
      const { data, error } = await this.supabase
        .from('tournament_results')
        .select(`
          *,
          participant:tournament_participants(
            *,
            user_profiles:user_id(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('final_rank', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération classement:', error);
      return [];
    }
  }

  /**
   * Récupère les participations d'un utilisateur
   */
  async getUserTournaments(userId: string): Promise<TournamentParticipant[]> {
    try {
      const { data, error } = await this.supabase
        .from('tournament_participants')
        .select(`
          *,
          tournament:tournaments(*)
        `)
        .eq('user_id', userId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération participations:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques d'un utilisateur dans les tournois
   */
  async getUserStats(userId: string): Promise<TournamentUserStats | null> {
    try {
      // Récupérer toutes les participations de l'utilisateur
      const { data: participations } = await this.supabase
        .from('tournament_participants')
        .select(`
          *,
          tournament:tournaments(tournament_type)
        `)
        .eq('user_id', userId);

      if (!participations || participations.length === 0) {
        return null;
      }

      // Récupérer les résultats
      const { data: results } = await this.supabase
        .from('tournament_results')
        .select('*')
        .in(
          'participant_id',
          participations.map((p: any) => p.id)
        );

      // Calculer les statistiques
      const totalTournaments = participations.length;
      const tournamentsCompleted = participations.filter(
        (p: any) => p.status === 'winner' || p.status === 'eliminated'
      ).length;
      const tournamentsWon = participations.filter((p: any) => p.status === 'winner').length;

      const totalMatches = participations.reduce((sum: number, p: any) => sum + p.matches_played, 0);
      const matchesWon = participations.reduce((sum: number, p: any) => sum + p.matches_won, 0);
      const matchesLost = participations.reduce((sum: number, p: any) => sum + p.matches_lost, 0);
      const winRate = totalMatches > 0 ? (matchesWon / totalMatches) * 100 : 0;

      const totalScore = participations.reduce((sum: number, p: any) => sum + (p.total_score || 0), 0);
      const averageScore = totalMatches > 0 ? totalScore / totalMatches : 0;

      const totalXpEarned = results?.reduce((sum: number, r: any) => sum + r.xp_earned, 0) || 0;
      const totalPrizes = results?.reduce((sum: number, r: any) => sum + r.prize_amount, 0) || 0;
      const bestPlacement = results?.length
        ? Math.min(...results.map((r: any) => r.final_rank))
        : 0;

      // Statistiques par type
      const statsByType: Record<
        TournamentType,
        { count: number; wins: number; average_placement: number }
      > = {
        weekly: { count: 0, wins: 0, average_placement: 0 },
        special: { count: 0, wins: 0, average_placement: 0 },
        seasonal: { count: 0, wins: 0, average_placement: 0 },
      };

      participations.forEach((p: any) => {
        const type = p.tournament?.tournament_type as TournamentType;
        if (type && statsByType[type]) {
          statsByType[type].count++;
          if (p.status === 'winner') {
            statsByType[type].wins++;
          }
        }
      });

      // Calculer la moyenne des placements par type
      if (results) {
        results.forEach((r: any) => {
          const participation = participations.find((p: any) => p.id === r.participant_id);
          const type = participation?.tournament?.tournament_type as TournamentType;
          if (type && statsByType[type]) {
            statsByType[type].average_placement =
              (statsByType[type].average_placement * (statsByType[type].count - 1) +
                r.final_rank) /
              statsByType[type].count;
          }
        });
      }

      return {
        user_id: userId,
        total_tournaments: totalTournaments,
        tournaments_won: tournamentsWon,
        tournaments_completed: tournamentsCompleted,
        total_matches: totalMatches,
        matches_won: matchesWon,
        matches_lost: matchesLost,
        win_rate: winRate,
        average_score: averageScore,
        total_xp_earned: totalXpEarned,
        total_prizes: totalPrizes,
        best_placement: bestPlacement,
        current_streak: 0, // TODO: Calculer le streak
        best_streak: 0, // TODO: Calculer le meilleur streak
        stats_by_type: statsByType,
      };
    } catch (error) {
      console.error('Erreur récupération statistiques utilisateur:', error);
      return null;
    }
  }

  /**
   * Se désinscrire d'un tournoi
   */
  async withdrawFromTournament(tournamentId: string, userId: string): Promise<boolean> {
    try {
      // Récupérer le participant
      const { data: participant } = await this.supabase
        .from('tournament_participants')
        .select('id, status')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId)
        .single();

      if (!participant) {
        throw new Error('Participation introuvable');
      }

      if (participant.status !== 'registered') {
        throw new Error('Impossible de se désinscrire après le début du tournoi');
      }

      // Mettre à jour le statut
      const { error } = await this.supabase
        .from('tournament_participants')
        .update({ status: 'withdrew' as ParticipantStatus })
        .eq('id', participant.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur désinscription tournoi:', error);
      return false;
    }
  }

  /**
   * Finalise un tournoi et génère les résultats
   */
  async finalizeTournament(tournamentId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('finalize_tournament_results', {
        p_tournament_id: tournamentId,
      });

      if (error) throw error;

      // Mettre à jour le statut du tournoi
      await this.supabase
        .from('tournaments')
        .update({ status: 'completed' as TournamentStatus })
        .eq('id', tournamentId);

      return true;
    } catch (error) {
      console.error('Erreur finalisation tournoi:', error);
      return false;
    }
  }

  /**
   * Crée une notification pour un tournoi
   */
  async createNotification(
    input: CreateTournamentNotificationInput
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('tournament_notifications').insert({
        user_id: input.user_id,
        tournament_id: input.tournament_id,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
        read: false,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur création notification:', error);
      return false;
    }
  }

  /**
   * Récupère les notifications d'un utilisateur
   */
  async getUserNotifications(userId: string, unreadOnly = false): Promise<any[]> {
    try {
      let query = this.supabase
        .from('tournament_notifications')
        .select(`
          *,
          tournament:tournaments(title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('tournament_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      return false;
    }
  }
}

/**
 * Instance singleton du service de tournois
 */
export const tournamentService = new TournamentService();
