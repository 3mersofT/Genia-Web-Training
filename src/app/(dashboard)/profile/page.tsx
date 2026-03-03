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
import NotificationPreferences from '@/components/notifications/NotificationPreferences';


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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Profil non trouvé</h2>
          <p className="text-muted-foreground">Impossible de charger votre profil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Mon Profil</h1>
                <p className="text-muted-foreground">Personnalisez votre profil et vos préférences</p>
              </div>
              <div className="flex gap-3">
                {editing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-foreground bg-muted rounded-lg hover:bg-muted flex items-center gap-2"
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
              className="flex items-center gap-2 text-muted-foreground hover:text-accent-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour au dashboard</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mon Profil</h1>
          <p className="text-muted-foreground">Personnalisez votre profil et vos préférences</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-sm p-6">
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
                <h3 className="text-lg font-semibold text-foreground mt-4">
                  {profile.display_name || 'Utilisateur'}
                </h3>
                <p className="text-muted-foreground text-sm">{profile.email}</p>
                <div className="mt-4">
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    profile.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800'
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
                      : 'text-foreground hover:bg-accent'
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
                      : 'text-foreground hover:bg-accent'
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
                      : 'text-foreground hover:bg-accent'
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
              <div className="bg-card rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Informations personnelles</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nom d'affichage
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      disabled={!editing}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
                      placeholder="Votre nom d'affichage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{profile.email}</span>
                      <span className="text-xs text-muted-foreground">(Non modifiable)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Biographie
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      disabled={!editing}
                      rows={4}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
                      placeholder="Parlez-nous de vous..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Membre depuis
                    </label>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">
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
              <div className="space-y-6">
                <div className="bg-card rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-6">Préférences générales</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
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
                                : 'border-border hover:border-input'
                            } ${!editing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          >
                            <div className="text-2xl mb-2">{theme.icon}</div>
                            <div className="text-sm font-medium">{theme.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Langue
                      </label>
                      <select
                        value={formData.preferences.language}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, language: e.target.value as 'fr' | 'en' }
                        }))}
                        disabled={!editing}
                        className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences Section */}
                {user && <NotificationPreferences userId={user.id} />}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-card rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Sécurité</h2>
                
                <div className="space-y-6">
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Mot de passe</h3>
                        <p className="text-sm text-muted-foreground">Dernière modification il y a 30 jours</p>
                      </div>
                      <button 
                        onClick={handleChangePassword}
                        className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Authentification à deux facteurs</h3>
                        <p className="text-sm text-muted-foreground">Ajoutez une couche de sécurité supplémentaire</p>
                      </div>
                      <button 
                        onClick={handleEnable2FA}
                        className="px-4 py-2 text-muted-foreground border border-input rounded-lg hover:bg-accent"
                      >
                        Activer
                      </button>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Sessions actives</h3>
                        <p className="text-sm text-muted-foreground">Gérez vos sessions connectées</p>
                      </div>
                      <button 
                        onClick={handleViewSessions}
                        className="px-4 py-2 text-muted-foreground border border-input rounded-lg hover:bg-accent"
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
