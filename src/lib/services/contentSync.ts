// Service de synchronisation hybride JSON ↔ Supabase
import { createClient } from '@/lib/supabase/client';
import { getAllModules } from '@/lib/data';

export interface ContentSyncStatus {
  lastSync: string | null;
  jsonModules: number;
  supabaseModules: number;
  syncNeeded: boolean;
  conflicts: string[];
}

export interface ContentConfig {
  module_id: string;
  is_published: boolean;
  custom_order: number | null;
  admin_notes: string | null;
  last_modified: string;
  modified_by: string;
}

export class ContentSyncService {
  private supabase = createClient();

  /**
   * 📊 Obtenir le statut de synchronisation
   */
  async getSyncStatus(): Promise<ContentSyncStatus> {
    try {
      // Charger les modules JSON
      const jsonModules = await getAllModules();
      
      // Vérifier les configurations Supabase
      const { data: configData, error } = await this.supabase
        .from('content_config')
        .select('*');

      if (error) throw error;

      const lastSync = await this.getLastSyncTime();
      const conflicts = await this.detectConflicts();

      return {
        lastSync,
        jsonModules: jsonModules.length,
        supabaseModules: configData?.length || 0,
        syncNeeded: jsonModules.length !== (configData?.length || 0),
        conflicts
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du sync:', error);
      return {
        lastSync: null,
        jsonModules: 0,
        supabaseModules: 0,
        syncNeeded: true,
        conflicts: ['Erreur de connexion']
      };
    }
  }

  /**
   * 🔄 Synchroniser JSON vers Supabase
   */
  async syncJsonToSupabase(adminId: string): Promise<{ success: boolean; message: string }> {
    try {
      const jsonModules = await getAllModules();
      
      // Préparer les données de configuration
      const configData: Partial<ContentConfig>[] = jsonModules.map((module) => ({
        module_id: module.id,
        is_published: true, // Par défaut, publier tous les modules JSON
        custom_order: parseInt(module.id.replace(/[^\d]/g, '')) || 1,
        admin_notes: `Synchronisé depuis JSON - ${new Date().toISOString()}`,
        last_modified: new Date().toISOString(),
        modified_by: adminId
      }));

      // Supprimer les anciennes configurations
      await this.supabase.from('content_config').delete().neq('module_id', 'never');

      // Insérer les nouvelles configurations
      const { error: insertError } = await this.supabase
        .from('content_config')
        .insert(configData);

      if (insertError) throw insertError;

      // Mettre à jour le timestamp de sync
      await this.updateSyncTime();

      return {
        success: true,
        message: `✅ ${jsonModules.length} modules synchronisés avec succès`
      };
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return {
        success: false,
        message: `❌ Erreur de synchronisation: ${error}`
      };
    }
  }

  /**
   * 📊 Obtenir la configuration d'un module
   */
  async getModuleConfig(moduleId: string): Promise<ContentConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from('content_config')
        .select('*')
        .eq('module_id', moduleId)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * ⚙️ Mettre à jour la configuration d'un module
   */
  async updateModuleConfig(
    moduleId: string, 
    config: Partial<ContentConfig>,
    adminId: string
  ): Promise<boolean> {
    try {
      const updateData = {
        ...config,
        last_modified: new Date().toISOString(),
        modified_by: adminId
      };

      const { error } = await this.supabase
        .from('content_config')
        .upsert({ module_id: moduleId, ...updateData });

      return !error;
    } catch (error) {
      console.error('Erreur mise à jour config:', error);
      return false;
    }
  }

  /**
   * 📈 Obtenir les statistiques de progression
   */
  async getProgressStats(moduleId?: string): Promise<any> {
    try {
      let query = this.supabase
        .from('user_progress')
        .select(`
          capsule_id,
          status,
          exercise_score,
          time_spent_seconds,
          user_profiles!inner(email, display_name)
        `);

      if (moduleId) {
        // Filtrer par module si spécifié
        query = query.like('capsule_id', `${moduleId}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculer les statistiques
      const stats = {
        totalUsers: new Set(data?.map((d: any) => d.user_profiles.email) || []).size,
        completions: data?.filter((d: any) => d.status === 'completed').length || 0,
        avgScore: data?.reduce((sum: number, d: any) => sum + (d.exercise_score || 0), 0) / (data?.length || 1),
        avgTime: data?.reduce((sum: number, d: any) => sum + (d.time_spent_seconds || 0), 0) / (data?.length || 1)
      };

      return stats;
    } catch (error) {
      console.error('Erreur stats progression:', error);
      return { totalUsers: 0, completions: 0, avgScore: 0, avgTime: 0 };
    }
  }

  /**
   * 🕒 Fonctions utilitaires privées
   */
  private async getLastSyncTime(): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('system_config')
        .select('value')
        .eq('key', 'last_content_sync')
        .single();

      return data?.value || null;
    } catch (error) {
      return null;
    }
  }

  private async updateSyncTime(): Promise<void> {
    const now = new Date().toISOString();
    await this.supabase
      .from('system_config')
      .upsert({ key: 'last_content_sync', value: now });
  }

  private async detectConflicts(): Promise<string[]> {
    // Logique pour détecter les conflits entre JSON et Supabase
    // Pour l'instant, retourner un tableau vide
    return [];
  }
}

// Instance singleton
export const contentSyncService = new ContentSyncService();
