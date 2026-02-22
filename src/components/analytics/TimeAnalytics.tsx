'use client';

import React, { useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { TimeAnalytics as TimeAnalyticsType } from '@/types/analytics.types';
import { Clock, Calendar, TrendingUp, Zap } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TimeAnalyticsProps {
  timeAnalytics: TimeAnalyticsType;
}

export default function TimeAnalytics({ timeAnalytics }: TimeAnalyticsProps) {
  // Format time in hours and minutes
  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Prepare time by module chart data
  const moduleChartData = useMemo(() => {
    if (!timeAnalytics.time_by_module || timeAnalytics.time_by_module.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Time Spent (hours)',
          data: [0],
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1
        }]
      };
    }

    // Sort by time spent (descending) and take top 8 modules
    const sortedModules = [...timeAnalytics.time_by_module]
      .sort((a, b) => b.time_spent_seconds - a.time_spent_seconds)
      .slice(0, 8);

    return {
      labels: sortedModules.map(m => m.module_title),
      datasets: [
        {
          label: 'Time Spent (hours)',
          data: sortedModules.map(m => m.time_spent_seconds / 3600),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };
  }, [timeAnalytics.time_by_module]);

  const moduleChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animations for performance
    },
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + 'h';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: function(context) {
            const seconds = timeAnalytics.time_by_module[context.dataIndex]?.time_spent_seconds || 0;
            const hours = (seconds / 3600).toFixed(1);
            const percentage = timeAnalytics.time_by_module[context.dataIndex]?.percentage || 0;
            return [
              `Time: ${hours} hours`,
              `Percentage: ${percentage.toFixed(1)}%`
            ];
          }
        }
      }
    }
  };

  // Prepare time by day of week chart data
  const dayOfWeekChartData = useMemo(() => {
    if (!timeAnalytics.time_by_day_of_week || timeAnalytics.time_by_day_of_week.length === 0) {
      return {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [{
          label: 'Time Spent (hours)',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        }]
      };
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = new Array(7).fill(0);

    timeAnalytics.time_by_day_of_week.forEach(item => {
      dayData[item.day] = item.time_spent_seconds / 3600;
    });

    return {
      labels: dayNames,
      datasets: [
        {
          label: 'Time Spent (hours)',
          data: dayData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };
  }, [timeAnalytics.time_by_day_of_week]);

  const dayOfWeekChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animations for performance
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + 'h';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: function(context) {
            const hours = context.parsed.y.toFixed(1);
            return `Time: ${hours} hours`;
          }
        }
      }
    }
  };

  // Prepare time trend chart data
  const trendChartData = useMemo(() => {
    if (!timeAnalytics.time_trend || timeAnalytics.time_trend.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Daily Time (minutes)',
          data: [0],
          borderColor: 'rgb(251, 146, 60)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }

    // Sort by date and take last 30 days
    const sortedTrend = [...timeAnalytics.time_trend]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    const labels = sortedTrend.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Daily Time (minutes)',
          data: sortedTrend.map(point => point.time_spent_seconds / 60),
          borderColor: 'rgb(251, 146, 60)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(251, 146, 60)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };
  }, [timeAnalytics.time_trend]);

  const trendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animations for performance
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + ' min';
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
        callbacks: {
          label: function(context) {
            const minutes = Math.round(context.parsed.y);
            const hours = (minutes / 60).toFixed(1);
            return [
              `Time: ${minutes} minutes`,
              `(${hours} hours)`
            ];
          }
        }
      }
    }
  };

  // Calculate time statistics
  const hasData = timeAnalytics.total_time_seconds > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            Time Analytics
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Your learning time patterns and statistics
          </p>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Time Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total Time */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-700 font-medium">Total Learning Time</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {formatTime(timeAnalytics.total_time_seconds)}
              </p>
            </div>

            {/* Total Sessions */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-700 font-medium">Total Sessions</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {timeAnalytics.total_sessions}
              </p>
            </div>

            {/* Average Session */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm text-gray-700 font-medium">Avg. Session</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {formatTime(timeAnalytics.average_session_duration_seconds)}
              </p>
            </div>

            {/* Longest Session */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm text-gray-700 font-medium">Longest Session</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">
                {formatTime(timeAnalytics.longest_session_seconds)}
              </p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time by Module */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Time by Module</h3>
              <div className="h-64">
                <Bar data={moduleChartData} options={moduleChartOptions} />
              </div>
            </div>

            {/* Time by Day of Week */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Time by Day of Week</h3>
              <div className="h-64">
                <Bar data={dayOfWeekChartData} options={dayOfWeekChartOptions} />
              </div>
            </div>
          </div>

          {/* Time Trend Chart */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Learning Time Trend (Last 30 Days)</h3>
            <div className="h-64">
              <Line data={trendChartData} options={trendChartOptions} />
            </div>
          </div>

          {/* Learning Insights */}
          {timeAnalytics.total_sessions > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Learning Insights
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                {timeAnalytics.average_session_duration_seconds >= 1800 && (
                  <p>✨ Great focus! Your average session is over 30 minutes.</p>
                )}
                {timeAnalytics.average_session_duration_seconds < 1800 && timeAnalytics.average_session_duration_seconds > 0 && (
                  <p>💡 Try longer sessions (30+ minutes) for better retention.</p>
                )}
                {timeAnalytics.total_sessions >= 20 && (
                  <p>🔥 Excellent consistency with {timeAnalytics.total_sessions} learning sessions!</p>
                )}
                {timeAnalytics.longest_session_seconds >= 3600 && (
                  <p>🏆 Impressive! Your longest session was {formatTime(timeAnalytics.longest_session_seconds)}.</p>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No time data available yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Start learning to track your study time and patterns
          </p>
        </div>
      )}
    </div>
  );
}
