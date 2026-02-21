'use client'

// Désactiver le prerendering pour éviter l'erreur Supabase sur Vercel
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { analyticsService } from '@/lib/services/analyticsService'
import type { StudentAnalytics } from '@/types/analytics.types'
import { BarChart3, RefreshCw } from 'lucide-react'

// Import all analytics components
import ProgressOverview from '@/components/analytics/ProgressOverview'
import SkillRadarChart from '@/components/analytics/SkillRadarChart'
import ScoreTrendChart from '@/components/analytics/ScoreTrendChart'
import StreakCalendar from '@/components/analytics/StreakCalendar'
import BadgeShowcase from '@/components/analytics/BadgeShowcase'
import TimeAnalytics from '@/components/analytics/TimeAnalytics'
import NextStepsRecommendations from '@/components/analytics/NextStepsRecommendations'

export default function AnalyticsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Load analytics data
  const loadAnalytics = async () => {
    if (!user) return

    try {
      setError(null)
      const data = await analyticsService.getStudentAnalytics(user.id)
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [user])

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true)
    loadAnalytics()
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Prompt Engineering Academy
            </h1>
            <button
              onClick={signOut}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Prompt Engineering Academy
          </h1>
          <button
            onClick={signOut}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
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
                <h2 className="text-3xl font-bold text-gray-800">
                  Learning Analytics Dashboard
                </h2>
                <p className="text-gray-600 mt-1">
                  Track your progress and performance
                </p>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Analytics Components */}
        {analytics && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <ProgressOverview stats={analytics.progress} />

            {/* Two-column grid for charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skill Radar Chart */}
              <SkillRadarChart skills={analytics.skills} />

              {/* Score Trend Chart */}
              <ScoreTrendChart scoreTrend={analytics.score_trend} />
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
          </div>
        )}

        {/* Empty State */}
        {!analytics && !loading && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Analytics Data Yet</h3>
            <p className="text-gray-600 mb-6">
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
