'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { skillTreeService } from '@/services/skillTreeService';
import type {
  UseSkillTreeOptions,
  UseSkillTreeResult,
  SkillTree,
  SkillNode,
  SkillCategory,
  UserSkillProgress,
  UserSkillStats,
  PrerequisitesCheck,
  UnlockSkillResult,
  UpdateSkillProgressInput,
  SkillUnlockSource
} from '@/types/skillTree.types';
import { getAvailableSkills as getAvailableSkillsHelper } from '@/types/skillTree.types';

/**
 * Hook pour gérer l'arbre de compétences
 */
export function useSkillTree(
  options: UseSkillTreeOptions = {
    autoLoad: true,
    includeUserProgress: true,
    includeLocked: true,
    realtimeEnabled: false
  }
): UseSkillTreeResult {
  // États
  const [user, setUser] = useState<User | null>(null);
  const [skillTree, setSkillTree] = useState<SkillTree | null>(null);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserSkillProgress>>({});
  const [stats, setStats] = useState<UserSkillStats | null>(null);
  const [availableSkills, setAvailableSkills] = useState<SkillNode[]>([]);
  const [lockedSkills, setLockedSkills] = useState<SkillNode[]>([]);
  const [completedSkills, setCompletedSkills] = useState<SkillNode[]>([]);
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
   * Charge l'arbre de compétences complet
   */
  const loadSkillTree = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Récupérer l'arbre de compétences
      const tree = await skillTreeService.getSkillTree(user.id);

      if (!tree) {
        throw new Error('Impossible de charger l\'arbre de compétences');
      }

      setSkillTree(tree);
      setCategories(tree.categories);

      // Filtrer par catégorie si spécifié
      const filteredNodes = options.categoryId
        ? tree.nodes.filter(node => node.category_id === options.categoryId)
        : tree.nodes;

      setNodes(filteredNodes);
      setUserProgress(tree.user_progress);

      // Calculer les compétences par statut
      await calculateSkillsByStatus(filteredNodes, tree.user_progress);

      // Charger les statistiques si activées
      if (options.includeUserProgress) {
        await loadUserStats();
      }

      setInitialized(true);
    } catch (err) {
      setError('Erreur lors du chargement de l\'arbre de compétences');
    } finally {
      setLoading(false);
    }
  }, [user?.id, options.categoryId, options.includeUserProgress]);

  /**
   * Calcule les compétences par statut
   */
  const calculateSkillsByStatus = useCallback(async (
    skillNodes: SkillNode[],
    progress: Record<string, UserSkillProgress>
  ) => {
    if (!user?.id) return;

    try {
      // Récupérer le niveau utilisateur pour calculer les disponibles
      const { data: userLevel } = await supabase
        .from('user_levels')
        .select('current_level, total_xp')
        .eq('user_id', user.id)
        .single();

      const currentLevel = userLevel?.current_level || 0;
      const currentXP = userLevel?.total_xp || 0;

      // Compétences disponibles pour déverrouillage
      const available = getAvailableSkillsHelper(skillNodes, progress, currentLevel, currentXP);
      setAvailableSkills(available);

      // Compétences verrouillées
      const locked = skillNodes.filter(node => {
        const nodeProgress = progress[node.id];
        return !nodeProgress || nodeProgress.status === 'locked';
      });
      setLockedSkills(locked);

      // Compétences complétées
      const completed = skillNodes.filter(node => {
        const nodeProgress = progress[node.id];
        return nodeProgress && ['completed', 'mastered'].includes(nodeProgress.status);
      });
      setCompletedSkills(completed);
    } catch (err) {
      // Erreur silencieuse, les listes resteront vides
    }
  }, [user?.id, supabase]);

  /**
   * Charge les statistiques utilisateur
   */
  const loadUserStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userStats = await skillTreeService.getUserStats(user.id);
      setStats(userStats);
    } catch (err) {
      // Erreur silencieuse
    }
  }, [user?.id]);

  /**
   * Déverrouille une compétence
   */
  const unlockSkill = useCallback(async (
    skillNodeId: string,
    source?: SkillUnlockSource
  ): Promise<UnlockSkillResult> => {
    if (!user?.id) {
      return {
        success: false,
        error: 'Utilisateur non authentifié',
        prerequisites_met: false,
        unlocked: false
      };
    }

    setError(null);

    try {
      const result = await skillTreeService.unlockSkillNode(
        user.id,
        skillNodeId,
        source || 'manual'
      );

      if (result.success) {
        // Recharger l'arbre pour mettre à jour l'état
        await refresh();
      } else {
        setError(result.error || 'Impossible de déverrouiller la compétence');
      }

      return result;
    } catch (err) {
      const errorMessage = 'Erreur lors du déverrouillage de la compétence';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        prerequisites_met: false,
        unlocked: false
      };
    }
  }, [user?.id]);

  /**
   * Met à jour la progression d'une compétence
   */
  const updateProgress = useCallback(async (
    input: Omit<UpdateSkillProgressInput, 'user_id'>
  ): Promise<void> => {
    if (!user?.id) return;

    setError(null);

    try {
      await skillTreeService.updateProgress({
        ...input,
        user_id: user.id
      });

      // Recharger l'arbre pour mettre à jour l'état
      await refresh();
    } catch (err) {
      setError('Erreur lors de la mise à jour de la progression');
      throw err;
    }
  }, [user?.id]);

  /**
   * Vérifie les prérequis pour une compétence
   */
  const checkPrerequisites = useCallback(async (
    skillNodeId: string
  ): Promise<PrerequisitesCheck> => {
    if (!user?.id) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      return await skillTreeService.checkPrerequisites(user.id, skillNodeId);
    } catch (err) {
      throw err;
    }
  }, [user?.id]);

  /**
   * Récupère un nœud de compétence par son ID
   */
  const getSkillNode = useCallback((skillNodeId: string): SkillNode | undefined => {
    return nodes.find(node => node.id === skillNodeId);
  }, [nodes]);

  /**
   * Récupère la progression d'une compétence
   */
  const getSkillProgress = useCallback((skillNodeId: string): UserSkillProgress | undefined => {
    return userProgress[skillNodeId];
  }, [userProgress]);

  /**
   * Rafraîchit l'arbre de compétences
   */
  const refresh = useCallback(async () => {
    await loadSkillTree();
  }, [loadSkillTree]);

  // Chargement automatique
  useEffect(() => {
    if (options.autoLoad && user?.id && !initialized) {
      loadSkillTree();
    }
  }, [options.autoLoad, user?.id, initialized, loadSkillTree]);

  // Écoute en temps réel (si activé)
  useEffect(() => {
    if (!options.realtimeEnabled || !user?.id) return;

    const channel = supabase
      .channel('skill-tree-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_skill_progress',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Recharger l'arbre lors d'un changement
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.realtimeEnabled, user?.id, supabase, refresh]);

  return {
    // État
    skillTree,
    categories,
    nodes,
    userProgress,
    stats,
    availableSkills,
    lockedSkills,
    completedSkills,
    loading,
    error,
    initialized,

    // Actions
    unlockSkill,
    updateProgress,
    checkPrerequisites,
    getSkillNode,
    getSkillProgress,
    refresh
  };
}
