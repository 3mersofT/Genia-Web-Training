'use client';

import { useState, useEffect, useCallback } from 'react';
import { ONBOARDING_CURRENT_VERSION } from '@/lib/constants/onboarding';

interface UseOnboardingResult {
  /** Full 6-step tour for new accounts (onboarding_completed === false) */
  showFullOnboarding: boolean;
  /** Feature discovery button for existing accounts (completed but version < current) */
  showLiteOnboarding: boolean;
  /** Mark the full tour as completed */
  completeOnboarding: () => Promise<void>;
  /** Reset to trigger the full tour again */
  resetOnboarding: () => Promise<void>;
  /** Dismiss the lite feature discovery button */
  dismissLiteOnboarding: () => Promise<void>;
  /** Switch from lite mode to the full tour */
  startFullTourFromLite: () => void;
  loading: boolean;
}

export function useOnboarding(userId: string | undefined): UseOnboardingResult {
  const [showFullOnboarding, setShowFullOnboarding] = useState(false);
  const [showLiteOnboarding, setShowLiteOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkOnboarding = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          const profile = data.profile;
          const completed = profile?.onboarding_completed ?? true;
          const versionSeen = profile?.onboarding_version_seen ?? 0;
          const liteDismissed = profile?.onboarding_lite_dismissed ?? false;

          if (!completed) {
            // New account: show full 6-step tour
            setShowFullOnboarding(true);
            setShowLiteOnboarding(false);
          } else if (versionSeen < ONBOARDING_CURRENT_VERSION && !liteDismissed) {
            // Existing account: show lite feature discovery
            setShowFullOnboarding(false);
            setShowLiteOnboarding(true);
          }
        }
      } catch {
        // Fail silently
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, [userId]);

  const completeOnboarding = useCallback(async () => {
    try {
      await fetch('/api/user/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      setShowFullOnboarding(false);
      setShowLiteOnboarding(false);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      const res = await fetch('/api/user/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.ok) {
        setShowFullOnboarding(true);
        setShowLiteOnboarding(false);
      }
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  }, []);

  const dismissLiteOnboarding = useCallback(async () => {
    try {
      await fetch('/api/user/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss_lite' }),
      });
      setShowLiteOnboarding(false);
    } catch (error) {
      console.error('Failed to dismiss lite onboarding:', error);
    }
  }, []);

  const startFullTourFromLite = useCallback(() => {
    setShowLiteOnboarding(false);
    setShowFullOnboarding(true);
  }, []);

  return {
    showFullOnboarding,
    showLiteOnboarding,
    completeOnboarding,
    resetOnboarding,
    dismissLiteOnboarding,
    startFullTourFromLite,
    loading,
  };
}
