// Service pour charger et gérer les données des modules
import type { MultimediaBlock } from '@/types/multimedia.types';

export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortTitle?: string;
  progress: number;
  color: string;
  totalCapsules: number;
  duration: number;
  difficulty: string;
  sections: Section[];
  capsules: Capsule[];
}

export interface Section {
  id: string;
  title: string;
  capsules: string[];
  duration: number;
  theme?: string;
  description?: string;
}

export interface Capsule {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  duration: number;
  difficulty: string;
  keyTakeaway?: string;
  exerciseType?: string;
  multimedia?: MultimediaBlock[];
  sections?: {
    hook?: any;
    concept?: any;
    demo?: any;
    exercise?: any;
    recap?: any;
  };
  completed?: boolean;
  available?: boolean;
}

// Module-level cache for memoization
const moduleCache = new Map<string, Module[]>();
const individualModuleCache = new Map<string, Module>();
const capsuleCache = new Map<string, Capsule>();
const capsuleContentCache = new Map<string, any>();

// Fonction helper pour obtenir les capsules de chaque fichier JSON
function getCapsules(data: any): any[] {
  // Structure module.capsules (module 1)
  if (data.module?.capsules) {
    return data.module.capsules;
  }
  // Structure capsules directe (modules 2 et 3)
  if (data.capsules) {
    return data.capsules;
  }
  return [];
}

// Dynamic import helper functions for metadata files
async function getModule1Metadata() {
  const data = await import('@/data/modules/module1_metadata_global.json');
  return data.default;
}

async function getModule2Metadata() {
  const data = await import('@/data/modules/module2_metadata_global.json');
  return data.default;
}

async function getModule3Metadata() {
  const data = await import('@/data/modules/module3_metadata_global_final.json');
  return data.default;
}

// Dynamic import helper functions for capsule files
async function getModule1Capsules1_3() {
  const data = await import('@/data/modules/module1_capsules_1_3.json');
  return data.default;
}

async function getModule1Capsules4_7() {
  const data = await import('@/data/modules/module1_capsules_4_7.json');
  return data.default;
}

async function getModule1Capsules8_12() {
  const data = await import('@/data/modules/module1_capsules_8_12.json');
  return data.default;
}

async function getModule2Capsules13_15() {
  const data = await import('@/data/modules/module2_capsules_13_15.json');
  return data.default;
}

async function getModule2Capsules16_18() {
  const data = await import('@/data/modules/module2_capsules_16_18.json');
  return data.default;
}

async function getModule2Capsules19_21() {
  const data = await import('@/data/modules/module2_capsules_19_21.json');
  return data.default;
}

async function getModule2Capsules22_24() {
  const data = await import('@/data/modules/module2_capsules_22_24.json');
  return data.default;
}

async function getModule3Capsules25_27() {
  const data = await import('@/data/modules/module3_capsules_25_27.json');
  return data.default;
}

async function getModule3Capsules28_30() {
  const data = await import('@/data/modules/module3_capsules_28_30.json');
  return data.default;
}

async function getModule3Capsules31_33() {
  const data = await import('@/data/modules/module3_capsules_31_33.json');
  return data.default;
}

async function getModule3Capsules34_36() {
  const data = await import('@/data/modules/module3_capsules_34_36.json');
  return data.default;
}

// Combiner les données des capsules (version asynchrone)
async function getAllCapsules(): Promise<Record<string, any>> {
  const [
    module1Capsules1_3,
    module1Capsules4_7,
    module1Capsules8_12,
    module2Capsules13_15,
    module2Capsules16_18,
    module2Capsules19_21,
    module2Capsules22_24,
    module3Capsules25_27,
    module3Capsules28_30,
    module3Capsules31_33,
    module3Capsules34_36,
  ] = await Promise.all([
    getModule1Capsules1_3(),
    getModule1Capsules4_7(),
    getModule1Capsules8_12(),
    getModule2Capsules13_15(),
    getModule2Capsules16_18(),
    getModule2Capsules19_21(),
    getModule2Capsules22_24(),
    getModule3Capsules25_27(),
    getModule3Capsules28_30(),
    getModule3Capsules31_33(),
    getModule3Capsules34_36(),
  ]);

  return {
    ...getCapsules(module1Capsules1_3).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),
    ...getCapsules(module1Capsules4_7).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),
    ...getCapsules(module1Capsules8_12).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),

    ...getCapsules(module2Capsules13_15).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),
    ...getCapsules(module2Capsules16_18).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),
    ...getCapsules(module2Capsules19_21).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),
    ...getCapsules(module2Capsules22_24).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),

    ...getCapsules(module3Capsules25_27).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),
    ...getCapsules(module3Capsules28_30).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),
    ...getCapsules(module3Capsules31_33).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),
    ...getCapsules(module3Capsules34_36).reduce((acc: any, cap: any) => ({ ...acc, [cap.id]: cap }), {}),
  };
}

// Configuration des modules avec mapping des slugs (version asynchrone)
async function getModulesConfig() {
  const [module1Metadata, module2Metadata, module3Metadata] = await Promise.all([
    getModule1Metadata(),
    getModule2Metadata(),
    getModule3Metadata(),
  ]);

  return [
    {
      metadata: module1Metadata,
      slug: 'fondamentaux',
      color: 'from-blue-500 to-cyan-600',
      progress: 0, // Sera calculé dynamiquement
    },
    {
      metadata: module2Metadata,
      slug: 'techniques',
      color: 'from-purple-500 to-pink-600',
      progress: 0, // Sera calculé dynamiquement
    },
    {
      metadata: module3Metadata,
      slug: 'pratique',
      color: 'from-violet-500 to-purple-700',
      progress: 0, // Sera calculé dynamiquement
    }
  ];
}

// Transformer les métadonnées en format unifié
function transformModule(config: any, index: number, allCapsules: Record<string, any>): Module {
  const metadata = config.metadata;

  // Pour module 1, utiliser la structure standard
  if (metadata.module?.metadata) {
    return {
      id: metadata.module.id,
      slug: config.slug,
      title: metadata.module.metadata.title,
      shortTitle: metadata.module.metadata.shortTitle,
      description: metadata.module.metadata.description,
      progress: config.progress,
      color: config.color,
      totalCapsules: metadata.module.structure.totalCapsules,
      duration: metadata.module.metadata.estimatedDuration,
      difficulty: metadata.module.metadata.difficulty,
      sections: metadata.module.structure.sections.map((section: any) => ({
        id: section.id,
        title: section.title,
        capsules: section.capsules,
        duration: section.duration,
        theme: section.theme,
      })),
      capsules: metadata.module.capsulesSummary.map((cap: any) => {
        const fullCapsule = allCapsules[cap.id];
        return {
          id: cap.id,
          moduleId: metadata.module.id,
          order: cap.order,
          title: cap.title,
          duration: fullCapsule?.duration || 5,
          difficulty: cap.difficulty,
          keyTakeaway: cap.keyTakeaway,
          exerciseType: cap.exerciseType,
          multimedia: fullCapsule?.multimedia,
          sections: fullCapsule?.sections,
          completed: false, // Sera calculé dynamiquement
          available: true, // Sera calculé dynamiquement
        };
      }),
    };
  }

  // Pour modules 2 et 3, utiliser la structure alternative
  if (metadata.module?.title) {
    const sections = metadata.sections || metadata.module?.sections || [];
    const capsules = metadata.capsules || metadata.module?.capsules_summary || [];

    return {
      id: metadata.module.id,
      slug: config.slug,
      title: metadata.module.title,
      shortTitle: metadata.module.title.split(' - ')[0],
      description: metadata.module.description,
      progress: config.progress,
      color: config.color,
      totalCapsules: metadata.module.totalCapsules || capsules.length,
      duration: metadata.module.totalDuration || metadata.module.duration,
      difficulty: metadata.module.difficulty,
      sections: sections.map((section: any) => ({
        id: section.id,
        title: section.title,
        capsules: section.capsules,
        duration: section.duration,
        description: section.description,
      })),
      capsules: capsules.map((cap: any) => {
        const fullCapsule = allCapsules[cap.id];
        return {
          id: cap.id,
          moduleId: metadata.module.id,
          order: cap.order,
          title: cap.title,
          duration: fullCapsule?.duration || 5,
          difficulty: cap.difficulty,
          keyTakeaway: cap.keyTakeaway,
          exerciseType: cap.exerciseType,
          multimedia: fullCapsule?.multimedia,
          sections: fullCapsule?.sections,
          completed: false, // Sera calculé dynamiquement
          available: true, // Sera calculé dynamiquement
        };
      }),
    };
  }

  // Fallback pour toute autre structure
  return {
    id: `module-${index + 1}`,
    slug: config.slug,
    title: config.slug.charAt(0).toUpperCase() + config.slug.slice(1),
    description: `Module ${index + 1}`,
    progress: config.progress,
    color: config.color,
    totalCapsules: 12,
    duration: 60,
    difficulty: 'beginner',
    sections: [],
    capsules: [],
  };
}

// Charger tous les modules (version asynchrone avec dynamic imports)
export async function getAllModules(): Promise<Module[]> {
  // Check cache first
  if (moduleCache.has('all-modules')) {
    return moduleCache.get('all-modules')!;
  }

  // Load data if not cached
  const modulesConfig = await getModulesConfig();
  const allCapsules = await getAllCapsules();

  const modules = modulesConfig.map((config, index) => transformModule(config, index, allCapsules));

  // Store in cache
  moduleCache.set('all-modules', modules);

  return modules;
}

// Charger tous les modules avec progression réelle (version asynchrone)
export async function getAllModulesWithProgress(userId: string): Promise<Module[]> {
  const modulesConfig = await getModulesConfig();
  const allCapsules = await getAllCapsules();
  const modules = [];

  for (let i = 0; i < modulesConfig.length; i++) {
    const config = modulesConfig[i];
    const metadata = config.metadata;

    // Calculer la progression réelle
    let realProgress = 0;
    let capsuleProgress: Record<string, { completed: boolean; available: boolean }> = {};

    if (metadata.module?.id) {
      realProgress = await getModuleProgress(metadata.module.id, userId);

      // Récupérer le statut de chaque capsule
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Créer le module temporaire pour obtenir les capsules
        const tempModule = transformModule({ ...config, progress: 0 }, i, allCapsules);
        const capsuleIds = tempModule.capsules.map(cap => cap.id);

        if (capsuleIds.length > 0) {
          // Récupérer la progression de l'utilisateur pour ces capsules
          const { data: progress } = await supabase
            .from('user_progress')
            .select('capsule_id, status')
            .eq('user_id', userId)
            .in('capsule_id', capsuleIds);

          // Créer un mapping des statuts
          capsuleProgress = {};
          capsuleIds.forEach((capsuleId: string) => {
            const userProgress = progress?.find((p: any) => p.capsule_id === capsuleId);
            capsuleProgress[capsuleId] = {
              completed: userProgress?.status === 'completed' || false,
              available: true // Pour l'instant, toutes les capsules sont disponibles
            };
          });
        }
      } catch (error) {
        console.error('Erreur récupération progression capsules:', error);
      }
    }

    // Créer le module avec la vraie progression
    const module = transformModule({ ...config, progress: realProgress }, i, allCapsules);

    // Mettre à jour le statut des capsules
    module.capsules = module.capsules.map(cap => ({
      ...cap,
      completed: capsuleProgress[cap.id]?.completed || false,
      available: capsuleProgress[cap.id]?.available !== false
    }));

    modules.push(module);
  }

  return modules;
}

// Charger un module spécifique par slug
export async function getModuleBySlug(slug: string): Promise<Module | null> {
  // Check individual module cache first
  if (individualModuleCache.has(slug)) {
    return individualModuleCache.get(slug)!;
  }

  const modules = await getAllModules();
  const module = modules.find(module => module.slug === slug) || null;

  // Store in individual module cache
  if (module) {
    individualModuleCache.set(slug, module);
  }

  return module;
}

// Charger une capsule spécifique
export async function getCapsuleById(capsuleId: string): Promise<Capsule | null> {
  // Check capsule cache first
  if (capsuleCache.has(capsuleId)) {
    return capsuleCache.get(capsuleId)!;
  }

  const modules = await getAllModules();

  for (const module of modules) {
    const capsule = module.capsules.find(cap => cap.id === capsuleId);
    if (capsule) {
      // Store in capsule cache
      capsuleCache.set(capsuleId, capsule);
      return capsule;
    }
  }

  return null;
}

// Charger le contenu complet d'une capsule
export async function getCapsuleContent(capsuleId: string): Promise<any | null> {
  // Check capsule content cache first
  if (capsuleContentCache.has(capsuleId)) {
    return capsuleContentCache.get(capsuleId)!;
  }

  const allCapsules = await getAllCapsules();
  const content = allCapsules[capsuleId] || null;

  // Store in capsule content cache
  if (content) {
    capsuleContentCache.set(capsuleId, content);
  }

  return content;
}

// Obtenir la capsule suivante
export async function getNextCapsule(currentCapsuleId: string): Promise<Capsule | null> {
  const modules = await getAllModules();

  for (const module of modules) {
    const currentIndex = module.capsules.findIndex(cap => cap.id === currentCapsuleId);
    if (currentIndex !== -1) {
      // Capsule suivante dans le même module
      if (currentIndex + 1 < module.capsules.length) {
        return module.capsules[currentIndex + 1];
      }

      // Première capsule du module suivant
      const moduleIndex = modules.findIndex(m => m.id === module.id);
      if (moduleIndex !== -1 && moduleIndex + 1 < modules.length) {
        const nextModule = modules[moduleIndex + 1];
        return nextModule.capsules[0] || null;
      }
    }
  }

  return null;
}

// Obtenir la capsule précédente
export async function getPreviousCapsule(currentCapsuleId: string): Promise<Capsule | null> {
  const modules = await getAllModules();

  for (const module of modules) {
    const currentIndex = module.capsules.findIndex(cap => cap.id === currentCapsuleId);
    if (currentIndex !== -1) {
      // Capsule précédente dans le même module
      if (currentIndex > 0) {
        return module.capsules[currentIndex - 1];
      }

      // Dernière capsule du module précédent
      const moduleIndex = modules.findIndex(m => m.id === module.id);
      if (moduleIndex > 0) {
        const previousModule = modules[moduleIndex - 1];
        return previousModule.capsules[previousModule.capsules.length - 1] || null;
      }
    }
  }

  return null;
}

// Calculer la progression réelle d'un module basée sur user_progress
export async function getModuleProgress(moduleId: string, userId: string): Promise<number> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    // Trouver le module dans la configuration JSON
    const modulesConfig = await getModulesConfig();
    const allCapsules = await getAllCapsules();
    const moduleConfig = modulesConfig.find(config => config.metadata.module?.id === moduleId);
    if (!moduleConfig) return 0;

    // Créer le module temporaire pour obtenir les capsules
    const tempModule = transformModule({ ...moduleConfig, progress: 0 }, 0, allCapsules);
    const capsuleIds = tempModule.capsules.map(cap => cap.id);

    if (capsuleIds.length === 0) return 0;

    // Récupérer la progression de l'utilisateur pour ces capsules
    const { data: progress } = await supabase
      .from('user_progress')
      .select('capsule_id, status')
      .eq('user_id', userId)
      .in('capsule_id', capsuleIds);

    if (!progress) return 0;

    // Compter les capsules complétées
    const completedCount = progress.filter((p: any) => p.status === 'completed').length;
    const totalCount = capsuleIds.length;

    return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  } catch (error) {
    console.error('Erreur calcul progression module:', error);
    return 0;
  }
}

// Calculer les statistiques de progression globale
export async function getProgressStats(): Promise<{
  totalCapsules: number;
  completedCapsules: number;
  progressPercentage: number;
}> {
  const modules = await getAllModules();
  let totalCapsules = 0;
  let completedCapsules = 0;

  modules.forEach(module => {
    totalCapsules += module.capsules.length;
    completedCapsules += module.capsules.filter(cap => cap.completed).length;
  });

  return {
    totalCapsules,
    completedCapsules,
    progressPercentage: totalCapsules > 0 ? Math.round((completedCapsules / totalCapsules) * 100) : 0,
  };
}
