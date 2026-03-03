'use client';

import { Activity } from 'lucide-react';
import type { ActivityHeatmapData } from '@/lib/services/cohortAnalyticsService';

interface ActivityHeatmapProps {
  data: ActivityHeatmapData[];
  isLoading: boolean;
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const HOUR_LABELS = ['0h', '', '', '3h', '', '', '6h', '', '', '9h', '', '', '12h', '', '', '15h', '', '', '18h', '', '', '21h', '', ''];

export default function ActivityHeatmap({ data, isLoading }: ActivityHeatmapProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-44" />
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getColor = (count: number): string => {
    if (count === 0) return 'bg-gray-100';
    const intensity = count / maxCount;
    if (intensity > 0.75) return 'bg-green-600';
    if (intensity > 0.5) return 'bg-green-400';
    if (intensity > 0.25) return 'bg-green-300';
    return 'bg-green-200';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900">Activité par créneau</h3>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">Pas encore de données d'activité.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Labels des heures */}
              <div className="flex mb-1 ml-10">
                {HOUR_LABELS.map((label, i) => (
                  <div key={i} className="flex-1 text-center text-xs text-gray-400">
                    {label}
                  </div>
                ))}
              </div>

              {/* Grid */}
              {DAY_LABELS.map((dayLabel, day) => (
                <div key={day} className="flex items-center gap-1 mb-1">
                  <span className="w-8 text-xs text-gray-500 text-right">{dayLabel}</span>
                  <div className="flex-1 flex gap-0.5">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const cell = data.find(d => d.day === day && d.hour === hour);
                      const count = cell?.count || 0;
                      return (
                        <div
                          key={hour}
                          className={`flex-1 h-5 rounded-sm ${getColor(count)} transition-colors`}
                          title={`${dayLabel} ${hour}h: ${count} activité${count > 1 ? 's' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Légende */}
          <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
            <span>Moins</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-gray-100" />
              <div className="w-3 h-3 rounded-sm bg-green-200" />
              <div className="w-3 h-3 rounded-sm bg-green-300" />
              <div className="w-3 h-3 rounded-sm bg-green-400" />
              <div className="w-3 h-3 rounded-sm bg-green-600" />
            </div>
            <span>Plus</span>
          </div>
        </>
      )}
    </div>
  );
}
