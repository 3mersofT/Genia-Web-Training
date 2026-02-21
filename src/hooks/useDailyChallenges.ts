'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { challengeService } from '@/services/challengeService';
import type {
  UseDailyChallenges,
  UseDailyChallengesOptions,
  DailyChallenge,
  ChallengeParticipation,
  LeaderboardEntry,
  ChallengeUserStats
} from '@/types/challenges.types';

/**
 * Hook pour gérer les défis quotidiens
 */
export function useDailyChallenges(
  options: UseDailyChallengesOptions = {
    autoLoad: true,
    includeHistory: false,
    includeStat: false,
    notificationsEnabled: true
  }
): UseDailyChallenges {
  // États
  const [user, setUser] = useState<User | null>(null);
  const [todayChallenge, setTodayChallenge] = useState<DailyChallenge | null>(null);
  const [participation, setParticipation] = useState<ChallengeParticipation | null>(null);
  const [recentChallenges, setRecentChallenges] = useState<DailyChallenge[]>([]);
  const [participations, setParticipations] = useState<ChallengeParticipation[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<ChallengeUserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Gestion de l'authentification
  useEffect(() => {
    // Charger l'utilisateur actuel
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Charge le défi du jour
   */
  const loadTodayChallenge = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer le défi du jour
      const challenge = await challengeService.getTodayChallenge();
      setTodayChallenge(challenge);

      // Vérifier si l'utilisateur a déjà participé
      if (user?.id && challenge) {
        const userParticipation = await challengeService.getUserParticipation(
          user.id,
          challenge.id
        );
        setParticipation(userParticipation);
      }

      // Charger le leaderboard si demandé
      if (challenge) {
        await loadLeaderboard(challenge.id);
      }
    } catch (err) {
      console.error('Erreur chargement défi du jour:', err);
      setError('Impossible de charger le défi du jour');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Charge le leaderboard d'un défi
   */
  const loadLeaderboard = useCallback(async (challengeId?: string) => {
    if (!challengeId && !todayChallenge?.id) return;

    const targetId = challengeId || todayChallenge!.id;

    try {
      const { leaderboard: board, userRank: rank } = await challengeService.getLeaderboard(
        targetId,
        user?.id
      );
      
      setLeaderboard(board);
      setUserRank(rank);
    } catch (err) {
      console.error('Erreur chargement leaderboard:', err);
    }
  }, [todayChallenge?.id, user?.id]);

  /**
   * Charge les statistiques utilisateur
   */
  const loadUserStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const stats = await challengeService.getUserStats(user.id);
      setUserStats(stats);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  }, [user?.id]);

  /**
   * Soumet une réponse au défi
   */
  const submitChallenge = useCallback(async (
    submission: string
  ): Promise<ChallengeParticipation | null> => {
    if (!user?.id || !todayChallenge?.id || isSubmitting) {
      return null;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Créer la participation
      const newParticipation = await challengeService.submitChallenge(
        user.id,
        todayChallenge.id,
        submission
      );

      if (newParticipation) {
        setParticipation(newParticipation);
        
        // Recharger le leaderboard
        await loadLeaderboard();
        
        // Mettre à jour les stats si activées
        if (options.includeStat) {
          await loadUserStats();
        }

        // Envoyer une notification de succès
        if (options.notificationsEnabled) {
          await challengeService.createNotification(
            user.id,
            'achievement',
            '🎉 Défi complété !',
            `Vous avez obtenu ${newParticipation.score || 0} points`
          );
        }
      }

      return newParticipation;
    } catch (err) {
      console.error('Erreur soumission défi:', err);
      setError('Impossible de soumettre votre réponse');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, todayChallenge?.id, isSubmitting, options, loadLeaderboard, loadUserStats]);

  /**
   * Sauvegarde le progrès (brouillon)
   */
  const saveProgress = useCallback(async (submission: string) => {
    if (!user?.id || !todayChallenge?.id) return;

    try {
      // Sauvegarder en localStorage pour l'instant
      const key = `challenge_draft_${todayChallenge.id}_${user.id}`;
      localStorage.setItem(key, JSON.stringify({
        submission,
        savedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Erreur sauvegarde progrès:', err);
    }
  }, [user?.id, todayChallenge?.id]);

  /**
   * Évalue une soumission d'un autre utilisateur
   */
  const reviewSubmission = useCallback(async (
    participationId: string,
    rating: number,
    comment?: string
  ) => {
    if (!user?.id) return;

    try {
      await challengeService.submitPeerReview(
        participationId,
        user.id,
        rating,
        comment
      );

      // Mettre à jour les stats si nécessaire
      if (options.includeStat) {
        await loadUserStats();
      }
    } catch (err) {
      console.error('Erreur évaluation:', err);
      setError('Impossible de soumettre votre évaluation');
    }
  }, [user?.id, options.includeStat, loadUserStats]);

  /**
   * Utilise un indice
   */
  const useHint = useCallback(async (hintIndex: number): Promise<string | null> => {
    if (!todayChallenge?.hints || hintIndex >= todayChallenge.hints.length) {
      return null;
    }

    // Marquer l'indice comme utilisé
    if (participation) {
      const hintsUsed = (participation.hints_used || 0) + 1;
      
      // Mettre à jour localement
      setParticipation({
        ...participation,
        hints_used: hintsUsed
      });

      // Mettre à jour en base si nécessaire
      if (user?.id) {
        await challengeService.updateParticipation(participation.id, {
          hints_used: hintsUsed
        });
      }
    }

    return todayChallenge.hints[hintIndex];
  }, [todayChallenge, participation, user?.id]);

  /**
   * Marque une notification comme lue
   */
  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await challengeService.markNotificationRead(notificationId);
    } catch (err) {
      console.error('Erreur marquage notification:', err);
    }
  }, []);

  /**
   * Charge l'historique des défis
   */
  useEffect(() => {
    if (options.includeHistory && user?.id) {
      const loadHistory = async () => {
        try {
          const [challenges, parts] = await Promise.all([
            challengeService.getRecentChallenges(7),
            challengeService.getUserParticipations(user.id, 10)
          ]);
          
          setRecentChallenges(challenges);
          setParticipations(parts);
        } catch (err) {
          console.error('Erreur chargement historique:', err);
        }
      };

      loadHistory();
    }
  }, [options.includeHistory, user?.id]);

  /**
   * Charge les données initiales
   */
  useEffect(() => {
    if (options.autoLoad) {
      // Délai pour s'assurer que le composant est monté côté client
      const timer = setTimeout(() => {
        loadTodayChallenge();
        
        if (options.includeStat && user?.id) {
          loadUserStats();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [options.autoLoad, options.includeStat, user?.id, loadTodayChallenge, loadUserStats]);

  /**
   * Écoute les changements en temps réel (leaderboard)
   */
  useEffect(() => {
    if (!todayChallenge?.id) return;

    const channel = supabase
      .channel(`challenge_${todayChallenge.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_participations',
          filter: `challenge_id=eq.${todayChallenge.id}`
        },
        () => {
          // Recharger le leaderboard quand quelqu'un participe
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [todayChallenge?.id, supabase, loadLeaderboard]);

  /**
   * Notification de fin de défi proche
   */
  useEffect(() => {
    if (!todayChallenge || participation) return;

    const checkTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const hoursRemaining = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Notifier si moins de 2 heures restantes
      if (hoursRemaining < 2 && options.notificationsEnabled) {
        const notification = {
          title: '⏰ Le défi se termine bientôt !',
          body: `Plus que ${Math.floor(hoursRemaining)} heure(s) pour participer au défi du jour.`,
          icon: '/icons/192.png',
          badge: '/icons/96.png',
          vibrate: [200, 100, 200]
        };

        // Utiliser l'API Notification si disponible
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, notification);
        }
      }
    };

    // Vérifier toutes les heures
    const interval = setInterval(checkTimeRemaining, 3600000);
    checkTimeRemaining(); // Vérification initiale

    return () => clearInterval(interval);
  }, [todayChallenge, participation, options.notificationsEnabled]);

  return {
    // État
    todayChallenge,
    participation,
    recentChallenges,
    participations,
    leaderboard,
    userRank,
    userStats,
    isLoading,
    error,
    isSubmitting,
    
    // Actions
    submitChallenge,
    saveProgress,
    reviewSubmission,
    loadTodayChallenge,
    loadLeaderboard,
    loadUserStats,
    markNotificationRead,
    useHint
  };
}
