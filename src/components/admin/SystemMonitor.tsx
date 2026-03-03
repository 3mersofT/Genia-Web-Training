'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, 
  Server, Database, Zap, HardDrive, Cpu, Clock,
  TrendingUp, TrendingDown, Minus, RefreshCw
} from 'lucide-react';
import { systemMonitoring, SystemHealth } from '@/lib/services/systemMonitoring';

interface SystemMonitorProps {
  className?: string;
}

export default function SystemMonitor({ className = '' }: SystemMonitorProps) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    checkSystemHealth();

    if (autoRefresh) {
      const interval = setInterval(checkSystemHealth, 30000); // Refresh toutes les 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const healthData = await systemMonitoring.checkSystemHealth();
      setHealth(healthData);
    } catch (error) {
      console.error('Erreur vérification santé:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'error': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'error': return <XCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    }
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    return value.toString();
  };

  const getMetricColor = (value: number, thresholds: { warning: number; error: number }) => {
    if (value > thresholds.error) return 'text-red-600 dark:text-red-400';
    if (value > thresholds.warning) return 'text-yellow-600';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressBarColor = (value: number, max: number = 100) => {
    const percentage = (value / max) * 100;
    if (percentage > 85) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading && !health) {
    return (
      <div className={`bg-card rounded-xl shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-muted rounded"></div>
            <div className="h-6 bg-muted rounded w-48"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className={`bg-card rounded-xl shadow-sm p-6 ${className}`}>
        <div className="text-center text-red-600 dark:text-red-400">
          <XCircle className="w-12 h-12 mx-auto mb-2" />
          <p>Impossible de récupérer l'état du système</p>
          <button
            onClick={checkSystemHealth}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getStatusColor(health.status)}`}>
              {getStatusIcon(health.status)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Santé du Système</h3>
              <p className="text-sm text-muted-foreground">
                Dernière vérification : {new Date(health.lastCheck).toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-xs rounded-full ${
                autoRefresh ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-muted text-muted-foreground'
              }`}
            >
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={checkSystemHealth}
              disabled={loading}
              className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-foreground">Uptime</span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {health.uptime.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-foreground">Réponse API</span>
              </div>
              <span className={`text-lg font-bold ${
                getMetricColor(health.metrics.api_response_time, { warning: 2000, error: 5000 })
              }`}>
                {formatValue(health.metrics.api_response_time, 'ms')}
              </span>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-foreground">Erreurs</span>
              </div>
              <span className={`text-lg font-bold ${
                getMetricColor(health.metrics.error_rate, { warning: 1, error: 3 })
              }`}>
                {formatValue(health.metrics.error_rate, '%')}
              </span>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-foreground">Alertes</span>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {health.alerts.filter(a => !a.resolved).length}
              </span>
            </div>
          </div>
        </div>

        {/* Métriques détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Métriques système */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Ressources Système</h4>
            <div className="space-y-4">
              {/* CPU */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-foreground">CPU</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(health.metrics.cpu_usage)}`}
                      style={{ width: `${health.metrics.cpu_usage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {formatValue(health.metrics.cpu_usage, '%')}
                  </span>
                </div>
              </div>

              {/* Mémoire */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-foreground">Mémoire</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(health.metrics.memory_usage)}`}
                      style={{ width: `${health.metrics.memory_usage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {formatValue(health.metrics.memory_usage, '%')}
                  </span>
                </div>
              </div>

              {/* Stockage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-foreground">Stockage</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(health.metrics.storage_usage)}`}
                      style={{ width: `${health.metrics.storage_usage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {formatValue(health.metrics.storage_usage, '%')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertes actives */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Alertes Actives ({health.alerts.filter(a => !a.resolved).length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {health.alerts.filter(a => !a.resolved).length === 0 ? (
                <div className="text-sm text-muted-foreground italic">Aucune alerte active</div>
              ) : (
                health.alerts.filter(a => !a.resolved).map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-950/30' :
                      alert.severity === 'high' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                            alert.severity === 'high' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleTimeString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2">
          <button
            onClick={() => window.open('/admin/analytics', '_blank')}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voir Analytics
          </button>
          <button
            onClick={() => systemMonitoring.startMonitoring(1)}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Démarrer Monitoring
          </button>
          <button
            onClick={() => {/* Exporter rapport */}}
            className="px-4 py-2 text-sm bg-muted-foreground text-white rounded-lg hover:bg-accent"
          >
            Exporter Rapport
          </button>
        </div>
      </div>
    </div>
  );
}
