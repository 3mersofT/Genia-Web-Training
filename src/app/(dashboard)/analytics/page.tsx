'use client'

// Désactiver le prerendering pour éviter l'erreur Supabase sur Vercel
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { analyticsService } from '@/lib/services/analyticsService'
import { useSeasonalLeaderboard } from '@/hooks/useSeasonalLeaderboard'
import type { StudentAnalytics } from '@/types/analytics.types'
import { BarChart3, RefreshCw, TrendingUp, Trophy, Brain } from 'lucide-react'

// Import all analytics components
import ProgressOverview from '@/components/analytics/ProgressOverview'
import SkillRadarChart from '@/components/analytics/SkillRadarChart'
import ScoreTrendChart from '@/components/analytics/ScoreTrendChart'
import StreakCalendar from '@/components/analytics/StreakCalendar'
import BadgeShowcase from '@/components/analytics/BadgeShowcase'
import TimeAnalytics from '@/components/analytics/TimeAnalytics'
import NextStepsRecommendations from '@/components/analytics/NextStepsRecommendations'
import SeasonalLeaderboard from '@/components/gamification/SeasonalLeaderboard'
import SocialShareButton from '@/components/gamification/SocialShareButton'

type TabType = 'performance' | 'seasonal'

export default function AnalyticsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('performance')

  // Use seasonal leaderboard hook
  const {
    currentSeason,
    leaderboard,
    userSeasonStats,
    historicalSeasons,
    isLoading: seasonalLoading,
    switchSeasonType,
    switchSeason,
    refresh: refreshSeasonal
  } = useSeasonalLeaderboard({
    autoLoad: true,
    seasonType: 'monthly',
    includeHistoricalSeasons: true
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Load analytics data
  const loadAnalytics = async () => {
    if (!user) {
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      setError(null)
      const data = await analyticsService.getStudentAnalytics(user.id)
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user])

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    if (activeTab === 'seasonal') {
      await refreshSeasonal()
    }
    setRefreshing(false)
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Error state
  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">
              Prompt Engineering Academy
            </h1>
            <button
              onClick={signOut}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-2">Unable to Load Analytics</h3>
            <p className="text-red-800 mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            Prompt Engineering Academy
          </h1>
          <button
            onClick={signOut}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  Learning Analytics Dashboard
                </h2>
                <p className="text-muted-foreground mt-1">
                  Track your progress and performance
                </p>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-1 inline-flex">
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'performance'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Performance Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('seasonal')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'seasonal'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>Seasonal Leaderboard</span>
            </button>
          </div>
        </div>

        {/* Performance Tab Content */}
        {activeTab === 'performance' && (
          <>
            {loading ? (
              <div className="space-y-6">
                {/* Loading skeletons */}
                <div className="bg-card rounded-xl p-6 shadow-sm animate-pulse">
                  <div className="h-8 bg-muted rounded w-48 mb-6" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-muted rounded-xl p-6 h-32" />
                    ))}
                  </div>
                </div>

                {/* Chart skeletons */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SkillRadarChart skills={[]} loading={true} />
                  <ScoreTrendChart scoreTrend={[]} loading={true} />
                </div>
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Progress Overview */}
                <ProgressOverview stats={analytics.progress} />

                {/* Two-column grid for charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Skill Radar Chart */}
                  <SkillRadarChart skills={analytics.skills} loading={refreshing} />

                  {/* Score Trend Chart */}
                  <ScoreTrendChart scoreTrend={analytics.score_trend} loading={refreshing} />
                </div>

                {/* Streak Calendar */}
                <StreakCalendar streak={analytics.streak} />

                {/* Two-column grid for badges and time */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Badge Showcase */}
                  <BadgeShowcase badges={analytics.badges} />

                  {/* Time Analytics */}
                  <TimeAnalytics timeAnalytics={analytics.time_analytics} />
                </div>

                {/* Next Steps Recommendations */}
                <NextStepsRecommendations recommendations={analytics.next_steps} />

                {/* Spaced Repetition Link */}
                <div className="bg-gradient-to-r from-purple-50 dark:from-purple-950/30 to-blue-50 dark:to-blue-950/30 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-bold text-foreground">Révisions espacées</h3>
                        <p className="text-sm text-muted-foreground">Consolidez vos acquis avec l'algorithme SM-2</p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/review')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Accéder
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* Seasonal Leaderboard Tab Content */}
        {activeTab === 'seasonal' && (
          <div className="space-y-6">
            {/* Social Share Section */}
            {userSeasonStats && userSeasonStats.rank && userSeasonStats.rank <= 10 && (
              <div className="bg-gradient-to-r from-yellow-50 dark:from-yellow-950/30 to-orange-50 dark:to-orange-950/30 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      Congratulations! You're in the Top 10!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Share your achievement with friends and showcase your skills
                    </p>
                  </div>
                  <SocialShareButton
                    shareType="achievement"
                    title={`Top ${userSeasonStats.rank} in ${currentSeason?.season_name || 'this season'}!`}
                    description={`I ranked #${userSeasonStats.rank} with ${userSeasonStats.total_score} points on GENIA!`}
                    data={{
                      points: userSeasonStats.total_score,
                      rank: userSeasonStats.rank
                    }}
                    compact={false}
                  />
                </div>
              </div>
            )}

            {/* Seasonal Leaderboard Component */}
            <SeasonalLeaderboard
              currentSeason={currentSeason}
              leaderboard={leaderboard}
              userSeasonStats={userSeasonStats}
              historicalSeasons={historicalSeasons}
              isLoading={seasonalLoading}
              onSeasonChange={switchSeason}
              onSeasonTypeChange={switchSeasonType}
            />
          </div>
        )}

        {/* Empty State - Performance Tab Only */}
        {activeTab === 'performance' && !analytics && !loading && !error && (
          <div className="bg-card rounded-xl p-12 text-center shadow-sm">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Analytics Data Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start completing capsules to see your learning analytics
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
