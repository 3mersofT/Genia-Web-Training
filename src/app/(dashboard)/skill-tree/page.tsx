'use client';

import React, { useState, useEffect } from 'react';
import SkillTreeVisualization from '@/components/gamification/SkillTreeVisualization';
import { SkillNode, UserSkillProgress } from '@/types/skillTree.types';
import { useTranslations } from 'next-intl';
import { Trophy, Target } from 'lucide-react';

export default function SkillTreePage() {
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserSkillProgress>>({});
  const t = useTranslations('skillTree');

  useEffect(() => {
    // TODO: Fetch skill nodes and user progress from API
  }, []);

  const handleNodeClick = (node: SkillNode) => {
    console.log('Node clicked:', node);
  };

  const handleUnlockClick = (node: SkillNode) => {
    console.log('Unlock clicked:', node);
    // TODO: Implement unlock logic via API
  };

  // Calculer les statistiques
  const stats = {
    total: nodes.length,
    unlocked: Object.values(userProgress).filter(p => p.status !== 'locked').length,
    completed: Object.values(userProgress).filter(p => ['completed', 'mastered'].includes(p.status)).length,
    mastered: Object.values(userProgress).filter(p => p.status === 'mastered').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 dark:from-indigo-950/30 via-background to-purple-50 dark:to-purple-950/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Target className="w-8 h-8 text-indigo-600" />
                {t('title')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span className="text-2xl font-bold text-foreground">
                {stats.mastered}/{stats.total}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-indigo-50 dark:from-indigo-950/30 to-indigo-100 dark:to-indigo-950/20 rounded-lg p-4">
              <div className="text-sm text-indigo-600 font-medium mb-1">{t('total')}</div>
              <div className="text-3xl font-bold text-indigo-900">{stats.total}</div>
              <div className="text-xs text-indigo-600 mt-1">{t('available')}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 dark:from-blue-950/30 to-blue-100 dark:to-blue-950/20 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">{t('unlocked')}</div>
              <div className="text-3xl font-bold text-blue-900">{stats.unlocked}</div>
              <div className="text-xs text-blue-600 mt-1">{t('unlockedDesc')}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 dark:from-green-950/30 to-green-100 dark:to-green-950/20 rounded-lg p-4">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">{t('completed')}</div>
              <div className="text-3xl font-bold text-green-900">{stats.completed}</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">{t('completedDesc')}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 dark:from-yellow-950/30 to-yellow-100 dark:to-yellow-950/20 rounded-lg p-4">
              <div className="text-sm text-yellow-600 font-medium mb-1">{t('mastered')}</div>
              <div className="text-3xl font-bold text-yellow-900">{stats.mastered}</div>
              <div className="text-xs text-yellow-600 mt-1">{t('masteredDesc')}</div>
            </div>
          </div>
        </div>

        {/* Skill Tree Visualization */}
        {nodes.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('noSkills')}</h3>
            <p className="text-muted-foreground">{t('noSkillsDesc')}</p>
          </div>
        ) : (
          <SkillTreeVisualization
            nodes={nodes}
            userProgress={userProgress}
            onNodeClick={handleNodeClick}
            onUnlockClick={handleUnlockClick}
          />
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 {t('howToUse')}</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {t('instructions.click')}</li>
            <li>• {t('instructions.green')}</li>
            <li>• {t('instructions.blue')}</li>
            <li>• {t('instructions.gray')}</li>
            <li>• {t('instructions.connections')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
