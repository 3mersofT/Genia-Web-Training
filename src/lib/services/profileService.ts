import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: 'student' | 'admin';
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: 'fr' | 'en';
    email_notifications: boolean;
    push_notifications: boolean;
  };
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  preferences?: Partial<UserProfile['preferences']>;
}

class ProfileService {
  private supabase = createClient();

  /**
   * Récupère le profil d'un utilisateur
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  /**
   * Met à jour le profil d'un utilisateur
   */
  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return false;
    }
  }

  /**
   * Met à jour les préférences d'un utilisateur
   */
  async updatePreferences(userId: string, preferences: Partial<UserProfile['preferences']>): Promise<boolean> {
    try {
      // Récupérer les préférences actuelles
      const { data: currentProfile } = await this.supabase
        .from('user_profiles')
        .select('preferences')
        .eq('user_id', userId)
        .single();

      const currentPreferences = currentProfile?.preferences || {};
      const updatedPreferences = { ...currentPreferences, ...preferences };

      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      return false;
    }
  }

  /**
   * Upload d'un avatar (à implémenter avec Supabase Storage)
   */
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      // Pour l'instant, on retourne une URL simulée
      // À implémenter avec Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      // Simulation d'upload
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      return null;
    }
  }

  /**
   * Supprime l'avatar d'un utilisateur
   */
  async deleteAvatar(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avatar:', error);
      return false;
    }
  }

  /**
   * Marque l'onboarding comme terminé
   */
  async completeOnboarding(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la finalisation de l\'onboarding:', error);
      return false;
    }
  }

  /**
   * Récupère les statistiques du profil
   */
  async getProfileStats(userId: string) {
    try {
      const [
        { data: progressData },
        { data: pointsData },
        { data: badgesData }
      ] = await Promise.all([
        this.supabase
          .from('user_progress')
          .select('status, completed_at')
          .eq('user_id', userId),
        this.supabase
          .from('user_points')
          .select('total_points, streak_days, level')
          .eq('user_id', userId)
          .single(),
        this.supabase
          .from('user_badges')
          .select('badge_id, earned_at')
          .eq('user_id', userId)
      ]);

      const completedCapsules = progressData?.filter((p: any) => p.status === 'completed').length || 0;
      const totalCapsules = progressData?.length || 0;
      const completionRate = totalCapsules > 0 ? (completedCapsules / totalCapsules) * 100 : 0;

      return {
        completedCapsules,
        totalCapsules,
        completionRate: Math.round(completionRate),
        totalPoints: pointsData?.total_points || 0,
        streakDays: pointsData?.streak_days || 0,
        level: pointsData?.level || 1,
        badgesEarned: badgesData?.length || 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  }
}

export const profileService = new ProfileService();
