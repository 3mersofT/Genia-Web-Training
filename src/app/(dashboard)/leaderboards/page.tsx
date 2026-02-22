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

  // Mock data pour la démonstration
  const mockCurrentSeason: Season = {
    id: 'season-2026-02',
    season_name: 'Février 2026',
    season_type: 'monthly',
    start_date: '2026-02-01',
    end_date: '2026-02-28',
    status: 'active',
    total_participants: 1247,
    total_entries: 1247,
    archived_at: null,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-22T00:00:00Z'
  };

  const mockUserStats: UserSeasonStats = {
    season_id: 'season-2026-02',
    user_id: 'user-1',
    rank: 42,
    total_score: 8650,
    challenges_completed: 28,
    tournaments_won: 3,
    xp_earned: 4200,
    skill_nodes_unlocked: 12,
    rank_change: 5,
    percentile: 96.6
  };

  const mockLeaderboard: LeaderboardEntryWithUser[] = [
    {
      id: 'entry-1',
      season_id: 'season-2026-02',
      user_id: 'user-top-1',
      total_score: 15420,
      challenges_completed: 45,
      tournaments_won: 8,
      xp_earned: 12500,
      skill_nodes_unlocked: 28,
      rank: 1,
      previous_rank: 2,
      last_activity_at: '2026-02-22T10:30:00Z',
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-22T10:30:00Z',
      user_profile: {
        username: 'prompt_master',
        avatar_url: null,
        display_name: 'Le Maître des Prompts'
      }
    },
    {
      id: 'entry-2',
      season_id: 'season-2026-02',
      user_id: 'user-top-2',
      total_score: 14890,
      challenges_completed: 42,
      tournaments_won: 7,
      xp_earned: 11800,
      skill_nodes_unlocked: 26,
      rank: 2,
      previous_rank: 1,
      last_activity_at: '2026-02-22T09:15:00Z',
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-22T09:15:00Z',
      user_profile: {
        username: 'ai_wizard',
        avatar_url: null,
        display_name: 'Sorcier IA'
      }
    },
    {
      id: 'entry-3',
      season_id: 'season-2026-02',
      user_id: 'user-top-3',
      total_score: 13650,
      challenges_completed: 40,
      tournaments_won: 6,
      xp_earned: 10200,
      skill_nodes_unlocked: 24,
      rank: 3,
      previous_rank: 4,
      last_activity_at: '2026-02-22T08:45:00Z',
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-22T08:45:00Z',
      user_profile: {
        username: 'tech_ninja',
        avatar_url: null,
        display_name: 'Ninja Tech'
      }
    },
    {
      id: 'entry-4',
      season_id: 'season-2026-02',
      user_id: 'user-top-4',
      total_score: 12340,
      challenges_completed: 38,
      tournaments_won: 5,
      xp_earned: 9800,
      skill_nodes_unlocked: 22,
      rank: 4,
      previous_rank: 3,
      last_activity_at: '2026-02-21T22:30:00Z',
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-21T22:30:00Z',
      user_profile: {
        username: 'code_champion',
        avatar_url: null,
        display_name: 'Champion du Code'
      }
    },
    {
      id: 'entry-5',
      season_id: 'season-2026-02',
      user_id: 'user-top-5',
      total_score: 11890,
      challenges_completed: 36,
      tournaments_won: 5,
      xp_earned: 9200,
      skill_nodes_unlocked: 21,
      rank: 5,
      previous_rank: 6,
      last_activity_at: '2026-02-21T20:15:00Z',
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-21T20:15:00Z',
      user_profile: {
        username: 'prompt_pro',
        avatar_url: null,
        display_name: 'Prompt Pro'
      }
    },
    {
      id: 'entry-6',
      season_id: 'season-2026-02',
      user_id: 'user-top-6',
      total_score: 10450,
      challenges_completed: 33,
      tournaments_won: 4,
      xp_earned: 8500,
      skill_nodes_unlocked: 19,
      rank: 6,
      previous_rank: 5,
      last_activity_at: '2026-02-21T18:00:00Z',
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-21T18:00:00Z',
      user_profile: {
        username: 'ai_expert',
        avatar_url: null,
        display_name: 'Expert IA'
      }
    },
    {
      id: 'entry-7',
      season_id: 'season-2026-02',
      user_id: 'user-top-7',
      total_score: 9890,
      challenges_completed: 31,
      tournaments_won: 4,
      xp_earned: 7900,
      skill_nodes_unlocked: 18,
      rank: 7,
      previous_rank: 8,
      last_activity_at: '2026-02-21T16:30:00Z',
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-21T16:30:00Z',
      user_profile: {
        username: 'learning_ace',
        avatar_url: null,
        display_name: 'As de l\'Apprentissage'
      }
    },
    {
      id: 'entry-8',
      season_id: 'season-2026-02',
      user_id: 'user-top-8',
      total_score: 9320,
      challenges_completed: 30,
      tournaments_won: 3,
      xp_earned: 7400,
      skill_nodes_unlocked: 17,
      rank: 8,
      previous_rank: 7,
      last_activity_at: '2026-02-21T14:45:00Z',
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-21T14:45:00Z',
      user_profile: {
        username: 'genia_star',
        avatar_url: null,
        display_name: 'Étoile GENIA'
      }
    }
  ];

  const mockHistoricalSeasons: HistoricalSeason[] = [
    {
      id: 'season-2026-01',
      season_name: 'Janvier 2026',
      season_type: 'monthly',
      start_date: '2026-01-01',
      end_date: '2026-01-31',
      status: 'completed',
      total_participants: 1156,
      total_entries: 1156,
      archived_at: '2026-02-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
      user_final_rank: 38,
      user_final_score: 7890,
      rewards_claimed: true
    },
    {
      id: 'season-2025-q4',
      season_name: 'Q4 2025',
      season_type: 'quarterly',
      start_date: '2025-10-01',
      end_date: '2025-12-31',
      status: 'archived',
      total_participants: 3420,
      total_entries: 3420,
      archived_at: '2026-01-01T00:00:00Z',
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      user_final_rank: 156,
      user_final_score: 18450,
      rewards_claimed: true
    },
    {
      id: 'season-2025-12',
      season_name: 'Décembre 2025',
      season_type: 'monthly',
      start_date: '2025-12-01',
      end_date: '2025-12-31',
      status: 'archived',
      total_participants: 1089,
      total_entries: 1089,
      archived_at: '2026-01-01T00:00:00Z',
      created_at: '2025-12-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      user_final_rank: 52,
      user_final_score: 6540,
      rewards_claimed: false
    }
  ];

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
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-purple-500">
                  <Trophy className="w-5 h-5" />
                  <span className="text-2xl font-bold">{mockCurrentSeason.total_participants}</span>
                </div>
                <p className="text-xs text-gray-500">Participants</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-blue-500">
                  <Calendar className="w-5 h-5" />
                  <span className="text-2xl font-bold">{mockCurrentSeason.season_name}</span>
                </div>
                <p className="text-xs text-gray-500">Saison actuelle</p>
              </div>
            </div>
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
            <SeasonalLeaderboard
              currentSeason={mockCurrentSeason}
              leaderboard={mockLeaderboard}
              userSeasonStats={mockUserStats}
              historicalSeasons={mockHistoricalSeasons}
              isLoading={false}
              onSeasonChange={(seasonId) => console.log('Season changed:', seasonId)}
              onSeasonTypeChange={(seasonType) => console.log('Season type changed:', seasonType)}
            />
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
