'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { tournamentService } from '@/services/tournamentService';
import type {
  Tournament,
  TournamentParticipant,
  TournamentBracketView,
  TournamentMatch,
  TournamentRound,
  TournamentResult,
  TournamentUserStats,
  UseTournamentsOptions,
} from '@/types/tournaments.types';

/**
 * Hook pour gérer les tournois
 */
export function useTournaments(
  options: UseTournamentsOptions = {
    autoLoad: true,
    includeHistory: false,
    includeStats: false,
  }
) {
  // États
  const [user, setUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [userTournaments, setUserTournaments] = useState<TournamentParticipant[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [currentBracket, setCurrentBracket] = useState<TournamentBracketView[]>([]);
  const [currentRound, setCurrentRound] = useState<TournamentRound | null>(null);
  const [userMatches, setUserMatches] = useState<TournamentMatch[]>([]);
  const [leaderboard, setLeaderboard] = useState<TournamentResult[]>([]);
  const [userStats, setUserStats] = useState<TournamentUserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Chargement initial
  useEffect(() => {
    if (options.autoLoad && user?.id) {
      loadTournaments();
      loadUserTournaments();

      if (options.includeStats) {
        loadUserStats();
      }
    }
  }, [user?.id, options.autoLoad, options.includeStats]);

  /**
   * Charge tous les tournois actifs
   */
  const loadTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await tournamentService.getActiveTournaments();
      setActiveTournaments(data);
      setTournaments(data);
    } catch (err) {
      console.error('Erreur chargement tournois:', err);
      setError('Impossible de charger les tournois');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Charge un tournoi spécifique
   */
  const loadTournament = useCallback(async (tournamentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const tournament = await tournamentService.getTournament(tournamentId);

      if (tournament) {
        setCurrentTournament(tournament);

        // Charger le bracket
        await loadBracket(tournamentId);

        // Charger les matchs de l'utilisateur
        if (user?.id) {
          const matches = await tournamentService.getUserMatches(tournamentId, user.id);
          setUserMatches(matches);
        }

        // Charger le classement
        const standings = await tournamentService.getTournamentStandings(tournamentId);
        setLeaderboard(standings);
      }
    } catch (err) {
      console.error('Erreur chargement tournoi:', err);
      setError('Impossible de charger le tournoi');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Charge les participations de l'utilisateur aux tournois
   */
  const loadUserTournaments = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await tournamentService.getUserTournaments(user.id);
      setUserTournaments(data);
    } catch (err) {
      console.error('Erreur chargement participations:', err);
    }
  }, [user?.id]);

  /**
   * Charge le bracket d'un tournoi
   */
  const loadBracket = useCallback(async (tournamentId?: string) => {
    const targetId = tournamentId || currentTournament?.id;
    if (!targetId) return;

    try {
      const bracket = await tournamentService.getTournamentBracket(targetId);
      setCurrentBracket(bracket);

      // Charger aussi les rounds
      const rounds = await tournamentService.getTournamentRounds(targetId);
      if (rounds.length > 0) {
        // Trouver le round actif ou le plus récent
        const activeRound = rounds.find((r) => r.status === 'active') || rounds[rounds.length - 1];
        setCurrentRound(activeRound);
      }
    } catch (err) {
      console.error('Erreur chargement bracket:', err);
    }
  }, [currentTournament?.id]);

  /**
   * Charge les statistiques de l'utilisateur
   */
  const loadUserStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const stats = await tournamentService.getUserStats(user.id);
      setUserStats(stats);
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
    }
  }, [user?.id]);

  /**
   * Inscrit l'utilisateur à un tournoi
   */
  const registerForTournament = useCallback(async (tournamentId: string) => {
    if (!user?.id || isSubmitting) {
      setError('Vous devez être connecté pour vous inscrire');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const participation = await tournamentService.registerParticipant(
        tournamentId,
        user.id
      );

      if (participation) {
        // Recharger les données
        await loadTournaments();
        await loadUserTournaments();

        if (options.includeStats) {
          await loadUserStats();
        }

        // Afficher un message de succès
        setError(null);
      } else {
        setError('Impossible de s\'inscrire au tournoi');
      }
    } catch (err) {
      console.error('Erreur inscription tournoi:', err);
      setError('Impossible de s\'inscrire au tournoi');
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, isSubmitting, options.includeStats, loadTournaments, loadUserTournaments, loadUserStats]);

  /**
   * Se désinscrire d'un tournoi
   */
  const withdrawFromTournament = useCallback(async (tournamentId: string) => {
    if (!user?.id || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await tournamentService.withdrawFromTournament(tournamentId, user.id);

      if (success) {
        // Recharger les données
        await loadTournaments();
        await loadUserTournaments();

        setError(null);
      } else {
        setError('Impossible de se désinscrire du tournoi');
      }
    } catch (err) {
      console.error('Erreur désinscription tournoi:', err);
      setError('Impossible de se désinscrire du tournoi');
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, isSubmitting, loadTournaments, loadUserTournaments]);

  /**
   * Soumet une réponse pour un match
   */
  const submitMatch = useCallback(async (matchId: string, submission: string, timeSpent?: number) => {
    if (!user?.id || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await tournamentService.submitMatch(
        {
          match_id: matchId,
          submission,
          time_spent: timeSpent,
        },
        user.id
      );

      if (success) {
        // Recharger le bracket et les matchs
        if (currentTournament?.id) {
          await loadBracket(currentTournament.id);

          const matches = await tournamentService.getUserMatches(
            currentTournament.id,
            user.id
          );
          setUserMatches(matches);
        }

        setError(null);
      } else {
        setError('Impossible de soumettre le match');
      }
    } catch (err) {
      console.error('Erreur soumission match:', err);
      setError('Impossible de soumettre le match');
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, isSubmitting, currentTournament?.id, loadBracket]);

  /**
   * Rafraîchit toutes les données des tournois
   */
  const refreshTournaments = useCallback(async () => {
    await loadTournaments();
    await loadUserTournaments();

    if (currentTournament?.id) {
      await loadTournament(currentTournament.id);
    }

    if (options.includeStats) {
      await loadUserStats();
    }
  }, [currentTournament?.id, options.includeStats, loadTournaments, loadUserTournaments, loadTournament, loadUserStats]);

  // Abonnement temps réel pour les tournois
  useEffect(() => {
    if (!user?.id) return;

    // S'abonner aux changements des tournois
    const channel = supabase
      .channel('tournament_realtime_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments'
        },
        () => {
          // Recharger la liste des tournois
          loadTournaments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_participants',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Recharger les participations de l'utilisateur
          loadUserTournaments();
          loadTournaments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches'
        },
        (payload: any) => {
          // Si un match change et qu'on regarde un tournoi, recharger le bracket
          if (currentTournament?.id) {
            loadBracket(currentTournament.id);

            // Recharger les matchs de l'utilisateur
            tournamentService.getUserMatches(currentTournament.id, user.id).then((matches) => {
              setUserMatches(matches);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_rounds'
        },
        () => {
          // Recharger le bracket si un round change
          if (currentTournament?.id) {
            loadBracket(currentTournament.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_results'
        },
        () => {
          // Recharger le classement
          if (currentTournament?.id) {
            tournamentService.getTournamentStandings(currentTournament.id).then((standings) => {
              setLeaderboard(standings);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, currentTournament?.id, supabase, loadTournaments, loadUserTournaments, loadBracket]);

  return {
    // Tournois
    tournaments,
    activeTournaments,
    userTournaments,
    currentTournament,

    // Bracket
    currentBracket,
    currentRound,
    userMatches,

    // Statistiques
    userStats,
    leaderboard,

    // État
    isLoading,
    isSubmitting,
    error,

    // Actions
    loadTournaments,
    loadTournament,
    registerForTournament,
    withdrawFromTournament,
    submitMatch,
    loadBracket,
    loadUserStats,
    refreshTournaments,
  };
}
