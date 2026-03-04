'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SpotlightOverlayProps {
  targetSelector: string;
  message: string;
  title: string;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function SpotlightOverlay({
  targetSelector,
  message,
  title,
  step,
  totalSteps,
  onNext,
  onSkip,
}: SpotlightOverlayProps) {
  const t = useTranslations('onboarding');
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const padding = 12;

  const updateRect = useCallback(() => {
    const el = document.querySelector(targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Delay measurement to allow scroll to settle
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        setRect({
          top: r.top + window.scrollY - padding,
          left: r.left + window.scrollX - padding,
          width: r.width + padding * 2,
          height: r.height + padding * 2,
        });
      }, 350);
    }
  }, [targetSelector]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  // Tooltip position: below the spotlight, or above if near bottom
  const tooltipStyle: React.CSSProperties = rect
    ? {
        position: 'absolute',
        top: rect.top + rect.height + 16,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 400)),
        maxWidth: 380,
        zIndex: 10002,
      }
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 380, zIndex: 10002 };

  return (
    <div className="fixed inset-0 z-[10000]" style={{ pointerEvents: 'auto' }}>
      {/* Dark overlay with cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ height: document.documentElement.scrollHeight, minHeight: '100vh' }}
      >
        <defs>
          <mask id={`spotlight-mask-${step}`}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask={`url(#spotlight-mask-${step})`}
        />
        {/* Spotlight border ring */}
        {rect && (
          <rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx="12"
            fill="none"
            stroke="rgb(139, 92, 246)"
            strokeWidth="3"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Tooltip card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        style={tooltipStyle}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl p-5">
          {/* GENIA avatar + title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('geniaName')}</p>
              <p className="font-semibold text-foreground text-sm">{title}</p>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-foreground leading-relaxed mb-4">{message}</p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('skip')}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {t('stepOf', { current: step, total: totalSteps })}
              </span>
              <button
                onClick={onNext}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-violet-700 hover:to-blue-700 transition-all"
              >
                {t('next')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
