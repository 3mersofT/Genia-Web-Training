'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Mail, Clock, Check, AlertCircle, Save, Smartphone } from 'lucide-react';
import type { NotificationPreferences as NotificationPrefsType, EmailDigestFrequency } from '@/types/notifications.types';
import { studentNotificationService } from '@/lib/services/studentNotificationService';

interface NotificationPreferencesProps {
  userId: string;
}

interface NotificationTypeConfig {
  key: keyof NotificationPrefsType['notification_types_enabled'];
  labelKey: string;
  descriptionKey: string;
}

const notificationTypes: NotificationTypeConfig[] = [
  {
    key: 'daily_challenge',
    labelKey: 'types.dailyChallenge',
    descriptionKey: 'types.dailyChallengeDesc'
  },
  {
    key: 'streak_reminder',
    labelKey: 'types.streakReminder',
    descriptionKey: 'types.streakReminderDesc'
  },
  {
    key: 'badge_earned',
    labelKey: 'types.badgeEarned',
    descriptionKey: 'types.badgeEarnedDesc'
  },
  {
    key: 'peer_review',
    labelKey: 'types.peerReview',
    descriptionKey: 'types.peerReviewDesc'
  },
  {
    key: 'new_module',
    labelKey: 'types.newModule',
    descriptionKey: 'types.newModuleDesc'
  },
  {
    key: 'ai_nudge',
    labelKey: 'types.aiNudge',
    descriptionKey: 'types.aiNudgeDesc'
  }
];

const emailDigestOptions: { value: EmailDigestFrequency; labelKey: string; descriptionKey: string }[] = [
  { value: 'immediate', labelKey: 'email.immediate', descriptionKey: 'email.immediateDesc' },
  { value: 'daily', labelKey: 'email.daily', descriptionKey: 'email.dailyDesc' },
  { value: 'weekly', labelKey: 'email.weekly', descriptionKey: 'email.weeklyDesc' },
  { value: 'off', labelKey: 'email.off', descriptionKey: 'email.offDesc' }
];

export default function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const t = useTranslations('notifications.preferences');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [preferences, setPreferences] = useState<NotificationPrefsType['notification_types_enabled']>({
    daily_challenge: true,
    streak_reminder: true,
    badge_earned: true,
    peer_review: true,
    new_module: true,
    ai_nudge: true
  });

  const [emailDigest, setEmailDigest] = useState<EmailDigestFrequency>('daily');
  const [preferredTime, setPreferredTime] = useState<string>('09:00');

  // Push notification state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    loadPreferences();
    checkPushNotificationStatus();
  }, [userId]);

  const checkPushNotificationStatus = async () => {
    const supported = studentNotificationService.isPushNotificationSupported();
    setPushSupported(supported);

    if (supported) {
      const permission = await studentNotificationService.checkPushPermission();
      setPushPermission(permission);
      setPushEnabled(permission === 'granted');
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');

      if (!response.ok) {
        throw new Error(t('loadError'));
      }

      const responseData = await response.json();
      const data: NotificationPrefsType = responseData.preferences || responseData;

      if (data) {
        setPreferences(data.notification_types_enabled || {
          daily_challenge: true,
          streak_reminder: true,
          badge_earned: true,
          peer_review: true,
          new_module: true,
          ai_nudge: true
        });
        setEmailDigest(data.email_digest_frequency || 'daily');
        setPreferredTime(data.preferred_notification_time?.substring(0, 5) || '09:00');
      }
    } catch (error) {
      console.error('[NotificationPreferences] Failed to load preferences:', error);
      // Keep default values, don't crash the ErrorBoundary
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPrefsType['notification_types_enabled']) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePushToggle = async () => {
    if (!pushSupported) {
      setMessage({
        type: 'error',
        text: t('push.notSupported')
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (pushEnabled) {
      // Désactiver les push notifications
      const success = await studentNotificationService.revokePushSubscription();
      if (success) {
        setPushEnabled(false);
        setMessage({
          type: 'success',
          text: t('push.disabled')
        });
      }
    } else {
      // Demander la permission
      const granted = await studentNotificationService.requestPushPermission();

      if (granted) {
        setPushEnabled(true);
        setPushPermission('granted');
        setMessage({
          type: 'success',
          text: t('push.enabled')
        });
      } else {
        const currentPermission = await studentNotificationService.checkPushPermission();
        setPushPermission(currentPermission);

        if (currentPermission === 'denied') {
          setMessage({
            type: 'error',
            text: t('push.denied')
          });
        } else {
          setMessage({
            type: 'error',
            text: t('push.error')
          });
        }
      }
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Convertir HH:MM en HH:MM:SS
      const timeWithSeconds = `${preferredTime}:00`;

      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification_types_enabled: preferences,
          email_digest_frequency: emailDigest,
          preferred_notification_time: timeWithSeconds
        })
      });

      if (!response.ok) {
        throw new Error(t('saveError'));
      }

      const responseData = await response.json();
      const saved: NotificationPrefsType = responseData.preferences || responseData;

      if (saved) {
        setPreferences(saved.notification_types_enabled || preferences);
        setEmailDigest(saved.email_digest_frequency || emailDigest);
        setPreferredTime(saved.preferred_notification_time?.substring(0, 5) || preferredTime);
      }

      setMessage({ type: 'success', text: t('saved') });

      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('[NotificationPreferences] Failed to save preferences:', error);
      setMessage({ type: 'error', text: t('saveError') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message de notification */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 dark:bg-green-950/30 text-green-800' : 'bg-red-50 dark:bg-red-950/30 text-red-800'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Types de notifications */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-foreground">{t('types.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t('types.description')}
        </p>

        <div className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-start justify-between py-3 border-b last:border-b-0">
              <div className="flex-1">
                <label htmlFor={type.key} className="font-medium text-foreground cursor-pointer">
                  {t(type.labelKey)}
                </label>
                <p className="text-sm text-muted-foreground mt-1">{t(type.descriptionKey)}</p>
              </div>
              <button
                id={type.key}
                onClick={() => handleToggle(type.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences[type.key] ? 'bg-blue-600' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                    preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-foreground">{t('push.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t('push.description')}
        </p>

        {!pushSupported ? (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              {t('push.notSupported')}
            </span>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between py-3">
              <div className="flex-1">
                <label htmlFor="pushNotifications" className="font-medium text-foreground cursor-pointer">
                  {t('push.enable')}
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('push.enableDescription')}
                </p>
                {pushPermission === 'denied' && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    {t('push.denied')}
                  </p>
                )}
              </div>
              <button
                id="pushNotifications"
                onClick={handlePushToggle}
                disabled={pushPermission === 'denied'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pushEnabled ? 'bg-blue-600' : 'bg-muted'
                } ${pushPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                    pushEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fréquence des emails */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-foreground">{t('email.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t('email.description')}
        </p>

        <div className="space-y-3">
          {emailDigestOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                emailDigest === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-border hover:border-input'
              }`}
            >
              <input
                type="radio"
                name="emailDigest"
                value={option.value}
                checked={emailDigest === option.value}
                onChange={(e) => setEmailDigest(e.target.value as EmailDigestFrequency)}
                className="mt-1 h-4 w-4 text-blue-600 focus-visible:ring-ring"
              />
              <div className="ml-3">
                <div className="font-medium text-foreground">{t(option.labelKey)}</div>
                <div className="text-sm text-muted-foreground">{t(option.descriptionKey)}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Heure préférée pour les rappels */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-foreground">{t('time.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t('time.description')}
        </p>

        <div className="flex items-center gap-4">
          <label htmlFor="preferredTime" className="text-sm font-medium text-foreground">
            {t('time.preferredTime')}
          </label>
          <input
            type="time"
            id="preferredTime"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent"
          />
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  );
}
