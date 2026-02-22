import { createClient } from '@/lib/supabase/client';
import type {
  Season,
  SeasonType,
  SeasonalLeaderboardEntry,
  SeasonalLeaderboardArchive,
  TeamSeasonalLeaderboardEntry,
  LeaderboardEntryWithUser,
  TeamLeaderboardEntryWithTeam,
  GetLeaderboardOptions,
  GetTeamLeaderboardOptions,
  LeaderboardResult,
  TeamLeaderboardResult,
  UserSeasonStats,
  UpdateSeasonalScoreData,
  HistoricalSeason
} from '@/types/seasonalLeaderboard.types';

/**
 * Service de gestion des classements saisonniers
 * Gère les classements mensuels et trimestriels avec archives historiques
 */
export class SeasonalLeaderboardService {
  private supabase = createClient();

  /**
   * Récupère la saison active pour un type donné (mensuelle ou trimestrielle)
   */
  async getCurrentSeason(seasonType: SeasonType = 'monthly'): Promise<Season | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .from('seasons')
        .select('*')
        .eq('season_type', seasonType)
        .eq('status', 'active')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Erreur récupération saison active:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur getCurrentSeason:', error);
      return null;
    }
  }

  /**
   * Récupère le classement pour une saison donnée
   */
  async getSeasonLeaderboard(
    options: GetLeaderboardOptions = {}
  ): Promise<LeaderboardResult | null> {
    try {
      const {
        season_id,
        season_type = 'monthly',
        limit = 100,
        offset = 0,
        include_user_profile = true
      } = options;

      // Si pas d'ID de saison fourni, récupérer la saison active
      let seasonId = season_id;
      let currentSeason: Season | null = null;

      if (!seasonId) {
        currentSeason = await this.getCurrentSeason(season_type);
        if (!currentSeason) {
          console.error('Aucune saison active trouvée');
          return null;
        }
        seasonId = currentSeason.id;
      } else {
        // Récupérer les infos de la saison
        const { data: seasonData } = await this.supabase
          .from('seasons')
          .select('*')
          .eq('id', seasonId)
          .single();
        currentSeason = seasonData;
      }

      if (!currentSeason) {
        return null;
      }

      // Construire la requête avec ou sans profils utilisateurs
      let query = this.supabase
        .from('seasonal_leaderboard_entries')
        .select(
          include_user_profile
            ? `
              *,
              user_profile:user_profiles!user_id (
                username,
                avatar_url,
                display_name
              )
            `
            : '*',
          { count: 'exact' }
        )
        .eq('season_id', seasonId)
        .order('rank', { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);

      const { data: entries, error, count } = await query;

      if (error) {
        console.error('Erreur récupération classement:', error);
        return null;
      }

      // Récupérer le rang de l'utilisateur actuel
      const { data: { user } } = await this.supabase.auth.getUser();
      let userRank: number | null = null;

      if (user) {
        const { data: userEntry } = await this.supabase
          .from('seasonal_leaderboard_entries')
          .select('rank')
          .eq('season_id', seasonId)
          .eq('user_id', user.id)
          .single();

        if (userEntry) {
          userRank = userEntry.rank;
        }
      }

      return {
        entries: entries as LeaderboardEntryWithUser[],
        total_count: count || 0,
        current_season: currentSeason,
        user_rank: userRank
      };
    } catch (error) {
      console.error('Erreur getSeasonLeaderboard:', error);
      return null;
    }
  }

  /**
   * Récupère le classement d'équipe pour une saison donnée
   */
  async getTeamLeaderboard(
    options: GetTeamLeaderboardOptions = {}
  ): Promise<TeamLeaderboardResult | null> {
    try {
      const {
        season_id,
        season_type = 'monthly',
        limit = 50,
        offset = 0,
        include_team_info = true
      } = options;

      // Si pas d'ID de saison fourni, récupérer la saison active
      let seasonId = season_id;
      let currentSeason: Season | null = null;

      if (!seasonId) {
        currentSeason = await this.getCurrentSeason(season_type);
        if (!currentSeason) {
          return null;
        }
        seasonId = currentSeason.id;
      } else {
        const { data: seasonData } = await this.supabase
          .from('seasons')
          .select('*')
          .eq('id', seasonId)
          .single();
        currentSeason = seasonData;
      }

      if (!currentSeason) {
        return null;
      }

      // Construire la requête
      let query = this.supabase
        .from('team_seasonal_leaderboard_entries')
        .select(
          include_team_info
            ? `
              *,
              team:teams!team_id (
                name,
                avatar_emoji,
                member_count
              )
            `
            : '*',
          { count: 'exact' }
        )
        .eq('season_id', seasonId)
        .order('rank', { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);

      const { data: entries, error, count } = await query;

      if (error) {
        console.error('Erreur récupération classement équipes:', error);
        return null;
      }

      // Récupérer le rang de l'équipe de l'utilisateur actuel
      const { data: { user } } = await this.supabase.auth.getUser();
      let teamRank: number | null = null;

      if (user) {
        // Trouver l'équipe active de l'utilisateur
        const { data: teamMember } = await this.supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .single();

        if (teamMember) {
          const { data: teamEntry } = await this.supabase
            .from('team_seasonal_leaderboard_entries')
            .select('rank')
            .eq('season_id', seasonId)
            .eq('team_id', teamMember.team_id)
            .single();

          if (teamEntry) {
            teamRank = teamEntry.rank;
          }
        }
      }

      return {
        entries: entries as TeamLeaderboardEntryWithTeam[],
        total_count: count || 0,
        current_season: currentSeason,
        team_rank: teamRank
      };
    } catch (error) {
      console.error('Erreur getTeamLeaderboard:', error);
      return null;
    }
  }

  /**
   * Archive une saison terminée
   * Note: Généralement appelé par un cron job ou un admin
   */
  async archiveSeason(seasonId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('archive_season', {
        p_season_id: seasonId
      });

      if (error) {
        console.error('Erreur archivage saison:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Erreur archiveSeason:', error);
      return false;
    }
  }

  /**
   * Récupère l'historique des saisons pour un utilisateur
   */
  async getHistoricalSeasons(
    userId?: string,
    seasonType?: SeasonType,
    limit: number = 12
  ): Promise<HistoricalSeason[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        return [];
      }

      // Construire la requête de base pour les saisons
      let seasonsQuery = this.supabase
        .from('seasons')
        .select('*')
        .in('status', ['completed', 'archived'])
        .order('start_date', { ascending: false })
        .limit(limit);

      if (seasonType) {
        seasonsQuery = seasonsQuery.eq('season_type', seasonType);
      }

      const { data: seasons, error: seasonsError } = await seasonsQuery;

      if (seasonsError || !seasons) {
        console.error('Erreur récupération saisons historiques:', seasonsError);
        return [];
      }

      // Récupérer les archives pour cet utilisateur
      const { data: archives } = await this.supabase
        .from('seasonal_leaderboard_archives')
        .select('*')
        .eq('user_id', targetUserId)
        .in('season_id', seasons.map((s: Season) => s.id));

      // Fusionner les données
      const historicalSeasons: HistoricalSeason[] = seasons.map((season: Season) => {
        const archive = archives?.find((a: SeasonalLeaderboardArchive) => a.season_id === season.id);
        return {
          ...season,
          user_final_rank: archive?.final_rank,
          user_final_score: archive?.final_score,
          rewards_claimed: archive?.rewards_claimed
        };
      });

      return historicalSeasons;
    } catch (error) {
      console.error('Erreur getHistoricalSeasons:', error);
      return [];
    }
  }

  /**
   * Récupère le rang et les statistiques d'un utilisateur pour une saison
   */
  async getUserSeasonRank(
    userId?: string,
    seasonId?: string,
    seasonType: SeasonType = 'monthly'
  ): Promise<UserSeasonStats | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        return null;
      }

      // Si pas d'ID de saison, récupérer la saison active
      let targetSeasonId = seasonId;
      if (!targetSeasonId) {
        const currentSeason = await this.getCurrentSeason(seasonType);
        if (!currentSeason) {
          return null;
        }
        targetSeasonId = currentSeason.id;
      }

      // Récupérer l'entrée de l'utilisateur
      const { data: entry, error } = await this.supabase
        .from('seasonal_leaderboard_entries')
        .select('*')
        .eq('season_id', targetSeasonId)
        .eq('user_id', targetUserId)
        .single();

      if (error || !entry) {
        // L'utilisateur n'a pas encore d'entrée pour cette saison
        return {
          season_id: targetSeasonId,
          user_id: targetUserId,
          rank: null,
          total_score: 0,
          challenges_completed: 0,
          tournaments_won: 0,
          xp_earned: 0,
          skill_nodes_unlocked: 0,
          rank_change: null,
          percentile: null
        };
      }

      // Calculer le changement de rang
      let rankChange: number | null = null;
      if (entry.rank !== null && entry.previous_rank !== null) {
        rankChange = entry.previous_rank - entry.rank; // Positif = amélioration
      }

      // Calculer le percentile
      let percentile: number | null = null;
      if (entry.rank !== null) {
        const { count } = await this.supabase
          .from('seasonal_leaderboard_entries')
          .select('*', { count: 'exact', head: true })
          .eq('season_id', targetSeasonId);

        if (count && count > 0) {
          percentile = Math.round((1 - (entry.rank - 1) / count) * 100);
        }
      }

      return {
        season_id: entry.season_id,
        user_id: entry.user_id,
        rank: entry.rank,
        total_score: entry.total_score,
        challenges_completed: entry.challenges_completed,
        tournaments_won: entry.tournaments_won,
        xp_earned: entry.xp_earned,
        skill_nodes_unlocked: entry.skill_nodes_unlocked,
        rank_change: rankChange,
        percentile: percentile
      };
    } catch (error) {
      console.error('Erreur getUserSeasonRank:', error);
      return null;
    }
  }

  /**
   * Met à jour le score saisonnier d'un utilisateur
   * Cette fonction met à jour automatiquement les saisons actives (mensuelle et trimestrielle)
   */
  async updateUserSeasonalScore(data: UpdateSeasonalScoreData): Promise<boolean> {
    try {
      const {
        user_id,
        score_increment = 0,
        challenges_increment = 0,
        tournaments_increment = 0,
        xp_increment = 0,
        skills_increment = 0
      } = data;

      const { error } = await this.supabase.rpc('update_user_seasonal_score', {
        p_user_id: user_id,
        p_score_increment: score_increment,
        p_challenges_increment: challenges_increment,
        p_tournaments_increment: tournaments_increment,
        p_xp_increment: xp_increment,
        p_skills_increment: skills_increment
      });

      if (error) {
        console.error('Erreur mise à jour score saisonnier:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur updateUserSeasonalScore:', error);
      return false;
    }
  }

  /**
   * Met à jour les rangs pour une saison donnée
   * Recalcule tous les rangs basés sur les scores
   */
  async updateSeasonRanks(seasonId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('update_seasonal_leaderboard_ranks', {
        p_season_id: seasonId
      });

      if (error) {
        console.error('Erreur mise à jour rangs:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur updateSeasonRanks:', error);
      return false;
    }
  }

  /**
   * Récupère toutes les saisons disponibles (actives, terminées, à venir)
   */
  async getAllSeasons(seasonType?: SeasonType): Promise<Season[]> {
    try {
      let query = this.supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });

      if (seasonType) {
        query = query.eq('season_type', seasonType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur récupération toutes les saisons:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur getAllSeasons:', error);
      return [];
    }
  }

  /**
   * Récupère une saison spécifique par son ID
   */
  async getSeasonById(seasonId: string): Promise<Season | null> {
    try {
      const { data, error } = await this.supabase
        .from('seasons')
        .select('*')
        .eq('id', seasonId)
        .single();

      if (error) {
        console.error('Erreur récupération saison:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur getSeasonById:', error);
      return null;
    }
  }

  /**
   * Récupère les top performers d'une saison
   */
  async getTopPerformers(
    seasonId?: string,
    seasonType: SeasonType = 'monthly',
    limit: number = 10
  ): Promise<LeaderboardEntryWithUser[]> {
    try {
      // Si pas d'ID de saison, récupérer la saison active
      let targetSeasonId = seasonId;
      if (!targetSeasonId) {
        const currentSeason = await this.getCurrentSeason(seasonType);
        if (!currentSeason) {
          return [];
        }
        targetSeasonId = currentSeason.id;
      }

      const { data, error } = await this.supabase
        .from('seasonal_leaderboard_entries')
        .select(`
          *,
          user_profile:user_profiles!user_id (
            username,
            avatar_url,
            display_name
          )
        `)
        .eq('season_id', targetSeasonId)
        .not('rank', 'is', null)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Erreur récupération top performers:', error);
        return [];
      }

      return data as LeaderboardEntryWithUser[];
    } catch (error) {
      console.error('Erreur getTopPerformers:', error);
      return [];
    }
  }

  /**
   * Récupère l'archive d'un utilisateur pour une saison donnée
   */
  async getUserSeasonArchive(
    seasonId: string,
    userId?: string
  ): Promise<SeasonalLeaderboardArchive | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        return null;
      }

      const { data, error } = await this.supabase
        .from('seasonal_leaderboard_archives')
        .select('*')
        .eq('season_id', seasonId)
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        console.error('Erreur récupération archive:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur getUserSeasonArchive:', error);
      return null;
    }
  }

  /**
   * Marque les récompenses d'une saison comme réclamées
   */
  async claimSeasonRewards(
    seasonId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        return false;
      }

      const { error } = await this.supabase
        .from('seasonal_leaderboard_archives')
        .update({ rewards_claimed: true })
        .eq('season_id', seasonId)
        .eq('user_id', targetUserId);

      if (error) {
        console.error('Erreur réclamation récompenses:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur claimSeasonRewards:', error);
      return false;
    }
  }
}

// Export d'une instance singleton
export const seasonalLeaderboardService = new SeasonalLeaderboardService();
