/**
 * Types for student learning analytics dashboard
 */

/**
 * Overall progress statistics across all modules
 */
export interface ProgressOverviewStats {
  total_modules: number;
  completed_modules: number;
  in_progress_modules: number;
  total_capsules: number;
  completed_capsules: number;
  in_progress_capsules: number;
  overall_completion_percentage: number;
  total_exercises_attempted: number;
  total_exercises_completed: number;
  average_exercise_score: number | null;
}

/**
 * Skill competency level for radar chart
 */
export interface SkillCompetency {
  skill_name: string;
  skill_category: string;
  competency_level: number; // 0-100
  capsules_completed: number;
  total_capsules: number;
  average_score: number | null;
}

/**
 * Score data point for trend chart
 */
export interface ScoreTrendPoint {
  date: string; // ISO date string
  capsule_id: string;
  capsule_title: string;
  module_title: string;
  score: number;
  exercise_attempts: number;
  time_spent_seconds: number;
}

/**
 * Daily activity for streak calendar
 */
export interface DailyActivity {
  date: string; // YYYY-MM-DD format
  capsules_completed: number;
  exercises_completed: number;
  time_spent_seconds: number;
  score_average: number | null;
  has_activity: boolean;
}

/**
 * Streak statistics
 */
export interface StreakStats {
  current_streak: number; // consecutive days
  longest_streak: number;
  total_active_days: number;
  last_activity_date: string | null;
  daily_activities: DailyActivity[];
}

/**
 * Badge definition
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'completion' | 'performance' | 'streak' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: Record<string, any>;
  points: number;
}

/**
 * Badge progress for user
 */
export interface BadgeProgress {
  badge: Badge;
  earned: boolean;
  earned_at: string | null;
  progress: number; // 0-100
  current_value: number;
  target_value: number;
}

/**
 * Time analytics statistics
 */
export interface TimeAnalytics {
  total_time_seconds: number;
  total_sessions: number;
  average_session_duration_seconds: number;
  longest_session_seconds: number;
  time_by_module: Array<{
    module_id: string;
    module_title: string;
    time_spent_seconds: number;
    percentage: number;
  }>;
  time_by_day_of_week: Array<{
    day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
    time_spent_seconds: number;
  }>;
  time_trend: Array<{
    date: string;
    time_spent_seconds: number;
  }>;
}

/**
 * Recommended next step for student
 */
export interface NextStepRecommendation {
  capsule_id: string;
  capsule_title: string;
  module_id: string;
  module_title: string;
  reason: 'prerequisite' | 'skill_gap' | 'continuation' | 'challenge';
  priority: 'high' | 'medium' | 'low';
  estimated_duration_minutes: number;
  skill_focus: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

/**
 * Complete student analytics data
 */
export interface StudentAnalytics {
  user_id: string;
  generated_at: string;

  // Progress overview
  progress: ProgressOverviewStats;

  // Skills analysis
  skills: SkillCompetency[];

  // Performance trends
  score_trend: ScoreTrendPoint[];

  // Engagement tracking
  streak: StreakStats;

  // Gamification
  badges: BadgeProgress[];
  total_points: number;
  level: number;
  level_progress: number; // 0-100 to next level

  // Time analysis
  time_analytics: TimeAnalytics;

  // Personalized recommendations
  next_steps: NextStepRecommendation[];

  // Metadata
  last_activity_at: string | null;
  account_age_days: number;
}

/**
 * Analytics filter options
 */
export interface AnalyticsFilters {
  date_range: '7d' | '30d' | '90d' | 'all';
  module_ids?: string[];
  skill_categories?: string[];
  include_in_progress?: boolean;
}

/**
 * Analytics API response
 */
export interface AnalyticsResponse {
  success: boolean;
  data: StudentAnalytics | null;
  error?: string;
  cached?: boolean;
  cache_expires_at?: string;
}

/**
 * Analytics loading state
 */
export interface AnalyticsState {
  data: StudentAnalytics | null;
  loading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  last_updated: string | null;
}

/**
 * Module completion summary for analytics
 */
export interface ModuleCompletionSummary {
  module_id: string;
  module_title: string;
  total_capsules: number;
  completed_capsules: number;
  in_progress_capsules: number;
  completion_percentage: number;
  average_score: number | null;
  time_spent_seconds: number;
  last_activity_at: string | null;
}

/**
 * Peer comparison data (optional feature)
 */
export interface PeerComparison {
  percentile: number; // 0-100, user's position among peers
  completion_vs_average: number; // percentage difference from average
  score_vs_average: number; // percentage difference from average
  streak_vs_average: number; // percentage difference from average
  cohort_size: number;
}

/**
 * Learning insights generated from analytics
 */
export interface LearningInsight {
  id: string;
  type: 'strength' | 'opportunity' | 'achievement' | 'suggestion';
  title: string;
  description: string;
  data?: Record<string, any>;
  action_url?: string;
  action_label?: string;
  priority: number;
}

/**
 * Export data format options
 */
export type AnalyticsExportFormat = 'json' | 'csv' | 'pdf';

/**
 * Analytics dashboard preferences
 */
export interface AnalyticsDashboardPreferences {
  user_id: string;
  default_date_range: '7d' | '30d' | '90d' | 'all';
  visible_sections: {
    progress_overview: boolean;
    skill_radar: boolean;
    score_trend: boolean;
    streak_calendar: boolean;
    badges: boolean;
    time_analytics: boolean;
    next_steps: boolean;
    peer_comparison: boolean;
  };
  chart_preferences: {
    theme: 'light' | 'dark' | 'auto';
    animation_enabled: boolean;
  };
  updated_at: string;
}
