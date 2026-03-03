'use client'

import { useState, useEffect } from 'react'
import TournamentBracket from '@/components/gamification/TournamentBracket'
import TournamentCard from '@/components/gamification/TournamentCard'
import { TournamentBracketView, TournamentRound, Tournament } from '@/types/tournaments.types'
import { Trophy, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function TournamentsPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [rounds, setRounds] = useState<TournamentRound[]>([])
  const [bracket, setBracket] = useState<TournamentBracketView[]>([])

  useEffect(() => {
    setMounted(true)
    // TODO: Fetch tournaments from API
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 dark:from-purple-950/30 via-background to-pink-50 dark:to-pink-950/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 dark:from-purple-950/30 via-background to-pink-50 dark:to-pink-950/30">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tournois</h1>
                <p className="text-muted-foreground">Participez aux tournois hebdomadaires et grimpez dans le classement !</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Trophy className="w-5 h-5" />
                  <span className="text-2xl font-bold">0</span>
                </div>
                <p className="text-xs text-muted-foreground">Victoires</p>
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
            <h2 className="text-2xl font-bold text-foreground mb-4">Tournois Disponibles</h2>
            {tournaments.length === 0 ? (
              <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucun tournoi disponible</h3>
                <p className="text-muted-foreground">Les tournois seront affichés ici lorsqu&apos;ils seront disponibles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    isRegistered={false}
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
            )}
          </div>

          {/* Tournament Bracket Section */}
          {selectedTournament && bracket.length > 0 && (
            <div id="bracket">
              <TournamentBracket
                bracket={bracket}
                rounds={rounds}
                tournamentTitle=""
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
