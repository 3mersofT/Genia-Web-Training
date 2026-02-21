'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { profileService, UserProfile } from '@/lib/services/profileService';
import {
  User, Mail, Calendar, Settings, Camera, Save, 
  Globe, Bell, Palette, Languages, Shield, Award,
  Edit3, X, Check, Upload, Image as ImageIcon, ArrowLeft
} from 'lucide-react';


export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  
  // Form states
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    preferences: {
      theme: 'light' as 'light' | 'dark' | 'system',
      notifications: true,
      language: 'fr' as 'fr' | 'en',
      email_notifications: true,
      push_notifications: true
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const data = await profileService.getProfile(user.id);
      if (data) {
        setProfile(data);
        setFormData({
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          preferences: {
            theme: data.preferences?.theme || 'light',
            notifications: data.preferences?.notifications ?? true,
            language: data.preferences?.language || 'fr',
            email_notifications: data.preferences?.email_notifications ?? true,
            push_notifications: data.preferences?.push_notifications ?? true
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const success = await profileService.updateProfile(user.id, {
        display_name: formData.display_name,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        preferences: formData.preferences
      });

      if (success) {
        setProfile(prev => prev ? { ...prev, ...formData } : null);
        setEditing(false);
        alert('Profil mis à jour avec succès !');
      } else {
        alert('Erreur lors de la sauvegarde du profil');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        preferences: {
          theme: profile.preferences?.theme || 'light',
          notifications: profile.preferences?.notifications ?? true,
          language: profile.preferences?.language || 'fr',
          email_notifications: profile.preferences?.email_notifications ?? true,
          push_notifications: profile.preferences?.push_notifications ?? true
        }
      });
    }
    setEditing(false);
  };

  const handleChangePassword = () => {
    // Rediriger vers la page de changement de mot de passe
    router.push('/forgot-password');
  };

  const handleEnable2FA = () => {
    alert('Fonctionnalité 2FA en cours de développement');
  };

  const handleViewSessions = () => {
    alert('Gestion des sessions en cours de développement');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const avatarUrl = await profileService.uploadAvatar(user.id, file);
      if (avatarUrl) {
        setFormData(prev => ({
          ...prev,
          avatar_url: avatarUrl
        }));
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      alert('Erreur lors de l\'upload de l\'avatar');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profil non trouvé</h2>
          <p className="text-gray-600">Impossible de charger votre profil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
                <p className="text-gray-600">Personnalisez votre profil et vos préférences</p>
              </div>
              <div className="flex gap-3">
                {editing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifier
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec bouton retour */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour au dashboard</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
          <p className="text-gray-600">Personnalisez votre profil et vos préférences</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.display_name?.charAt(0)?.toUpperCase() || profile.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {editing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">
                  {profile.display_name || 'Utilisateur'}
                </h3>
                <p className="text-gray-600 text-sm">{profile.email}</p>
                <div className="mt-4">
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    profile.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {profile.role === 'admin' ? 'Administrateur' : 'Étudiant'}
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="mt-8 space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Informations personnelles
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'preferences'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Préférences
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'security'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Sécurité
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations personnelles</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom d'affichage
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      disabled={!editing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Votre nom d'affichage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profile.email}</span>
                      <span className="text-xs text-gray-500">(Non modifiable)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Biographie
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      disabled={!editing}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Parlez-nous de vous..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Membre depuis
                    </label>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Préférences</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Thème
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Clair', icon: '☀️' },
                        { value: 'dark', label: 'Sombre', icon: '🌙' },
                        { value: 'system', label: 'Système', icon: '💻' }
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => editing && setFormData(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, theme: theme.value as any }
                          }))}
                          disabled={!editing}
                          className={`p-4 rounded-lg border-2 text-center transition-colors ${
                            formData.preferences.theme === theme.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          } ${!editing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <div className="text-2xl mb-2">{theme.icon}</div>
                          <div className="text-sm font-medium">{theme.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Langue
                    </label>
                    <select
                      value={formData.preferences.language}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, language: e.target.value as 'fr' | 'en' }
                      }))}
                      disabled={!editing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                    
                    {[
                      { key: 'notifications', label: 'Notifications générales', description: 'Recevoir des notifications sur la plateforme' },
                      { key: 'email_notifications', label: 'Notifications par email', description: 'Recevoir des mises à jour par email' },
                      { key: 'push_notifications', label: 'Notifications push', description: 'Recevoir des notifications push' }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{setting.label}</div>
                          <div className="text-sm text-gray-500">{setting.description}</div>
                        </div>
                        <button
                          onClick={() => editing && setFormData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              [setting.key]: !prev.preferences[setting.key as keyof typeof prev.preferences]
                            }
                          }))}
                          disabled={!editing}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.preferences[setting.key as keyof typeof formData.preferences]
                              ? 'bg-blue-600'
                              : 'bg-gray-200'
                          } ${!editing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.preferences[setting.key as keyof typeof formData.preferences]
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Sécurité</h2>
                
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Mot de passe</h3>
                        <p className="text-sm text-gray-500">Dernière modification il y a 30 jours</p>
                      </div>
                      <button 
                        onClick={handleChangePassword}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Authentification à deux facteurs</h3>
                        <p className="text-sm text-gray-500">Ajoutez une couche de sécurité supplémentaire</p>
                      </div>
                      <button 
                        onClick={handleEnable2FA}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Activer
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Sessions actives</h3>
                        <p className="text-sm text-gray-500">Gérez vos sessions connectées</p>
                      </div>
                      <button 
                        onClick={handleViewSessions}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
