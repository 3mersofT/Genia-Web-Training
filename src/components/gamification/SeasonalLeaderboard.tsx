'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus,
  Calendar, Users, Award, ChevronDown, Star, Zap, Target
} from 'lucide-react';
import type {
  Season,
  SeasonType,
  LeaderboardEntryWithUser,
  HistoricalSeason
} from '@/types/seasonalLeaderboard.types';

interface SeasonalLeaderboardProps {
  currentSeason: Season | null;
  leaderboard: LeaderboardEntryWithUser[];
  userSeasonStats: any;
  historicalSeasons: HistoricalSeason[];
  isLoading: boolean;
  onSeasonChange?: (seasonId: string) => void;
  onSeasonTypeChange?: (seasonType: SeasonType) => void;
}

/**
 * Composant SeasonalLeaderboard
 * Affiche le classement saisonnier avec possibilité de changer de saison
 */
export default function SeasonalLeaderboard({
  currentSeason,
  leaderboard,
  userSeasonStats,
  historicalSeasons,
  isLoading,
  onSeasonChange,
  onSeasonTypeChange
}: SeasonalLeaderboardProps) {
  const [seasonType, setSeasonType] = useState<SeasonType>('monthly');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoricalSeason, setSelectedHistoricalSeason] = useState<string | null>(null);

  /**
   * Obtient la couleur du rang
   */
  const getRankColor = (rank: number | null) => {
    if (!rank) return 'text-gray-400';
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    if (rank <= 10) return 'text-purple-500';
    return 'text-gray-600';
  };

  /**
   * Obtient l'icône du rang
   */
  const getRankIcon = (rank: number | null) => {
    if (!rank) return <Minus className="w-5 h-5" />;
    if (rank === 1) return <Crown className="w-5 h-5" />;
    if (rank === 2) return <Medal className="w-5 h-5" />;
    if (rank === 3) return <Trophy className="w-5 h-5" />;
    return <span className="text-sm font-bold">#{rank}</span>;
  };

  /**
   * Obtient l'indicateur de changement de rang
   */
  const getRankChange = (rank: number | null, previousRank: number | null) => {
    if (!rank || !previousRank) return null;

    const change = previousRank - rank; // positif = amélioration

    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-500 text-xs">
          <TrendingUp className="w-3 h-3" />
          <span>+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <TrendingDown className="w-3 h-3" />
          <span>{change}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-gray-400 text-xs">
        <Minus className="w-3 h-3" />
      </div>
    );
  };

  /**
   * Change le type de saison
   */
  const handleSeasonTypeChange = (type: SeasonType) => {
    setSeasonType(type);
    if (onSeasonTypeChange) {
      onSeasonTypeChange(type);
    }
  };

  /**
   * Sélectionne une saison historique
   */
  const handleHistoricalSeasonSelect = (seasonId: string) => {
    setSelectedHistoricalSeason(seasonId);
    if (onSeasonChange) {
      onSeasonChange(seasonId);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Chargement du classement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélection de saison */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Info saison actuelle */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentSeason?.season_name || 'Classement Saisonnier'}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {currentSeason?.start_date ? new Date(currentSeason.start_date).toLocaleDateString('fr-FR') : 'N/A'} - {' '}
                  {currentSeason?.end_date ? new Date(currentSeason.end_date).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{currentSeason?.total_participants || 0} participants</span>
              </div>
            </div>
          </div>

          {/* Contrôles */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSeasonTypeChange('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                seasonType === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => handleSeasonTypeChange('quarterly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                seasonType === 'quarterly'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Trimestriel
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium flex items-center gap-2 transition-colors"
            >
              Historique
              <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Historique des saisons */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Saisons précédentes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {historicalSeasons.length > 0 ? (
                    historicalSeasons.map((season) => (
                      <button
                        key={season.id}
                        onClick={() => handleHistoricalSeasonSelect(season.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedHistoricalSeason === season.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="font-medium text-gray-900 text-sm">{season.season_name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {season.user_final_rank ? `Rang: #${season.user_final_rank}` : 'Non participé'}
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 col-span-full">Aucune saison historique disponible</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Statistiques utilisateur */}
      {userSeasonStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Votre Performance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{userSeasonStats.rank ? `#${userSeasonStats.rank}` : 'N/A'}</div>
              <div className="text-sm text-purple-100">Classement</div>
              {getRankChange(userSeasonStats.rank, userSeasonStats.previous_rank)}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{userSeasonStats.total_score || 0}</div>
              <div className="text-sm text-purple-100">Score Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{userSeasonStats.challenges_completed || 0}</div>
              <div className="text-sm text-purple-100">Défis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{userSeasonStats.tournaments_won || 0}</div>
              <div className="text-sm text-purple-100">Tournois</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{userSeasonStats.xp_earned || 0}</div>
              <div className="text-sm text-purple-100">XP Gagné</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Classement */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Top Joueurs
          </h3>
        </div>

        <div className="divide-y">
          {leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  entry.user_id === userSeasonStats?.user_id ? 'bg-purple-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rang */}
                  <div className={`flex-shrink-0 w-12 text-center ${getRankColor(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar et nom */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {entry.user_profile?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 truncate">
                        {entry.user_profile?.display_name || entry.user_profile?.username || 'Utilisateur'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Dernière activité: {new Date(entry.last_activity_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  {/* Statistiques */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-purple-600">
                        <Award className="w-4 h-4" />
                        <span className="font-bold">{entry.total_score}</span>
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-blue-600">
                        <Target className="w-4 h-4" />
                        <span className="font-bold">{entry.challenges_completed}</span>
                      </div>
                      <div className="text-xs text-gray-500">Défis</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-green-600">
                        <Trophy className="w-4 h-4" />
                        <span className="font-bold">{entry.tournaments_won}</span>
                      </div>
                      <div className="text-xs text-gray-500">Tournois</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-orange-600">
                        <Zap className="w-4 h-4" />
                        <span className="font-bold">{entry.xp_earned}</span>
                      </div>
                      <div className="text-xs text-gray-500">XP</div>
                    </div>
                  </div>

                  {/* Changement de rang */}
                  <div className="flex-shrink-0">
                    {getRankChange(entry.rank, entry.previous_rank)}
                  </div>
                </div>

                {/* Stats mobiles */}
                <div className="md:hidden mt-3 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-sm font-bold text-purple-600">{entry.total_score}</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-blue-600">{entry.challenges_completed}</div>
                    <div className="text-xs text-gray-500">Défis</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-600">{entry.tournaments_won}</div>
                    <div className="text-xs text-gray-500">Tournois</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-orange-600">{entry.xp_earned}</div>
                    <div className="text-xs text-gray-500">XP</div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun participant dans cette saison</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
