'use client'

import { useState, useEffect } from 'react'
import TournamentBracket from '@/components/gamification/TournamentBracket'
import TournamentCard from '@/components/gamification/TournamentCard'
import { TournamentBracketView, TournamentRound, Tournament } from '@/types/tournaments.types'
import { Trophy, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function TournamentsPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<string | null>('tournament-1')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mock tournaments data
  const mockTournaments: Tournament[] = [
    {
      id: 'tournament-1',
      title: 'Tournoi Hebdomadaire #12',
      description: 'Défi de prompt engineering avancé avec focus sur les techniques de transformation de texte',
      tournament_type: 'weekly',
      status: 'active',
      start_date: new Date(Date.now() - 86400000).toISOString(),
      end_date: new Date(Date.now() + 6 * 86400000).toISOString(),
      registration_deadline: new Date(Date.now() - 43200000).toISOString(),
      max_participants: 32,
      min_participants: 8,
      bracket_type: 'single_elimination',
      challenge_type: 'transform',
      difficulty: 'advanced',
      time_limit: 1800,
      prize_pool: { first: 1000, second: 500, third: 250 },
      xp_rewards: { first: 500, second: 300, third: 150, participant: 50 },
      category: 'Prompt Engineering',
      tags: ['transformation', 'avancé', 'AI'],
      participant_count: 24,
      current_round: 2,
      total_rounds: 3,
      created_at: new Date(Date.now() - 604800000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'tournament-2',
      title: 'Challenge Spécial: Créativité IA',
      description: 'Créez les prompts les plus créatifs et innovants pour générer du contenu unique',
      tournament_type: 'special',
      status: 'registration',
      start_date: new Date(Date.now() + 2 * 86400000).toISOString(),
      end_date: new Date(Date.now() + 9 * 86400000).toISOString(),
      registration_deadline: new Date(Date.now() + 86400000).toISOString(),
      max_participants: 64,
      min_participants: 16,
      bracket_type: 'single_elimination',
      challenge_type: 'creative',
      difficulty: 'intermediate',
      time_limit: 2400,
      prize_pool: { first: 1500, second: 800, third: 400 },
      xp_rewards: { first: 750, second: 450, third: 200, participant: 75 },
      category: 'Créativité',
      tags: ['créatif', 'innovation', 'spécial'],
      participant_count: 42,
      current_round: 0,
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'tournament-3',
      title: 'Tournoi Débutant: Bases du Prompt',
      description: 'Parfait pour les nouveaux utilisateurs qui veulent apprendre les fondamentaux',
      tournament_type: 'weekly',
      status: 'registration',
      start_date: new Date(Date.now() + 3 * 86400000).toISOString(),
      end_date: new Date(Date.now() + 10 * 86400000).toISOString(),
      registration_deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
      max_participants: 16,
      min_participants: 4,
      bracket_type: 'single_elimination',
      challenge_type: 'create',
      difficulty: 'beginner',
      time_limit: 1200,
      prize_pool: { first: 500, second: 250, third: 100 },
      xp_rewards: { first: 250, second: 150, third: 75, participant: 25 },
      category: 'Débutant',
      tags: ['débutant', 'basics', 'apprentissage'],
      participant_count: 8,
      current_round: 0,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Available Tournaments Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournois Disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  isRegistered={tournament.id === 'tournament-1'}
                  onRegister={(id) => {
                    alert(`Inscription au tournoi ${id}`)
                  }}
                  onWithdraw={(id) => {
                    alert(`Désinscription du tournoi ${id}`)
                  }}
                  onViewDetails={(id) => {
                    setSelectedTournament(id)
                    window.scrollTo({ top: document.getElementById('bracket')?.offsetTop || 0, behavior: 'smooth' })
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tournament Bracket Section */}
          {selectedTournament && (
            <div id="bracket">
              <TournamentBracket
                bracket={mockBracket}
                rounds={mockRounds}
                tournamentTitle="Tournoi Hebdomadaire #12"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
