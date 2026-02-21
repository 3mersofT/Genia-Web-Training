import { createClient } from '@/lib/supabase/client';
import type {
  StudentAnalytics,
  ProgressOverviewStats,
  SkillCompetency,
  ScoreTrendPoint,
  StreakStats,
  DailyActivity,
  BadgeProgress,
  Badge,
  TimeAnalytics,
  NextStepRecommendation,
  ModuleCompletionSummary,
  AnalyticsFilters
} from '@/types/analytics.types';

/**
 * Service de gestion des analytics d'apprentissage étudiant
 */
class AnalyticsService {
  private supabase = createClient();

  /**
   * Récupère les analytics complètes d'un étudiant
   */
  async getStudentAnalytics(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<StudentAnalytics | null> {
    try {
      const [
        progress,
        skills,
        scoreTrend,
        streak,
        badges,
        pointsData,
        timeAnalytics,
        nextSteps,
        accountInfo
      ] = await Promise.all([
        this.getProgressOverview(userId, filters),
        this.getSkillCompetencies(userId, filters),
        this.getScoreTrend(userId, filters),
        this.getStreakStats(userId, filters),
        this.getBadgeProgress(userId),
        this.getUserPoints(userId),
        this.getTimeAnalytics(userId, filters),
        this.getNextStepRecommendations(userId),
        this.getAccountInfo(userId)
      ]);

      return {
        user_id: userId,
        generated_at: new Date().toISOString(),
        progress,
        skills,
        score_trend: scoreTrend,
        streak,
        badges,
        total_points: pointsData.total_points,
        level: pointsData.level,
        level_progress: pointsData.level_progress,
        time_analytics: timeAnalytics,
        next_steps: nextSteps,
        last_activity_at: accountInfo.last_activity_at,
        account_age_days: accountInfo.account_age_days
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics:', error);
      return null;
    }
  }

  /**
   * Récupère les statistiques de progression globale
   */
  async getProgressOverview(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<ProgressOverviewStats> {
    try {
      // Récupérer tous les modules publiés
      const { data: modules, error: modulesError } = await this.supabase
        .from('modules')
        .select('id')
        .eq('is_published', true);

      if (modulesError) throw modulesError;

      const totalModules = modules?.length || 0;

      // Récupérer toutes les capsules publiées
      const { data: capsules, error: capsulesError } = await this.supabase
        .from('capsules')
        .select('id, module_id')
        .eq('is_published', true);

      if (capsulesError) throw capsulesError;

      const totalCapsules = capsules?.length || 0;

      // Récupérer la progression de l'utilisateur
      let progressQuery = this.supabase
        .from('user_progress')
        .select('capsule_id, status, exercise_score, exercise_attempts, completed_at')
        .eq('user_id', userId);

      // Appliquer les filtres de date si nécessaire
      if (filters?.date_range && filters.date_range !== 'all') {
        const dateLimit = this.getDateLimit(filters.date_range);
        progressQuery = progressQuery.gte('updated_at', dateLimit);
      }

      const { data: progressData, error: progressError } = await progressQuery;

      if (progressError) throw progressError;

      const completedCapsules = progressData?.filter((p: any) => p.status === 'completed').length || 0;
      const inProgressCapsules = progressData?.filter((p: any) => p.status === 'in_progress').length || 0;

      // Calculer les modules complétés et en cours
      const capsulesByModule = capsules?.reduce((acc: Record<string, string[]>, capsule: any) => {
        if (!acc[capsule.module_id]) {
          acc[capsule.module_id] = [];
        }
        acc[capsule.module_id].push(capsule.id);
        return acc;
      }, {} as Record<string, string[]>) || {};

      let completedModules = 0;
      let inProgressModules = 0;

      Object.entries(capsulesByModule).forEach(([moduleId, capsuleIds]) => {
        const moduleCapsules = progressData?.filter((p: any) => (capsuleIds as string[]).includes(p.capsule_id)) || [];
        const moduleCompleted = moduleCapsules.filter((p: any) => p.status === 'completed').length;
        const moduleInProgress = moduleCapsules.filter((p: any) => p.status === 'in_progress').length;

        if (moduleCompleted === (capsuleIds as string[]).length) {
          completedModules++;
        } else if (moduleCompleted > 0 || moduleInProgress > 0) {
          inProgressModules++;
        }
      });

      // Calculer les statistiques d'exercices
      const exercisesWithScores = progressData?.filter((p: any) => p.exercise_score !== null) || [];
      const totalExercisesAttempted = progressData?.reduce((sum: number, p: any) => sum + p.exercise_attempts, 0) || 0;
      const totalExercisesCompleted = exercisesWithScores.length;
      const averageScore = exercisesWithScores.length > 0
        ? exercisesWithScores.reduce((sum: number, p: any) => sum + (p.exercise_score || 0), 0) / exercisesWithScores.length
        : null;

      const overallCompletionPercentage = totalCapsules > 0
        ? (completedCapsules / totalCapsules) * 100
        : 0;

      return {
        total_modules: totalModules,
        completed_modules: completedModules,
        in_progress_modules: inProgressModules,
        total_capsules: totalCapsules,
        completed_capsules: completedCapsules,
        in_progress_capsules: inProgressCapsules,
        overall_completion_percentage: Math.round(overallCompletionPercentage * 10) / 10,
        total_exercises_attempted: totalExercisesAttempted,
        total_exercises_completed: totalExercisesCompleted,
        average_exercise_score: averageScore !== null ? Math.round(averageScore * 10) / 10 : null
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la progression:', error);
      return this.getEmptyProgressOverview();
    }
  }

  /**
   * Récupère les compétences par skill
   */
  async getSkillCompetencies(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<SkillCompetency[]> {
    try {
      // Récupérer les capsules avec leurs métadonnées de skills
      const { data: capsules, error: capsulesError } = await this.supabase
        .from('capsules')
        .select('id, title, content, module_id')
        .eq('is_published', true);

      if (capsulesError) throw capsulesError;

      // Récupérer la progression de l'utilisateur
      const { data: progressData, error: progressError } = await this.supabase
        .from('user_progress')
        .select('capsule_id, status, exercise_score')
        .eq('user_id', userId);

      if (progressError) throw progressError;

      // Extraire les skills des capsules et calculer les compétences
      const skillMap = new Map<string, {
        category: string;
        capsules: string[];
        completed: string[];
        scores: number[];
      }>();

      capsules?.forEach((capsule: any) => {
        // Extraire les skills du contenu de la capsule
        const content = capsule.content as any;
        const skills = this.extractSkillsFromContent(content);

        skills.forEach(skill => {
          if (!skillMap.has(skill.name)) {
            skillMap.set(skill.name, {
              category: skill.category,
              capsules: [],
              completed: [],
              scores: []
            });
          }
          const skillData = skillMap.get(skill.name)!;
          skillData.capsules.push(capsule.id);

          const progress = progressData?.find((p: any) => p.capsule_id === capsule.id);
          if (progress?.status === 'completed') {
            skillData.completed.push(capsule.id);
            if (progress.exercise_score !== null) {
              skillData.scores.push(progress.exercise_score);
            }
          }
        });
      });

      // Convertir en tableau de compétences
      const competencies: SkillCompetency[] = [];
      skillMap.forEach((data, skillName) => {
        const completionRate = data.capsules.length > 0
          ? (data.completed.length / data.capsules.length) * 100
          : 0;
        const averageScore = data.scores.length > 0
          ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
          : null;

        // Le niveau de compétence est une combinaison du taux de complétion et du score moyen
        let competencyLevel = completionRate * 0.5;
        if (averageScore !== null) {
          competencyLevel += averageScore * 0.5;
        }

        competencies.push({
          skill_name: skillName,
          skill_category: data.category,
          competency_level: Math.round(competencyLevel * 10) / 10,
          capsules_completed: data.completed.length,
          total_capsules: data.capsules.length,
          average_score: averageScore !== null ? Math.round(averageScore * 10) / 10 : null
        });
      });

      return competencies.sort((a, b) => b.competency_level - a.competency_level);
    } catch (error) {
      console.error('Erreur lors de la récupération des compétences:', error);
      return [];
    }
  }

  /**
   * Récupère les tendances de score
   */
  async getScoreTrend(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<ScoreTrendPoint[]> {
    try {
      let progressQuery = this.supabase
        .from('user_progress')
        .select(`
          capsule_id,
          completed_at,
          exercise_score,
          exercise_attempts,
          time_spent_seconds,
          capsules (
            title,
            module_id,
            modules (
              title
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('exercise_score', 'is', null)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true });

      // Appliquer les filtres de date
      if (filters?.date_range && filters.date_range !== 'all') {
        const dateLimit = this.getDateLimit(filters.date_range);
        progressQuery = progressQuery.gte('completed_at', dateLimit);
      }

      const { data, error } = await progressQuery;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        date: item.completed_at,
        capsule_id: item.capsule_id,
        capsule_title: item.capsules?.title || 'Unknown',
        module_title: item.capsules?.modules?.title || 'Unknown',
        score: item.exercise_score,
        exercise_attempts: item.exercise_attempts,
        time_spent_seconds: item.time_spent_seconds
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances de score:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques de streak
   */
  async getStreakStats(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<StreakStats> {
    try {
      // Récupérer toutes les activités de l'utilisateur
      const { data: progressData, error } = await this.supabase
        .from('user_progress')
        .select('completed_at, exercise_score, time_spent_seconds, status')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true });

      if (error) throw error;

      if (!progressData || progressData.length === 0) {
        return this.getEmptyStreakStats();
      }

      // Grouper les activités par jour
      const dailyActivitiesMap = new Map<string, DailyActivity>();

      (progressData as any[]).forEach((item: any) => {
        const date = item.completed_at.split('T')[0];

        if (!dailyActivitiesMap.has(date)) {
          dailyActivitiesMap.set(date, {
            date,
            capsules_completed: 0,
            exercises_completed: 0,
            time_spent_seconds: 0,
            score_average: null,
            has_activity: true
          });
        }

        const activity = dailyActivitiesMap.get(date)!;
        if (item.status === 'completed') {
          activity.capsules_completed++;
        }
        if (item.exercise_score !== null) {
          activity.exercises_completed++;
        }
        activity.time_spent_seconds += item.time_spent_seconds || 0;
      });

      // Calculer les moyennes de scores par jour
      dailyActivitiesMap.forEach((activity, date) => {
        const dayScores = progressData
          .filter((item: any) =>
            item.completed_at.split('T')[0] === date &&
            item.exercise_score !== null
          )
          .map((item: any) => item.exercise_score);

        if (dayScores.length > 0) {
          const avg = dayScores.reduce((sum: number, score: number) => sum + score, 0) / dayScores.length;
          activity.score_average = Math.round(avg * 10) / 10;
        }
      });

      const dailyActivities = Array.from(dailyActivitiesMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      // Calculer le streak actuel
      const today = new Date().toISOString().split('T')[0];
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      dailyActivities.forEach(activity => {
        const activityDate = new Date(activity.date);

        if (!lastDate) {
          tempStreak = 1;
        } else {
          const daysDiff = Math.floor((activityDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }

        lastDate = activityDate;

        // Vérifier si le streak est toujours actuel
        if (activity.date === today ||
            (lastDate && Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) === 0)) {
          currentStreak = tempStreak;
        }
      });

      longestStreak = Math.max(longestStreak, tempStreak);
      const lastActivity = dailyActivities[dailyActivities.length - 1];

      // Limiter les activités quotidiennes selon le filtre de date
      let filteredDailyActivities = dailyActivities;
      if (filters?.date_range && filters.date_range !== 'all') {
        const dateLimit = this.getDateLimit(filters.date_range);
        filteredDailyActivities = dailyActivities.filter(a => a.date >= dateLimit.split('T')[0]);
      }

      return {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        total_active_days: dailyActivities.length,
        last_activity_date: lastActivity.date,
        daily_activities: filteredDailyActivities
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des streaks:', error);
      return this.getEmptyStreakStats();
    }
  }

  /**
   * Récupère la progression des badges
   */
  async getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
    try {
      // Pour l'instant, retourner des badges mockés car la table n'existe pas encore
      const badges = this.getMockBadges();

      // Récupérer les données utilisateur pour calculer la progression
      const { data: progressData } = await this.supabase
        .from('user_progress')
        .select('status, exercise_score, completed_at')
        .eq('user_id', userId);

      const completedCount = progressData?.filter((p: any) => p.status === 'completed').length || 0;
      const perfectScores = progressData?.filter((p: any) => p.exercise_score === 100).length || 0;

      return badges.map(badge => {
        let progress = 0;
        let currentValue = 0;
        let targetValue = 100;
        let earned = false;

        // Calculer la progression selon le type de badge
        switch (badge.id) {
          case 'first-capsule':
            currentValue = completedCount > 0 ? 1 : 0;
            targetValue = 1;
            progress = currentValue >= targetValue ? 100 : 0;
            earned = currentValue >= targetValue;
            break;
          case 'ten-capsules':
            currentValue = completedCount;
            targetValue = 10;
            progress = Math.min((currentValue / targetValue) * 100, 100);
            earned = currentValue >= targetValue;
            break;
          case 'perfect-score':
            currentValue = perfectScores;
            targetValue = 1;
            progress = currentValue >= targetValue ? 100 : 0;
            earned = currentValue >= targetValue;
            break;
          case 'week-streak':
            // À implémenter avec les vraies données de streak
            currentValue = 0;
            targetValue = 7;
            progress = 0;
            earned = false;
            break;
        }

        return {
          badge,
          earned,
          earned_at: earned ? new Date().toISOString() : null,
          progress: Math.round(progress * 10) / 10,
          current_value: currentValue,
          target_value: targetValue
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des badges:', error);
      return [];
    }
  }

  /**
   * Récupère les analytics de temps
   */
  async getTimeAnalytics(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<TimeAnalytics> {
    try {
      let progressQuery = this.supabase
        .from('user_progress')
        .select(`
          time_spent_seconds,
          started_at,
          completed_at,
          capsule_id,
          capsules (
            module_id,
            modules (
              title
            )
          )
        `)
        .eq('user_id', userId)
        .gt('time_spent_seconds', 0);

      if (filters?.date_range && filters.date_range !== 'all') {
        const dateLimit = this.getDateLimit(filters.date_range);
        progressQuery = progressQuery.gte('updated_at', dateLimit);
      }

      const { data, error } = await progressQuery;

      if (error) throw error;

      const totalTime = data?.reduce((sum: number, item: any) => sum + item.time_spent_seconds, 0) || 0;
      const totalSessions = data?.length || 0;
      const averageSessionDuration = totalSessions > 0 ? totalTime / totalSessions : 0;
      const longestSession = data?.reduce((max: number, item: any) =>
        Math.max(max, item.time_spent_seconds), 0
      ) || 0;

      // Grouper par module
      const timeByModuleMap = new Map<string, { title: string; time: number }>();
      data?.forEach((item: any) => {
        const moduleId = item.capsules?.module_id;
        const moduleTitle = item.capsules?.modules?.title || 'Unknown';

        if (moduleId) {
          if (!timeByModuleMap.has(moduleId)) {
            timeByModuleMap.set(moduleId, { title: moduleTitle, time: 0 });
          }
          timeByModuleMap.get(moduleId)!.time += item.time_spent_seconds;
        }
      });

      const timeByModule = Array.from(timeByModuleMap.entries()).map(([moduleId, data]) => ({
        module_id: moduleId,
        module_title: data.title,
        time_spent_seconds: data.time,
        percentage: totalTime > 0 ? (data.time / totalTime) * 100 : 0
      })).sort((a, b) => b.time_spent_seconds - a.time_spent_seconds);

      // Grouper par jour de la semaine
      const timeByDayOfWeek = Array.from({ length: 7 }, (_, i) => ({
        day: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        time_spent_seconds: 0
      }));

      data?.forEach((item: any) => {
        if (item.completed_at) {
          const dayOfWeek = new Date(item.completed_at).getDay();
          timeByDayOfWeek[dayOfWeek].time_spent_seconds += item.time_spent_seconds;
        }
      });

      // Tendance temporelle par jour
      const timeTrendMap = new Map<string, number>();
      data?.forEach((item: any) => {
        if (item.completed_at) {
          const date = item.completed_at.split('T')[0];
          timeTrendMap.set(date, (timeTrendMap.get(date) || 0) + item.time_spent_seconds);
        }
      });

      const timeTrend = Array.from(timeTrendMap.entries())
        .map(([date, time]) => ({ date, time_spent_seconds: time }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total_time_seconds: totalTime,
        total_sessions: totalSessions,
        average_session_duration_seconds: Math.round(averageSessionDuration),
        longest_session_seconds: longestSession,
        time_by_module: timeByModule,
        time_by_day_of_week: timeByDayOfWeek,
        time_trend: timeTrend
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics de temps:', error);
      return this.getEmptyTimeAnalytics();
    }
  }

  /**
   * Récupère les recommandations de prochaines étapes
   */
  async getNextStepRecommendations(userId: string): Promise<NextStepRecommendation[]> {
    try {
      // Récupérer toutes les capsules
      const { data: allCapsules, error: capsulesError } = await this.supabase
        .from('capsules')
        .select(`
          id,
          title,
          duration_minutes,
          prerequisites,
          module_id,
          content,
          modules (
            title
          )
        `)
        .eq('is_published', true);

      if (capsulesError) throw capsulesError;

      // Récupérer la progression de l'utilisateur
      const { data: progressData, error: progressError } = await this.supabase
        .from('user_progress')
        .select('capsule_id, status, exercise_score')
        .eq('user_id', userId);

      if (progressError) throw progressError;

      const completedCapsuleIds = new Set(
        progressData?.filter((p: any) => p.status === 'completed').map((p: any) => p.capsule_id) || []
      );
      const inProgressCapsuleIds = new Set(
        progressData?.filter((p: any) => p.status === 'in_progress').map((p: any) => p.capsule_id) || []
      );

      const recommendations: NextStepRecommendation[] = [];

      // Trouver les capsules disponibles
      allCapsules?.forEach((capsule: any) => {
        // Ignorer les capsules déjà complétées
        if (completedCapsuleIds.has(capsule.id)) return;

        // Vérifier les prérequis
        const prerequisites = capsule.prerequisites || [];
        const prerequisitesMet = prerequisites.every((prereq: string) =>
          completedCapsuleIds.has(prereq)
        );

        if (!prerequisitesMet && prerequisites.length > 0) return;

        // Déterminer la raison et la priorité
        let reason: NextStepRecommendation['reason'] = 'continuation';
        let priority: NextStepRecommendation['priority'] = 'medium';

        if (inProgressCapsuleIds.has(capsule.id)) {
          reason = 'continuation';
          priority = 'high';
        } else if (prerequisites.length > 0) {
          reason = 'prerequisite';
          priority = 'high';
        }

        // Extraire les skills
        const content = capsule.content as any;
        const skills = this.extractSkillsFromContent(content);
        const skillFocus = skills.map(s => s.name);

        // Déterminer la difficulté (à améliorer avec de vraies données)
        const difficulty = this.estimateDifficulty(capsule);

        recommendations.push({
          capsule_id: capsule.id,
          capsule_title: capsule.title,
          module_id: capsule.module_id,
          module_title: capsule.modules?.title || 'Unknown',
          reason,
          priority,
          estimated_duration_minutes: capsule.duration_minutes || 30,
          skill_focus: skillFocus,
          difficulty_level: difficulty
        });
      });

      // Trier par priorité et limiter à 5 recommandations
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return recommendations
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, 5);
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      return [];
    }
  }

  /**
   * Récupère les points et le niveau de l'utilisateur
   */
  private async getUserPoints(userId: string): Promise<{
    total_points: number;
    level: number;
    level_progress: number;
  }> {
    try {
      // Calculer les points basés sur la progression
      const { data: progressData } = await this.supabase
        .from('user_progress')
        .select('status, exercise_score')
        .eq('user_id', userId);

      const completedCount = progressData?.filter((p: any) => p.status === 'completed').length || 0;
      const scoreSum = progressData?.reduce((sum: number, p: any) => sum + (p.exercise_score || 0), 0) || 0;

      const totalPoints = (completedCount * 100) + scoreSum;
      const level = Math.floor(totalPoints / 1000) + 1;
      const pointsInLevel = totalPoints % 1000;
      const levelProgress = (pointsInLevel / 1000) * 100;

      return {
        total_points: totalPoints,
        level,
        level_progress: Math.round(levelProgress * 10) / 10
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des points:', error);
      return { total_points: 0, level: 1, level_progress: 0 };
    }
  }

  /**
   * Récupère les informations de compte
   */
  private async getAccountInfo(userId: string): Promise<{
    last_activity_at: string | null;
    account_age_days: number;
  }> {
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

      const { data: lastProgress } = await this.supabase
        .from('user_progress')
        .select('updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
      const accountAgeDays = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        last_activity_at: lastProgress?.updated_at || null,
        account_age_days: accountAgeDays
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos de compte:', error);
      return { last_activity_at: null, account_age_days: 0 };
    }
  }

  /**
   * Utilitaires privés
   */

  private getDateLimit(range: '7d' | '30d' | '90d' | 'all'): string {
    const now = new Date();
    switch (range) {
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
      case '90d':
        now.setDate(now.getDate() - 90);
        break;
      default:
        return new Date(0).toISOString();
    }
    return now.toISOString();
  }

  private extractSkillsFromContent(content: any): Array<{ name: string; category: string }> {
    // Extraire les skills du contenu de la capsule
    // Pour l'instant, retourner des skills par défaut
    const defaultSkills = [
      { name: 'Prompt Engineering', category: 'Core' },
      { name: 'Context Setting', category: 'Core' },
      { name: 'Output Formatting', category: 'Advanced' }
    ];

    // TODO: Implémenter l'extraction réelle depuis le contenu
    if (content?.metadata?.skills) {
      return content.metadata.skills;
    }

    return defaultSkills;
  }

  private estimateDifficulty(capsule: any): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    // Estimer la difficulté basée sur les métadonnées
    // Pour l'instant, retourner une valeur par défaut
    if (capsule.content?.metadata?.difficulty) {
      return capsule.content.metadata.difficulty;
    }
    return 'intermediate';
  }

  private getMockBadges(): Badge[] {
    return [
      {
        id: 'first-capsule',
        name: 'Premier Pas',
        description: 'Complétez votre première capsule',
        icon: '🎯',
        category: 'completion',
        rarity: 'common',
        criteria: { capsules_completed: 1 },
        points: 100
      },
      {
        id: 'ten-capsules',
        name: 'Explorateur',
        description: 'Complétez 10 capsules',
        icon: '🗺️',
        category: 'completion',
        rarity: 'rare',
        criteria: { capsules_completed: 10 },
        points: 500
      },
      {
        id: 'perfect-score',
        name: 'Perfectionniste',
        description: 'Obtenez un score parfait',
        icon: '⭐',
        category: 'performance',
        rarity: 'epic',
        criteria: { perfect_scores: 1 },
        points: 250
      },
      {
        id: 'week-streak',
        name: 'Assidu',
        description: 'Maintenez un streak de 7 jours',
        icon: '🔥',
        category: 'streak',
        rarity: 'rare',
        criteria: { streak_days: 7 },
        points: 300
      }
    ];
  }

  private getEmptyProgressOverview(): ProgressOverviewStats {
    return {
      total_modules: 0,
      completed_modules: 0,
      in_progress_modules: 0,
      total_capsules: 0,
      completed_capsules: 0,
      in_progress_capsules: 0,
      overall_completion_percentage: 0,
      total_exercises_attempted: 0,
      total_exercises_completed: 0,
      average_exercise_score: null
    };
  }

  private getEmptyStreakStats(): StreakStats {
    return {
      current_streak: 0,
      longest_streak: 0,
      total_active_days: 0,
      last_activity_date: null,
      daily_activities: []
    };
  }

  private getEmptyTimeAnalytics(): TimeAnalytics {
    return {
      total_time_seconds: 0,
      total_sessions: 0,
      average_session_duration_seconds: 0,
      longest_session_seconds: 0,
      time_by_module: [],
      time_by_day_of_week: Array.from({ length: 7 }, (_, i) => ({
        day: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        time_spent_seconds: 0
      })),
      time_trend: []
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
