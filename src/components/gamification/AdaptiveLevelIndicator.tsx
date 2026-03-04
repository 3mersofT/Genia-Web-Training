'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap, Target, Brain, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { UserPerformanceProfile, DifficultyLevel } from '@/lib/services/adaptiveDifficultyService';

interface AdaptiveLevelIndicatorProps {
  userId: string;
  compact?: boolean;
}

const LEVEL_CONFIG: Record<DifficultyLevel, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  progressMax: number;
}> = {
  beginner: {
    color: 'text-green-700',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300',
    icon: <Zap className="w-5 h-5 text-green-600" />,
    progressMax: 25,
  },
  intermediate: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300',
    icon: <Target className="w-5 h-5 text-blue-600" />,
    progressMax: 50,
  },
  advanced: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-300',
    icon: <Brain className="w-5 h-5 text-purple-600" />,
    progressMax: 75,
  },
  expert: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-300',
    icon: <Shield className="w-5 h-5 text-amber-600" />,
    progressMax: 100,
  },
};

export default function AdaptiveLevelIndicator({ userId, compact = false }: AdaptiveLevelIndicatorProps) {
  const t = useTranslations('dashboard.level');
  const [profile, setProfile] = useState<UserPerformanceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<DifficultyLevel | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/user/difficulty');
        if (!res.ok) return;
        const data = await res.json();
        const newProfile = data.profile as UserPerformanceProfile;

        if (previousLevel && newProfile.currentLevel !== previousLevel && newProfile.shouldLevelUp) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }

        setPreviousLevel(newProfile.currentLevel);
        setProfile(newProfile);
      } catch (err) {
        console.error('[AdaptiveLevelIndicator] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  if (loading || !profile) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const config = LEVEL_CONFIG[profile.currentLevel];
  const progressPercent = Math.round(profile.difficultyScore * 100);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor} cursor-help`}>
              {config.icon}
              <span className="ml-1">{t(profile.currentLevel)}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('score')}: {progressPercent}% | {profile.exercisesCompleted} {t('exercises').toLowerCase()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-yellow-400/20 to-purple-400/20 z-10"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="text-6xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {config.icon}
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor} text-sm px-3 py-1`}>
            {t(profile.currentLevel)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {t('score')} : {progressPercent}%
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('progress')}</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="font-semibold text-foreground">{profile.exercisesCompleted}</p>
            <p className="text-xs text-muted-foreground">{t('exercises')}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">{Math.round(profile.successRate)}%</p>
            <p className="text-xs text-muted-foreground">{t('successRate')}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">{Math.round(profile.retentionRate)}%</p>
            <p className="text-xs text-muted-foreground">{t('retention')}</p>
          </div>
        </div>

        {(profile.strengthAreas.length > 0 || profile.weaknessAreas.length > 0) && (
          <div className="space-y-2 pt-2 border-t">
            {profile.strengthAreas.length > 0 && (
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{t('strengths')} :</span> {profile.strengthAreas.slice(0, 3).join(', ')}
                </p>
              </div>
            )}
            {profile.weaknessAreas.length > 0 && (
              <div className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{t('weaknesses')} :</span> {profile.weaknessAreas.slice(0, 3).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {profile.progressionMessage && (
          <p className="text-xs text-muted-foreground italic pt-1">
            {profile.progressionMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
