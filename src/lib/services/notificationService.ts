// Service de notifications push pour les admins
import { createClient } from '@/lib/supabase/client';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  condition: string;
  type: NotificationType;
  title: string;
  message: string;
  isActive: boolean;
}

class NotificationService {
  private supabase = createClient();
  private listeners: ((notifications: AdminNotification[]) => void)[] = [];

  /**
   * 📬 Obtenir toutes les notifications pour un admin
   */
  async getNotifications(adminId: string): Promise<AdminNotification[]> {
    try {
      const { data, error } = await this.supabase
        .from('admin_notifications')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }
  }

  /**
   * 🔔 Créer une nouvelle notification
   */
  async createNotification(
    adminId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('admin_notifications')
        .insert({
          admin_id: adminId,
          type,
          title,
          message,
          data
        });

      if (error) throw error;
      
      // Notifier les listeners
      this.notifyListeners(adminId);
      return true;
    } catch (error) {
      console.error('Erreur création notification:', error);
      return false;
    }
  }

  /**
   * ✅ Marquer une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
      return false;
    }
  }

  /**
   * ✅ Marquer toutes les notifications comme lues
   */
  async markAllAsRead(adminId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('admin_id', adminId)
        .eq('is_read', false);

      return !error;
    } catch (error) {
      console.error('Erreur marquer toutes comme lues:', error);
      return false;
    }
  }

  /**
   * 🗑️ Supprimer les anciennes notifications
   */
  async cleanupOldNotifications(adminId: string, daysOld: number = 30): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await this.supabase
        .from('admin_notifications')
        .delete()
        .eq('admin_id', adminId)
        .lt('created_at', cutoffDate.toISOString());

      return !error;
    } catch (error) {
      console.error('Erreur nettoyage notifications:', error);
      return false;
    }
  }

  /**
   * 👂 S'abonner aux notifications temps réel
   */
  subscribe(adminId: string, callback: (notifications: AdminNotification[]) => void) {
    this.listeners.push(callback);

    // Configuration du temps réel Supabase
    const subscription = this.supabase
      .channel('admin-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'admin_notifications',
        filter: `admin_id=eq.${adminId}`
      }, () => {
        this.notifyListeners(adminId);
      })
      .subscribe();

    return () => {
      this.supabase.removeChannel(subscription);
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * 📢 Notifier tous les listeners
   */
  private async notifyListeners(adminId: string) {
    const notifications = await this.getNotifications(adminId);
    this.listeners.forEach(listener => listener(notifications));
  }

  /**
   * 🚨 Notifications prédéfinies pour événements système
   */
  async notifyNewUserRegistration(adminId: string, userEmail: string) {
    return this.createNotification(
      adminId,
      'info',
      '👋 Nouvel utilisateur',
      `${userEmail} vient de s'inscrire sur la plateforme`,
      { event: 'user_registered', userEmail }
    );
  }

  async notifyQuotaExceeded(adminId: string, model: string, usage: number, limit: number) {
    return this.createNotification(
      adminId,
      'warning',
      '⚠️ Quota dépassé',
      `${model} : ${usage}/${limit} tokens utilisés (${Math.round((usage/limit)*100)}%)`,
      { event: 'quota_exceeded', model, usage, limit }
    );
  }

  async notifySystemError(adminId: string, error: string, context?: string) {
    return this.createNotification(
      adminId,
      'error',
      '🚨 Erreur système',
      `Erreur détectée : ${error}${context ? ` (${context})` : ''}`,
      { event: 'system_error', error, context }
    );
  }

  async notifyModuleCompleted(adminId: string, userEmail: string, moduleTitle: string) {
    return this.createNotification(
      adminId,
      'success',
      '🎉 Module terminé',
      `${userEmail} a terminé le module "${moduleTitle}"`,
      { event: 'module_completed', userEmail, moduleTitle }
    );
  }

  async notifyLowEngagement(adminId: string, stats: { inactiveUsers: number, days: number }) {
    return this.createNotification(
      adminId,
      'warning',
      '📉 Engagement faible',
      `${stats.inactiveUsers} utilisateurs inactifs depuis ${stats.days} jours`,
      { event: 'low_engagement', ...stats }
    );
  }

  async notifyBackupCompleted(adminId: string, backupSize: string) {
    return this.createNotification(
      adminId,
      'success',
      '💾 Sauvegarde terminée',
      `Backup automatique réalisé avec succès (${backupSize})`,
      { event: 'backup_completed', backupSize }
    );
  }

  async notifySecurityAlert(adminId: string, alertType: string, details: any) {
    return this.createNotification(
      adminId,
      'error',
      '🔒 Alerte sécurité',
      `Tentative de connexion suspecte : ${alertType}`,
      { event: 'security_alert', alertType, ...details }
    );
  }
}

// Règles automatiques de notifications
export const notificationRules: NotificationRule[] = [
  {
    id: 'new-user-registration',
    name: 'Nouvelle inscription',
    condition: 'user.created',
    type: 'info',
    title: 'Nouvel utilisateur',
    message: 'Un utilisateur vient de s\'inscrire',
    isActive: true
  },
  {
    id: 'quota-80-percent',
    name: 'Quota IA 80%',
    condition: 'quota > 0.8',
    type: 'warning',
    title: 'Quota IA élevé',
    message: 'Plus de 80% du quota mensuel utilisé',
    isActive: true
  },
  {
    id: 'system-error',
    name: 'Erreur système',
    condition: 'error.level === "error"',
    type: 'error',
    title: 'Erreur système détectée',
    message: 'Une erreur nécessite votre attention',
    isActive: true
  },
  {
    id: 'daily-summary',
    name: 'Résumé quotidien',
    condition: 'time === "20:00"',
    type: 'info',
    title: 'Résumé de la journée',
    message: 'Statistiques et activité du jour',
    isActive: true
  },
  {
    id: 'low-engagement-weekly',
    name: 'Engagement faible',
    condition: 'inactive_users > 10 && weekly',
    type: 'warning',
    title: 'Engagement utilisateur',
    message: 'Baisse d\'engagement détectée',
    isActive: true
  }
];

// Instance singleton
export const notificationService = new NotificationService();
