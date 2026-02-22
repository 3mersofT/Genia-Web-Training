'use client'

import { LevelProgress } from '@/types/levels.types'
import { Trophy, Zap, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface LevelBadgeProps {
  levelProgress: LevelProgress
  showDetails?: boolean
  compact?: boolean
  onClick?: () => void
}

export default function LevelBadge({
  levelProgress,
  showDetails = true,
  compact = false,
  onClick
}: LevelBadgeProps) {
  // Get level color from the current level
  const getLevelColor = (rank: number) => {
    switch (rank) {
      case 1: // Novice
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-700',
          badge: 'bg-gray-500',
          glow: 'shadow-gray-200'
        }
      case 2: // Apprenti
        return {
          bg: 'from-blue-50 to-blue-100',
          border: 'border-blue-300',
          text: 'text-blue-700',
          badge: 'bg-blue-500',
          glow: 'shadow-blue-200'
        }
      case 3: // Expert
        return {
          bg: 'from-orange-50 to-orange-100',
          border: 'border-orange-300',
          text: 'text-orange-700',
          badge: 'bg-orange-500',
          glow: 'shadow-orange-200'
        }
      case 4: // Maître
        return {
          bg: 'from-red-50 to-red-100',
          border: 'border-red-300',
          text: 'text-red-700',
          badge: 'bg-red-500',
          glow: 'shadow-red-200'
        }
      case 5: // Légende
        return {
          bg: 'from-purple-50 to-purple-100',
          border: 'border-purple-300',
          text: 'text-purple-700',
          badge: 'bg-gradient-to-r from-purple-500 to-pink-500',
          glow: 'shadow-purple-200'
        }
      default:
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-700',
          badge: 'bg-gray-500',
          glow: 'shadow-gray-200'
        }
    }
  }

  const colors = getLevelColor(levelProgress.level_rank)
  const isMaxLevel = levelProgress.next_level === null

  // Compact version (for sidebars, headers, etc.)
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={onClick}
      >
        <div className={`text-2xl`}>
          {levelProgress.current_level.icon_emoji || '🏆'}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${colors.text}`}>
            {levelProgress.level_name_fr}
          </p>
          <p className="text-xs text-gray-600">
            {levelProgress.total_xp.toLocaleString()} XP
          </p>
        </div>
      </motion.div>
    )
  }

  // Full version
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-xl p-6 ${colors.glow} shadow-lg ${onClick ? 'cursor-pointer hover:shadow-xl transition-all' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 ${colors.badge} rounded-xl text-white text-3xl shadow-md`}>
            {levelProgress.current_level.icon_emoji || '🏆'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {levelProgress.level_name_fr}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-semibold ${colors.badge} text-white rounded-full`}>
                Niveau {levelProgress.level_rank}
              </span>
            </div>
            {levelProgress.current_level.description && (
              <p className="text-sm text-gray-600 mt-1">
                {levelProgress.current_level.description}
              </p>
            )}
          </div>
        </div>
        <Trophy className={`w-8 h-8 ${colors.text}`} />
      </div>

      {/* XP Stats */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-white bg-opacity-60 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <p className="text-xs text-gray-600">XP Total</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {levelProgress.total_xp.toLocaleString()}
            </p>
          </div>

          <div className="text-center p-3 bg-white bg-opacity-60 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-xs text-gray-600">XP Actuel</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {levelProgress.current_xp.toLocaleString()}
            </p>
          </div>

          <div className="text-center p-3 bg-white bg-opacity-60 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-purple-500" />
              <p className="text-xs text-gray-600">Prochain</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {isMaxLevel ? 'MAX' : levelProgress.xp_to_next_level.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {!isMaxLevel && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Progression vers {levelProgress.next_level?.level_name_fr}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {Math.round(levelProgress.progress_percentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress.progress_percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full ${colors.badge} shadow-sm`}
            />
          </div>
          <p className="text-xs text-gray-600 text-center">
            {levelProgress.xp_to_next_level.toLocaleString()} XP restants pour le prochain niveau
          </p>
        </div>
      )}

      {/* Max Level Message */}
      {isMaxLevel && (
        <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-purple-800">
            🎉 Niveau Maximum Atteint!
          </p>
          <p className="text-xs text-purple-600 mt-1">
            Vous êtes une légende de l&apos;ingénierie de prompt!
          </p>
        </div>
      )}

      {/* Next Level Preview */}
      {!isMaxLevel && levelProgress.next_level && showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex items-center gap-2">
            <div className="text-xl opacity-50">
              {levelProgress.next_level.icon_emoji || '🏆'}
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Prochain niveau</p>
              <p className="text-sm font-semibold text-gray-700">
                {levelProgress.next_level.level_name_fr}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">XP requis</p>
              <p className="text-sm font-bold text-gray-900">
                {levelProgress.next_level.xp_required.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
