'use client';

import React, { useMemo } from 'react';
import { StreakStats } from '@/types/analytics.types';
import { Flame, Calendar, Trophy, TrendingUp } from 'lucide-react';

interface StreakCalendarProps {
  streak: StreakStats;
}

export default function StreakCalendar({ streak }: StreakCalendarProps) {
  // Generate calendar grid for the last 12 weeks (84 days)
  const calendarData = useMemo(() => {
    const weeks: Array<Array<{ date: string; activity: number; hasActivity: boolean }>> = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 83); // 12 weeks back

    // Create a map of daily activities for quick lookup
    const activityMap = new Map(
      streak.daily_activities?.map(day => [day.date, day]) || []
    );

    let currentWeek: Array<{ date: string; activity: number; hasActivity: boolean }> = [];

    // Start from the beginning of the week containing startDate
    const firstDay = new Date(startDate);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());

    for (let i = 0; i < 84; i++) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayActivity = activityMap.get(dateStr);
      const activity = dayActivity?.capsules_completed || 0;
      const hasActivity = dayActivity?.has_activity || false;

      currentWeek.push({
        date: dateStr,
        activity,
        hasActivity
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [streak.daily_activities]);

  // Get activity level color
  const getActivityColor = (activity: number, hasActivity: boolean) => {
    if (!hasActivity) return 'bg-muted';
    if (activity === 0) return 'bg-muted';
    if (activity === 1) return 'bg-green-200';
    if (activity === 2) return 'bg-green-300';
    if (activity >= 3) return 'bg-green-500';
    return 'bg-green-400';
  };

  // Calculate streak health
  const streakHealth = useMemo(() => {
    if (streak.current_streak === 0) return { level: 'start', message: 'Start your streak today!' };
    if (streak.current_streak < 3) return { level: 'warming', message: 'Building momentum!' };
    if (streak.current_streak < 7) return { level: 'good', message: 'Great consistency!' };
    if (streak.current_streak < 14) return { level: 'strong', message: 'Impressive streak!' };
    if (streak.current_streak < 30) return { level: 'excellent', message: 'Outstanding dedication!' };
    return { level: 'legendary', message: 'Legendary streak! 🔥' };
  }, [streak.current_streak]);

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            Learning Streak Calendar
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your daily learning activity over the past 12 weeks
          </p>
        </div>
      </div>

      {/* Streak Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Current Streak */}
        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold text-foreground">
              {streak.current_streak}
              <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{streakHealth.message}</p>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <p className="text-2xl font-bold text-foreground">
              {streak.longest_streak}
              <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Personal best</p>
          </div>
        </div>

        {/* Total Active Days */}
        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Active Days</p>
            <p className="text-2xl font-bold text-foreground">
              {streak.total_active_days}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {streak.last_activity_date
                ? `Last active: ${new Date(streak.last_activity_date).toLocaleDateString()}`
                : 'No activity yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="bg-muted rounded-lg p-4">
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            <div className="h-3"></div>
            {dayLabels.map((day, idx) => (
              <div
                key={day + idx}
                className="h-3 flex items-center justify-center text-xs text-muted-foreground font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-1">
              {calendarData.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {/* Month label (show on first day of month) */}
                  <div className="h-3 text-xs text-muted-foreground font-medium">
                    {weekIdx === 0 || new Date(week[0].date).getDate() <= 7
                      ? new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' })
                      : ''}
                  </div>

                  {week.map((day, dayIdx) => {
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    const isFuture = new Date(day.date) > new Date();

                    return (
                      <div
                        key={day.date}
                        className={`
                          w-3 h-3 rounded-sm transition-all cursor-pointer
                          ${isFuture ? 'bg-muted' : getActivityColor(day.activity, day.hasActivity)}
                          ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                          hover:ring-2 hover:ring-gray-400 hover:scale-125
                        `}
                        title={`${day.date}: ${day.activity} capsules completed`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-muted rounded-sm" title="No activity"></div>
            <div className="w-3 h-3 bg-green-200 rounded-sm" title="1 capsule"></div>
            <div className="w-3 h-3 bg-green-300 rounded-sm" title="2 capsules"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm" title="3 capsules"></div>
            <div className="w-3 h-3 bg-green-500 rounded-sm" title="4+ capsules"></div>
          </div>
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>

      {/* Empty State */}
      {(!streak.daily_activities || streak.daily_activities.length === 0) && (
        <div className="text-center py-8 mt-6 border-t border-border">
          <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No activity data yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start learning to build your streak!
          </p>
        </div>
      )}

      {/* Motivational Message */}
      {streak.current_streak > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {streak.current_streak >= streak.longest_streak
                  ? "🎉 You're at your all-time best streak!"
                  : `You're ${streak.longest_streak - streak.current_streak} days away from your record!`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Keep the momentum going by completing a capsule today.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
