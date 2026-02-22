'use client';

import React, { useMemo } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { SkillCompetency } from '@/types/analytics.types';
import { Target, TrendingUp, Award, Loader2 } from 'lucide-react';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface SkillRadarChartProps {
  skills: SkillCompetency[];
  loading?: boolean;
}

export default function SkillRadarChart({ skills, loading = false }: SkillRadarChartProps) {
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!skills || skills.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Competency Level',
          data: [0],
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(99, 102, 241)'
        }]
      };
    }

    return {
      labels: skills.map(skill => skill.skill_name),
      datasets: [
        {
          label: 'Competency Level (%)',
          data: skills.map(skill => skill.competency_level),
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(99, 102, 241)',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }, [skills]);

  const chartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 20,
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            const skillIndex = context.dataIndex;
            const skill = skills[skillIndex];
            if (!skill) return '';

            return [
              `Competency: ${skill.competency_level}%`,
              `Completed: ${skill.capsules_completed}/${skill.total_capsules} capsules`,
              skill.average_score !== null
                ? `Avg Score: ${skill.average_score.toFixed(1)}%`
                : 'No scores yet'
            ];
          }
        }
      }
    }
  };

  // Calculate skill statistics
  const skillStats = useMemo(() => {
    if (!skills || skills.length === 0) {
      return {
        strongestSkill: null,
        weakestSkill: null,
        averageCompetency: 0
      };
    }

    const sorted = [...skills].sort((a, b) => b.competency_level - a.competency_level);
    const averageCompetency = skills.reduce((sum, s) => sum + s.competency_level, 0) / skills.length;

    return {
      strongestSkill: sorted[0],
      weakestSkill: sorted[sorted.length - 1],
      averageCompetency
    };
  }, [skills]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              Skill Competency Radar
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Your proficiency across different prompt engineering skills
            </p>
          </div>
        </div>

        {/* Loading Skeleton */}
        <div className="h-80 mb-6 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading skill data...</p>
          </div>
        </div>

        {/* Loading Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="p-2 bg-gray-200 rounded-lg w-9 h-9" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-16 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Skill Competency Radar
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Your proficiency across different prompt engineering skills
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <Radar data={chartData} options={chartOptions} />
      </div>

      {/* Skill Statistics */}
      {skills && skills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {/* Average Competency */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Competency</p>
              <p className="text-lg font-bold text-gray-900">
                {skillStats.averageCompetency.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Strongest Skill */}
          {skillStats.strongestSkill && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Strongest Skill</p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {skillStats.strongestSkill.skill_name}
                </p>
                <p className="text-xs text-gray-500">
                  {skillStats.strongestSkill.competency_level}% proficiency
                </p>
              </div>
            </div>
          )}

          {/* Weakest Skill (Growth Area) */}
          {skillStats.weakestSkill && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Growth Area</p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {skillStats.weakestSkill.skill_name}
                </p>
                <p className="text-xs text-gray-500">
                  {skillStats.weakestSkill.competency_level}% proficiency
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {(!skills || skills.length === 0) && (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No skill data available yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Complete more capsules to see your skill competencies
          </p>
        </div>
      )}
    </div>
  );
}
