'use client';

import { AlertTriangle, TrendingDown, Clock, Target } from 'lucide-react';
import type { BottleneckData } from '@/lib/services/cohortAnalyticsService';

interface BottleneckAnalysisProps {
  data: BottleneckData[];
  isLoading: boolean;
}

export default function BottleneckAnalysis({ data, isLoading }: BottleneckAnalysisProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topBottlenecks = data.slice(0, 10);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">Points de blocage</h3>
      </div>

      {topBottlenecks.length === 0 ? (
        <p className="text-gray-500 text-sm">Pas encore assez de données pour identifier les points de blocage.</p>
      ) : (
        <div className="space-y-3">
          {topBottlenecks.map((item, index) => (
            <div
              key={item.capsuleId}
              className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                item.dropOffRate >= 50 ? 'bg-red-100 text-red-700' :
                item.dropOffRate >= 30 ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.capsuleTitle}
                </p>
                <p className="text-xs text-gray-500">{item.moduleTitle}</p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1" title="Taux d'abandon">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  <span className={`font-medium ${
                    item.dropOffRate >= 50 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {item.dropOffRate}%
                  </span>
                </div>
                <div className="flex items-center gap-1" title="Score moyen">
                  <Target className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-gray-600">{item.averageScore}%</span>
                </div>
                <div className="flex items-center gap-1" title="Temps moyen">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600">{Math.round(item.averageTime / 60)}min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
