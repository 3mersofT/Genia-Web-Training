'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Target, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import Link from 'next/link';

export default function DailyChallengeWidget() {
  const { 
    todayChallenge, 
    participation, 
    userRank,
    userStats,
    isLoading 
  } = useDailyChallenges({
    autoLoad: true,
    includeStat: true
  });

  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-2/3 mb-4"></div>
        <div className="h-4 bg-muted rounded w-full mb-2"></div>
        <div className="h-4 bg-muted rounded w-4/5"></div>
      </div>
    );
  }

  const isCompleted = !!participation?.completed_at;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <h3 className="text-lg font-bold">Défi du Jour</h3>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span>{timeRemaining}</span>
          </div>
        </div>

        {todayChallenge ? (
          <div>
            <h4 className="font-semibold mb-1 line-clamp-1">
              {todayChallenge.title}
            </h4>
            <p className="text-sm opacity-90 line-clamp-2">
              {todayChallenge.description}
            </p>
          </div>
        ) : (
          <p className="text-sm opacity-90">
            Aucun défi disponible aujourd'hui
          </p>
        )}
      </div>

      {/* Stats et actions */}
      <div className="p-6">
        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xl font-bold">
                {userStats?.current_streak || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Série</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-500 dark:text-blue-400 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xl font-bold">
                {userRank ? `#${userRank}` : '-'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Rang</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-500 dark:text-green-400 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xl font-bold">
                {participation?.score || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
        </div>

        {/* Barre de progression */}
        {userStats && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
              <span>Progression mensuelle</span>
              <span>{userStats.total_participations || 0}/30</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(100, ((userStats.total_participations || 0) / 30) * 100)}%` 
                }}
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Bouton d'action */}
        <Link href="/challenges">
          <button className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isCompleted
              ? 'bg-muted text-muted-foreground'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
          }`}>
            {isCompleted ? (
              <>
                <Trophy className="w-4 h-4" />
                Défi complété !
              </>
            ) : (
              <>
                Participer au défi
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </Link>

        {/* Lien vers tous les défis */}
        <Link 
          href="/challenges/history"
          className="block text-center text-sm text-muted-foreground hover:text-foreground mt-3"
        >
          Voir l'historique des défis →
        </Link>
      </div>
    </motion.div>
  );
}
