'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, TrendingUp, Users } from 'lucide-react';

interface FeedbackStatsProps {
  targetType: 'module' | 'capsule' | 'platform';
  targetId: string;
  showDetails?: boolean;
}

interface StatsData {
  total_feedbacks: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  category_stats: Record<string, number>;
}

export default function FeedbackStats({ targetType, targetId, showDetails = false }: FeedbackStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [targetType, targetId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/feedback/stats?targetType=${targetType}&targetId=${targetId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur récupération stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-4 h-4 border-2 border-muted-foreground border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (!stats || stats.total_feedbacks === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Star className="w-4 h-4" />
        <span className="text-sm">Aucun feedback</span>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-3">
      {/* Note moyenne et nombre de feedbacks */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {renderStars(Math.round(stats.average_rating))}
          <span className={`font-semibold ${getRatingColor(stats.average_rating)}`}>
            {stats.average_rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">{stats.total_feedbacks} feedback{stats.total_feedbacks > 1 ? 's' : ''}</span>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-3">
          {/* Distribution des notes */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Distribution des notes</h4>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.rating_distribution[rating.toString()] || 0;
                const percentage = stats.total_feedbacks > 0 ? (count / stats.total_feedbacks) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-3">{rating}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats par catégorie */}
          {Object.keys(stats.category_stats).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Par catégorie</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.category_stats).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm text-muted-foreground capitalize">{category}</span>
                    <span className="text-sm font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
