import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limiter';

const rateLimiter = createRateLimiter({
  interval: 60000,
  limit: 20,
});

export async function GET(req: NextRequest) {
  const { response: rateLimitResponse } = await rateLimiter(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'overview': {
        // Nombre total d'étudiants
        const { count: totalStudents } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');

        // Étudiants actifs (7 derniers jours)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: activeData } = await supabase
          .from('user_progress')
          .select('user_id')
          .gte('updated_at', weekAgo.toISOString());

        const activeStudents = new Set(activeData?.map((d: any) => d.user_id) || []).size;

        // Progression
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('status, exercise_score, time_spent_seconds');

        const completions = progressData?.filter((p: any) => p.status === 'completed') || [];
        const total = progressData?.length || 0;

        const avgScore = completions.length > 0
          ? Math.round(completions.reduce((s: number, p: any) => s + (p.exercise_score || 0), 0) / completions.length)
          : 0;

        const avgTime = completions.length > 0
          ? Math.round(completions.reduce((s: number, p: any) => s + (p.time_spent_seconds || 0), 0) / completions.length)
          : 0;

        return NextResponse.json({
          overview: {
            totalStudents: totalStudents || 0,
            activeStudents,
            averageCompletion: total > 0 ? Math.round((completions.length / total) * 100) : 0,
            averageScore: avgScore,
            totalCapsuleCompletions: completions.length,
            averageTimePerCapsule: avgTime
          }
        });
      }

      case 'bottlenecks': {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('capsule_id, status, exercise_score, exercise_attempts, time_spent_seconds');

        if (!progressData || progressData.length === 0) {
          return NextResponse.json({ bottlenecks: [] });
        }

        const capsuleStats = new Map<string, {
          attempts: number;
          completions: number;
          scores: number[];
          times: number[];
        }>();

        for (const p of progressData) {
          const stats = capsuleStats.get(p.capsule_id) || {
            attempts: 0, completions: 0, scores: [], times: []
          };
          stats.attempts++;
          if (p.status === 'completed') stats.completions++;
          if (p.exercise_score != null) stats.scores.push(p.exercise_score);
          if (p.time_spent_seconds) stats.times.push(p.time_spent_seconds);
          capsuleStats.set(p.capsule_id, stats);
        }

        const bottlenecks = Array.from(capsuleStats.entries())
          .filter(([, s]) => s.attempts >= 2)
          .map(([capsuleId, s]) => ({
            capsuleId,
            dropOffRate: Math.round((1 - s.completions / s.attempts) * 100),
            averageScore: s.scores.length > 0
              ? Math.round(s.scores.reduce((sum, v) => sum + v, 0) / s.scores.length)
              : 0,
            averageTime: s.times.length > 0
              ? Math.round(s.times.reduce((sum, v) => sum + v, 0) / s.times.length)
              : 0,
            totalAttempts: s.attempts,
            completions: s.completions
          }))
          .sort((a, b) => b.dropOffRate - a.dropOffRate);

        return NextResponse.json({ bottlenecks });
      }

      case 'retention': {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('user_id, created_at')
          .order('created_at', { ascending: true });

        if (!progressData || progressData.length === 0) {
          return NextResponse.json({ retention: [] });
        }

        const userFirstActivity = new Map<string, Date>();
        for (const p of progressData) {
          if (!userFirstActivity.has(p.user_id)) {
            userFirstActivity.set(p.user_id, new Date(p.created_at));
          }
        }

        const totalUsers = userFirstActivity.size;
        const weeks = parseInt(searchParams.get('weeks') || '8');
        const retention = [];

        for (let week = 0; week < weeks; week++) {
          const weekStart = week * 7;
          const weekEnd = (week + 1) * 7;
          let activeInWeek = 0;

          for (const [userId, firstDate] of userFirstActivity) {
            const hasActivity = progressData.some((p: any) => {
              if (p.user_id !== userId) return false;
              const days = Math.floor(
                (new Date(p.created_at).getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              return days >= weekStart && days < weekEnd;
            });
            if (hasActivity) activeInWeek++;
          }

          retention.push({
            week: week + 1,
            weekLabel: `S${week + 1}`,
            totalUsers,
            activeUsers: activeInWeek,
            retentionRate: totalUsers > 0 ? Math.round((activeInWeek / totalUsers) * 100) : 0
          });
        }

        return NextResponse.json({ retention });
      }

      case 'heatmap': {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('created_at, updated_at');

        if (!progressData) {
          return NextResponse.json({ heatmap: [] });
        }

        const heatmap = new Map<string, number>();
        for (const p of progressData) {
          const date = new Date(p.updated_at || p.created_at);
          const key = `${date.getDay()}-${date.getHours()}`;
          heatmap.set(key, (heatmap.get(key) || 0) + 1);
        }

        const result = [];
        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            result.push({
              day,
              hour,
              count: heatmap.get(`${day}-${hour}`) || 0
            });
          }
        }

        return NextResponse.json({ heatmap: result });
      }

      default:
        return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }
  } catch (error) {
    console.error('GET /api/admin/analytics/cohort error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
