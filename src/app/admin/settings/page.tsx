'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Settings, Shield, Bell, Database, Mail, Globe, 
  Save, AlertCircle, Check, X, Download,
  Upload, RefreshCw, Lock, Users, Zap, Clock,
  HardDrive, Wifi, WifiOff, DollarSign, Brain
} from 'lucide-react';

interface SystemSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
  allow_registrations: boolean;
  max_users_limit: number;
  require_email_verification: boolean;
  allow_social_login: boolean;
  
  // Quotas IA
  magistral_daily_quota: number;
  mistral_medium_daily_quota: number;
  mistral_small_daily_quota: number;
  monthly_budget_limit: number;
  
  // Notifications
  send_welcome_email: boolean;
  send_completion_certificates: boolean;
  admin_email_notifications: boolean;
  admin_notification_email: string;
  
  // Sécurité
  session_timeout_minutes: number;
  max_login_attempts: number;
  password_min_length: number;
  require_strong_password: boolean;
  
  // Backup
  auto_backup_enabled: boolean;
  backup_frequency_days: number;
  backup_retention_days: number;
  last_backup_date: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    maintenance_message: 'La plateforme est en maintenance. Nous serons de retour bientôt.',
    allow_registrations: true,
    max_users_limit: 200,
    require_email_verification: false,
    allow_social_login: false,
    
    magistral_daily_quota: 60,
    mistral_medium_daily_quota: 300,
    mistral_small_daily_quota: 1000,
    monthly_budget_limit: 100,
    
    send_welcome_email: true,
    send_completion_certificates: true,
    admin_email_notifications: true,
    admin_notification_email: 'admin@geniawebtraining.com',
    
    session_timeout_minutes: 60,
    max_login_attempts: 5,
    password_min_length: 8,
    require_strong_password: true,
    
    auto_backup_enabled: false,
    backup_frequency_days: 7,
    backup_retention_days: 30,
    last_backup_date: null
  });

  const [originalSettings, setOriginalSettings] = useState<SystemSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Détecter les changements
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    // Dans une vraie application, ces paramètres seraient stockés dans la base de données
    // Pour l'instant, on utilise les valeurs par défaut
    try {
      // Simuler le chargement depuis la DB
      const savedSettings = localStorage.getItem('admin_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setOriginalSettings(parsed);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Dans une vraie application, on sauvegarderait dans la DB
      localStorage.setItem('admin_settings', JSON.stringify(settings));
      setOriginalSettings(settings);
      setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès!' });
      
      // Si le mode maintenance est activé, afficher un avertissement
      if (settings.maintenance_mode) {
        setTimeout(() => {
          setMessage({ 
            type: 'error', 
            text: '⚠️ Mode maintenance activé - Les utilisateurs ne peuvent plus accéder à la plateforme' 
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des paramètres' });
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(originalSettings);
    setMessage(null);
  };

  const handleBackupNow = async () => {
    if (confirm('Voulez-vous lancer une sauvegarde manuelle maintenant?')) {
      setMessage({ type: 'success', text: 'Sauvegarde en cours...' });
      // Simuler la sauvegarde
      setTimeout(() => {
        setSettings(prev => ({
          ...prev,
          last_backup_date: new Date().toISOString()
        }));
        setMessage({ type: 'success', text: 'Sauvegarde effectuée avec succès!' });
      }, 2000);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `settings_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <a href="/admin" className="text-blue-600 hover:text-blue-800 font-medium">← Dashboard Admin</a>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-gray-900">Paramètres Système</h1>
          </div>
          <p className="text-gray-600">Configuration générale de la plateforme GENIA Web Training</p>
        </div>
        
        {/* Quick Navigation */}
        <div className="px-6 pb-2">
          <nav className="flex gap-4 text-sm">
            <a href="/admin" className="text-gray-500 hover:text-gray-700">Dashboard</a>
            <a href="/admin/users" className="text-gray-500 hover:text-gray-700">Utilisateurs</a>
            <a href="/admin/analytics" className="text-gray-500 hover:text-gray-700">Analytics</a>
            <a href="/admin/content" className="text-gray-500 hover:text-gray-700">Contenu</a>
            <a href="/admin/settings" className="text-blue-600 font-medium">Paramètres</a>
          </nav>
        </div>
      </div>
      
      <div className="p-6">

      {/* Message de notification */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Actions bar */}
      <div className="mb-6 flex justify-between items-center bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Modifications non sauvegardées
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportSettings}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Exporter
          </button>
          {hasChanges && (
            <>
              <button
                onClick={resetSettings}
                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Général */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Paramètres Généraux
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Mode maintenance */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Mode maintenance</label>
                <p className="text-sm text-gray-500">Fermer temporairement la plateforme</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, maintenance_mode: !prev.maintenance_mode }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.maintenance_mode ? 'bg-red-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {settings.maintenance_mode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message de maintenance
                </label>
                <textarea
                  value={settings.maintenance_message}
                  onChange={(e) => setSettings(prev => ({ ...prev, maintenance_message: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            )}

            {/* Inscriptions */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Autoriser les inscriptions</label>
                <p className="text-sm text-gray-500">Permettre aux nouveaux utilisateurs de s'inscrire</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, allow_registrations: !prev.allow_registrations }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.allow_registrations ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.allow_registrations ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Limite d'utilisateurs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limite d'utilisateurs
              </label>
              <input
                type="number"
                value={settings.max_users_limit}
                onChange={(e) => setSettings(prev => ({ ...prev, max_users_limit: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vérification email */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Vérification email requise</label>
                <p className="text-sm text-gray-500">Les utilisateurs doivent confirmer leur email</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, require_email_verification: !prev.require_email_verification }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.require_email_verification ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.require_email_verification ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section Quotas IA */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Quotas IA & Budget
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Budget mensuel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget mensuel (€)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={settings.monthly_budget_limit}
                  onChange={(e) => setSettings(prev => ({ ...prev, monthly_budget_limit: parseInt(e.target.value) || 0 }))}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quota Magistral */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Magistral Medium (requêtes/jour/utilisateur)
              </label>
              <input
                type="number"
                value={settings.magistral_daily_quota}
                onChange={(e) => setSettings(prev => ({ ...prev, magistral_daily_quota: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quota Mistral Medium */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mistral Medium 3 (requêtes/jour/utilisateur)
              </label>
              <input
                type="number"
                value={settings.mistral_medium_daily_quota}
                onChange={(e) => setSettings(prev => ({ ...prev, mistral_medium_daily_quota: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quota Mistral Small */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mistral Small (requêtes/jour/utilisateur)
              </label>
              <input
                type="number"
                value={settings.mistral_small_daily_quota}
                onChange={(e) => setSettings(prev => ({ ...prev, mistral_small_daily_quota: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estimation */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Estimation :</strong> Avec ces quotas, environ {Math.floor(settings.monthly_budget_limit / 0.5)} utilisateurs
                actifs peuvent être supportés avec le budget de {settings.monthly_budget_limit}€/mois.
              </p>
            </div>
          </div>
        </div>

        {/* Section Notifications */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications & Emails
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Email de bienvenue */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Email de bienvenue</label>
                <p className="text-sm text-gray-500">Envoyer un email aux nouveaux inscrits</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, send_welcome_email: !prev.send_welcome_email }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.send_welcome_email ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.send_welcome_email ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Certificats */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Certificats de complétion</label>
                <p className="text-sm text-gray-500">Envoyer automatiquement les certificats</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, send_completion_certificates: !prev.send_completion_certificates }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.send_completion_certificates ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.send_completion_certificates ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Notifications admin */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Notifications admin</label>
                <p className="text-sm text-gray-500">Recevoir les alertes système</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, admin_email_notifications: !prev.admin_email_notifications }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.admin_email_notifications ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.admin_email_notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {settings.admin_email_notifications && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de notification admin
                </label>
                <input
                  type="email"
                  value={settings.admin_notification_email}
                  onChange={(e) => setSettings(prev => ({ ...prev, admin_notification_email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section Sécurité */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sécurité
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Timeout session */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout de session (minutes)
              </label>
              <input
                type="number"
                value={settings.session_timeout_minutes}
                onChange={(e) => setSettings(prev => ({ ...prev, session_timeout_minutes: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tentatives de connexion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tentatives de connexion max
              </label>
              <input
                type="number"
                value={settings.max_login_attempts}
                onChange={(e) => setSettings(prev => ({ ...prev, max_login_attempts: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Longueur mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longueur minimale du mot de passe
              </label>
              <input
                type="number"
                value={settings.password_min_length}
                onChange={(e) => setSettings(prev => ({ ...prev, password_min_length: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mot de passe fort */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Mot de passe fort requis</label>
                <p className="text-sm text-gray-500">Majuscules, minuscules, chiffres, symboles</p>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, require_strong_password: !prev.require_strong_password }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.require_strong_password ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.require_strong_password ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section Backup */}
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Sauvegarde & Restauration
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Backup automatique */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Backup automatique</label>
                  <p className="text-sm text-gray-500">Sauvegarder régulièrement</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, auto_backup_enabled: !prev.auto_backup_enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.auto_backup_enabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.auto_backup_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Fréquence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fréquence (jours)
                </label>
                <input
                  type="number"
                  value={settings.backup_frequency_days}
                  onChange={(e) => setSettings(prev => ({ ...prev, backup_frequency_days: parseInt(e.target.value) || 0 }))}
                  disabled={!settings.auto_backup_enabled}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* Rétention */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rétention (jours)
                </label>
                <input
                  type="number"
                  value={settings.backup_retention_days}
                  onChange={(e) => setSettings(prev => ({ ...prev, backup_retention_days: parseInt(e.target.value) || 0 }))}
                  disabled={!settings.auto_backup_enabled}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Dernière sauvegarde */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Dernière sauvegarde</p>
                  <p className="text-sm text-gray-500">
                    {settings.last_backup_date 
                      ? new Date(settings.last_backup_date).toLocaleString('fr-FR')
                      : 'Aucune sauvegarde'
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBackupNow}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <HardDrive className="w-4 h-4 inline mr-2" />
                    Sauvegarder maintenant
                  </button>
                  <button
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Restaurer
                  </button>
                </div>
              </div>
            </div>

            {/* Note d'information */}
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>Note :</strong> Les sauvegardes automatiques sont gérées par Supabase. 
                    Pour un plan gratuit, les sauvegardes quotidiennes sont conservées pendant 7 jours.
                    Pour plus d'options, passez à un plan Pro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}