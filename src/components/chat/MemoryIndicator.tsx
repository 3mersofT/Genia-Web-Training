'use client';

import { useState } from 'react';
import { 
  Brain, TrendingUp, Target, Sparkles, ChevronDown, 
  ChevronUp, AlertCircle, CheckCircle, Clock, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryContext, SessionMetrics } from '@/types/geniaMemory.types';

interface MemoryIndicatorProps {
  context: MemoryContext | null;
  metrics: SessionMetrics | null;
  isActive: boolean;
  onStyleChange?: (style: 'visual' | 'textual' | 'practical' | 'mixed') => void;
}

export default function MemoryIndicator({ 
  context, 
  metrics, 
  isActive,
  onStyleChange 
}: MemoryIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isActive || !context) {
    return null;
  }

  const getLearningStyleIcon = () => {
    switch (context.learningStyle) {
      case 'visual': return '👁️';
      case 'textual': return '📝';
      case 'practical': return '🛠️';
      default: return '🎯';
    }
  };

  const getSkillLevelColor = () => {
    switch (context.skillLevel) {
      case 'expert': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30';
      case 'advanced': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30';
      case 'intermediate': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 max-w-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden"
      >
        {/* Header compact */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] flex items-center justify-between hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-950/40 dark:hover:to-purple-950/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-5 h-5 text-blue-600" />
              {context.currentProgress > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                />
              )}
            </div>
            <span className="font-medium text-foreground">
              Mémoire Active
            </span>
            {context.streakDays > 0 && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                🔥 {context.streakDays}j
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Indicateurs compacts toujours visibles */}
        <div className="px-4 py-2 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            {/* Style d'apprentissage */}
            <div className="flex items-center gap-1">
              <span className="text-lg">{getLearningStyleIcon()}</span>
              <span className="text-xs text-muted-foreground">
                {context.learningStyle}
              </span>
            </div>

            {/* Niveau */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor()}`}>
              {context.skillLevel}
            </div>

            {/* Progression */}
            {context.currentProgress > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-12 h-1.5 bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${context.currentProgress}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {context.currentProgress}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contenu étendu */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border"
            >
              <div className="p-4 space-y-3">
                {/* Métriques de session */}
                {metrics && (
                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    <h4 className="text-xs font-medium text-foreground mb-2">
                      Session actuelle
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {metrics.duration} min
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        <span className="text-muted-foreground">
                          {metrics.interactions} interactions
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-muted-foreground">
                          {Math.round(metrics.successRate)}% succès
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-blue-500" />
                        <span className="text-muted-foreground">
                          {metrics.topics.length} sujets
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Points de difficulté */}
                {context.keyDifficulties.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-foreground flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-orange-500" />
                      Points d'attention
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {context.keyDifficulties.slice(0, 3).map((difficulty, index) => (
                        <span
                          key={index}
                          className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full"
                        >
                          {difficulty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approches qui fonctionnent */}
                {context.successfulApproaches.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-foreground flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Méthodes efficaces
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {context.successfulApproaches.slice(0, 3).map((approach, index) => (
                        <span
                          key={index}
                          className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full"
                        >
                          {approach}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommandations */}
                {context.recommendedFocus.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      Focus suggéré
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {context.recommendedFocus.slice(0, 2).map((focus, index) => (
                        <span
                          key={index}
                          className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full"
                        >
                          {focus}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions rapides */}
                <div className="pt-2 border-t border-border">
                  <h4 className="text-xs font-medium text-foreground mb-2">
                    Ajuster le style
                  </h4>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => onStyleChange?.('visual')}
                      className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition-colors ${
                        context.learningStyle === 'visual'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <span>👁️</span>
                      <span>Visuel</span>
                    </button>
                    <button
                      onClick={() => onStyleChange?.('textual')}
                      className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition-colors ${
                        context.learningStyle === 'textual'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <span>📝</span>
                      <span>Textuel</span>
                    </button>
                    <button
                      onClick={() => onStyleChange?.('practical')}
                      className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition-colors ${
                        context.learningStyle === 'practical'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <span>🛠️</span>
                      <span>Pratique</span>
                    </button>
                    <button
                      onClick={() => onStyleChange?.('mixed')}
                      className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition-colors ${
                        context.learningStyle === 'mixed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <span>🎯</span>
                      <span>Mixte</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
