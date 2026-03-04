'use client';

import { useTranslations } from 'next-intl';
import { Brain, Calendar, Target, TrendingUp, Award, BarChart3 } from 'lucide-react';
import type { ReviewStats } from '@/lib/services/spacedRepetitionService';

interface ReviewDashboardProps {
  stats: ReviewStats;
  dueCount: number;
  onStartReview: () => void;
}

export default function ReviewDashboard({
  stats,
  dueCount,
  onStartReview
}: ReviewDashboardProps) {
  const t = useTranslations('review');
  return (
    <div className="space-y-6">
      {/* Header avec CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{t('title')}</h2>
            <p className="text-blue-100">
              {dueCount > 0
                ? t('dueCountMessage', { count: dueCount })
                : t('noDue')}
            </p>
          </div>
          {dueCount > 0 && (
            <button
              onClick={onStartReview}
              className="px-6 py-3 bg-card text-blue-600 font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            >
              {t('startSession')}
            </button>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">{t('stats.totalCards')}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalCards}</p>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <span className="text-sm text-muted-foreground">{t('reviews')}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalReviews}</p>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-500 dark:text-green-400" />
            <span className="text-sm text-muted-foreground">{t('stats.retention')}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.retentionRate > 0 ? `${stats.retentionRate}%` : '-'}
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">{t('averageEasiness')}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.averageEasiness.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Info SM-2 */}
      {stats.totalCards === 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">{t('howItWorks')}</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>{t('howItWorksSteps.step1')}</li>
            <li>{t('howItWorksSteps.step2')}</li>
            <li>{t('howItWorksSteps.step3')}</li>
            <li>{t('howItWorksSteps.step4')}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
