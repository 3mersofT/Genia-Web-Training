'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Brain } from 'lucide-react';
import Link from 'next/link';
import ReviewDashboard from '@/components/review/ReviewDashboard';
import ReviewSession from '@/components/review/ReviewSession';
import { getCapsuleById, getCapsuleContent } from '@/lib/data';
import type { SM2Quality } from '@/lib/services/spacedRepetitionService';

interface CardWithContent {
  id: string;
  capsuleId: string;
  capsuleTitle: string;
  moduleTitle: string;
  sections?: Record<string, any>;
}

export default function ReviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCards: 0,
    cardsDueToday: 0,
    totalReviews: 0,
    averageEasiness: 2.5,
    retentionRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReviewDate: null as string | null
  });
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [sessionCards, setSessionCards] = useState<CardWithContent[]>([]);
  const [showSession, setShowSession] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [statsRes, dueRes] = await Promise.all([
        fetch('/api/review?type=stats'),
        fetch('/api/review?type=due')
      ]);

      if (statsRes.ok) {
        const { stats: s } = await statsRes.json();
        setStats({
          totalCards: s.total_cards || 0,
          cardsDueToday: s.cards_due_today || 0,
          totalReviews: s.total_reviews || 0,
          averageEasiness: s.average_easiness || 2.5,
          retentionRate: s.retention_rate || 0,
          currentStreak: s.current_streak || 0,
          longestStreak: s.longest_streak || 0,
          lastReviewDate: s.last_review_date || null
        });
      }

      if (dueRes.ok) {
        const { cards } = await dueRes.json();
        setDueCards(cards || []);
      }
    } catch (error) {
      console.error('Erreur chargement données révision:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartReview = async () => {
    const cardsWithContent: CardWithContent[] = [];

    for (const card of dueCards) {
      try {
        const [capsuleData, capsuleContent] = await Promise.all([
          getCapsuleById(card.capsule_id),
          getCapsuleContent(card.capsule_id)
        ]);

        cardsWithContent.push({
          id: card.id,
          capsuleId: card.capsule_id,
          capsuleTitle: capsuleData?.title || card.capsule_id,
          moduleTitle: capsuleData?.moduleId || '',
          sections: capsuleContent?.sections
        });
      } catch {
        cardsWithContent.push({
          id: card.id,
          capsuleId: card.capsule_id,
          capsuleTitle: card.capsule_id,
          moduleTitle: '',
        });
      }
    }

    setSessionCards(cardsWithContent);
    setShowSession(true);
  };

  const handleRate = async (cardId: string, capsuleId: string, quality: SM2Quality) => {
    await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'review',
        cardId,
        capsuleId,
        quality,
        timeSpentSeconds: 0
      })
    });
  };

  const handleCloseSession = () => {
    setShowSession(false);
    loadData();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--gradient-start))] via-background to-[hsl(var(--gradient-end))]">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--gradient-start))] via-background to-[hsl(var(--gradient-end))]">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Révisions</h1>
                <p className="text-muted-foreground">Système de révision espacée SM-2</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <ReviewDashboard
          stats={stats}
          dueCount={dueCards.length}
          onStartReview={handleStartReview}
        />
      </div>

      {/* Session modal */}
      {showSession && sessionCards.length > 0 && (
        <ReviewSession
          cards={sessionCards}
          onRate={handleRate}
          onClose={handleCloseSession}
        />
      )}
    </div>
  );
}
