// Service de notifications pour les étudiants
import { createClient } from '@/lib/supabase/client';
import type {
  StudentNotification,
  NotificationPreferences,
  NotificationType,
  CreateNotificationParams,
  UpdatePreferencesParams,
  EmailDigestFrequency
} from '@/types/notifications.types';

class StudentNotificationService {
  private supabase = createClient();
  private listeners: ((notifications: StudentNotification[]) => void)[] = [];

  /**
   * 📬 Obtenir toutes les notifications pour un étudiant
   */
  async getNotifications(userId: string): Promise<StudentNotification[]> {
    try {
      const { data, error } = await this.supabase
        .from('student_notifications')
        .select('*')
        .eq('user_id', userId)
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
  async createNotification(params: CreateNotificationParams): Promise<boolean> {
    try {
      const { userId, type, title, message, data } = params;

      const { error } = await this.supabase
        .from('student_notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data: data || {}
        });

      if (error) throw error;

      // Notifier les listeners
      this.notifyListeners(userId);
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
        .from('student_notifications')
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
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .rpc('mark_all_notifications_read', { p_user_id: userId });

      return !error;
    } catch (error) {
      console.error('Erreur marquer toutes comme lues:', error);
      return false;
    }
  }

  /**
   * 🔢 Obtenir le nombre de notifications non lues
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_unread_notification_count', { p_user_id: userId });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Erreur comptage notifications non lues:', error);
      return 0;
    }
  }

  /**
   * 🗑️ Supprimer les anciennes notifications
   */
  async cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await this.supabase
        .from('student_notifications')
        .delete()
        .eq('user_id', userId)
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
  subscribe(userId: string, callback: (notifications: StudentNotification[]) => void) {
    this.listeners.push(callback);

    // Configuration du temps réel Supabase
    const subscription = this.supabase
      .channel('student-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_notifications',
        filter: `user_id=eq.${userId}`
      }, () => {
        this.notifyListeners(userId);
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
  private async notifyListeners(userId: string) {
    const notifications = await this.getNotifications(userId);
    this.listeners.forEach(listener => listener(notifications));
  }

  /**
   * ⚙️ Obtenir les préférences de notification d'un utilisateur
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur récupération préférences:', error);
      return null;
    }
  }

  /**
   * 💾 Mettre à jour les préférences de notification
   */
  async updatePreferences(userId: string, updates: UpdatePreferencesParams): Promise<boolean> {
    try {
      // Si on met à jour partiellement notification_types_enabled, on doit merger
      let finalUpdates = { ...updates };

      if (updates.notification_types_enabled) {
        const currentPrefs = await this.getPreferences(userId);
        if (currentPrefs) {
          finalUpdates.notification_types_enabled = {
            ...currentPrefs.notification_types_enabled,
            ...updates.notification_types_enabled
          };
        }
      }

      const { error } = await this.supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...finalUpdates
        }, {
          onConflict: 'user_id'
        });

      return !error;
    } catch (error) {
      console.error('Erreur mise à jour préférences:', error);
      return false;
    }
  }

  /**
   * 🚨 Notifications prédéfinies pour événements système
   */

  // 📅 Nouveau défi quotidien disponible
  async notifyDailyChallengeAvailable(userId: string, challengeTitle: string) {
    return this.createNotification({
      userId,
      type: 'daily_challenge',
      title: '🎯 Nouveau défi quotidien !',
      message: `"${challengeTitle}" est maintenant disponible`,
      data: { event: 'daily_challenge_available', challengeTitle }
    });
  }

  // 🔥 Rappel de streak en danger
  async notifyStreakAtRisk(userId: string, currentStreak: number) {
    return this.createNotification({
      userId,
      type: 'streak_reminder',
      title: '⚠️ Votre série est en danger !',
      message: `Ne perdez pas votre série de ${currentStreak} jours ! Complétez un défi aujourd'hui.`,
      data: { event: 'streak_at_risk', currentStreak }
    });
  }

  // 🏆 Badge gagné
  async notifyBadgeEarned(userId: string, badgeName: string, badgeDescription: string) {
    return this.createNotification({
      userId,
      type: 'badge_earned',
      title: '🏆 Nouveau badge débloqué !',
      message: `Félicitations ! Vous avez gagné le badge "${badgeName}" : ${badgeDescription}`,
      data: { event: 'badge_earned', badgeName, badgeDescription }
    });
  }

  // 👥 Nouvelle review reçue
  async notifyPeerReview(userId: string, reviewerName: string, challengeTitle: string) {
    return this.createNotification({
      userId,
      type: 'peer_review',
      title: '💬 Nouvelle review reçue',
      message: `${reviewerName} a évalué votre soumission pour "${challengeTitle}"`,
      data: { event: 'peer_review_received', reviewerName, challengeTitle }
    });
  }

  // 📚 Nouveau module lancé
  async notifyNewModule(userId: string, moduleTitle: string, moduleDescription: string) {
    return this.createNotification({
      userId,
      type: 'new_module',
      title: '🆕 Nouveau module disponible !',
      message: `"${moduleTitle}" : ${moduleDescription}`,
      data: { event: 'new_module_launched', moduleTitle, moduleDescription }
    });
  }

  // 🤖 Nudge personnalisé du tuteur IA
  async notifyAINudge(userId: string, message: string, context?: string) {
    return this.createNotification({
      userId,
      type: 'ai_nudge',
      title: '💡 Suggestion de votre tuteur IA',
      message,
      data: { event: 'ai_nudge', context }
    });
  }

  /**
   * 🔍 Vérifier et notifier les streaks en danger
   * Méthode pour détecter les utilisateurs qui n'ont pas eu d'activité depuis 20+ heures
   */
  async checkAndNotifyStreakAtRisk(): Promise<number> {
    try {
      // Cette méthode sera appelée par un cron job ou une Edge Function
      // Pour l'instant, elle retourne juste le nombre de notifications envoyées

      // Note: La logique complète nécessiterait d'accéder à user_progress
      // et de vérifier la dernière activité. Ceci sera implémenté dans les triggers.

      return 0;
    } catch (error) {
      console.error('Erreur vérification streaks:', error);
      return 0;
    }
  }

  /**
   * 📧 Vérifier si l'utilisateur doit recevoir une notification par email
   */
  async shouldSendEmail(userId: string, notificationType: NotificationType): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    if (!prefs) return false;

    // Vérifier si le type de notification est activé
    if (!prefs.notification_types_enabled[notificationType]) {
      return false;
    }

    // Vérifier la fréquence des emails
    return prefs.email_digest_frequency !== 'off';
  }
}

// Export singleton
export const studentNotificationService = new StudentNotificationService();
export default studentNotificationService;
