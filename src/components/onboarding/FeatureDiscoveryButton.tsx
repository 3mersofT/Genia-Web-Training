'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, RefreshCw, MessageCircle, BookOpen, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FEATURE_TIPS } from '@/lib/constants/onboarding';
import SpotlightOverlay from './SpotlightOverlay';

interface FeatureDiscoveryButtonProps {
  onDismiss: () => void;
  onStartFullTour: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Brain,
  RefreshCw,
  MessageCircle,
  BookOpen,
};

const TIP_TRANSLATION_KEYS: Record<string, string> = {
  'adaptive-level': 'tip_adaptive',
  'spaced-repetition': 'tip_spaced',
  'chat-link': 'tip_chat',
  'modules': 'tip_modules',
};

// Map tip IDs to the full tour step keys for spotlight messages
const TIP_STEP_KEYS: Record<string, { titleKey: string; messageKey: string }> = {
  'adaptive-level': { titleKey: 'step2.title', messageKey: 'step2.message' },
  'spaced-repetition': { titleKey: 'step3.title', messageKey: 'step3.message' },
  'chat-link': { titleKey: 'step4.title', messageKey: 'step4.message' },
  'modules': { titleKey: 'step5.title', messageKey: 'step5.message' },
};

export default function FeatureDiscoveryButton({
  onDismiss,
  onStartFullTour,
}: FeatureDiscoveryButtonProps) {
  const t = useTranslations('onboarding');
  const tl = useTranslations('onboarding.lite');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTipId, setActiveTipId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleTipClick = useCallback((tipId: string) => {
    setIsOpen(false);
    setActiveTipId(tipId);
  }, []);

  const handleCloseSpotlight = useCallback(() => {
    setActiveTipId(null);
  }, []);

  // While showing a spotlight, render it
  if (activeTipId) {
    const tip = FEATURE_TIPS.find((t) => t.id === activeTipId);
    const stepKeys = TIP_STEP_KEYS[activeTipId];
    if (tip && stepKeys) {
      return (
        <SpotlightOverlay
          targetSelector={tip.selector}
          title={t(stepKeys.titleKey)}
          message={t(stepKeys.messageKey)}
          step={0}
          totalSteps={0}
          onNext={handleCloseSpotlight}
          onSkip={handleCloseSpotlight}
          nextLabel={tl('gotIt')}
          hideStepInfo
        />
      );
    }
  }

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {/* Popover menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-80 mb-2"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{tl('title')}</p>
                    <p className="text-white/70 text-xs">{tl('subtitle')}</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="ml-auto p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Tips list */}
              <div className="p-2">
                {FEATURE_TIPS.map((tip) => {
                  const Icon = ICON_MAP[tip.icon];
                  const translationKey = TIP_TRANSLATION_KEYS[tip.id];
                  return (
                    <button
                      key={tip.id}
                      onClick={() => handleTipClick(tip.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <p className="text-sm text-foreground leading-snug">
                        {tl(translationKey)}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div className="border-t border-border px-3 py-2.5 space-y-1.5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onStartFullTour();
                  }}
                  className="w-full text-sm text-center py-2 px-3 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium hover:from-violet-700 hover:to-blue-700 transition-all"
                >
                  {tl('startFullTour')}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onDismiss();
                  }}
                  className="w-full text-xs text-center py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tl('dismiss')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" style={{ animationDuration: '2.5s' }} />
        <Brain className="w-6 h-6 text-white relative z-10" />

        {/* Badge */}
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold z-10">
          {FEATURE_TIPS.length}
        </span>
      </motion.button>
    </div>
  );
}
