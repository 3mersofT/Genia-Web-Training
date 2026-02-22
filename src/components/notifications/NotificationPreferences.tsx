'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, Clock, Check, AlertCircle, Save, Smartphone } from 'lucide-react';
import type { NotificationPreferences as NotificationPrefsType, EmailDigestFrequency } from '@/types/notifications.types';
import { studentNotificationService } from '@/lib/services/studentNotificationService';

interface NotificationPreferencesProps {
  userId: string;
}

interface NotificationTypeConfig {
  key: keyof NotificationPrefsType['notification_types_enabled'];
  label: string;
  description: string;
}

const notificationTypes: NotificationTypeConfig[] = [
  {
    key: 'daily_challenge',
    label: 'Défi quotidien',
    description: 'Recevoir une notification quand un nouveau défi est disponible'
  },
  {
    key: 'streak_reminder',
    label: 'Rappel de série',
    description: 'Recevoir un rappel si votre série est en danger (pas d\'activité depuis 20h)'
  },
  {
    key: 'badge_earned',
    label: 'Badges gagnés',
    description: 'Recevoir une notification quand vous gagnez un nouveau badge'
  },
  {
    key: 'peer_review',
    label: 'Revue par les pairs',
    description: 'Recevoir une notification quand quelqu\'un évalue votre travail'
  },
  {
    key: 'new_module',
    label: 'Nouveau module',
    description: 'Recevoir une notification quand un nouveau module est publié'
  },
  {
    key: 'ai_nudge',
    label: 'Suggestions IA',
    description: 'Recevoir des suggestions personnalisées du tuteur IA'
  }
];

const emailDigestOptions: { value: EmailDigestFrequency; label: string; description: string }[] = [
  { value: 'immediate', label: 'Immédiat', description: 'Recevoir un email pour chaque notification' },
  { value: 'daily', label: 'Résumé quotidien', description: 'Recevoir un résumé une fois par jour' },
  { value: 'weekly', label: 'Résumé hebdomadaire', description: 'Recevoir un résumé une fois par semaine' },
  { value: 'off', label: 'Désactivé', description: 'Ne pas recevoir d\'emails de notification' }
];

export default function NotificationPreferences({ userId }: NotificationPreferencesProps) {
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
        throw new Error('Erreur lors du chargement des préférences');
      }

      const data: NotificationPrefsType = await response.json();

      if (data) {
        setPreferences(data.notification_types_enabled);
        setEmailDigest(data.email_digest_frequency);
        // Convertir HH:MM:SS en HH:MM pour l'input
        setPreferredTime(data.preferred_notification_time?.substring(0, 5) || '09:00');
      }
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des préférences' });
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
        text: 'Les notifications push ne sont pas supportées par votre navigateur'
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
          text: 'Notifications push désactivées'
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
          text: 'Notifications push activées avec succès!'
        });
      } else {
        const currentPermission = await studentNotificationService.checkPushPermission();
        setPushPermission(currentPermission);

        if (currentPermission === 'denied') {
          setMessage({
            type: 'error',
            text: 'Permission refusée. Veuillez autoriser les notifications dans les paramètres de votre navigateur.'
          });
        } else {
          setMessage({
            type: 'error',
            text: 'Impossible d\'activer les notifications push'
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
        throw new Error('Erreur lors de la sauvegarde');
      }

      setMessage({ type: 'success', text: 'Préférences sauvegardées avec succès!' });

      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde préférences:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des préférences' });
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
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Types de notifications */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Types de notifications</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Choisissez les types de notifications que vous souhaitez recevoir
        </p>

        <div className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-start justify-between py-3 border-b last:border-b-0">
              <div className="flex-1">
                <label htmlFor={type.key} className="font-medium text-gray-900 cursor-pointer">
                  {type.label}
                </label>
                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
              </div>
              <button
                id={type.key}
                onClick={() => handleToggle(type.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences[type.key] ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notifications Push</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Recevez des notifications instantanées sur votre appareil
        </p>

        {!pushSupported ? (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              Les notifications push ne sont pas supportées par votre navigateur
            </span>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between py-3">
              <div className="flex-1">
                <label htmlFor="pushNotifications" className="font-medium text-gray-900 cursor-pointer">
                  Activer les notifications push
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Recevoir des notifications en temps réel même quand l'application n'est pas ouverte
                </p>
                {pushPermission === 'denied' && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Permission refusée. Veuillez autoriser les notifications dans les paramètres de votre navigateur.
                  </p>
                )}
              </div>
              <button
                id="pushNotifications"
                onClick={handlePushToggle}
                disabled={pushPermission === 'denied'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pushEnabled ? 'bg-blue-600' : 'bg-gray-200'
                } ${pushPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pushEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fréquence des emails */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notifications par email</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Choisissez la fréquence des emails de notification
        </p>

        <div className="space-y-3">
          {emailDigestOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                emailDigest === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="emailDigest"
                value={option.value}
                checked={emailDigest === option.value}
                onChange={(e) => setEmailDigest(e.target.value as EmailDigestFrequency)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Heure préférée pour les rappels */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Heure des rappels</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Choisissez l'heure à laquelle vous souhaitez recevoir vos rappels de série
        </p>

        <div className="flex items-center gap-4">
          <label htmlFor="preferredTime" className="text-sm font-medium text-gray-700">
            Heure préférée :
          </label>
          <input
            type="time"
            id="preferredTime"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
        </button>
      </div>
    </div>
  );
}
