'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Brain, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { getQualityColor, type SM2Quality } from '@/lib/services/spacedRepetitionService';

interface ReviewCardProps {
  capsuleTitle: string;
  capsuleId: string;
  moduleTitle: string;
  sections?: Record<string, any>;
  onRate: (quality: SM2Quality) => void;
  isSubmitting: boolean;
}

export default function ReviewCard({
  capsuleTitle,
  capsuleId,
  moduleTitle,
  sections,
  onRate,
  isSubmitting
}: ReviewCardProps) {
  const t = useTranslations('review');
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const hook = sections?.hook;
  const keyPoint = sections?.recap?.keyPoint;
  const concept = sections?.concept?.content;

  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-blue-100 text-sm">{moduleTitle}</p>
            <h2 className="text-lg font-bold">{capsuleTitle}</h2>
          </div>
          <div className="flex items-center gap-1 text-blue-100 text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeElapsed)}</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-foreground">{t('questionPrompt')}</h3>
          </div>

          {hook?.text && (
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-foreground text-sm">
              <p className="font-medium text-blue-800 mb-1">{t('hint')}</p>
              <p>{hook.text}</p>
            </div>
          )}
        </div>

        {/* Bouton révéler */}
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full py-3 bg-muted hover:bg-accent text-foreground font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t('revealAnswer')}
          </button>
        ) : (
          <>
            {/* Réponse */}
            <div className="mb-6 space-y-3">
              {keyPoint && (
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200">
                  <p className="font-medium text-green-800 dark:text-green-200 mb-1">{t('keyPoint')}</p>
                  <p className="text-green-700 dark:text-green-300 text-sm">{keyPoint}</p>
                </div>
              )}

              {concept && (
                <button
                  onClick={() => {
                    const el = document.getElementById(`concept-${capsuleId}`);
                    if (el) el.classList.toggle('hidden');
                  }}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
                >
                  <ChevronDown className="w-4 h-4" />
                  {t('viewFullConcept')}
                </button>
              )}
              {concept && (
                <div id={`concept-${capsuleId}`} className="hidden bg-purple-50 p-4 rounded-lg text-sm text-foreground max-h-48 overflow-y-auto">
                  {concept.substring(0, 500)}{concept.length > 500 ? '...' : ''}
                </div>
              )}
            </div>

            {/* Boutons de notation */}
            <div>
              <p className="text-sm text-muted-foreground mb-3 text-center">
                {t('rateRecall')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {([0, 1, 2, 3, 4, 5] as SM2Quality[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => onRate(q)}
                    disabled={isSubmitting}
                    className={`py-2.5 px-3 rounded-lg text-white text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${getQualityColor(q)}`}
                  >
                    <span className="block text-lg">{q}</span>
                    <span className="block text-xs opacity-90">{t(`quality.${q}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
