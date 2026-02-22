/**
 * Types pour le système d'arbre de compétences (Skill Tree)
 */

export type SkillDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SkillUnlockType = 'automatic' | 'challenge' | 'manual';
export type SkillProgressStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered';
export type SkillUnlockSource = 'level_up' | 'challenge_complete' | 'prerequisite_met' | 'manual' | 'xp_threshold';

/**
 * Catégorie de compétences
 */
export interface SkillCategory {
  id: string;
  name: string;
  name_fr: string;

  // Visuel
  icon_emoji?: string;
  color_hex?: string;

  // Métadonnées
  description?: string;
  display_order: number;

  created_at: string;
  updated_at: string;

  // Relations
  skill_nodes?: SkillNode[];
}

/**
 * Nœud de l'arbre de compétences
 */
export interface SkillNode {
  id: string;
  category_id: string;

  // Identification
  skill_key: string;
  name: string;
  name_fr: string;

  // Hiérarchie
  parent_node_id?: string;
  tree_level: number;
  display_order: number;

  // Prérequis
  prerequisites: string[]; // IDs des skill_nodes requis
  min_level_required: number;
  xp_required: number;

  // Contenu
  description: string;
  detailed_explanation?: string;
  examples?: Array<{
    title: string;
    prompt: string;
    explanation?: string;
  }>;
  resources?: string[];

  // Déverrouillage
  unlock_type: SkillUnlockType;
  unlock_challenge_id?: string;

  // Visuel
  icon_emoji?: string;
  position_x?: number;
  position_y?: number;

  // Métadonnées
  difficulty?: SkillDifficulty;
  estimated_time?: number; // Minutes pour maîtriser

  active: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  category?: SkillCategory;
  parent_node?: SkillNode;
  child_nodes?: SkillNode[];
  user_progress?: UserSkillProgress;
}

/**
 * Progression utilisateur pour une compétence
 */
export interface UserSkillProgress {
  id: string;
  user_id: string;
  skill_node_id: string;

  // Statut
  status: SkillProgressStatus;

  // Progression
  progress_percentage: number;
  practice_count: number;
  success_count: number;

  // Timestamps
  unlocked_at?: string;
  started_at?: string;
  completed_at?: string;
  mastered_at?: string;
  last_practiced_at?: string;

  created_at: string;
  updated_at: string;

  // Relations
  skill_node?: SkillNode;
}

/**
 * Journal des déverrouillages de compétences
 */
export interface SkillUnlockLog {
  id: string;
  user_id: string;
  skill_node_id: string;

  // Contexte
  unlock_source?: SkillUnlockSource;
  unlock_context?: Record<string, any>;

  created_at: string;

  // Relations
  skill_node?: SkillNode;
}

/**
 * Arbre de compétences complet avec progression
 */
export interface SkillTree {
  categories: SkillCategory[];
  nodes: SkillNode[];
  user_progress: Record<string, UserSkillProgress>; // Indexé par skill_node_id
}

/**
 * Résultat du déverrouillage d'une compétence
 */
export interface UnlockSkillResult {
  success: boolean;
  skill_node_id?: string;
  error?: string;
  prerequisites_met?: boolean;
  unlocked?: boolean;
}

/**
 * Vérification des prérequis
 */
export interface PrerequisitesCheck {
  can_unlock: boolean;
  missing_prerequisites: SkillNode[];
  level_requirement_met: boolean;
  xp_requirement_met: boolean;
  current_level: number;
  required_level: number;
  current_xp: number;
  required_xp: number;
}

/**
 * Statistiques utilisateur pour les compétences
 */
export interface UserSkillStats {
  user_id: string;

  // Compteurs globaux
  total_skills: number;
  unlocked_skills: number;
  completed_skills: number;
  mastered_skills: number;
  in_progress_skills: number;

  // Par catégorie
  stats_by_category: Record<string, {
    category_name: string;
    total: number;
    unlocked: number;
    completed: number;
    mastered: number;
  }>;

  // Par difficulté
  stats_by_difficulty: Record<SkillDifficulty, {
    total: number;
    completed: number;
  }>;

  // Progression globale
  overall_completion_percentage: number;
  total_practice_count: number;
  total_success_count: number;

  // Timeline
  recent_unlocks: SkillUnlockLog[];
  recently_practiced: UserSkillProgress[];
}

/**
 * Nœud avec métadonnées pour visualisation
 */
export interface SkillTreeNode {
  node: SkillNode;
  progress: UserSkillProgress | null;

  // État calculé
  is_locked: boolean;
  is_available: boolean;
  is_unlocked: boolean;
  is_completed: boolean;
  is_mastered: boolean;

  // Prérequis
  prerequisites_met: boolean;
  missing_prerequisites: string[];

  // Relations pour visualisation
  parent?: SkillTreeNode;
  children: SkillTreeNode[];
  connected_nodes: SkillTreeNode[];
}

/**
 * Configuration de visualisation de l'arbre
 */
export interface SkillTreeVisualizationConfig {
  layout: 'tree' | 'graph' | 'grid';
  show_locked: boolean;
  show_descriptions: boolean;
  highlight_available: boolean;
  group_by_category: boolean;
  zoom_level: number;
  center_node_id?: string;
}

/**
 * Entrée pour déverrouiller une compétence
 */
export interface UnlockSkillInput {
  user_id: string;
  skill_node_id: string;
  unlock_source?: SkillUnlockSource;
}

/**
 * Entrée pour mettre à jour la progression
 */
export interface UpdateSkillProgressInput {
  user_id: string;
  skill_node_id: string;
  status?: SkillProgressStatus;
  progress_percentage?: number;
  increment_practice?: boolean;
  increment_success?: boolean;
}

/**
 * Options du hook useSkillTree
 */
export interface UseSkillTreeOptions {
  autoLoad?: boolean;
  includeUserProgress?: boolean;
  includeLocked?: boolean;
  categoryId?: string;
  realtimeEnabled?: boolean;
}

/**
 * État du hook useSkillTree
 */
export interface SkillTreeState {
  // Données
  skillTree: SkillTree | null;
  categories: SkillCategory[];
  nodes: SkillNode[];
  userProgress: Record<string, UserSkillProgress>;

  // Statistiques
  stats: UserSkillStats | null;

  // Filtrés/calculés
  availableSkills: SkillNode[];
  lockedSkills: SkillNode[];
  completedSkills: SkillNode[];

  // État de chargement
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

/**
 * Actions du hook useSkillTree
 */
export interface SkillTreeActions {
  unlockSkill: (skillNodeId: string, source?: SkillUnlockSource) => Promise<UnlockSkillResult>;
  updateProgress: (input: Omit<UpdateSkillProgressInput, 'user_id'>) => Promise<void>;
  checkPrerequisites: (skillNodeId: string) => Promise<PrerequisitesCheck>;
  getSkillNode: (skillNodeId: string) => SkillNode | undefined;
  getSkillProgress: (skillNodeId: string) => UserSkillProgress | undefined;
  refresh: () => Promise<void>;
}

/**
 * Résultat complet du hook useSkillTree
 */
export interface UseSkillTreeResult extends SkillTreeState, SkillTreeActions {}

/**
 * Événement temps réel pour les compétences
 */
export interface SkillTreeRealtimeEvent {
  type: 'skill_unlocked' | 'skill_progress_updated' | 'skill_completed' | 'skill_mastered';
  user_id: string;
  data: SkillUnlockLog | UserSkillProgress;
  timestamp: string;
}

/**
 * Chemin de progression recommandé
 */
export interface SkillProgressionPath {
  current_node: SkillNode;
  recommended_next: SkillNode[];
  optimal_path: SkillNode[];
  estimated_completion_time: number; // Minutes
  difficulty_curve: 'gentle' | 'moderate' | 'steep';
}

/**
 * Catégories de compétences par défaut
 */
export const DEFAULT_SKILL_CATEGORIES: Readonly<Array<{
  name: string;
  name_fr: string;
  icon_emoji: string;
  color_hex: string;
  description: string;
  display_order: number;
}>> = [
  {
    name: 'Foundations',
    name_fr: 'Fondamentaux',
    icon_emoji: '🎯',
    color_hex: '#3B82F6',
    description: 'Techniques de base du prompt engineering',
    display_order: 1
  },
  {
    name: 'Context Control',
    name_fr: 'Contrôle du Contexte',
    icon_emoji: '📝',
    color_hex: '#10B981',
    description: 'Gestion et optimisation du contexte',
    display_order: 2
  },
  {
    name: 'Output Shaping',
    name_fr: 'Façonnage de Sortie',
    icon_emoji: '🎨',
    color_hex: '#F59E0B',
    description: 'Contrôle du format et style de sortie',
    display_order: 3
  },
  {
    name: 'Advanced Techniques',
    name_fr: 'Techniques Avancées',
    icon_emoji: '⚡',
    color_hex: '#8B5CF6',
    description: 'Techniques avancées et spécialisées',
    display_order: 4
  },
  {
    name: 'Chain of Thought',
    name_fr: 'Chaîne de Pensée',
    icon_emoji: '🧠',
    color_hex: '#EC4899',
    description: 'Raisonnement et réflexion structurés',
    display_order: 5
  },
  {
    name: 'Few-Shot Learning',
    name_fr: 'Apprentissage Few-Shot',
    icon_emoji: '📚',
    color_hex: '#06B6D4',
    description: 'Utilisation d\'exemples pour guider l\'IA',
    display_order: 6
  }
] as const;

/**
 * Helper pour vérifier si une compétence peut être déverrouillée
 */
export function canUnlockSkill(
  skillNode: SkillNode,
  userProgress: Record<string, UserSkillProgress>,
  userLevel: number,
  userXP: number
): boolean {
  // Vérifier le niveau minimum requis
  if (userLevel < skillNode.min_level_required) {
    return false;
  }

  // Vérifier l'XP minimum requis
  if (userXP < skillNode.xp_required) {
    return false;
  }

  // Vérifier les prérequis
  if (skillNode.prerequisites && skillNode.prerequisites.length > 0) {
    for (const prereqId of skillNode.prerequisites) {
      const prereqProgress = userProgress[prereqId];
      if (!prereqProgress || !['completed', 'mastered'].includes(prereqProgress.status)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Helper pour obtenir les compétences disponibles
 */
export function getAvailableSkills(
  nodes: SkillNode[],
  userProgress: Record<string, UserSkillProgress>,
  userLevel: number,
  userXP: number
): SkillNode[] {
  return nodes.filter(node => {
    const progress = userProgress[node.id];

    // Si déjà déverrouillé, pas disponible pour déverrouillage
    if (progress && progress.status !== 'locked') {
      return false;
    }

    // Vérifier si peut être déverrouillé
    return canUnlockSkill(node, userProgress, userLevel, userXP);
  });
}

/**
 * Helper pour calculer les statistiques utilisateur
 */
export function calculateUserSkillStats(
  nodes: SkillNode[],
  userProgress: Record<string, UserSkillProgress>,
  categories: SkillCategory[]
): Partial<UserSkillStats> {
  const stats: Partial<UserSkillStats> = {
    total_skills: nodes.length,
    unlocked_skills: 0,
    completed_skills: 0,
    mastered_skills: 0,
    in_progress_skills: 0,
    total_practice_count: 0,
    total_success_count: 0
  };

  for (const node of nodes) {
    const progress = userProgress[node.id];
    if (progress) {
      stats.total_practice_count! += progress.practice_count;
      stats.total_success_count! += progress.success_count;

      if (progress.status === 'mastered') stats.mastered_skills!++;
      if (progress.status === 'completed') stats.completed_skills!++;
      if (progress.status === 'in_progress') stats.in_progress_skills!++;
      if (['available', 'in_progress', 'completed', 'mastered'].includes(progress.status)) {
        stats.unlocked_skills!++;
      }
    }
  }

  stats.overall_completion_percentage =
    stats.total_skills! > 0
      ? Math.round(((stats.completed_skills! + stats.mastered_skills!) / stats.total_skills!) * 100)
      : 0;

  return stats;
}
