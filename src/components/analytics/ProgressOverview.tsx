'use client'

import { ProgressOverviewStats } from '@/types/analytics.types'
import { Trophy, Target, BookOpen, Award, TrendingUp, CheckCircle } from 'lucide-react'

interface ProgressOverviewProps {
  stats: ProgressOverviewStats
}

export default function ProgressOverview({ stats }: ProgressOverviewProps) {
  // Format average score to 1 decimal place
  const avgScore = stats.average_exercise_score
    ? `${stats.average_exercise_score.toFixed(1)}%`
    : 'N/A'

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Vue d'ensemble de la progression</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Overall Completion */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-blue-700">
              {stats.overall_completion_percentage}%
            </span>
          </div>
          <p className="text-gray-700 font-medium">Progression globale</p>
          <p className="text-sm text-gray-600 mt-1">
            {stats.completed_capsules} / {stats.total_capsules} capsules
          </p>
        </div>

        {/* Modules Progress */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-green-700">
              {stats.completed_modules}/{stats.total_modules}
            </span>
          </div>
          <p className="text-gray-700 font-medium">Modules terminés</p>
          <p className="text-sm text-gray-600 mt-1">
            {stats.in_progress_modules} en cours
          </p>
        </div>

        {/* Average Score */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold text-purple-700">
              {avgScore}
            </span>
          </div>
          <p className="text-gray-700 font-medium">Score moyen</p>
          <p className="text-sm text-gray-600 mt-1">
            Sur tous les exercices
          </p>
        </div>

        {/* Exercises Completed */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-orange-600" />
            <span className="text-3xl font-bold text-orange-700">
              {stats.total_exercises_completed}
            </span>
          </div>
          <p className="text-gray-700 font-medium">Exercices réussis</p>
          <p className="text-sm text-gray-600 mt-1">
            {stats.total_exercises_attempted} tentés
          </p>
        </div>

        {/* Capsules In Progress */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-yellow-600" />
            <span className="text-3xl font-bold text-yellow-700">
              {stats.in_progress_capsules}
            </span>
          </div>
          <p className="text-gray-700 font-medium">Capsules en cours</p>
          <p className="text-sm text-gray-600 mt-1">
            À compléter
          </p>
        </div>

        {/* Completion Rate */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-pink-600" />
            <span className="text-3xl font-bold text-pink-700">
              {stats.total_exercises_attempted > 0
                ? Math.round((stats.total_exercises_completed / stats.total_exercises_attempted) * 100)
                : 0}%
            </span>
          </div>
          <p className="text-gray-700 font-medium">Taux de réussite</p>
          <p className="text-sm text-gray-600 mt-1">
            Exercices réussis
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progression du parcours</span>
          <span className="text-sm font-bold text-blue-600">
            {stats.completed_capsules} / {stats.total_capsules}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.overall_completion_percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
