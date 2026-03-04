'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseOnboardingResult {
  showOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  loading: boolean;
}

export function useOnboarding(userId: string | undefined): UseOnboardingResult {
  const [showOnboarding, setShowOnboarding] = useState(false);
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
          const completed = data.profile?.onboarding_completed ?? true;
          setShowOnboarding(!completed);
        }
      } catch {
        // Fail silently - don't show onboarding if we can't check
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, [userId]);

  const completeOnboarding = useCallback(async () => {
    try {
      await fetch('/api/user/onboarding-complete', { method: 'POST' });
      setShowOnboarding(false);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      const res = await fetch('/api/user/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      if (res.ok) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  }, []);

  return { showOnboarding, completeOnboarding, resetOnboarding, loading };
}
