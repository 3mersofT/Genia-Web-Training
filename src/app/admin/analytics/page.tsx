'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Brain, TrendingUp, AlertCircle, DollarSign, BarChart3,
  Calendar, Download, Filter, RefreshCw, Zap, Cpu, Activity
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UsageData {
  date: string;
  model: string;
  request_count: number;
  total_tokens: number;
  total_cost: number;
}

interface UserUsage {
  user_id: string;
  email: string;
  display_name: string;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
}

interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  rate: number;
}

export default function AIUsagePage() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [topUsers, setTopUsers] = useState<UserUsage[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({ total: 0, positive: 0, negative: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedModel, setSelectedModel] = useState<'all' | 'magistral-medium' | 'mistral-medium-3' | 'mistral-small'>('all');

  const supabase = createClient();

  // Configuration des modèles et quotas
  const modelConfig = {
    'magistral-medium': {
      name: 'Magistral Medium',
      color: 'rgb(99, 102, 241)',
      dailyQuota: 60,
      costPerMillion: { input: 2, output: 6 }
    },
    'mistral-medium-3': {
      name: 'Mistral Medium 3',
      color: 'rgb(16, 185, 129)',
      dailyQuota: 300,
      costPerMillion: { input: 1.5, output: 4.5 }
    },
    'mistral-small': {
      name: 'Mistral Small',
      color: 'rgb(251, 146, 60)',
      dailyQuota: 1000,
      costPerMillion: { input: 0.25, output: 0.25 }
    }
  };

  const fetchUsageData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      if (dateRange === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (dateRange === '30d') startDate.setDate(startDate.getDate() - 30);
      else startDate.setDate(startDate.getDate() - 90);

      let query = supabase
        .from('llm_usage')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (selectedModel !== 'all') {
        query = query.eq('model', selectedModel);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsageData(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // Si pas de données, utiliser un tableau vide
      setUsageData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedModel, supabase]);

  const fetchTopUsers = useCallback(async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data, error } = await supabase
        .from('llm_usage')
        .select(`
          user_id,
          request_count,
          total_tokens,
          total_cost,
          user_profiles!inner(email, display_name)
        `)
        .gte('date', startDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Agréger par utilisateur
      const userMap = new Map<string, UserUsage>();
      
      data?.forEach((record: any) => {
        const userId = record.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            email: record.user_profiles?.email || 'N/A',
            display_name: record.user_profiles?.display_name || 'Utilisateur',
            total_requests: 0,
            total_tokens: 0,
            total_cost: 0
          });
        }
        
        const user = userMap.get(userId)!;
        user.total_requests += record.request_count || 0;
        user.total_tokens += record.total_tokens || 0;
        user.total_cost += record.total_cost || 0;
      });

      const sortedUsers = Array.from(userMap.values())
        .sort((a, b) => b.total_cost - a.total_cost)
        .slice(0, 10);

      setTopUsers(sortedUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des top utilisateurs:', error);
      setTopUsers([]);
    }
  }, [supabase]);

  const fetchFeedbackStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('message_feedback')
        .select('feedback');

      if (error) throw error;

      const total = data?.length || 0;
      const positive = data?.filter((d: { feedback: string }) => d.feedback === 'up').length || 0;
      const negative = data?.filter((d: { feedback: string }) => d.feedback === 'down').length || 0;

      setFeedbackStats({
        total,
        positive,
        negative,
        rate: total > 0 ? Math.round((positive / total) * 100) : 0,
      });
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsageData();
    fetchTopUsers();
    fetchFeedbackStats();
  }, [fetchUsageData, fetchTopUsers, fetchFeedbackStats]);

  // Calcul des statistiques avec mémoire
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = usageData.filter(d => d.date === today);
    
    const totalRequests = usageData.reduce((sum, d) => sum + (d.request_count || 0), 0);
    const totalTokens = usageData.reduce((sum, d) => sum + (d.total_tokens || 0), 0);
    const totalCost = usageData.reduce((sum, d) => sum + (d.total_cost || 0), 0);
    const todayRequests = todayUsage.reduce((sum, d) => sum + (d.request_count || 0), 0);

    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;

    return {
      totalRequests,
      totalTokens,
      totalCost,
      todayRequests,
      avgRequestsPerDay: days > 0 ? totalRequests / days : 0,
      projectedMonthlyCost: days > 0 ? (totalCost / days) * 30 : 0
    };
  }, [usageData, dateRange]);

  // Préparation des données pour les graphiques
  const prepareChartData = () => {
    const dates = [...new Set(usageData.map(d => d.date))].sort();
    const models = ['magistral-medium', 'mistral-medium-3', 'mistral-small'];

    // Graphique en ligne - Évolution des requêtes
    const lineData = {
      labels: dates.map(d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
      datasets: models.map(model => ({
        label: modelConfig[model as keyof typeof modelConfig].name,
        data: dates.map(date => 
          usageData
            .filter(d => d.date === date && d.model === model)
            .reduce((sum, d) => sum + d.request_count, 0)
        ),
        borderColor: modelConfig[model as keyof typeof modelConfig].color,
        backgroundColor: modelConfig[model as keyof typeof modelConfig].color + '20',
        fill: true,
        tension: 0.3
      }))
    };

    // Graphique en barres - Coûts par modèle
    const barData = {
      labels: models.map(m => modelConfig[m as keyof typeof modelConfig].name),
      datasets: [{
        label: 'Coût total (€)',
        data: models.map(model =>
          usageData
            .filter(d => d.model === model)
            .reduce((sum, d) => sum + d.total_cost, 0)
        ),
        backgroundColor: models.map(m => modelConfig[m as keyof typeof modelConfig].color),
      }]
    };

    // Graphique donut - Répartition des tokens
    const donutData = {
      labels: models.map(m => modelConfig[m as keyof typeof modelConfig].name),
      datasets: [{
        data: models.map(model =>
          usageData
            .filter(d => d.model === model)
            .reduce((sum, d) => sum + d.total_tokens, 0)
        ),
        backgroundColor: models.map(m => modelConfig[m as keyof typeof modelConfig].color),
      }]
    };

    return { lineData, barData, donutData };
  };

  const { lineData, barData, donutData } = useMemo(() => prepareChartData(), [usageData]);

  const exportData = () => {
    const headers = ['Date', 'Modèle', 'Requêtes', 'Tokens', 'Coût (€)'];
    const csvData = usageData.map(d => [
      d.date,
      d.model,
      d.request_count,
      d.total_tokens,
      d.total_cost.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage_ia_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <a href="/admin" className="text-primary hover:text-primary/80 font-medium">← Dashboard Admin</a>
            <span className="text-muted-foreground">|</span>
            <h1 className="text-xl font-bold text-foreground">Utilisation de l'IA</h1>
          </div>
          <p className="text-muted-foreground">Monitoring et analyse de la consommation des modèles Mistral</p>
        </div>
        
        {/* Quick Navigation */}
        <div className="px-6 pb-2">
          <nav className="flex gap-4 text-sm">
            <a href="/admin" className="text-muted-foreground hover:text-foreground">Dashboard</a>
            <a href="/admin/users" className="text-muted-foreground hover:text-foreground">Utilisateurs</a>
            <a href="/admin/analytics" className="text-primary font-medium">Analytics</a>
            <a href="/admin/content" className="text-muted-foreground hover:text-foreground">Contenu</a>
            <a href="/admin/settings" className="text-muted-foreground hover:text-foreground">Paramètres</a>
          </nav>
        </div>
      </div>
      
      <div className="p-6">

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Requêtes totales</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalRequests.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Période: {dateRange}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tokens consommés</p>
              <p className="text-2xl font-bold text-foreground">
                {(stats.totalTokens / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-muted-foreground">Millions de tokens</p>
            </div>
            <Cpu className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Coût total</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalCost.toFixed(2)}€</p>
              <p className="text-xs text-muted-foreground">Budget: 100€/mois</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Projection mensuelle</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.projectedMonthlyCost.toFixed(2)}€
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.projectedMonthlyCost > 100 ? '⚠️ Dépassement' : '✅ Dans le budget'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Feedback & Provider Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Satisfaction utilisateur</p>
              <p className="text-2xl font-bold text-foreground">{feedbackStats.rate}%</p>
              <p className="text-xs text-muted-foreground">
                {feedbackStats.positive} positifs / {feedbackStats.total} total
              </p>
            </div>
            <div className="text-3xl">{feedbackStats.rate >= 80 ? '😊' : feedbackStats.rate >= 50 ? '😐' : '😟'}</div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Requêtes aujourd&apos;hui</p>
              <p className="text-2xl font-bold text-foreground">{stats.todayRequests}</p>
              <p className="text-xs text-muted-foreground">Moyenne : {stats.avgRequestsPerDay.toFixed(0)}/jour</p>
            </div>
            <BarChart3 className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Providers disponibles</p>
              <p className="text-2xl font-bold text-foreground">Multi-provider</p>
              <p className="text-xs text-muted-foreground">Mistral + OpenAI + Anthropic + DeepSeek</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Alertes */}
      {stats.projectedMonthlyCost > 100 && (
        <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <p className="text-sm text-red-800">
                <strong>Attention :</strong> La projection mensuelle dépasse le budget de 100€.
                Considérez de réduire les quotas ou d'optimiser l'utilisation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-card rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus-visible:ring-ring"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
            </select>

            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus-visible:ring-ring"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
            >
              <option value="all">Tous les modèles</option>
              <option value="magistral-medium">Magistral Medium</option>
              <option value="mistral-medium-3">Mistral Medium 3</option>
              <option value="mistral-small">Mistral Small</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchUsageData()}
              className="flex items-center gap-2 px-4 py-2 text-foreground border rounded-lg hover:bg-accent"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Évolution des requêtes */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Évolution des requêtes</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Chargement...</div>
          ) : (
            <div className="h-64">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                  animation: {
                    duration: 0, // Désactiver les animations pour éviter les problèmes
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Coûts par modèle */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Coûts par modèle</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Chargement...</div>
          ) : (
            <div className="h-64">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value + '€';
                        }
                      }
                    },
                  },
                  animation: {
                    duration: 0, // Désactiver les animations pour éviter les problèmes
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition des tokens */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Répartition des tokens</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Chargement...</div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={donutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      position: 'right' as const,
                    },
                  },
                  animation: {
                    duration: 0, // Désactiver les animations pour éviter les problèmes
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Top utilisateurs */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top 10 utilisateurs (30j)</h3>
          <div className="space-y-2">
            {topUsers.map((user, index) => (
              <div key={user.user_id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{user.total_cost.toFixed(2)}€</p>
                  <p className="text-xs text-muted-foreground">{user.total_requests} requêtes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quotas par modèle */}
      <div className="bg-card rounded-lg shadow mt-6 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Utilisation des quotas aujourd'hui</h3>
        <div className="space-y-4">
          {Object.entries(modelConfig).map(([key, config]) => {
            const todayUsage = usageData
              .filter(d => d.date === new Date().toISOString().split('T')[0] && d.model === key)
              .reduce((sum, d) => sum + d.request_count, 0);
            const percentage = (todayUsage / config.dailyQuota) * 100;

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{config.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {todayUsage} / {config.dailyQuota} requêtes
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: percentage > 80 ? '#ef4444' : config.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}