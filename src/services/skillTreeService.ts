import { createClient } from '@/lib/supabase/client';
import type {
  SkillTree,
  SkillNode,
  SkillCategory,
  UserSkillProgress,
  PrerequisitesCheck,
  UnlockSkillResult,
  UpdateSkillProgressInput,
  UserSkillStats,
  SkillUnlockLog,
  SkillUnlockSource,
  SkillProgressStatus
} from '@/types/skillTree.types';
import { canUnlockSkill, calculateUserSkillStats } from '@/types/skillTree.types';
import type { UserLevel } from '@/types/levels.types';

/**
 * Service de gestion de l'arbre de compétences
 */
export class SkillTreeService {
  private supabase = createClient();

  /**
   * Récupère l'arbre de compétences complet avec la progression utilisateur
   */
  async getSkillTree(userId: string): Promise<SkillTree | null> {
    try {
      // Récupérer toutes les catégories
      const { data: categories, error: categoriesError } = await this.supabase
        .from('skill_categories')
        .select('*')
        .order('display_order');

      if (categoriesError) {
        console.error('Erreur récupération catégories:', categoriesError);
        throw categoriesError;
      }

      // Récupérer tous les nœuds de compétences
      const { data: nodes, error: nodesError } = await this.supabase
        .from('skill_nodes')
        .select('*')
        .eq('active', true)
        .order('category_id, tree_level, display_order');

      if (nodesError) {
        console.error('Erreur récupération nœuds:', nodesError);
        throw nodesError;
      }

      // Récupérer la progression utilisateur
      const { data: progressData, error: progressError } = await this.supabase
        .from('user_skill_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) {
        console.error('Erreur récupération progression:', progressError);
        throw progressError;
      }

      // Indexer la progression par skill_node_id
      const userProgress: Record<string, UserSkillProgress> = {};
      progressData?.forEach((progress: UserSkillProgress) => {
        userProgress[progress.skill_node_id] = progress;
      });

      return {
        categories: categories || [],
        nodes: nodes || [],
        user_progress: userProgress
      };
    } catch (error) {
      console.error('Erreur récupération arbre de compétences:', error);
      return null;
    }
  }

  /**
   * Vérifie si un utilisateur peut déverrouiller une compétence
   */
  async checkPrerequisites(userId: string, skillNodeId: string): Promise<PrerequisitesCheck> {
    try {
      // Récupérer le nœud de compétence
      const { data: skillNode, error: nodeError } = await this.supabase
        .from('skill_nodes')
        .select('*')
        .eq('id', skillNodeId)
        .single();

      if (nodeError || !skillNode) {
        throw new Error('Nœud de compétence introuvable');
      }

      // Récupérer le niveau et l'XP de l'utilisateur
      const { data: userLevel, error: levelError } = await this.supabase
        .from('user_levels')
        .select('current_level, total_xp')
        .eq('user_id', userId)
        .single();

      if (levelError) {
        console.error('Erreur récupération niveau utilisateur:', levelError);
        // Valeurs par défaut si l'utilisateur n'a pas encore de niveau
        return {
          can_unlock: false,
          missing_prerequisites: [],
          level_requirement_met: false,
          xp_requirement_met: false,
          current_level: 0,
          required_level: skillNode.min_level_required,
          current_xp: 0,
          required_xp: skillNode.xp_required
        };
      }

      const currentLevel = userLevel?.current_level || 0;
      const currentXP = userLevel?.total_xp || 0;

      // Vérifier les prérequis de niveau et XP
      const levelRequirementMet = currentLevel >= skillNode.min_level_required;
      const xpRequirementMet = currentXP >= skillNode.xp_required;

      // Récupérer les nœuds prérequis
      const missingPrerequisites: SkillNode[] = [];
      if (skillNode.prerequisites && skillNode.prerequisites.length > 0) {
        const { data: userProgress } = await this.supabase
          .from('user_skill_progress')
          .select('skill_node_id, status')
          .eq('user_id', userId)
          .in('skill_node_id', skillNode.prerequisites);

        const completedPrereqs = new Set(
          userProgress
            ?.filter((p: { skill_node_id: string; status: string }) => ['completed', 'mastered'].includes(p.status))
            .map((p: { skill_node_id: string; status: string }) => p.skill_node_id) || []
        );

        for (const prereqId of skillNode.prerequisites) {
          if (!completedPrereqs.has(prereqId)) {
            const { data: prereqNode } = await this.supabase
              .from('skill_nodes')
              .select('*')
              .eq('id', prereqId)
              .single();

            if (prereqNode) {
              missingPrerequisites.push(prereqNode);
            }
          }
        }
      }

      const canUnlock =
        levelRequirementMet &&
        xpRequirementMet &&
        missingPrerequisites.length === 0;

      return {
        can_unlock: canUnlock,
        missing_prerequisites: missingPrerequisites,
        level_requirement_met: levelRequirementMet,
        xp_requirement_met: xpRequirementMet,
        current_level: currentLevel,
        required_level: skillNode.min_level_required,
        current_xp: currentXP,
        required_xp: skillNode.xp_required
      };
    } catch (error) {
      console.error('Erreur vérification prérequis:', error);
      throw error;
    }
  }

  /**
   * Déverrouille une compétence pour un utilisateur
   */
  async unlockSkillNode(
    userId: string,
    skillNodeId: string,
    source: SkillUnlockSource = 'manual'
  ): Promise<UnlockSkillResult> {
    try {
      // Vérifier les prérequis
      const prereqCheck = await this.checkPrerequisites(userId, skillNodeId);

      if (!prereqCheck.can_unlock) {
        return {
          success: false,
          error: 'Prérequis non satisfaits',
          prerequisites_met: false,
          unlocked: false
        };
      }

      // Vérifier si déjà déverrouillé
      const { data: existingProgress } = await this.supabase
        .from('user_skill_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('skill_node_id', skillNodeId)
        .single();

      if (existingProgress && existingProgress.status !== 'locked') {
        return {
          success: true,
          skill_node_id: skillNodeId,
          prerequisites_met: true,
          unlocked: true
        };
      }

      const now = new Date().toISOString();

      // Créer ou mettre à jour la progression
      if (existingProgress) {
        const { error: updateError } = await this.supabase
          .from('user_skill_progress')
          .update({
            status: 'available',
            unlocked_at: now,
            updated_at: now
          })
          .eq('id', existingProgress.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await this.supabase
          .from('user_skill_progress')
          .insert({
            user_id: userId,
            skill_node_id: skillNodeId,
            status: 'available',
            progress_percentage: 0,
            practice_count: 0,
            success_count: 0,
            unlocked_at: now
          });

        if (insertError) {
          throw insertError;
        }
      }

      // Enregistrer le déverrouillage dans le log
      await this.supabase.from('skill_unlocks_log').insert({
        user_id: userId,
        skill_node_id: skillNodeId,
        unlock_source: source
      });

      return {
        success: true,
        skill_node_id: skillNodeId,
        prerequisites_met: true,
        unlocked: true
      };
    } catch (error) {
      console.error('Erreur déverrouillage compétence:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        prerequisites_met: false,
        unlocked: false
      };
    }
  }

  /**
   * Met à jour la progression d'une compétence
   */
  async updateProgress(input: UpdateSkillProgressInput): Promise<void> {
    try {
      const { user_id, skill_node_id, status, progress_percentage, increment_practice, increment_success } = input;

      // Récupérer la progression actuelle
      const { data: currentProgress } = await this.supabase
        .from('user_skill_progress')
        .select('*')
        .eq('user_id', user_id)
        .eq('skill_node_id', skill_node_id)
        .single();

      if (!currentProgress) {
        throw new Error('Progression introuvable');
      }

      const now = new Date().toISOString();
      const updates: Partial<UserSkillProgress> = {
        updated_at: now,
        last_practiced_at: now
      };

      // Mettre à jour le statut si fourni
      if (status) {
        updates.status = status;

        // Mettre à jour les timestamps selon le statut
        if (status === 'in_progress' && !currentProgress.started_at) {
          updates.started_at = now;
        } else if (status === 'completed' && !currentProgress.completed_at) {
          updates.completed_at = now;
          updates.progress_percentage = 100;
        } else if (status === 'mastered' && !currentProgress.mastered_at) {
          updates.mastered_at = now;
          updates.progress_percentage = 100;
        }
      }

      // Mettre à jour le pourcentage de progression
      if (progress_percentage !== undefined) {
        updates.progress_percentage = Math.min(100, Math.max(0, progress_percentage));
      }

      // Incrémenter les compteurs
      if (increment_practice) {
        updates.practice_count = currentProgress.practice_count + 1;
      }

      if (increment_success) {
        updates.success_count = currentProgress.success_count + 1;
      }

      // Appliquer les mises à jour
      const { error } = await this.supabase
        .from('user_skill_progress')
        .update(updates)
        .eq('id', currentProgress.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erreur mise à jour progression:', error);
      throw error;
    }
  }

  /**
   * Récupère la progression utilisateur pour toutes les compétences
   */
  async getUserSkillProgress(userId: string): Promise<UserSkillProgress[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_skill_progress')
        .select('*, skill_node:skill_nodes(*)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur récupération progression utilisateur:', error);
      return [];
    }
  }

  /**
   * Récupère les détails d'un nœud de compétence
   */
  async getSkillNodeDetails(skillNodeId: string): Promise<SkillNode | null> {
    try {
      const { data, error } = await this.supabase
        .from('skill_nodes')
        .select('*, category:skill_categories(*)')
        .eq('id', skillNodeId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur récupération détails nœud:', error);
      return null;
    }
  }

  /**
   * Récupère toutes les compétences déverrouillées d'un utilisateur
   */
  async getUnlockedSkills(userId: string): Promise<SkillNode[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_skill_progress')
        .select('skill_node:skill_nodes(*)')
        .eq('user_id', userId)
        .in('status', ['available', 'in_progress', 'completed', 'mastered']);

      if (error) {
        throw error;
      }

      return data?.map((item: { skill_node: SkillNode }) => item.skill_node).filter(Boolean) || [];
    } catch (error) {
      console.error('Erreur récupération compétences déverrouillées:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques de compétences d'un utilisateur
   */
  async getUserStats(userId: string): Promise<UserSkillStats | null> {
    try {
      // Récupérer toutes les données nécessaires
      const skillTree = await this.getSkillTree(userId);
      if (!skillTree) {
        return null;
      }

      const { nodes, user_progress, categories } = skillTree;

      // Calculer les statistiques de base
      const baseStats = calculateUserSkillStats(nodes, user_progress, categories);

      // Récupérer les déverrouillages récents
      const { data: recentUnlocks } = await this.supabase
        .from('skill_unlocks_log')
        .select('*, skill_node:skill_nodes(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les compétences récemment pratiquées
      const { data: recentlyPracticed } = await this.supabase
        .from('user_skill_progress')
        .select('*, skill_node:skill_nodes(*)')
        .eq('user_id', userId)
        .not('last_practiced_at', 'is', null)
        .order('last_practiced_at', { ascending: false })
        .limit(10);

      // Calculer les statistiques par catégorie
      const statsByCategory: Record<string, {
        category_name: string;
        total: number;
        unlocked: number;
        completed: number;
        mastered: number;
      }> = {};

      categories.forEach(category => {
        const categoryNodes = nodes.filter(n => n.category_id === category.id);
        let unlocked = 0;
        let completed = 0;
        let mastered = 0;

        categoryNodes.forEach(node => {
          const progress = user_progress[node.id];
          if (progress) {
            if (['available', 'in_progress', 'completed', 'mastered'].includes(progress.status)) {
              unlocked++;
            }
            if (progress.status === 'completed') completed++;
            if (progress.status === 'mastered') mastered++;
          }
        });

        statsByCategory[category.id] = {
          category_name: category.name_fr,
          total: categoryNodes.length,
          unlocked,
          completed,
          mastered
        };
      });

      // Calculer les statistiques par difficulté
      const statsByDifficulty: Record<string, { total: number; completed: number }> = {
        beginner: { total: 0, completed: 0 },
        intermediate: { total: 0, completed: 0 },
        advanced: { total: 0, completed: 0 },
        expert: { total: 0, completed: 0 }
      };

      nodes.forEach(node => {
        if (node.difficulty) {
          statsByDifficulty[node.difficulty].total++;
          const progress = user_progress[node.id];
          if (progress && ['completed', 'mastered'].includes(progress.status)) {
            statsByDifficulty[node.difficulty].completed++;
          }
        }
      });

      return {
        user_id: userId,
        ...baseStats,
        stats_by_category: statsByCategory,
        stats_by_difficulty: statsByDifficulty as UserSkillStats['stats_by_difficulty'],
        recent_unlocks: recentUnlocks || [],
        recently_practiced: recentlyPracticed || []
      } as UserSkillStats;
    } catch (error) {
      console.error('Erreur récupération statistiques utilisateur:', error);
      return null;
    }
  }

  /**
   * Récupère les compétences disponibles pour déverrouillage
   */
  async getAvailableSkills(userId: string): Promise<SkillNode[]> {
    try {
      const skillTree = await this.getSkillTree(userId);
      if (!skillTree) {
        return [];
      }

      // Récupérer le niveau et l'XP de l'utilisateur
      const { data: userLevel } = await this.supabase
        .from('user_levels')
        .select('current_level, total_xp')
        .eq('user_id', userId)
        .single();

      const currentLevel = userLevel?.current_level || 0;
      const currentXP = userLevel?.total_xp || 0;

      // Filtrer les compétences disponibles
      return skillTree.nodes.filter(node => {
        const progress = skillTree.user_progress[node.id];

        // Si déjà déverrouillé, pas disponible pour déverrouillage
        if (progress && progress.status !== 'locked') {
          return false;
        }

        // Vérifier si peut être déverrouillé
        return canUnlockSkill(node, skillTree.user_progress, currentLevel, currentXP);
      });
    } catch (error) {
      console.error('Erreur récupération compétences disponibles:', error);
      return [];
    }
  }

  /**
   * Récupère l'historique des déverrouillages d'un utilisateur
   */
  async getUnlockHistory(userId: string, limit = 50): Promise<SkillUnlockLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('skill_unlocks_log')
        .select('*, skill_node:skill_nodes(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur récupération historique déverrouillages:', error);
      return [];
    }
  }
}

/**
 * Instance singleton du service
 */
export const skillTreeService = new SkillTreeService();
