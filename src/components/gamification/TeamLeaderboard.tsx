'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Medal, Crown, Users, Target, Award,
  TrendingUp, Flame, Star, ChevronDown
} from 'lucide-react';
import type { TeamLeaderboardEntry } from '@/types/teams.types';

interface TeamLeaderboardProps {
  leaderboard: TeamLeaderboardEntry[];
  isLoading?: boolean;
  period?: 'all' | 'weekly' | 'monthly';
  onPeriodChange?: (period: 'all' | 'weekly' | 'monthly') => void;
}

/**
 * Composant TeamLeaderboard
 * Affiche le classement des équipes avec leurs statistiques
 */
export default function TeamLeaderboard({
  leaderboard = [],
  isLoading = false,
  period = 'all',
  onPeriodChange
}: TeamLeaderboardProps) {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  /**
   * Obtient la couleur du rang
   */
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-muted-foreground';
    if (rank === 3) return 'text-orange-600';
    if (rank <= 10) return 'text-purple-500';
    return 'text-muted-foreground';
  };

  /**
   * Obtient l'icône du rang
   */
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6" />;
    if (rank === 2) return <Medal className="w-6 h-6" />;
    if (rank === 3) return <Trophy className="w-6 h-6" />;
    return <span className="text-lg font-bold">#{rank}</span>;
  };

  /**
   * Obtient le badge de rang
   */
  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  /**
   * Change la période
   */
  const handlePeriodChange = (newPeriod: 'all' | 'weekly' | 'monthly') => {
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  };

  /**
   * Basculer l'expansion d'une équipe
   */
  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-muted-foreground">Chargement du classement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles de période */}
      <div className="bg-card rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-purple-600" />
              Classement des Équipes
            </h2>
            <p className="text-muted-foreground">
              Découvrez les meilleures équipes et leurs performances
            </p>
          </div>

          {/* Sélecteur de période */}
          {onPeriodChange && (
            <div className="flex gap-2">
              <button
                onClick={() => handlePeriodChange('weekly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'weekly'
                    ? 'bg-purple-600 text-white'
                    : 'bg-muted text-foreground hover:bg-accent'
                }`}
              >
                Hebdomadaire
              </button>
              <button
                onClick={() => handlePeriodChange('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'monthly'
                    ? 'bg-purple-600 text-white'
                    : 'bg-muted text-foreground hover:bg-accent'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => handlePeriodChange('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-muted text-foreground hover:bg-accent'
                }`}
              >
                Tout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Classement */}
      <div className="bg-card rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Top Équipes
          </h3>
        </div>

        <div className="divide-y">
          {leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => {
              const isExpanded = expandedTeamId === entry.team_id;
              const badge = getRankBadge(entry.rank);

              return (
                <motion.div
                  key={entry.team_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-accent transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rang */}
                      <div className={`flex-shrink-0 w-16 text-center ${getRankColor(entry.rank)}`}>
                        <div className="flex flex-col items-center">
                          {getRankIcon(entry.rank)}
                          {badge && <span className="text-2xl mt-1">{badge}</span>}
                        </div>
                      </div>

                      {/* Avatar et nom de l'équipe */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {entry.team?.avatar_url ? (
                            <img
                              src={entry.team.avatar_url}
                              alt={entry.team.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            entry.team?.name?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground truncate flex items-center gap-2">
                            {entry.team?.name || 'Équipe'}
                            {entry.rank <= 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-medium">
                                Top {entry.rank}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            <span>{entry.member_count} membre{entry.member_count > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Statistiques principales */}
                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-purple-600">
                            <Star className="w-4 h-4" />
                            <span className="font-bold">{entry.total_score.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-blue-600">
                            <Target className="w-4 h-4" />
                            <span className="font-bold">{entry.challenges_completed}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Défis</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <Trophy className="w-4 h-4" />
                            <span className="font-bold">{entry.tournaments_won}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Tournois</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-orange-600">
                            <Award className="w-4 h-4" />
                            <span className="font-bold">{entry.average_score.toFixed(0)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Moyenne</div>
                        </div>
                      </div>

                      {/* Bouton d'expansion */}
                      <button
                        onClick={() => toggleTeamExpansion(entry.team_id)}
                        className="flex-shrink-0 p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <ChevronDown
                          className={`w-5 h-5 text-muted-foreground transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Stats mobiles */}
                    <div className="md:hidden mt-3 grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-sm font-bold text-purple-600">
                          {entry.total_score.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-blue-600">
                          {entry.challenges_completed}
                        </div>
                        <div className="text-xs text-muted-foreground">Défis</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">
                          {entry.tournaments_won}
                        </div>
                        <div className="text-xs text-muted-foreground">Tournois</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-orange-600">
                          {entry.average_score.toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Moyenne</div>
                      </div>
                    </div>

                    {/* Détails étendus */}
                    {isExpanded && entry.team && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                              Informations
                            </h4>
                            <div className="space-y-2 text-sm">
                              {entry.team.description && (
                                <p className="text-muted-foreground">{entry.team.description}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {entry.member_count}/{entry.team.max_members} membres
                                </span>
                              </div>
                              {entry.team.current_streak > 0 && (
                                <div className="flex items-center gap-2">
                                  <Flame className="w-4 h-4 text-orange-500" />
                                  <span className="text-muted-foreground">
                                    Série de {entry.team.current_streak} jour
                                    {entry.team.current_streak > 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                              Performances par période
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Hebdomadaire:</span>
                                <span className="font-semibold text-purple-600 flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {entry.weekly_score.toLocaleString()} pts
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Mensuel:</span>
                                <span className="font-semibold text-purple-600 flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {entry.monthly_score.toLocaleString()} pts
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Aucune équipe dans le classement</p>
              <p className="text-sm mt-1">Créez une équipe et relevez des défis pour apparaître ici!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
