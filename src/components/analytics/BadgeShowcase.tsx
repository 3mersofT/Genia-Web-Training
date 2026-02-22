'use client'

import { BadgeProgress } from '@/types/analytics.types'
import { Trophy, Award, Medal, Star, Crown, Lock } from 'lucide-react'

interface BadgeShowcaseProps {
  badges: BadgeProgress[]
}

export default function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  // Separate earned and upcoming badges
  const earnedBadges = badges.filter(b => b.earned)
  const upcomingBadges = badges.filter(b => !b.earned).slice(0, 6) // Show top 6 upcoming

  // Get rarity color scheme
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-700',
          badge: 'bg-gray-500'
        }
      case 'rare':
        return {
          bg: 'from-blue-50 to-blue-100',
          border: 'border-blue-300',
          text: 'text-blue-700',
          badge: 'bg-blue-500'
        }
      case 'epic':
        return {
          bg: 'from-purple-50 to-purple-100',
          border: 'border-purple-300',
          text: 'text-purple-700',
          badge: 'bg-purple-500'
        }
      case 'legendary':
        return {
          bg: 'from-yellow-50 to-yellow-100',
          border: 'border-yellow-400',
          text: 'text-yellow-700',
          badge: 'bg-gradient-to-r from-yellow-500 to-orange-500'
        }
      default:
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-700',
          badge: 'bg-gray-500'
        }
    }
  }

  // Get icon for badge category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'completion':
        return <Trophy className="w-6 h-6" />
      case 'performance':
        return <Star className="w-6 h-6" />
      case 'streak':
        return <Award className="w-6 h-6" />
      case 'social':
        return <Medal className="w-6 h-6" />
      case 'special':
        return <Crown className="w-6 h-6" />
      default:
        return <Trophy className="w-6 h-6" />
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Badge Collection
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Earn badges by completing challenges and milestones
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
          <div className="p-2 bg-yellow-500 rounded-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Badges</p>
            <p className="text-2xl font-bold text-gray-900">
              {earnedBadges.length}
              <span className="text-sm font-normal text-gray-600 ml-1">
                / {badges.length}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((earnedBadges.length / badges.length) * 100)}% collected
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Rare Badges</p>
            <p className="text-2xl font-bold text-gray-900">
              {earnedBadges.filter(b => ['epic', 'legendary'].includes(b.badge.rarity)).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Epic or Legendary</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Badge Points</p>
            <p className="text-2xl font-bold text-gray-900">
              {earnedBadges.reduce((sum, b) => sum + b.badge.points, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total points earned</p>
          </div>
        </div>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Earned Badges ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadges.map((badgeProgress) => {
              const colors = getRarityColor(badgeProgress.badge.rarity)
              return (
                <div
                  key={badgeProgress.badge.id}
                  className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg p-4 transition-transform hover:scale-105`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-3 ${colors.badge} rounded-lg text-white`}>
                      {getCategoryIcon(badgeProgress.badge.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {badgeProgress.badge.name}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs font-medium ${colors.badge} text-white rounded-full`}>
                          {badgeProgress.badge.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {badgeProgress.badge.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Earned {badgeProgress.earned_at ? new Date(badgeProgress.earned_at).toLocaleDateString() : 'Recently'}
                        </span>
                        <span className="font-semibold text-yellow-600">
                          +{badgeProgress.badge.points} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming Badges (In Progress) */}
      {upcomingBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-500" />
            Next Badges to Earn ({upcomingBadges.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBadges.map((badgeProgress) => {
              const colors = getRarityColor(badgeProgress.badge.rarity)
              return (
                <div
                  key={badgeProgress.badge.id}
                  className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 opacity-80 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-gray-200 rounded-lg text-gray-500">
                      {getCategoryIcon(badgeProgress.badge.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-gray-700">
                          {badgeProgress.badge.name}
                        </h4>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                          {badgeProgress.badge.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {badgeProgress.badge.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-700">
                            {badgeProgress.current_value} / {badgeProgress.target_value}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${colors.badge} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${badgeProgress.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-500">
                            {badgeProgress.progress}% complete
                          </span>
                          <span className="font-semibold text-yellow-600">
                            +{badgeProgress.badge.points} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {badges.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">No badges available yet</p>
          <p className="text-sm text-gray-500">
            Complete learning activities to start earning badges!
          </p>
        </div>
      )}

      {/* Motivational Message */}
      {upcomingBadges.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {upcomingBadges[0].progress >= 50
                  ? `You're ${100 - upcomingBadges[0].progress}% away from earning "${upcomingBadges[0].badge.name}"!`
                  : `Keep learning to unlock new badges!`}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Complete more activities to increase your progress and earn badges.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
