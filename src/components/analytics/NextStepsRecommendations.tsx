'use client'

import { NextStepRecommendation } from '@/types/analytics.types'
import { Target, BookOpen, TrendingUp, Zap, Clock, Award, ChevronRight, Lightbulb } from 'lucide-react'
import Link from 'next/link'

interface NextStepsRecommendationsProps {
  recommendations: NextStepRecommendation[]
}

export default function NextStepsRecommendations({ recommendations }: NextStepsRecommendationsProps) {
  // Sort by priority (high -> medium -> low)
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  // Get icon for recommendation reason
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'prerequisite':
        return <BookOpen className="w-5 h-5" />
      case 'skill_gap':
        return <Target className="w-5 h-5" />
      case 'continuation':
        return <TrendingUp className="w-5 h-5" />
      case 'challenge':
        return <Zap className="w-5 h-5" />
      default:
        return <Lightbulb className="w-5 h-5" />
    }
  }

  // Get reason label
  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'prerequisite':
        return 'Prérequis manquant'
      case 'skill_gap':
        return 'Combler une lacune'
      case 'continuation':
        return 'Poursuivre votre parcours'
      case 'challenge':
        return 'Relevez un défi'
      default:
        return 'Recommandé'
    }
  }

  // Get priority color scheme
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'from-red-50 to-orange-50',
          border: 'border-red-200',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-500'
        }
      case 'medium':
        return {
          bg: 'from-yellow-50 to-orange-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-500'
        }
      case 'low':
        return {
          bg: 'from-blue-50 to-cyan-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-500'
        }
      default:
        return {
          bg: 'from-muted to-muted/80',
          border: 'border-border',
          text: 'text-foreground',
          badge: 'bg-gray-500'
        }
    }
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      case 'advanced':
        return 'text-orange-600 bg-orange-100'
      case 'expert':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  // Get difficulty label
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Débutant'
      case 'intermediate':
        return 'Intermédiaire'
      case 'advanced':
        return 'Avancé'
      case 'expert':
        return 'Expert'
      default:
        return difficulty
    }
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-purple-500" />
          Prochaines Étapes Recommandées
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Suggestions personnalisées basées sur votre progression et vos compétences
        </p>
      </div>

      {/* Recommendations List */}
      {sortedRecommendations.length > 0 ? (
        <div className="space-y-4">
          {sortedRecommendations.map((rec) => {
            const colors = getPriorityColor(rec.priority)
            return (
              <Link
                key={rec.capsule_id}
                href={`/capsules/${rec.capsule_id}`}
                className="block group"
              >
                <div
                  className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg p-5 transition-all hover:shadow-md hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 ${colors.badge} rounded-lg text-white flex-shrink-0`}>
                        {getReasonIcon(rec.reason)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground group-hover:text-purple-600 transition-colors">
                            {rec.capsule_title}
                          </h3>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rec.module_title}
                        </p>

                        {/* Reason Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-1 text-xs font-medium ${colors.badge} text-white rounded-full`}>
                            {getReasonLabel(rec.reason)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(rec.difficulty_level)}`}>
                            {getDifficultyLabel(rec.difficulty_level)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            rec.priority === 'high'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : rec.priority === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700'
                          }`}>
                            {rec.priority === 'high' ? 'Priorité haute' : rec.priority === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                          </span>
                        </div>

                        {/* Skills Focus */}
                        {rec.skill_focus.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">Compétences ciblées :</p>
                            <div className="flex flex-wrap gap-1">
                              {rec.skill_focus.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-xs bg-card/60 text-foreground rounded border border-border"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Duration */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{rec.estimated_duration_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            <span>+10 points</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium mb-2">Aucune recommandation pour le moment</p>
          <p className="text-sm text-muted-foreground">
            Complétez plus de capsules pour recevoir des suggestions personnalisées !
          </p>
        </div>
      )}

      {/* Insights Section */}
      {sortedRecommendations.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {sortedRecommendations.filter(r => r.priority === 'high').length > 0
                  ? `Focus sur les priorités hautes pour progresser rapidement !`
                  : `Continuez votre apprentissage avec ces suggestions adaptées à votre niveau.`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Nos recommandations sont basées sur votre progression, vos compétences et vos objectifs d'apprentissage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {sortedRecommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Priorités hautes</p>
              <p className="text-lg font-bold text-purple-700">
                {sortedRecommendations.filter(r => r.priority === 'high').length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Temps estimé</p>
              <p className="text-lg font-bold text-blue-700">
                {sortedRecommendations.reduce((sum, r) => sum + r.estimated_duration_minutes, 0)} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="p-2 bg-green-500 rounded-lg">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Points potentiels</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                +{sortedRecommendations.length * 10}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
