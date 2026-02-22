'use client'

import { TournamentBracketView, TournamentRound, MatchStatus } from '@/types/tournaments.types'
import { Trophy, Award, Crown, Clock, Check, Minus, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface TournamentBracketProps {
  bracket: TournamentBracketView[]
  rounds: TournamentRound[]
  tournamentTitle?: string
}

export default function TournamentBracket({ bracket, rounds, tournamentTitle }: TournamentBracketProps) {
  // Organize bracket data by rounds
  const bracketByRounds = rounds.map(round => ({
    round,
    matches: bracket.filter(match => match.round_number === round.round_number)
  }))

  // Get match status icon and color
  const getMatchStatusIndicator = (status: MatchStatus) => {
    switch (status) {
      case 'completed':
        return { icon: <Check className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-100' }
      case 'in_progress':
        return { icon: <Clock className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-100' }
      case 'scheduled':
        return { icon: <Clock className="w-4 h-4" />, color: 'text-gray-500', bg: 'bg-gray-100' }
      case 'forfeit':
        return { icon: <Minus className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-100' }
      case 'cancelled':
        return { icon: <Minus className="w-4 h-4" />, color: 'text-gray-400', bg: 'bg-gray-100' }
      default:
        return { icon: <Clock className="w-4 h-4" />, color: 'text-gray-500', bg: 'bg-gray-100' }
    }
  }

  // Get round icon
  const getRoundIcon = (roundName: string) => {
    if (roundName.toLowerCase().includes('final') && !roundName.toLowerCase().includes('semi')) {
      return <Crown className="w-5 h-5 text-yellow-500" />
    }
    if (roundName.toLowerCase().includes('semi')) {
      return <Trophy className="w-5 h-5 text-purple-500" />
    }
    return <Award className="w-5 h-5 text-blue-500" />
  }

  // Empty state
  if (!bracket || bracket.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun bracket disponible
          </h3>
          <p className="text-gray-600">
            Le bracket du tournoi sera généré une fois les inscriptions terminées.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          {tournamentTitle ? `Bracket - ${tournamentTitle}` : 'Bracket du Tournoi'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Système d&apos;élimination directe - {rounds.length} tour{rounds.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Bracket Visualization */}
      <div className="overflow-x-auto">
        <div className="flex gap-8 pb-4" style={{ minWidth: 'max-content' }}>
          {bracketByRounds.map((roundData, roundIndex) => (
            <div key={roundData.round.id} className="flex-shrink-0">
              {/* Round Header */}
              <div className="mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getRoundIcon(roundData.round.round_name)}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {roundData.round.round_name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  {roundData.matches.length} match{roundData.matches.length > 1 ? 's' : ''}
                  {roundData.round.best_of > 1 && ` - Best of ${roundData.round.best_of}`}
                </p>
              </div>

              {/* Matches */}
              <div className="space-y-6" style={{ width: '280px' }}>
                {roundData.matches.map((match, matchIndex) => {
                  const statusInfo = getMatchStatusIndicator(match.match_status)
                  const isCompleted = match.match_status === 'completed'
                  const participant1IsWinner = match.winner_user_id === match.participant1_user_id
                  const participant2IsWinner = match.winner_user_id === match.participant2_user_id

                  return (
                    <motion.div
                      key={match.match_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: roundIndex * 0.1 + matchIndex * 0.05 }}
                      className="relative"
                    >
                      {/* Match Card */}
                      <div className={`border-2 rounded-lg overflow-hidden transition-all ${
                        isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                      }`}>
                        {/* Match Status Badge */}
                        <div className={`px-3 py-1 text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span>Match #{match.match_number}</span>
                          {match.scheduled_time && (
                            <span className="ml-auto">
                              {new Date(match.scheduled_time).toLocaleDateString('fr-FR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>

                        {/* Participant 1 */}
                        <div className={`px-3 py-2 flex items-center justify-between border-b ${
                          participant1IsWinner
                            ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200'
                            : 'border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2 flex-1">
                            {participant1IsWinner && (
                              <Trophy className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            )}
                            <span className={`text-sm truncate ${
                              participant1IsWinner ? 'font-semibold text-gray-900' : 'text-gray-700'
                            }`}>
                              {match.participant1_user_id ? `Joueur ${match.participant1_user_id.slice(0, 8)}` : 'TBD'}
                            </span>
                          </div>
                          {match.participant1_user_id && (
                            <span className={`text-sm font-bold ml-2 ${
                              participant1IsWinner ? 'text-yellow-700' : 'text-gray-600'
                            }`}>
                              {match.participant1_score}
                            </span>
                          )}
                        </div>

                        {/* Participant 2 */}
                        <div className={`px-3 py-2 flex items-center justify-between ${
                          participant2IsWinner
                            ? 'bg-gradient-to-r from-yellow-50 to-yellow-100'
                            : ''
                        }`}>
                          <div className="flex items-center gap-2 flex-1">
                            {participant2IsWinner && (
                              <Trophy className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            )}
                            <span className={`text-sm truncate ${
                              participant2IsWinner ? 'font-semibold text-gray-900' : 'text-gray-700'
                            }`}>
                              {match.participant2_user_id ? `Joueur ${match.participant2_user_id.slice(0, 8)}` : 'TBD'}
                            </span>
                          </div>
                          {match.participant2_user_id && (
                            <span className={`text-sm font-bold ml-2 ${
                              participant2IsWinner ? 'text-yellow-700' : 'text-gray-600'
                            }`}>
                              {match.participant2_score}
                            </span>
                          )}
                        </div>

                        {/* Completion Time */}
                        {match.completed_at && (
                          <div className="px-3 py-1 bg-gray-50 text-xs text-gray-500 text-center">
                            Terminé le {new Date(match.completed_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>

                      {/* Connection Line to Next Round */}
                      {roundIndex < bracketByRounds.length - 1 && (
                        <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
                          <ChevronRight className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Légende</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">Terminé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-600">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-xs text-gray-600">Planifié</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-gray-600">Vainqueur</span>
          </div>
        </div>
      </div>
    </div>
  )
}
