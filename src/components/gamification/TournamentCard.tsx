'use client'

import { Tournament, TournamentStatus } from '@/types/tournaments.types'
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  Award,
  Target,
  ChevronRight,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react'
import { motion } from 'framer-motion'

interface TournamentCardProps {
  tournament: Tournament
  isRegistered?: boolean
  onRegister?: (tournamentId: string) => void
  onWithdraw?: (tournamentId: string) => void
  onViewDetails?: (tournamentId: string) => void
}

export default function TournamentCard({
  tournament,
  isRegistered = false,
  onRegister,
  onWithdraw,
  onViewDetails
}: TournamentCardProps) {
  // Get status color scheme
  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'upcoming':
        return {
          bg: 'from-blue-50 to-blue-100',
          border: 'border-blue-300',
          text: 'text-blue-700',
          badge: 'bg-blue-500'
        }
      case 'registration':
        return {
          bg: 'from-green-50 to-green-100',
          border: 'border-green-300',
          text: 'text-green-700',
          badge: 'bg-green-500'
        }
      case 'active':
        return {
          bg: 'from-purple-50 to-purple-100',
          border: 'border-purple-300',
          text: 'text-purple-700',
          badge: 'bg-purple-500'
        }
      case 'completed':
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-700',
          badge: 'bg-gray-500'
        }
      case 'cancelled':
        return {
          bg: 'from-red-50 to-red-100',
          border: 'border-red-300',
          text: 'text-red-700',
          badge: 'bg-red-500'
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

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'intermediate':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'advanced':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'expert':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'mixed':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  // Get tournament type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'weekly':
        return 'Hebdomadaire'
      case 'special':
        return 'Spécial'
      case 'seasonal':
        return 'Saisonnier'
      default:
        return type
    }
  }

  // Get status label
  const getStatusLabel = (status: TournamentStatus) => {
    switch (status) {
      case 'upcoming':
        return 'À venir'
      case 'registration':
        return 'Inscriptions ouvertes'
      case 'active':
        return 'En cours'
      case 'completed':
        return 'Terminé'
      case 'cancelled':
        return 'Annulé'
      default:
        return status
    }
  }

  // Calculate registration progress
  const registrationProgress = (tournament.participant_count / tournament.max_participants) * 100
  const spotsRemaining = tournament.max_participants - tournament.participant_count
  const isRegistrationFull = tournament.participant_count >= tournament.max_participants
  const canRegister = tournament.status === 'registration' && !isRegistered && !isRegistrationFull

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get colors
  const colors = getStatusColor(tournament.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-xl p-6 transition-all hover:shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className={`w-6 h-6 ${colors.text}`} />
            <h3 className="text-xl font-bold text-gray-900">{tournament.title}</h3>
          </div>
          {tournament.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{tournament.description}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end ml-4">
          <span className={`px-3 py-1 text-xs font-semibold ${colors.badge} text-white rounded-full whitespace-nowrap`}>
            {getStatusLabel(tournament.status)}
          </span>
          {isRegistered && (
            <span className="px-3 py-1 text-xs font-semibold bg-yellow-500 text-white rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Inscrit
            </span>
          )}
        </div>
      </div>

      {/* Tournament Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Tournament Type */}
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Type</p>
            <p className="text-sm font-semibold text-gray-900">
              {getTypeLabel(tournament.tournament_type)}
            </p>
          </div>
        </div>

        {/* Difficulty */}
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Difficulté</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getDifficultyColor(tournament.difficulty)}`}>
              {tournament.difficulty}
            </span>
          </div>
        </div>

        {/* Start Date */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Début</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(tournament.start_date)}
            </p>
          </div>
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Fin</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(tournament.end_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Registration Deadline (if status is registration) */}
      {tournament.status === 'registration' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-yellow-700" />
            <div>
              <p className="text-xs text-yellow-600">Inscriptions jusqu&apos;au</p>
              <p className="text-sm font-semibold text-yellow-800">
                {formatDate(tournament.registration_deadline)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Participant Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Participants</span>
          </div>
          <span className="text-sm text-gray-600">
            {tournament.participant_count} / {tournament.max_participants}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${
              registrationProgress >= 100
                ? 'bg-red-500'
                : registrationProgress >= 75
                ? 'bg-yellow-500'
                : 'bg-green-500'
            } transition-all duration-300`}
            style={{ width: `${Math.min(registrationProgress, 100)}%` }}
          />
        </div>
        {tournament.status === 'registration' && (
          <p className="text-xs text-gray-500 mt-1">
            {isRegistrationFull
              ? 'Tournoi complet'
              : `${spotsRemaining} place${spotsRemaining > 1 ? 's' : ''} restante${spotsRemaining > 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* Prize Pool */}
      <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 mb-1">Prix</p>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <Trophy className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-gray-900">{tournament.prize_pool.first} pts</p>
              </div>
              <div className="text-center">
                <Award className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                <p className="text-xs font-semibold text-gray-700">{tournament.prize_pool.second} pts</p>
              </div>
              <div className="text-center">
                <Award className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <p className="text-xs font-semibold text-gray-700">{tournament.prize_pool.third} pts</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">XP Bonus</p>
            <p className="text-lg font-bold text-yellow-700">+{tournament.xp_rewards.first}</p>
            <p className="text-xs text-gray-500">pour le vainqueur</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {canRegister && onRegister && (
          <button
            onClick={() => onRegister(tournament.id)}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            S&apos;inscrire
          </button>
        )}

        {isRegistered && tournament.status === 'registration' && onWithdraw && (
          <button
            onClick={() => onWithdraw(tournament.id)}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Se désinscrire
          </button>
        )}

        {onViewDetails && (
          <button
            onClick={() => onViewDetails(tournament.id)}
            className={`${
              canRegister || (isRegistered && tournament.status === 'registration')
                ? 'flex-none px-4'
                : 'flex-1'
            } bg-white border-2 ${colors.border} ${colors.text} font-semibold py-2 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2`}
          >
            Détails
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Current Round Info (for active tournaments) */}
      {tournament.status === 'active' && tournament.current_round > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Tour actuel</span>
            <span className="text-sm font-bold text-purple-700">
              Round {tournament.current_round}
              {tournament.total_rounds && ` / ${tournament.total_rounds}`}
            </span>
          </div>
        </div>
      )}

      {/* Tags (if available) */}
      {tournament.tags && tournament.tags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex flex-wrap gap-2">
            {tournament.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
