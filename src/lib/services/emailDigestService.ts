/**
 * Service de génération de digest d'emails pour les notifications étudiants
 * GENIA Web Training Platform
 */

import { createClient } from '@/lib/supabase/client';
import { emailConfig, generateEmailHTML, getButtonStyle } from '@/config/emailTemplates';
import type { StudentNotification, NotificationType } from '@/types/notifications.types';

interface DigestParams {
  userId: string;
  userEmail: string;
  userName: string;
}

interface NotificationGroup {
  type: NotificationType;
  icon: string;
  label: string;
  notifications: StudentNotification[];
}

class EmailDigestService {
  private supabase = createClient();

  /**
   * 📧 Générer un digest quotidien (dernières 24 heures)
   */
  async generateDailyDigest(params: DigestParams): Promise<string | null> {
    const { userId, userEmail, userName } = params;

    try {
      // Récupérer les notifications des dernières 24 heures
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);

      const notifications = await this.getNotificationsSince(userId, cutoffDate);

      if (notifications.length === 0) {
        return null; // Pas de notifications, pas d'email
      }

      // Grouper les notifications par type
      const groups = this.groupNotificationsByType(notifications);

      // Générer le contenu HTML
      const content = this.generateDigestContent(
        userName,
        groups,
        'quotidien',
        notifications.length
      );

      // Retourner l'email HTML complet
      return generateEmailHTML(
        '📬 Votre résumé quotidien - GENIA Web Training',
        content,
        this.getDigestStyles()
      );
    } catch (error) {
      console.error('Erreur génération digest quotidien:', error);
      return null;
    }
  }

  /**
   * 📧 Générer un digest hebdomadaire (derniers 7 jours)
   */
  async generateWeeklyDigest(params: DigestParams): Promise<string | null> {
    const { userId, userEmail, userName } = params;

    try {
      // Récupérer les notifications des 7 derniers jours
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const notifications = await this.getNotificationsSince(userId, cutoffDate);

      if (notifications.length === 0) {
        return null; // Pas de notifications, pas d'email
      }

      // Grouper les notifications par type
      const groups = this.groupNotificationsByType(notifications);

      // Générer des statistiques hebdomadaires
      const stats = this.generateWeeklyStats(notifications);

      // Générer le contenu HTML
      const content = this.generateDigestContent(
        userName,
        groups,
        'hebdomadaire',
        notifications.length,
        stats
      );

      // Retourner l'email HTML complet
      return generateEmailHTML(
        '📊 Votre résumé hebdomadaire - GENIA Web Training',
        content,
        this.getDigestStyles()
      );
    } catch (error) {
      console.error('Erreur génération digest hebdomadaire:', error);
      return null;
    }
  }

  /**
   * 📅 Récupérer les notifications depuis une date donnée
   */
  private async getNotificationsSince(
    userId: string,
    sinceDate: Date
  ): Promise<StudentNotification[]> {
    const { data, error } = await this.supabase
      .from('student_notifications')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * 📊 Grouper les notifications par type
   */
  private groupNotificationsByType(notifications: StudentNotification[]): NotificationGroup[] {
    const typeConfig: Record<NotificationType, { icon: string; label: string }> = {
      daily_challenge: { icon: '🎯', label: 'Défis quotidiens' },
      streak_reminder: { icon: '🔥', label: 'Rappels de série' },
      badge_earned: { icon: '🏆', label: 'Badges gagnés' },
      peer_review: { icon: '👥', label: 'Évaluations reçues' },
      new_module: { icon: '📚', label: 'Nouveaux modules' },
      ai_nudge: { icon: '💡', label: 'Suggestions du tuteur IA' }
    };

    const groups: NotificationGroup[] = [];

    // Grouper par type
    const notificationsByType = new Map<NotificationType, StudentNotification[]>();

    notifications.forEach(notification => {
      const existing = notificationsByType.get(notification.type) || [];
      existing.push(notification);
      notificationsByType.set(notification.type, existing);
    });

    // Créer les groupes
    notificationsByType.forEach((notifs, type) => {
      const config = typeConfig[type];
      groups.push({
        type,
        icon: config.icon,
        label: config.label,
        notifications: notifs
      });
    });

    return groups;
  }

  /**
   * 📈 Générer des statistiques hebdomadaires
   */
  private generateWeeklyStats(notifications: StudentNotification[]): {
    totalNotifications: number;
    badgesEarned: number;
    challengesCompleted: number;
    reviewsReceived: number;
  } {
    const badgesEarned = notifications.filter(n => n.type === 'badge_earned').length;
    const challengesCompleted = notifications.filter(n => n.type === 'daily_challenge').length;
    const reviewsReceived = notifications.filter(n => n.type === 'peer_review').length;

    return {
      totalNotifications: notifications.length,
      badgesEarned,
      challengesCompleted,
      reviewsReceived
    };
  }

  /**
   * 🎨 Générer le contenu du digest
   */
  private generateDigestContent(
    userName: string,
    groups: NotificationGroup[],
    period: 'quotidien' | 'hebdomadaire',
    totalCount: number,
    stats?: ReturnType<typeof this.generateWeeklyStats>
  ): string {
    const greeting = period === 'quotidien'
      ? 'Voici votre résumé quotidien !'
      : 'Voici votre résumé de la semaine !';

    let content = `
      <h2>Bonjour ${userName} 👋</h2>
      <p>${greeting}</p>
      <p>Vous avez reçu <strong>${totalCount} notification${totalCount > 1 ? 's' : ''}</strong> ${period === 'quotidien' ? 'aujourd\'hui' : 'cette semaine'}.</p>
    `;

    // Ajouter les statistiques hebdomadaires si disponibles
    if (stats && period === 'hebdomadaire') {
      content += `
        <div class="stats-section">
          <h3>📊 Vos statistiques de la semaine</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${stats.badgesEarned}</div>
              <div class="stat-label">🏆 Badges gagnés</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.challengesCompleted}</div>
              <div class="stat-label">🎯 Défis complétés</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.reviewsReceived}</div>
              <div class="stat-label">👥 Reviews reçues</div>
            </div>
          </div>
        </div>
      `;
    }

    // Ajouter chaque groupe de notifications
    groups.forEach(group => {
      content += `
        <div class="notification-group">
          <h3>${group.icon} ${group.label} (${group.notifications.length})</h3>
          <div class="notification-list">
      `;

      group.notifications.slice(0, 5).forEach(notification => {
        const timeAgo = this.formatTimeAgo(new Date(notification.created_at));
        content += `
          <div class="notification-item">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${timeAgo}</div>
          </div>
        `;
      });

      // Si plus de 5 notifications, afficher un message
      if (group.notifications.length > 5) {
        content += `
          <div class="notification-more">
            + ${group.notifications.length - 5} autre${group.notifications.length - 5 > 1 ? 's' : ''} notification${group.notifications.length - 5 > 1 ? 's' : ''}
          </div>
        `;
      }

      content += `
          </div>
        </div>
      `;
    });

    // Ajouter le bouton d'action
    content += `
      <div style="text-align: center; margin-top: 30px;">
        <a href="${emailConfig.urls.siteUrl}/dashboard" style="${getButtonStyle('primary')}">
          Voir toutes mes notifications
        </a>
      </div>
      <p style="margin-top: 20px; color: #666; font-size: 14px; text-align: center;">
        Vous pouvez personnaliser la fréquence de ces emails dans vos
        <a href="${emailConfig.urls.siteUrl}/profile#notifications" style="color: ${emailConfig.colors.primary};">
          paramètres de notification
        </a>.
      </p>
    `;

    return content;
  }

  /**
   * 🎨 Styles CSS personnalisés pour le digest
   */
  private getDigestStyles(): string {
    return `
      .stats-section {
        background: linear-gradient(135deg, ${emailConfig.colors.primary} 0%, ${emailConfig.colors.secondary} 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .stats-section h3 {
        color: white;
        margin-top: 0;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-top: 15px;
      }
      .stat-card {
        background: rgba(255, 255, 255, 0.15);
        padding: 15px;
        border-radius: 6px;
        text-align: center;
        backdrop-filter: blur(10px);
      }
      .stat-value {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .stat-label {
        font-size: 12px;
        opacity: 0.9;
      }
      .notification-group {
        margin: 20px 0;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
        background: #fafafa;
      }
      .notification-group h3 {
        margin-top: 0;
        color: ${emailConfig.colors.primary};
        font-size: 16px;
      }
      .notification-list {
        margin-top: 10px;
      }
      .notification-item {
        background: white;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 8px;
        border-left: 3px solid ${emailConfig.colors.primary};
      }
      .notification-title {
        font-weight: bold;
        color: #333;
        margin-bottom: 4px;
      }
      .notification-message {
        color: #666;
        font-size: 14px;
        margin-bottom: 4px;
      }
      .notification-time {
        color: #999;
        font-size: 12px;
      }
      .notification-more {
        text-align: center;
        color: ${emailConfig.colors.primary};
        font-size: 14px;
        font-weight: bold;
        margin-top: 10px;
        padding: 8px;
      }
      @media only screen and (max-width: 600px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  /**
   * ⏰ Formater le temps écoulé depuis une date
   */
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }

  /**
   * 📤 Envoyer un digest par email (utilise Supabase Edge Function)
   * Note: Cette méthode nécessite une Edge Function Supabase pour l'envoi réel
   */
  async sendDigest(
    params: DigestParams,
    digestType: 'daily' | 'weekly'
  ): Promise<boolean> {
    try {
      const emailHTML = digestType === 'daily'
        ? await this.generateDailyDigest(params)
        : await this.generateWeeklyDigest(params);

      if (!emailHTML) {
        return false; // Pas de notifications, pas d'envoi
      }

      // Note: L'envoi réel nécessite une Edge Function Supabase
      // Pour l'instant, on retourne juste true pour indiquer que le digest est prêt
      // Future enhancement: Appeler une Edge Function pour envoyer l'email via Resend/SendGrid

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Digest email généré pour:', params.userEmail);
        console.log('Type:', digestType);
        console.log('Longueur HTML:', emailHTML.length);
      }

      return true;
    } catch (error) {
      console.error('Erreur envoi digest:', error);
      return false;
    }
  }

  /**
   * 🔍 Obtenir les utilisateurs qui doivent recevoir un digest quotidien
   */
  async getUsersForDailyDigest(): Promise<DigestParams[]> {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select(`
          user_id,
          users:user_id (
            email,
            full_name
          )
        `)
        .eq('email_digest_frequency', 'daily');

      if (error) throw error;

      return (data || []).map((pref: any) => ({
        userId: pref.user_id,
        userEmail: pref.users.email,
        userName: pref.users.full_name || 'Étudiant'
      }));
    } catch (error) {
      console.error('Erreur récupération utilisateurs digest quotidien:', error);
      return [];
    }
  }

  /**
   * 🔍 Obtenir les utilisateurs qui doivent recevoir un digest hebdomadaire
   */
  async getUsersForWeeklyDigest(): Promise<DigestParams[]> {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select(`
          user_id,
          users:user_id (
            email,
            full_name
          )
        `)
        .eq('email_digest_frequency', 'weekly');

      if (error) throw error;

      return (data || []).map((pref: any) => ({
        userId: pref.user_id,
        userEmail: pref.users.email,
        userName: pref.users.full_name || 'Étudiant'
      }));
    } catch (error) {
      console.error('Erreur récupération utilisateurs digest hebdomadaire:', error);
      return [];
    }
  }

  /**
   * 🚀 Traiter tous les digests quotidiens
   * Cette méthode sera appelée par un cron job quotidien
   */
  async processDailyDigests(): Promise<{ sent: number; failed: number }> {
    const users = await this.getUsersForDailyDigest();
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const success = await this.sendDigest(user, 'daily');
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * 🚀 Traiter tous les digests hebdomadaires
   * Cette méthode sera appelée par un cron job hebdomadaire (ex: lundi matin)
   */
  async processWeeklyDigests(): Promise<{ sent: number; failed: number }> {
    const users = await this.getUsersForWeeklyDigest();
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const success = await this.sendDigest(user, 'weekly');
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }
}

// Export singleton
export const emailDigestService = new EmailDigestService();
export default emailDigestService;
