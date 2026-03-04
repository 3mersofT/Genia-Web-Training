'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, Target, Users, TrendingUp, Calendar,
  Award, Star, Clock, Filter, ChevronLeft, ChevronRight, RefreshCw, Send
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function ChallengePage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'leaderboard' | 'history'>('today');
  const t = useTranslations('challenges');
  const tc = useTranslations('common');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 dark:from-purple-950/30 via-background to-pink-50 dark:to-pink-950/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
            <p className="text-muted-foreground">{tc('loading')}</p>
          </div>
        </div>
      </div>
    );
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
                <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-5 h-5" />
                  <span className="text-2xl font-bold">0</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('currentStreak')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-blue-500">
                  <Trophy className="w-5 h-5" />
                  <span className="text-2xl font-bold">0</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('victories')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-green-500 dark:text-green-400">
                  <Star className="w-5 h-5" />
                  <span className="text-2xl font-bold">0</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('averageScore')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button 
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'today' 
                  ? 'text-purple-600' 
                  : 'text-muted-foreground hover:text-accent-foreground'
              }`}
              onClick={() => setActiveTab('today')}
            >
              {t('dailyChallenge')}
              {activeTab === 'today' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
            <button 
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'leaderboard' 
                  ? 'text-purple-600' 
                  : 'text-muted-foreground hover:text-accent-foreground'
              }`}
              onClick={() => setActiveTab('leaderboard')}
            >
              {t('leaderboard')}
              {activeTab === 'leaderboard' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
            <button 
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'history' 
                  ? 'text-purple-600' 
                  : 'text-muted-foreground hover:text-accent-foreground'
              }`}
              onClick={() => setActiveTab('history')}
            >
              {t('history')}
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-card rounded-xl shadow-lg p-8"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Transforme ce prompt vague en version RCTF
                  </h2>
                  <p className="text-muted-foreground">
                    Améliore ce prompt pour e-commerce : "Écris-moi un article"
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-foreground mb-3">{t('instructions')}:</h3>
                  <ul className="space-y-2 text-foreground">
                    <li className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>Utilisez la méthode RCTF (Rôle, Contexte, Tâche, Format)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>Vous avez 10 minutes pour compléter ce défi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>Score maximum : 100 points</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('yourAnswer')}:
                    </label>
                    <textarea
                      className="w-full h-32 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('placeholder')}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                      <Send className="w-4 h-4 inline mr-2" />
                      {t('submit')}
                    </button>
                    <button className="px-6 py-3 border border-input text-foreground rounded-lg hover:bg-accent transition-colors">
                      <RefreshCw className="w-4 h-4 inline mr-2" />
                      {t('newChallenge')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-card rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">{t('leaderboard')}</h2>
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t('noLeaderboard')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('noLeaderboardDesc')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-card rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">{t('history')}</h2>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t('noHistory')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('noHistoryDesc')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}