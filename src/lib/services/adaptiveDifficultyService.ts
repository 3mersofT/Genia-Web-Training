import { createClient } from '@/lib/supabase/server';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface UserPerformanceProfile {
  userId: string;
  currentLevel: DifficultyLevel;
  difficultyScore: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0
  recentScores: number[];
  averageScore: number;
  successRate: number;
  exercisesCompleted: number;
  streakDays: number;
  retentionRate: number; // from SM-2
  weaknessAreas: string[];
  strengthAreas: string[];
  recommendedFocus: string[];
  shouldLevelUp: boolean;
  shouldLevelDown: boolean;
  progressionMessage?: string;
}

const LEVEL_ORDER: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

function levelIndex(level: DifficultyLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

export class AdaptiveDifficultyService {
  /**
   * Calculates the full user performance profile by aggregating all data sources
   */
  static async getUserPerformanceProfile(userId: string): Promise<UserPerformanceProfile> {
    const supabase = await createClient();

    // Parallel queries for speed (< 200ms target)
    const [progressResult, insightsResult, cardsResult] = await Promise.all([
      supabase
        .from('user_progress_genia')
        .select('current_level, exercises_completed, exercises_succeeded, average_score, streak_days, genia_stats')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('genia_learning_insights')
        .select('optimal_difficulty_level, weakness_areas, strength_areas, recommended_focus, improvement_velocity, average_success_rate')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('spaced_repetition_cards')
        .select('easiness_factor, correct_reviews, total_reviews, average_quality')
        .eq('user_id', userId),
    ]);

    const progress = progressResult.data;
    const insights = insightsResult.data;
    const cards = cardsResult.data || [];

    // Calculate retention rate from SM-2 cards
    const totalReviews = cards.reduce((sum: number, c: any) => sum + (c.total_reviews || 0), 0);
    const correctReviews = cards.reduce((sum: number, c: any) => sum + (c.correct_reviews || 0), 0);
    const retentionRate = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;

    // Extract recent scores from genia_stats if available
    const geniaStats = progress?.genia_stats as any;
    const recentScores: number[] = geniaStats?.recent_scores || [];

    const exercisesCompleted = progress?.exercises_completed || 0;
    const exercisesSucceeded = progress?.exercises_succeeded || 0;
    const successRate = exercisesCompleted > 0
      ? (exercisesSucceeded / exercisesCompleted) * 100
      : 0;
    const averageScore = progress?.average_score || 0;
    const currentLevel = (progress?.current_level as DifficultyLevel) || 'beginner';
    const streakDays = progress?.streak_days || 0;

    const weaknessAreas: string[] = Array.isArray(insights?.weakness_areas)
      ? insights.weakness_areas
      : (insights?.weakness_areas as any)?.areas || [];
    const strengthAreas: string[] = Array.isArray(insights?.strength_areas)
      ? insights.strength_areas
      : (insights?.strength_areas as any)?.areas || [];
    const recommendedFocus: string[] = insights?.recommended_focus || [];

    // Calculate improvement velocity weight
    const velocity = (insights?.improvement_velocity as any)?.score || 0;

    // Composite difficulty score (0.0 - 1.0)
    const scoreWeight = 0.40;
    const successWeight = 0.25;
    const retentionWeight = 0.20;
    const velocityWeight = 0.15;

    const normalizedScore = Math.min(averageScore / 100, 1);
    const normalizedSuccess = Math.min(successRate / 100, 1);
    const normalizedRetention = Math.min(retentionRate / 100, 1);
    const normalizedVelocity = Math.min(Math.max(velocity, 0), 1);

    const difficultyScore =
      normalizedScore * scoreWeight +
      normalizedSuccess * successWeight +
      normalizedRetention * retentionWeight +
      normalizedVelocity * velocityWeight;

    // Confidence based on data quantity
    const confidence = Math.min(exercisesCompleted / 10, 1);

    // Calculate level change recommendations
    const optimalResult = AdaptiveDifficultyService.calculateOptimalDifficulty({
      userId,
      currentLevel,
      difficultyScore,
      confidence,
      recentScores,
      averageScore,
      successRate,
      exercisesCompleted,
      streakDays,
      retentionRate,
      weaknessAreas,
      strengthAreas,
      recommendedFocus,
      shouldLevelUp: false,
      shouldLevelDown: false,
    });

    return {
      userId,
      currentLevel: optimalResult.changed ? optimalResult.level : currentLevel,
      difficultyScore,
      confidence,
      recentScores,
      averageScore,
      successRate,
      exercisesCompleted,
      streakDays,
      retentionRate,
      weaknessAreas,
      strengthAreas,
      recommendedFocus,
      shouldLevelUp: optimalResult.direction === 'up',
      shouldLevelDown: optimalResult.direction === 'down',
      progressionMessage: optimalResult.message,
    };
  }

  /**
   * Determines optimal difficulty level based on weighted criteria
   *
   * Progression rules:
   * - beginner -> intermediate: 5+ exercises, avg score > 75, success rate > 70%
   * - intermediate -> advanced: 15+ exercises, avg score > 80, success rate > 75%, retention > 60%
   * - advanced -> expert: 30+ exercises, avg score > 85, success rate > 80%, retention > 70%
   *
   * Regression rules:
   * - Last 3 scores < 50: drop one level
   * - Success rate < 40% on last 5 exercises: drop one level
   * - NEVER drop more than one level at a time
   */
  static calculateOptimalDifficulty(profile: UserPerformanceProfile): {
    level: DifficultyLevel;
    score: number;
    changed: boolean;
    direction: 'up' | 'down' | 'stable';
    message: string;
  } {
    const { currentLevel, averageScore, successRate, exercisesCompleted, retentionRate, recentScores } = profile;
    const currentIdx = levelIndex(currentLevel);

    // Check regression first
    const last3 = recentScores.slice(-3);
    const last5 = recentScores.slice(-5);

    if (last3.length >= 3 && last3.every(s => s < 50)) {
      if (currentIdx > 0) {
        const newLevel = LEVEL_ORDER[currentIdx - 1];
        return {
          level: newLevel,
          score: profile.difficultyScore,
          changed: true,
          direction: 'down',
          message: `On ajuste la difficulté pour mieux consolider vos bases. Vous passez au niveau ${newLevel}.`,
        };
      }
    }

    if (last5.length >= 5) {
      const last5Success = last5.filter(s => s >= 50).length / last5.length;
      if (last5Success < 0.4 && currentIdx > 0) {
        const newLevel = LEVEL_ORDER[currentIdx - 1];
        return {
          level: newLevel,
          score: profile.difficultyScore,
          changed: true,
          direction: 'down',
          message: `On ralentit un peu pour consolider vos acquis. Niveau ajusté à ${newLevel}.`,
        };
      }
    }

    // Check progression
    if (currentLevel === 'beginner' && exercisesCompleted >= 5 && averageScore > 75 && successRate > 70) {
      return {
        level: 'intermediate',
        score: profile.difficultyScore,
        changed: true,
        direction: 'up',
        message: 'Vous progressez rapidement ! Passage au niveau intermédiaire.',
      };
    }

    if (currentLevel === 'intermediate' && exercisesCompleted >= 15 && averageScore > 80 && successRate > 75 && retentionRate > 60) {
      return {
        level: 'advanced',
        score: profile.difficultyScore,
        changed: true,
        direction: 'up',
        message: 'Excellent travail ! Vous passez au niveau avancé.',
      };
    }

    if (currentLevel === 'advanced' && exercisesCompleted >= 30 && averageScore > 85 && successRate > 80 && retentionRate > 70) {
      return {
        level: 'expert',
        score: profile.difficultyScore,
        changed: true,
        direction: 'up',
        message: 'Impressionnant ! Bienvenue au niveau expert.',
      };
    }

    return {
      level: currentLevel,
      score: profile.difficultyScore,
      changed: false,
      direction: 'stable',
      message: `Niveau actuel : ${currentLevel}. Continuez ainsi !`,
    };
  }

  /**
   * Updates user level in the database
   */
  static async updateUserLevel(userId: string, newLevel: DifficultyLevel): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('user_progress_genia')
      .upsert(
        {
          user_id: userId,
          current_level: newLevel,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
  }

  /**
   * Generates prompt modifiers adapted to the user's level
   */
  static getDifficultyPromptModifiers(level: DifficultyLevel, profile: UserPerformanceProfile): string {
    const weaknesses = profile.weaknessAreas.length > 0
      ? `\nPoints faibles identifiés : ${profile.weaknessAreas.join(', ')}.`
      : '';
    const strengths = profile.strengthAreas.length > 0
      ? `\nPoints forts : ${profile.strengthAreas.join(', ')}.`
      : '';
    const focus = profile.recommendedFocus.length > 0
      ? `\nFocus recommandé : ${profile.recommendedFocus.join(', ')}.`
      : '';

    const modifiers: Record<DifficultyLevel, string> = {
      beginner: `NIVEAU ADAPTATIF : DÉBUTANT (score: ${Math.round(profile.difficultyScore * 100)}%)
- Utilise un vocabulaire simple et accessible
- Explique chaque concept étape par étape
- Donne beaucoup d'exemples concrets du quotidien
- Encourage constamment, célèbre chaque progrès
- Propose des exercices guidés avec indices
- Limite la complexité : 1-2 concepts à la fois${weaknesses}${strengths}${focus}`,

      intermediate: `NIVEAU ADAPTATIF : INTERMÉDIAIRE (score: ${Math.round(profile.difficultyScore * 100)}%)
- Utilise le vocabulaire technique avec des explications quand nécessaire
- Propose des défis modérés qui poussent à réfléchir
- Compare avec des cas réels professionnels
- Encourage l'autonomie dans la résolution de problèmes
- Exercices avec aide contextuelle mais moins d'indices
- Combine 2-3 concepts par exercice${weaknesses}${strengths}${focus}`,

      advanced: `NIVEAU ADAPTATIF : AVANCÉ (score: ${Math.round(profile.difficultyScore * 100)}%)
- Vocabulaire technique complet sans simplification
- Défis complexes multi-étapes
- Cas d'usage avancés et scénarios professionnels
- Peu d'indices, encourage la réflexion autonome
- Exercices intégrant 3-4 concepts simultanément
- Feedback détaillé et exigeant${weaknesses}${strengths}${focus}`,

      expert: `NIVEAU ADAPTATIF : EXPERT (score: ${Math.round(profile.difficultyScore * 100)}%)
- Niveau expert, discussions approfondies
- Défis de niveau production/professionnel
- Scénarios edge-case et optimisation avancée
- Pas d'indices, évaluation stricte
- Exercices intégrant tout le spectre des compétences
- Feedback critique et orienté best practices${weaknesses}${strengths}${focus}`,
    };

    return modifiers[level];
  }

  /**
   * Generates exercise parameters adapted to level
   */
  static getExerciseParameters(level: DifficultyLevel, profile: UserPerformanceProfile): {
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    maxSteps: number;
    hintsAvailable: number;
    timeEstimateMinutes: number;
    focusAreas: string[];
  } {
    const focusAreas = profile.recommendedFocus.length > 0
      ? profile.recommendedFocus
      : profile.weaknessAreas.length > 0
        ? profile.weaknessAreas
        : ['Prompt Engineering'];

    const params: Record<DifficultyLevel, {
      complexity: 'simple' | 'moderate' | 'complex' | 'expert';
      maxSteps: number;
      hintsAvailable: number;
      timeEstimateMinutes: number;
    }> = {
      beginner: { complexity: 'simple', maxSteps: 3, hintsAvailable: 3, timeEstimateMinutes: 5 },
      intermediate: { complexity: 'moderate', maxSteps: 5, hintsAvailable: 2, timeEstimateMinutes: 10 },
      advanced: { complexity: 'complex', maxSteps: 7, hintsAvailable: 1, timeEstimateMinutes: 15 },
      expert: { complexity: 'expert', maxSteps: 10, hintsAvailable: 0, timeEstimateMinutes: 20 },
    };

    return { ...params[level], focusAreas };
  }
}
