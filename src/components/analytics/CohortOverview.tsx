'use client';

import { Users, TrendingUp, Target, Clock, BookOpen, Award } from 'lucide-react';
import type { CohortOverviewData } from '@/lib/services/cohortAnalyticsService';

interface CohortOverviewProps {
  data: CohortOverviewData;
  isLoading: boolean;
}

export default function CohortOverview({ data, isLoading }: CohortOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Étudiants inscrits',
      value: data.totalStudents,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      label: 'Actifs (7j)',
      value: data.activeStudents,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-50'
    },
    {
      label: 'Taux complétion',
      value: `${data.averageCompletion}%`,
      icon: Target,
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    {
      label: 'Score moyen',
      value: `${data.averageScore}%`,
      icon: Award,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50'
    },
    {
      label: 'Capsules terminées',
      value: data.totalCapsuleCompletions,
      icon: BookOpen,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Temps/capsule',
      value: data.averageTimePerCapsule > 0
        ? `${Math.round(data.averageTimePerCapsule / 60)}min`
        : '-',
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 shadow-sm border`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-gray-600">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
