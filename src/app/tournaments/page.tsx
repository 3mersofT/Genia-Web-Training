'use client'

import { useState, useEffect } from 'react'
import TournamentBracket from '@/components/gamification/TournamentBracket'
import { TournamentBracketView, TournamentRound } from '@/types/tournaments.types'
import { Trophy, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function TournamentsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mock data for demonstration
  const mockRounds: TournamentRound[] = [
    {
      id: 'round-1',
      tournament_id: 'tournament-1',
      round_number: 1,
      round_name: 'Quarter Finals',
      status: 'completed',
      matches_count: 4,
      best_of: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'round-2',
      tournament_id: 'tournament-1',
      round_number: 2,
      round_name: 'Semi Finals',
      status: 'active',
      matches_count: 2,
      best_of: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'round-3',
      tournament_id: 'tournament-1',
      round_number: 3,
      round_name: 'Finals',
      status: 'pending',
      matches_count: 1,
      best_of: 1,
      created_at: new Date().toISOString(),
    },
  ]

  const mockBracket: TournamentBracketView[] = [
    // Quarter Finals
    {
      tournament_id: 'tournament-1',
      tournament_title: 'Tournoi Hebdomadaire #1',
      round_number: 1,
      round_name: 'Quarter Finals',
      match_number: 1,
      match_id: 'match-1',
      match_status: 'completed',
      participant1_user_id: 'user-1',
      participant2_user_id: 'user-2',
      participant1_score: 85,
      participant2_score: 72,
      winner_user_id: 'user-1',
      completed_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      tournament_id: 'tournament-1',
      tournament_title: 'Tournoi Hebdomadaire #1',
      round_number: 1,
      round_name: 'Quarter Finals',
      match_number: 2,
      match_id: 'match-2',
      match_status: 'completed',
      participant1_user_id: 'user-3',
      participant2_user_id: 'user-4',
      participant1_score: 90,
      participant2_score: 88,
      winner_user_id: 'user-3',
      completed_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      tournament_id: 'tournament-1',
      tournament_title: 'Tournoi Hebdomadaire #1',
      round_number: 1,
      round_name: 'Quarter Finals',
      match_number: 3,
      match_id: 'match-3',
      match_status: 'completed',
      participant1_user_id: 'user-5',
      participant2_user_id: 'user-6',
      participant1_score: 78,
      participant2_score: 92,
      winner_user_id: 'user-6',
      completed_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      tournament_id: 'tournament-1',
      tournament_title: 'Tournoi Hebdomadaire #1',
      round_number: 1,
      round_name: 'Quarter Finals',
      match_number: 4,
      match_id: 'match-4',
      match_status: 'completed',
      participant1_user_id: 'user-7',
      participant2_user_id: 'user-8',
      participant1_score: 95,
      participant2_score: 81,
      winner_user_id: 'user-7',
      completed_at: new Date(Date.now() - 86400000).toISOString(),
    },
    // Semi Finals
    {
      tournament_id: 'tournament-1',
      tournament_title: 'Tournoi Hebdomadaire #1',
      round_number: 2,
      round_name: 'Semi Finals',
      match_number: 5,
      match_id: 'match-5',
      match_status: 'in_progress',
      participant1_user_id: 'user-1',
      participant2_user_id: 'user-3',
      participant1_score: 0,
      participant2_score: 0,
    },
    {
      tournament_id: 'tournament-1',
      tournament_title: 'Tournoi Hebdomadaire #1',
      round_number: 2,
      round_name: 'Semi Finals',
      match_number: 6,
      match_id: 'match-6',
      match_status: 'scheduled',
      participant1_user_id: 'user-6',
      participant2_user_id: 'user-7',
      participant1_score: 0,
      participant2_score: 0,
      scheduled_time: new Date(Date.now() + 3600000).toISOString(),
    },
    // Finals
    {
      tournament_id: 'tournament-1',
      tournament_title: 'Tournoi Hebdomadaire #1',
      round_number: 3,
      round_name: 'Finals',
      match_number: 7,
      match_id: 'match-7',
      match_status: 'scheduled',
      participant1_score: 0,
      participant2_score: 0,
    },
  ]

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tournois</h1>
                <p className="text-gray-600">Participez aux tournois hebdomadaires et grimpez dans le classement !</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Trophy className="w-5 h-5" />
                  <span className="text-2xl font-bold">0</span>
                </div>
                <p className="text-xs text-gray-500">Victoires</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <TournamentBracket
            bracket={mockBracket}
            rounds={mockRounds}
            tournamentTitle="Tournoi Hebdomadaire #1"
          />
        </div>
      </div>
    </div>
  )
}
