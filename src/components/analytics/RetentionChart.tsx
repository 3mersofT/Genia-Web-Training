'use client';

import { Users, TrendingDown } from 'lucide-react';
import type { RetentionData } from '@/lib/services/cohortAnalyticsService';

interface RetentionChartProps {
  data: RetentionData[];
  isLoading: boolean;
}

export default function RetentionChart({ data, isLoading }: RetentionChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-40" />
          <div className="h-48 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  const maxRate = Math.max(...data.map(d => d.retentionRate), 100);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">Rétention par semaine</h3>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">Pas encore assez de données pour l'analyse de rétention.</p>
      ) : (
        <>
          {/* Bar chart */}
          <div className="flex items-end gap-2 h-48 mb-4">
            {data.map((d) => {
              const height = maxRate > 0 ? (d.retentionRate / maxRate) * 100 : 0;
              const color = d.retentionRate >= 70 ? 'bg-green-400' :
                           d.retentionRate >= 40 ? 'bg-yellow-400' : 'bg-red-400';

              return (
                <div key={d.week} className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-gray-600 mb-1">{d.retentionRate}%</span>
                  <div
                    className={`w-full rounded-t ${color} transition-all duration-500`}
                    style={{ height: `${height}%`, minHeight: d.retentionRate > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-gray-500 mt-1">{d.weekLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
            <span>{data[0]?.totalUsers || 0} utilisateurs au total</span>
            {data.length > 1 && (
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {data[0]?.retentionRate - (data[data.length - 1]?.retentionRate || 0)}% de perte sur {data.length} semaines
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
