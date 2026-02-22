// Types pour le système de notifications étudiants

export type NotificationType =
  | 'daily_challenge'
  | 'streak_reminder'
  | 'badge_earned'
  | 'peer_review'
  | 'new_module'
  | 'ai_nudge';

export type EmailDigestFrequency =
  | 'immediate'
  | 'daily'
  | 'weekly'
  | 'off';

export interface StudentNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  notification_types_enabled: {
    daily_challenge: boolean;
    streak_reminder: boolean;
    badge_earned: boolean;
    peer_review: boolean;
    new_module: boolean;
    ai_nudge: boolean;
  };
  email_digest_frequency: EmailDigestFrequency;
  push_enabled: boolean;
  push_subscription?: Record<string, any> | null;
  preferred_notification_time: string; // Format: HH:MM:SS
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface UpdatePreferencesParams {
  notification_types_enabled?: Partial<NotificationPreferences['notification_types_enabled']>;
  email_digest_frequency?: EmailDigestFrequency;
  push_enabled?: boolean;
  push_subscription?: Record<string, any> | null;
  preferred_notification_time?: string;
}
