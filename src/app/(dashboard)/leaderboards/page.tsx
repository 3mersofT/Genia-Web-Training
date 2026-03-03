'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import SeasonalLeaderboard from '@/components/gamification/SeasonalLeaderboard';
import type {
  Season,
  SeasonType,
  LeaderboardEntryWithUser,
  UserSeasonStats,
  HistoricalSeason
} from '@/types/seasonalLeaderboard.types';

export default function LeaderboardsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');

  // TODO: Remplacer par un vrai fetch Supabase quand le backend sera prêt
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [userStats, setUserStats] = useState<UserSeasonStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithUser[]>([]);
  const [historicalSeasons, setHistoricalSeasons] = useState<HistoricalSeason[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    );
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
                <h1 className="text-2xl font-bold text-gray-900">Classements Saisonniers</h1>
                <p className="text-gray-600">Comparez vos performances avec les meilleurs joueurs !</p>
              </div>
            </div>
            {currentSeason && (
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-purple-500">
                    <Trophy className="w-5 h-5" />
                    <span className="text-2xl font-bold">{currentSeason.total_participants}</span>
                  </div>
                  <p className="text-xs text-gray-500">Participants</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-blue-500">
                    <Calendar className="w-5 h-5" />
                    <span className="text-2xl font-bold">{currentSeason.season_name}</span>
                  </div>
                  <p className="text-xs text-gray-500">Saison actuelle</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'individual'
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('individual')}
            >
              Classement Individuel
              {activeTab === 'individual' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
            <button
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'team'
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('team')}
            >
              Classement Équipes
              {activeTab === 'team' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'individual' ? (
          <motion.div
            key="individual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!currentSeason && leaderboard.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Classement Individuel</h3>
                <p className="text-gray-600">
                  Le classement sera disponible quand des étudiants auront complété des capsules.
                </p>
              </div>
            ) : (
              <SeasonalLeaderboard
                currentSeason={currentSeason}
                leaderboard={leaderboard}
                userSeasonStats={userStats}
                historicalSeasons={historicalSeasons}
                isLoading={false}
                onSeasonChange={(seasonId) => console.log('Season changed:', seasonId)}
                onSeasonTypeChange={(seasonType) => console.log('Season type changed:', seasonType)}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Classement Équipes</h3>
            <p className="text-gray-600">Le classement des équipes sera bientôt disponible.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
