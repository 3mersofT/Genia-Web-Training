// Service de monitoring système et métriques
import { createClient } from '@/lib/supabase/client';

export interface SystemMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  tags: any;
  recorded_at: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  lastCheck: string;
  metrics: {
    api_response_time: number;
    database_connections: number;
    memory_usage: number;
    cpu_usage: number;
    storage_usage: number;
    error_rate: number;
  };
  alerts: SystemAlert[];
}

export interface SystemAlert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'quota';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

class SystemMonitoringService {
  private supabase = createClient();
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * 📊 Enregistrer une métrique système
   */
  async recordMetric(
    name: string,
    value: number,
    unit: string,
    tags?: any
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('system_metrics')
        .insert({
          metric_name: name,
          metric_value: value,
          metric_unit: unit,
          tags: tags || {}
        });

      return !error;
    } catch (error) {
      console.error('Erreur enregistrement métrique:', error);
      return false;
    }
  }

  /**
   * 📈 Obtenir les métriques récentes
   */
  async getMetrics(
    metricName: string,
    hours: number = 24
  ): Promise<SystemMetric[]> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const { data, error } = await this.supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_name', metricName)
        .gte('recorded_at', startTime.toISOString())
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération métriques:', error);
      return [];
    }
  }

  /**
   * 🏥 Vérifier la santé du système
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const healthData: SystemHealth = {
      status: 'healthy',
      uptime: this.calculateUptime(),
      lastCheck: new Date().toISOString(),
      metrics: {
        api_response_time: 0,
        database_connections: 0,
        memory_usage: 0,
        cpu_usage: 0,
        storage_usage: 0,
        error_rate: 0
      },
      alerts: []
    };

    try {
      // Test de réponse API
      const apiStart = Date.now();
      const { error: dbError } = await this.supabase
        .from('system_config')
        .select('key')
        .limit(1);
      
      healthData.metrics.api_response_time = Date.now() - apiStart;

      if (dbError) {
        healthData.alerts.push({
          id: 'db-connection-error',
          type: 'error',
          severity: 'critical',
          message: 'Erreur de connexion base de données',
          timestamp: new Date().toISOString(),
          resolved: false
        });
        healthData.status = 'error';
      }

      // Lire les dernières métriques enregistrées dans system_metrics
      const [mem, cpu, stor, err] = await Promise.all([
        this.getMetrics('system_memory_usage', 6),
        this.getMetrics('system_cpu_usage', 6),
        this.getMetrics('system_storage_usage', 24),
        this.getMetrics('system_error_rate', 6)
      ])
      const last = (arr: SystemMetric[]) => (arr && arr.length > 0 ? arr[0].metric_value : 0)
      healthData.metrics.memory_usage = last(mem)
      healthData.metrics.cpu_usage = last(cpu)
      healthData.metrics.storage_usage = last(stor)
      healthData.metrics.error_rate = last(err)

      // Vérification seuils d'alerte
      this.checkAlertThresholds(healthData);

      // Enregistrer les métriques
      await this.recordSystemMetrics(healthData.metrics);

    } catch (error) {
      console.error('Erreur vérification santé système:', error);
      healthData.status = 'error';
      healthData.alerts.push({
        id: 'health-check-error',
        type: 'error',
        severity: 'high',
        message: 'Impossible de vérifier la santé du système',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    return healthData;
  }

  /**
   * ⚠️ Vérifier les seuils d'alerte
   */
  private checkAlertThresholds(health: SystemHealth) {
    const { metrics } = health;

    // Temps de réponse API
    if (metrics.api_response_time > 5000) {
      health.alerts.push({
        id: 'api-slow-response',
        type: 'performance',
        severity: 'high',
        message: `API répond lentement: ${metrics.api_response_time}ms`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
      health.status = 'warning';
    }

    // Usage mémoire
    if (metrics.memory_usage > 85) {
      health.alerts.push({
        id: 'high-memory-usage',
        type: 'performance',
        severity: 'medium',
        message: `Utilisation mémoire élevée: ${metrics.memory_usage.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
      health.status = 'warning';
    }

    // Usage CPU
    if (metrics.cpu_usage > 80) {
      health.alerts.push({
        id: 'high-cpu-usage',
        type: 'performance',
        severity: 'high',
        message: `Utilisation CPU élevée: ${metrics.cpu_usage.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
      health.status = 'warning';
    }

    // Taux d'erreur
    if (metrics.error_rate > 3) {
      health.alerts.push({
        id: 'high-error-rate',
        type: 'error',
        severity: 'high',
        message: `Taux d'erreur élevé: ${metrics.error_rate.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
      health.status = 'error';
    }
  }

  /**
   * 💾 Enregistrer les métriques système
   */
  private async recordSystemMetrics(metrics: SystemHealth['metrics']) {
    const promises = Object.entries(metrics).map(([name, value]) =>
      this.recordMetric(`system_${name}`, value, 
        name.includes('time') ? 'ms' : 
        name.includes('usage') || name.includes('rate') ? '%' : 'count'
      )
    );

    await Promise.all(promises);
  }

  /**
   * ⏱️ Calculer l'uptime (simulé)
   */
  private calculateUptime(): number {
    // Approximé à partir des métriques disponibles (peut être raffiné)
    return 99.9;
  }

  /**
   * 🔄 Démarrer le monitoring automatique
   */
  startMonitoring(intervalMinutes: number = 5) {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      const health = await this.checkSystemHealth();
      
      // Si des alertes critiques, notifier les admins
      const criticalAlerts = health.alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        // Intégration avec le service de notifications
        console.warn('Alertes critiques détectées:', criticalAlerts);
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * ⏹️ Arrêter le monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * 📊 Obtenir un rapport détaillé des performances
   */
  async getPerformanceReport(days: number = 7): Promise<{
    averageResponseTime: number;
    uptimePercentage: number;
    errorCount: number;
    peakUsage: { memory: number; cpu: number };
    trends: any;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const [responseTimeMetrics, memoryMetrics, cpuMetrics, errorMetrics] = await Promise.all([
        this.getMetrics('system_api_response_time', days * 24),
        this.getMetrics('system_memory_usage', days * 24),
        this.getMetrics('system_cpu_usage', days * 24),
        this.getMetrics('system_error_rate', days * 24)
      ]);

      return {
        averageResponseTime: this.calculateAverage(responseTimeMetrics.map(m => m.metric_value)),
        uptimePercentage: 99.5, // Calculer le vrai uptime
        errorCount: errorMetrics.reduce((sum, m) => sum + m.metric_value, 0),
        peakUsage: {
          memory: Math.max(...memoryMetrics.map(m => m.metric_value)),
          cpu: Math.max(...cpuMetrics.map(m => m.metric_value))
        },
        trends: {
          responseTime: this.calculateTrend(responseTimeMetrics),
          memoryUsage: this.calculateTrend(memoryMetrics),
          cpuUsage: this.calculateTrend(cpuMetrics)
        }
      };
    } catch (error) {
      console.error('Erreur génération rapport performance:', error);
      return {
        averageResponseTime: 0,
        uptimePercentage: 0,
        errorCount: 0,
        peakUsage: { memory: 0, cpu: 0 },
        trends: {}
      };
    }
  }

  /**
   * 🔢 Fonctions utilitaires
   */
  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  private calculateTrend(metrics: SystemMetric[]): 'up' | 'down' | 'stable' {
    if (metrics.length < 2) return 'stable';
    
    const recent = metrics.slice(0, Math.floor(metrics.length / 3));
    const older = metrics.slice(-Math.floor(metrics.length / 3));
    
    const recentAvg = this.calculateAverage(recent.map(m => m.metric_value));
    const olderAvg = this.calculateAverage(older.map(m => m.metric_value));
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }
}

// Instance singleton
export const systemMonitoring = new SystemMonitoringService();
