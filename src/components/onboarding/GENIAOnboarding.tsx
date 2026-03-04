'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, PartyPopper, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import SpotlightOverlay from './SpotlightOverlay';

interface GENIAOnboardingProps {
  userId: string;
  onComplete: () => void;
}

const TOTAL_STEPS = 6;

const SPOTLIGHT_STEPS: Record<number, string> = {
  2: '[data-onboarding="adaptive-level"]',
  3: '[data-onboarding="spaced-repetition"]',
  4: '[data-onboarding="chat-link"]',
  5: '[data-onboarding="modules"]',
};

export default function GENIAOnboarding({ userId, onComplete }: GENIAOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const t = useTranslations('onboarding');

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const progressValue = (currentStep / TOTAL_STEPS) * 100;

  // Steps 2-5 use spotlight overlay
  if (currentStep >= 2 && currentStep <= 5) {
    const stepKey = `step${currentStep}` as const;
    return (
      <SpotlightOverlay
        targetSelector={SPOTLIGHT_STEPS[currentStep]}
        title={t(`${stepKey}.title`)}
        message={t(`${stepKey}.message`)}
        step={currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onSkip={handleSkip}
      />
    );
  }

  // Steps 1 and 6 use modal dialog
  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Progress bar */}
        <div className="px-6 pt-5">
          <Progress value={progressValue} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t('stepOf', { current: currentStep, total: TOTAL_STEPS })}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="px-6 pb-6 pt-4"
            >
              {/* GENIA Avatar */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <DialogTitle className="text-xl font-bold text-foreground mb-2">
                  {t('step1.title')}
                </DialogTitle>
                <p className="text-foreground leading-relaxed mb-6">
                  {t('step1.message')}
                </p>

                <button
                  onClick={handleNext}
                  className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {t('step1.cta')}
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={handleSkip}
                  className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('step1.skip')}
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="px-6 pb-6 pt-4"
            >
              <div className="flex flex-col items-center text-center">
                {/* Celebration */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                  <PartyPopper className="w-10 h-10 text-white" />
                </div>
                <DialogTitle className="text-xl font-bold text-foreground mb-2">
                  {t('step6.title')}
                </DialogTitle>
                <p className="text-foreground leading-relaxed mb-6">
                  {t('step6.message')}
                </p>

                <button
                  onClick={handleNext}
                  className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {t('step6.cta')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
