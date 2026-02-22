'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { levelProgressionService } from '@/services/levelProgressionService';
import type {
  UserLevel,
  LevelDefinition,
  XPTransaction,
  LevelUpNotification,
  LevelProgress,
  AwardXPResult,
  AwardXPInput,
  UseLevelProgressionOptions,
  UseLevelProgressionResult
} from '@/types/levels.types';

/**
 * Hook pour gérer la progression de niveau et l'XP
 */
export function useLevelProgression(
  options: UseLevelProgressionOptions = {
    autoLoad: true,
    includeHistory: false,
    includeNotifications: false,
    realtimeEnabled: false
  }
): UseLevelProgressionResult {
  // États
  const [user, setUser] = useState<User | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [levelDefinitions, setLevelDefinitions] = useState<LevelDefinition[]>([]);
  const [xpHistory, setXpHistory] = useState<XPTransaction[]>([]);
  const [levelUpNotifications, setLevelUpNotifications] = useState<LevelUpNotification[]>([]);
  const [unshownNotifications, setUnshownNotifications] = useState<LevelUpNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

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
   * Charge les définitions de niveau
   */
  const loadLevelDefinitions = useCallback(async () => {
    try {
      const definitions = await levelProgressionService.getAllLevelDefinitions();
      setLevelDefinitions(definitions);
    } catch (err) {
      console.error('Erreur chargement définitions de niveau:', err);
    }
  }, []);

  /**
   * Charge le niveau et la progression de l'utilisateur
   */
  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Récupérer le niveau utilisateur
      const level = await levelProgressionService.getUserLevel(user.id);
      setUserLevel(level);

      // Récupérer la progression
      const progress = await levelProgressionService.getLevelProgress(user.id);
      setLevelProgress(progress);

      // Charger l'historique si demandé
      if (options.includeHistory) {
        const history = await levelProgressionService.getXPHistory(user.id);
        setXpHistory(history);
      }

      // Charger les notifications si demandé
      if (options.includeNotifications) {
        const notifications = await levelProgressionService.getLevelUpNotifications(user.id);
        setLevelUpNotifications(notifications);

        const unshown = await levelProgressionService.getLevelUpNotifications(user.id, true);
        setUnshownNotifications(unshown);
      }

      setInitialized(true);
    } catch (err) {
      console.error('Erreur chargement progression utilisateur:', err);
      setError('Impossible de charger votre progression');
    } finally {
      setLoading(false);
    }
  }, [user?.id, options.includeHistory, options.includeNotifications]);

  /**
   * Attribue de l'XP à l'utilisateur
   */
  const awardXP = useCallback(async (
    input: Omit<AwardXPInput, 'user_id'>
  ): Promise<AwardXPResult> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setError(null);

    try {
      const result = await levelProgressionService.awardXP({
        ...input,
        user_id: user.id
      });

      // Rafraîchir les données après attribution
      await loadUserProgress();

      return result;
    } catch (err) {
      console.error('Erreur attribution XP:', err);
      setError('Impossible d\'attribuer l\'XP');
      throw err;
    }
  }, [user?.id, loadUserProgress]);

  /**
   * Rafraîchit toutes les données
   */
  const refresh = useCallback(async () => {
    await loadLevelDefinitions();
    await loadUserProgress();
  }, [loadLevelDefinitions, loadUserProgress]);

  /**
   * Marque une notification comme affichée
   */
  const markNotificationShown = useCallback(async (notificationId: string) => {
    try {
      const success = await levelProgressionService.markNotificationAsShown(notificationId);

      if (success && options.includeNotifications) {
        // Recharger les notifications
        const notifications = await levelProgressionService.getLevelUpNotifications(user!.id);
        setLevelUpNotifications(notifications);

        const unshown = await levelProgressionService.getLevelUpNotifications(user!.id, true);
        setUnshownNotifications(unshown);
      }
    } catch (err) {
      console.error('Erreur marquage notification:', err);
    }
  }, [user?.id, options.includeNotifications]);

  /**
   * Récupère une définition de niveau par rang
   */
  const getLevelDefinition = useCallback((rank: number): LevelDefinition | undefined => {
    return levelDefinitions.find(l => l.level_rank === rank);
  }, [levelDefinitions]);

  /**
   * Récupère l'XP requis pour un niveau
   */
  const getXPForLevel = useCallback((rank: number): number => {
    const level = getLevelDefinition(rank);
    return level?.xp_required || 0;
  }, [getLevelDefinition]);

  /**
   * Calcule la progression vers le prochain niveau
   */
  const calculateProgressToNextLevel = useCallback((): number => {
    return levelProgress?.progress_percentage || 0;
  }, [levelProgress]);

  // Chargement initial
  useEffect(() => {
    if (options.autoLoad) {
      loadLevelDefinitions();
    }
  }, [options.autoLoad, loadLevelDefinitions]);

  useEffect(() => {
    if (options.autoLoad && user?.id) {
      loadUserProgress();
    }
  }, [options.autoLoad, user?.id, loadUserProgress]);

  // Abonnement temps réel
  useEffect(() => {
    if (!options.realtimeEnabled || !user?.id) {
      return;
    }

    // S'abonner aux changements du niveau utilisateur
    const channel = supabase
      .channel('level_progression_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_levels',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Recharger les données quand le niveau change
          loadUserProgress();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'xp_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Recharger les données quand une transaction XP est créée
          loadUserProgress();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'level_up_notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Recharger les notifications quand une nouvelle est créée
          if (options.includeNotifications) {
            loadUserProgress();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.realtimeEnabled, options.includeNotifications, user?.id, loadUserProgress, supabase]);

  return {
    // État
    userLevel,
    levelProgress,
    levelDefinitions,
    xpHistory,
    levelUpNotifications,
    unshownNotifications,
    loading,
    error,
    initialized,

    // Actions
    awardXP,
    refresh,
    markNotificationShown,
    getLevelDefinition,
    getXPForLevel,
    calculateProgressToNextLevel
  };
}
