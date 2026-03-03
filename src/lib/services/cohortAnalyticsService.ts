// Service d'analytics de cohorte pour l'administration
// Fournit des analyses avancées : bottlenecks, rétention, heatmaps

import { createClient } from '@/lib/supabase/client';

export interface CohortOverviewData {
  totalStudents: number;
  activeStudents: number;
  averageCompletion: number;
  averageScore: number;
  totalCapsuleCompletions: number;
  averageTimePerCapsule: number;
}

export interface BottleneckData {
  capsuleId: string;
  capsuleTitle: string;
  moduleTitle: string;
  dropOffRate: number;
  averageScore: number;
  averageAttempts: number;
  averageTime: number;
  totalAttempts: number;
  completions: number;
}

export interface RetentionData {
  week: number;
  weekLabel: string;
  totalUsers: number;
  activeUsers: number;
  retentionRate: number;
}

export interface ActivityHeatmapData {
  day: number; // 0=dimanche, 6=samedi
  hour: number; // 0-23
  count: number;
}

export interface CohortComparisonData {
  cohortId: string;
  label: string;
  averageCompletion: number;
  averageScore: number;
  activeRate: number;
  studentCount: number;
}

class CohortAnalyticsService {
  private supabase = createClient();

  /**
   * Vue d'ensemble de la cohorte
   */
  async getCohortOverview(): Promise<CohortOverviewData> {
    try {
      // Nombre total d'étudiants
      const { count: totalStudents } = await this.supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Étudiants actifs (activité dans les 7 derniers jours)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: activeData } = await this.supabase
        .from('user_progress')
        .select('user_id')
        .gte('updated_at', weekAgo.toISOString());

      const activeStudents = new Set(activeData?.map((d: any) => d.user_id) || []).size;

      // Progression moyenne
      const { data: progressData } = await this.supabase
        .from('user_progress')
        .select('status, exercise_score, time_spent_seconds');

      const completions = progressData?.filter((p: any) => p.status === 'completed') || [];
      const totalAttempts = progressData?.length || 0;
      const avgScore = completions.length > 0
        ? completions.reduce((s: number, p: any) => s + (p.exercise_score || 0), 0) / completions.length
        : 0;
      const avgTime = completions.length > 0
        ? completions.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0) / completions.length
        : 0;

      return {
        totalStudents: totalStudents || 0,
        activeStudents,
        averageCompletion: totalAttempts > 0
          ? Math.round((completions.length / totalAttempts) * 100)
          : 0,
        averageScore: Math.round(avgScore),
        totalCapsuleCompletions: completions.length,
        averageTimePerCapsule: Math.round(avgTime)
      };
    } catch (error) {
      console.error('Erreur getCohortOverview:', error);
      return {
        totalStudents: 0,
        activeStudents: 0,
        averageCompletion: 0,
        averageScore: 0,
        totalCapsuleCompletions: 0,
        averageTimePerCapsule: 0
      };
    }
  }

  /**
   * Analyse des bottlenecks (capsules problématiques)
   */
  async getBottleneckAnalysis(): Promise<BottleneckData[]> {
    try {
      const { data: progressData } = await this.supabase
        .from('user_progress')
        .select('capsule_id, status, exercise_score, exercise_attempts, time_spent_seconds');

      if (!progressData || progressData.length === 0) return [];

      // Grouper par capsule
      const capsuleStats = new Map<string, {
        attempts: number;
        completions: number;
        scores: number[];
        times: number[];
        totalAttempts: number[];
      }>();

      for (const p of progressData) {
        const stats = capsuleStats.get(p.capsule_id) || {
          attempts: 0,
          completions: 0,
          scores: [],
          times: [],
          totalAttempts: []
        };

        stats.attempts++;
        if (p.status === 'completed') stats.completions++;
        if (p.exercise_score != null) stats.scores.push(p.exercise_score);
        if (p.time_spent_seconds) stats.times.push(p.time_spent_seconds);
        if (p.exercise_attempts) stats.totalAttempts.push(p.exercise_attempts);

        capsuleStats.set(p.capsule_id, stats);
      }

      const bottlenecks: BottleneckData[] = [];

      for (const [capsuleId, stats] of capsuleStats) {
        const dropOffRate = stats.attempts > 0
          ? Math.round((1 - stats.completions / stats.attempts) * 100)
          : 0;

        const avgScore = stats.scores.length > 0
          ? stats.scores.reduce((s, v) => s + v, 0) / stats.scores.length
          : 0;

        const avgTime = stats.times.length > 0
          ? stats.times.reduce((s, v) => s + v, 0) / stats.times.length
          : 0;

        const avgAttempts = stats.totalAttempts.length > 0
          ? stats.totalAttempts.reduce((s, v) => s + v, 0) / stats.totalAttempts.length
          : 1;

        bottlenecks.push({
          capsuleId,
          capsuleTitle: capsuleId, // Will be enriched by the component
          moduleTitle: '',
          dropOffRate,
          averageScore: Math.round(avgScore),
          averageAttempts: Math.round(avgAttempts * 10) / 10,
          averageTime: Math.round(avgTime),
          totalAttempts: stats.attempts,
          completions: stats.completions
        });
      }

      // Trier par drop-off rate décroissant
      return bottlenecks
        .filter(b => b.totalAttempts >= 2) // Au moins 2 tentatives
        .sort((a, b) => b.dropOffRate - a.dropOffRate);
    } catch (error) {
      console.error('Erreur getBottleneckAnalysis:', error);
      return [];
    }
  }

  /**
   * Analyse de rétention par semaine
   */
  async getRetentionAnalysis(weeks: number = 8): Promise<RetentionData[]> {
    try {
      const { data: progressData } = await this.supabase
        .from('user_progress')
        .select('user_id, created_at')
        .order('created_at', { ascending: true });

      if (!progressData || progressData.length === 0) return [];

      // Trouver la date de première activité pour chaque utilisateur
      const userFirstActivity = new Map<string, Date>();
      for (const p of progressData) {
        if (!userFirstActivity.has(p.user_id)) {
          userFirstActivity.set(p.user_id, new Date(p.created_at));
        }
      }

      const totalUsers = userFirstActivity.size;
      const retentionData: RetentionData[] = [];

      for (let week = 0; week < weeks; week++) {
        const weekStart = week * 7;
        const weekEnd = (week + 1) * 7;
        let activeInWeek = 0;

        for (const [userId, firstDate] of userFirstActivity) {
          const hasActivityInWeek = progressData.some((p: any) => {
            if (p.user_id !== userId) return false;
            const activityDate = new Date(p.created_at);
            const daysSinceFirst = Math.floor(
              (activityDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysSinceFirst >= weekStart && daysSinceFirst < weekEnd;
          });

          if (hasActivityInWeek) activeInWeek++;
        }

        retentionData.push({
          week: week + 1,
          weekLabel: `S${week + 1}`,
          totalUsers,
          activeUsers: activeInWeek,
          retentionRate: totalUsers > 0
            ? Math.round((activeInWeek / totalUsers) * 100)
            : 0
        });
      }

      return retentionData;
    } catch (error) {
      console.error('Erreur getRetentionAnalysis:', error);
      return [];
    }
  }

  /**
   * Heatmap d'activité (jour x heure)
   */
  async getActivityHeatmap(): Promise<ActivityHeatmapData[]> {
    try {
      const { data: progressData } = await this.supabase
        .from('user_progress')
        .select('created_at, updated_at');

      if (!progressData || progressData.length === 0) return [];

      // Compter les activités par jour/heure
      const heatmap = new Map<string, number>();

      for (const p of progressData) {
        const date = new Date(p.updated_at || p.created_at);
        const key = `${date.getDay()}-${date.getHours()}`;
        heatmap.set(key, (heatmap.get(key) || 0) + 1);
      }

      const result: ActivityHeatmapData[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          result.push({
            day,
            hour,
            count: heatmap.get(`${day}-${hour}`) || 0
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Erreur getActivityHeatmap:', error);
      return [];
    }
  }
}

// Instance singleton
export const cohortAnalyticsService = new CohortAnalyticsService();
