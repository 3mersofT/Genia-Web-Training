'use client';

import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { ScoreTrendPoint } from '@/types/analytics.types';
import { TrendingUp, TrendingDown, BarChart3, Target, Loader2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ScoreTrendChartProps {
  scoreTrend: ScoreTrendPoint[];
  loading?: boolean;
}

export default function ScoreTrendChart({ scoreTrend, loading = false }: ScoreTrendChartProps) {
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!scoreTrend || scoreTrend.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Exercise Scores',
          data: [0],
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      };
    }

    // Sort by date
    const sortedTrend = [...scoreTrend].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Format dates for display
    const labels = sortedTrend.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Exercise Score (%)',
          data: sortedTrend.map(point => point.score),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: 'rgb(99, 102, 241)',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3
        }
      ]
    };
  }, [scoreTrend]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animations for performance
    },
    scales: {
      y: {
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
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: function(context) {
            const index = context[0].dataIndex;
            const point = scoreTrend[index];
            if (!point) return '';
            return point.capsule_title;
          },
          label: function(context) {
            const index = context.dataIndex;
            const point = scoreTrend[index];
            if (!point) return '';

            const timeSpentMinutes = Math.round(point.time_spent_seconds / 60);

            return [
              `Score: ${point.score}%`,
              `Module: ${point.module_title}`,
              `Attempts: ${point.exercise_attempts}`,
              `Time spent: ${timeSpentMinutes} min`
            ];
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  // Calculate score statistics and trends
  const scoreStats = useMemo(() => {
    if (!scoreTrend || scoreTrend.length === 0) {
      return {
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        trend: 'neutral' as 'improving' | 'declining' | 'neutral',
        trendPercentage: 0,
        totalExercises: 0
      };
    }

    const scores = scoreTrend.map(p => p.score);
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Calculate trend (compare first half vs second half)
    let trend: 'improving' | 'declining' | 'neutral' = 'neutral';
    let trendPercentage = 0;

    if (scoreTrend.length >= 4) {
      const midpoint = Math.floor(scoreTrend.length / 2);
      const sortedByDate = [...scoreTrend].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const firstHalf = sortedByDate.slice(0, midpoint);
      const secondHalf = sortedByDate.slice(midpoint);

      const firstAvg = firstHalf.reduce((sum, p) => sum + p.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, p) => sum + p.score, 0) / secondHalf.length;

      const difference = secondAvg - firstAvg;
      trendPercentage = Math.abs(difference);

      if (difference > 5) {
        trend = 'improving';
      } else if (difference < -5) {
        trend = 'declining';
      }
    }

    return {
      averageScore,
      highestScore,
      lowestScore,
      trend,
      trendPercentage,
      totalExercises: scoreTrend.length
    };
  }, [scoreTrend]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              Score Trend Over Time
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your exercise performance progression
            </p>
          </div>
        </div>

        {/* Loading Skeleton */}
        <div className="h-80 mb-6 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading score data...</p>
          </div>
        </div>

        {/* Loading Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="p-2 bg-muted rounded-lg w-9 h-9" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-6 bg-muted rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Score Trend Over Time
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your exercise performance progression
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Score Statistics */}
      {scoreTrend && scoreTrend.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
          {/* Average Score */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-lg font-bold text-foreground">
                {scoreStats.averageScore.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Highest Score */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Highest Score</p>
              <p className="text-lg font-bold text-foreground">
                {scoreStats.highestScore}%
              </p>
            </div>
          </div>

          {/* Performance Trend */}
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              scoreStats.trend === 'improving' ? 'bg-green-100 dark:bg-green-900/30' :
              scoreStats.trend === 'declining' ? 'bg-orange-100' :
              'bg-muted'
            }`}>
              {scoreStats.trend === 'improving' ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : scoreStats.trend === 'declining' ? (
                <TrendingDown className="w-5 h-5 text-orange-600" />
              ) : (
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trend</p>
              <p className="text-sm font-bold text-foreground capitalize">
                {scoreStats.trend}
              </p>
              {scoreStats.trend !== 'neutral' && (
                <p className="text-xs text-muted-foreground">
                  {scoreStats.trend === 'improving' ? '+' : '-'}
                  {scoreStats.trendPercentage.toFixed(1)}%
                </p>
              )}
            </div>
          </div>

          {/* Total Exercises */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Exercises</p>
              <p className="text-lg font-bold text-foreground">
                {scoreStats.totalExercises}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!scoreTrend || scoreTrend.length === 0) && (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No score data available yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete exercises to see your performance trend
          </p>
        </div>
      )}
    </div>
  );
}
