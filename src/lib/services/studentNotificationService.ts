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
   *
   * Cette fonction identifie les utilisateurs qui:
   * - Ont un streak actif (streak_days > 0)
   * - N'ont pas eu d'activité depuis 20+ heures
   * - Ont activé les notifications de rappel de streak
   *
   * Note: Cette méthode est destinée à être appelée par un cron job ou Edge Function
   *
   * @returns Le nombre de notifications envoyées
   */
  async checkAndNotifyStreakAtRisk(): Promise<number> {
    try {
      // Temps limite: 20 heures en arrière
      const twentyHoursAgo = new Date();
      twentyHoursAgo.setHours(twentyHoursAgo.getHours() - 20);

      // 1. Trouver les utilisateurs avec streak > 0 et préférences de notification activées
      const { data: usersAtRisk, error: queryError } = await this.supabase
        .from('user_points')
        .select(`
          user_id,
          streak_days,
          user_profiles!inner(display_name, email),
          notification_preferences!inner(
            notification_types_enabled,
            preferred_notification_time
          )
        `)
        .gt('streak_days', 0);

      if (queryError) {
        console.error('Erreur requête utilisateurs à risque:', queryError);
        return 0;
      }

      if (!usersAtRisk || usersAtRisk.length === 0) {
        return 0;
      }

      let notificationsSent = 0;

      // 2. Pour chaque utilisateur, vérifier leur dernière activité
      for (const user of usersAtRisk) {
        try {
          // Vérifier si les notifications de streak sont activées
          const prefs = user.notification_preferences as any;
          const typesEnabled = prefs?.notification_types_enabled || {};

          if (!typesEnabled.streak_reminder) {
            continue; // Skip si notifications désactivées
          }

          // Vérifier la dernière activité (challenges ou capsules)
          const [challengeActivity, capsuleActivity] = await Promise.all([
            // Dernière participation à un défi
            this.supabase
              .from('challenge_participations')
              .select('completed_at')
              .eq('user_id', user.user_id)
              .order('completed_at', { ascending: false })
              .limit(1)
              .single(),

            // Dernier accès à une capsule
            this.supabase
              .from('user_progress')
              .select('last_accessed_at')
              .eq('user_id', user.user_id)
              .order('last_accessed_at', { ascending: false })
              .limit(1)
              .single()
          ]);

          // Déterminer la dernière activité
          const lastChallengeDate = challengeActivity.data?.completed_at
            ? new Date(challengeActivity.data.completed_at)
            : null;
          const lastCapsuleDate = capsuleActivity.data?.last_accessed_at
            ? new Date(capsuleActivity.data.last_accessed_at)
            : null;

          // Trouver la plus récente des deux
          let lastActivityDate: Date | null = null;
          if (lastChallengeDate && lastCapsuleDate) {
            lastActivityDate = lastChallengeDate > lastCapsuleDate
              ? lastChallengeDate
              : lastCapsuleDate;
          } else {
            lastActivityDate = lastChallengeDate || lastCapsuleDate;
          }

          // Si aucune activité trouvée ou activité > 20h, notifier
          if (!lastActivityDate || lastActivityDate < twentyHoursAgo) {
            // Vérifier si une notification n'a pas déjà été envoyée aujourd'hui
            const { data: existingNotif } = await this.supabase
              .from('student_notifications')
              .select('id')
              .eq('user_id', user.user_id)
              .eq('type', 'streak_reminder')
              .gte('created_at', new Date().toISOString().split('T')[0]) // Aujourd'hui
              .limit(1)
              .single();

            if (existingNotif) {
              continue; // Déjà notifié aujourd'hui
            }

            // Créer la notification
            const success = await this.notifyStreakAtRisk(
              user.user_id,
              user.streak_days
            );

            if (success) {
              notificationsSent++;
            }
          }
        } catch (error) {
          // Continuer même si un utilisateur échoue
          console.error(`Erreur notification streak pour utilisateur ${user.user_id}:`, error);
        }
      }

      return notificationsSent;
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

  /**
   * 📱 Vérifier le statut des permissions de notification push
   */
  async checkPushPermission(): Promise<NotificationPermission | null> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null;
    }

    return Notification.permission;
  }

  /**
   * 🔔 Demander la permission pour les notifications push
   */
  async requestPushPermission(): Promise<boolean> {
    try {
      // Vérifier si les notifications sont supportées
      if (typeof window === 'undefined' || !('Notification' in window)) {
        throw new Error('Les notifications push ne sont pas supportées par ce navigateur');
      }

      // Si déjà accordé, retourner true
      if (Notification.permission === 'granted') {
        return true;
      }

      // Si déjà refusé, retourner false
      if (Notification.permission === 'denied') {
        return false;
      }

      // Demander la permission
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        // Tracker l'acceptation
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'push_permission_granted', {
            event_category: 'engagement',
            event_label: 'notifications'
          });
        }
        return true;
      } else {
        // Tracker le refus
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'push_permission_denied', {
            event_category: 'engagement',
            event_label: 'notifications'
          });
        }

        // Sauvegarder le refus
        localStorage.setItem('push-permission-denied', new Date().toISOString());
        return false;
      }
    } catch (error) {
      console.error('Erreur demande permission push:', error);
      return false;
    }
  }

  /**
   * 🔕 Révoquer l'abonnement aux notifications push
   */
  async revokePushSubscription(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return false;

      const result = await subscription.unsubscribe();
      return result;
    } catch (error) {
      console.error('Erreur révocation abonnement push:', error);
      return false;
    }
  }

  /**
   * 📲 Vérifier si les notifications push sont disponibles
   */
  isPushNotificationSupported(): boolean {
    return typeof window !== 'undefined' &&
           'Notification' in window &&
           'serviceWorker' in navigator &&
           'PushManager' in window;
  }
}

// Export singleton
export const studentNotificationService = new StudentNotificationService();
export default studentNotificationService;
