'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { seasonalLeaderboardService } from '@/services/seasonalLeaderboardService';
import type {
  UseSeasonalLeaderboard,
  UseSeasonalLeaderboardOptions,
  Season,
  SeasonType,
  LeaderboardEntryWithUser,
  TeamLeaderboardEntryWithTeam,
  UserSeasonStats,
  HistoricalSeason,
  GetLeaderboardOptions,
  GetTeamLeaderboardOptions
} from '@/types/seasonalLeaderboard.types';

/**
 * Hook pour gérer les classements saisonniers
 */
export function useSeasonalLeaderboard(
  options: UseSeasonalLeaderboardOptions = {
    autoLoad: true,
    seasonType: 'monthly',
    includeTeamLeaderboard: false,
    includeHistoricalSeasons: false
  }
): UseSeasonalLeaderboard {
  // États
  const [user, setUser] = useState<User | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithUser[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardEntryWithTeam[]>([]);
  const [userSeasonStats, setUserSeasonStats] = useState<UserSeasonStats | null>(null);
  const [historicalSeasons, setHistoricalSeasons] = useState<HistoricalSeason[]>([]);
  const [topPerformers, setTopPerformers] = useState<LeaderboardEntryWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [teamTotalCount, setTeamTotalCount] = useState(0);

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
   * Charge la saison actuelle
   */
  const loadCurrentSeason = useCallback(async (seasonType?: SeasonType) => {
    setIsLoading(true);
    setError(null);

    try {
      const type = seasonType || options.seasonType || 'monthly';
      const season = await seasonalLeaderboardService.getCurrentSeason(type);

      if (season) {
        setCurrentSeason(season);
      } else {
        setError('Aucune saison active trouvée');
      }
    } catch (err) {
      console.error('Erreur chargement saison actuelle:', err);
      setError('Impossible de charger la saison actuelle');
    } finally {
      setIsLoading(false);
    }
  }, [options.seasonType]);

  /**
   * Charge le classement
   */
  const loadLeaderboard = useCallback(async (loadOptions?: GetLeaderboardOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const opts: GetLeaderboardOptions = {
        season_type: options.seasonType || 'monthly',
        limit: 100,
        include_user_profile: true,
        ...loadOptions
      };

      const result = await seasonalLeaderboardService.getSeasonLeaderboard(opts);

      if (result) {
        setLeaderboard(result.entries);
        setTotalCount(result.total_count);
        setCurrentSeason(result.current_season);

        // Charger les stats utilisateur si disponible
        if (user?.id) {
          await loadUserStats(user.id, result.current_season.id);
        }
      } else {
        setError('Impossible de charger le classement');
      }
    } catch (err) {
      console.error('Erreur chargement classement:', err);
      setError('Impossible de charger le classement');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, options.seasonType]);

  /**
   * Charge le classement d'équipe
   */
  const loadTeamLeaderboard = useCallback(async (loadOptions?: GetTeamLeaderboardOptions) => {
    setIsLoadingTeams(true);
    setError(null);

    try {
      const opts: GetTeamLeaderboardOptions = {
        season_type: options.seasonType || 'monthly',
        limit: 50,
        include_team_info: true,
        ...loadOptions
      };

      const result = await seasonalLeaderboardService.getTeamLeaderboard(opts);

      if (result) {
        setTeamLeaderboard(result.entries);
        setTeamTotalCount(result.total_count);
      } else {
        setError('Impossible de charger le classement d\'équipe');
      }
    } catch (err) {
      console.error('Erreur chargement classement équipe:', err);
      setError('Impossible de charger le classement d\'équipe');
    } finally {
      setIsLoadingTeams(false);
    }
  }, [options.seasonType]);

  /**
   * Charge les statistiques utilisateur pour la saison
   */
  const loadUserStats = useCallback(async (userId?: string, seasonId?: string) => {
    if (!user?.id && !userId) return;

    try {
      const targetUserId = userId || user!.id;
      const seasonType = options.seasonType || 'monthly';

      const stats = await seasonalLeaderboardService.getUserSeasonRank(
        targetUserId,
        seasonId,
        seasonType
      );

      if (stats) {
        setUserSeasonStats(stats);
      }
    } catch (err) {
      console.error('Erreur chargement stats utilisateur:', err);
    }
  }, [user?.id, options.seasonType]);

  /**
   * Charge les saisons historiques
   */
  const loadHistoricalSeasons = useCallback(async (seasonType?: SeasonType, limit: number = 12) => {
    if (!user?.id) return;

    setIsLoadingHistory(true);

    try {
      const type = seasonType || options.seasonType;
      const history = await seasonalLeaderboardService.getHistoricalSeasons(
        user.id,
        type,
        limit
      );

      setHistoricalSeasons(history);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id, options.seasonType]);

  /**
   * Charge les meilleurs performers
   */
  const loadTopPerformers = useCallback(async (seasonId?: string, limit: number = 10) => {
    try {
      const seasonType = options.seasonType || 'monthly';
      const performers = await seasonalLeaderboardService.getTopPerformers(
        seasonId,
        seasonType,
        limit
      );

      setTopPerformers(performers);
    } catch (err) {
      console.error('Erreur chargement top performers:', err);
    }
  }, [options.seasonType]);

  /**
   * Change de saison
   */
  const switchSeason = useCallback(async (seasonId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const season = await seasonalLeaderboardService.getSeasonById(seasonId);

      if (season) {
        setCurrentSeason(season);

        // Recharger le classement pour cette saison
        await loadLeaderboard({ season_id: seasonId });

        if (options.includeTeamLeaderboard) {
          await loadTeamLeaderboard({ season_id: seasonId });
        }
      } else {
        setError('Saison introuvable');
      }
    } catch (err) {
      console.error('Erreur changement de saison:', err);
      setError('Impossible de changer de saison');
    } finally {
      setIsLoading(false);
    }
  }, [options.includeTeamLeaderboard, loadLeaderboard, loadTeamLeaderboard]);

  /**
   * Change de type de saison
   */
  const switchSeasonType = useCallback(async (seasonType: SeasonType) => {
    setIsLoading(true);
    setError(null);

    try {
      await loadCurrentSeason(seasonType);
      await loadLeaderboard({ season_type: seasonType });

      if (options.includeTeamLeaderboard) {
        await loadTeamLeaderboard({ season_type: seasonType });
      }

      if (options.includeHistoricalSeasons) {
        await loadHistoricalSeasons(seasonType);
      }
    } catch (err) {
      console.error('Erreur changement de type de saison:', err);
      setError('Impossible de changer de type de saison');
    } finally {
      setIsLoading(false);
    }
  }, [
    options.includeTeamLeaderboard,
    options.includeHistoricalSeasons,
    loadCurrentSeason,
    loadLeaderboard,
    loadTeamLeaderboard,
    loadHistoricalSeasons
  ]);

  /**
   * Réclame les récompenses d'une saison
   */
  const claimRewards = useCallback(async (seasonId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Vous devez être connecté pour réclamer vos récompenses');
      return false;
    }

    try {
      const success = await seasonalLeaderboardService.claimSeasonRewards(seasonId, user.id);

      if (success) {
        // Mettre à jour l'historique
        if (options.includeHistoricalSeasons) {
          await loadHistoricalSeasons();
        }
      } else {
        setError('Impossible de réclamer les récompenses');
      }

      return success;
    } catch (err) {
      console.error('Erreur réclamation récompenses:', err);
      setError('Impossible de réclamer les récompenses');
      return false;
    }
  }, [user?.id, options.includeHistoricalSeasons, loadHistoricalSeasons]);

  /**
   * Rafraîchit toutes les données
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loadCurrentSeason();
      await loadLeaderboard();

      if (options.includeTeamLeaderboard) {
        await loadTeamLeaderboard();
      }

      if (options.includeHistoricalSeasons) {
        await loadHistoricalSeasons();
      }

      if (currentSeason) {
        await loadTopPerformers(currentSeason.id);
      }
    } catch (err) {
      console.error('Erreur rafraîchissement:', err);
      setError('Impossible de rafraîchir les données');
    } finally {
      setIsLoading(false);
    }
  }, [
    options.includeTeamLeaderboard,
    options.includeHistoricalSeasons,
    currentSeason,
    loadCurrentSeason,
    loadLeaderboard,
    loadTeamLeaderboard,
    loadHistoricalSeasons,
    loadTopPerformers
  ]);

  // Chargement automatique au montage
  useEffect(() => {
    if (options.autoLoad) {
      const init = async () => {
        await loadCurrentSeason();
        await loadLeaderboard();

        if (options.includeTeamLeaderboard) {
          await loadTeamLeaderboard();
        }

        if (options.includeHistoricalSeasons) {
          await loadHistoricalSeasons();
        }
      };

      init();
    }
  }, [
    options.autoLoad,
    options.includeTeamLeaderboard,
    options.includeHistoricalSeasons,
    loadCurrentSeason,
    loadLeaderboard,
    loadTeamLeaderboard,
    loadHistoricalSeasons
  ]);

  // Abonnement temps réel pour les classements saisonniers
  useEffect(() => {
    if (!currentSeason?.id) return;

    // S'abonner aux changements du classement saisonnier
    const channel = supabase
      .channel('seasonal_leaderboard_realtime_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seasonal_leaderboard',
          filter: `season_id=eq.${currentSeason.id}`
        },
        () => {
          // Recharger le classement
          loadLeaderboard({ season_id: currentSeason.id });

          // Recharger les stats utilisateur si disponible
          if (user?.id) {
            loadUserStats(user.id, currentSeason.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_seasonal_leaderboard',
          filter: `season_id=eq.${currentSeason.id}`
        },
        () => {
          // Recharger le classement d'équipe si activé
          if (options.includeTeamLeaderboard) {
            loadTeamLeaderboard({ season_id: currentSeason.id });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seasons',
          filter: `id=eq.${currentSeason.id}`
        },
        () => {
          // Recharger la saison actuelle si elle change
          loadCurrentSeason(currentSeason.season_type);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    currentSeason?.id,
    currentSeason?.season_type,
    user?.id,
    options.includeTeamLeaderboard,
    supabase,
    loadLeaderboard,
    loadTeamLeaderboard,
    loadCurrentSeason,
    loadUserStats
  ]);

  return {
    // État
    currentSeason,
    leaderboard,
    teamLeaderboard,
    userSeasonStats,
    historicalSeasons,
    topPerformers,
    isLoading,
    isLoadingTeams,
    isLoadingHistory,
    error,
    totalCount,
    teamTotalCount,

    // Actions
    loadCurrentSeason,
    loadLeaderboard,
    loadTeamLeaderboard,
    loadUserStats,
    loadHistoricalSeasons,
    loadTopPerformers,
    switchSeason,
    switchSeasonType,
    claimRewards,
    refresh
  };
}
