import { createClient } from '@/lib/supabase/client';
import type {
  LevelDefinition,
  UserLevel,
  XPTransaction,
  LevelUpNotification,
  LevelProgress,
  AwardXPResult,
  AwardXPInput,
  UserLevelStats,
  XPSourceType,
  LevelName,
  LevelNameFr
} from '@/types/levels.types';
import { calculateLevelFromXP, calculateProgressPercentage } from '@/types/levels.types';

/**
 * Service de gestion de la progression de niveau et de l'XP
 */
export class LevelProgressionService {
  private supabase = createClient();

  /**
   * Attribue de l'XP à un utilisateur
   * Gère automatiquement les montées de niveau
   */
  async awardXP(input: AwardXPInput): Promise<AwardXPResult> {
    try {
      const { user_id, xp_amount, source_type, source_id, description } = input;

      // Valider l'entrée
      if (xp_amount <= 0) {
        throw new Error('Le montant d\'XP doit être positif');
      }

      // Obtenir le niveau actuel de l'utilisateur
      const userLevelBefore = await this.getUserLevel(user_id);

      if (!userLevelBefore) {
        throw new Error('Niveau utilisateur non trouvé');
      }

      const oldLevelRank = userLevelBefore.current_level_rank;
      const oldTotalXP = userLevelBefore.total_xp;

      // Créer la transaction XP
      const { data: xpTransaction, error: xpError } = await this.supabase
        .from('xp_transactions')
        .insert({
          user_id,
          xp_amount,
          source_type,
          source_id,
          description
        })
        .select()
        .single();

      if (xpError) {
        console.error('Erreur création transaction XP:', xpError);
        throw xpError;
      }

      // Calculer le nouveau total XP
      const newTotalXP = oldTotalXP + xp_amount;

      // Obtenir toutes les définitions de niveau
      const levelDefinitions = await this.getAllLevelDefinitions();

      // Calculer le nouveau niveau
      const newLevel = calculateLevelFromXP(newTotalXP, levelDefinitions);

      if (!newLevel) {
        throw new Error('Impossible de calculer le nouveau niveau');
      }

      const newLevelRank = newLevel.level_rank;
      const leveledUp = newLevelRank > oldLevelRank;

      // XP dans le niveau actuel
      const currentLevelXP = newTotalXP - newLevel.xp_required;

      // Mettre à jour le niveau de l'utilisateur
      const { error: updateError } = await this.supabase
        .from('user_levels')
        .update({
          current_level_id: newLevel.id,
          current_level_rank: newLevelRank,
          total_xp: newTotalXP,
          current_level_xp: currentLevelXP,
          total_level_ups: leveledUp ? userLevelBefore.total_level_ups + (newLevelRank - oldLevelRank) : userLevelBefore.total_level_ups,
          last_xp_gain_at: new Date().toISOString(),
          last_level_up_at: leveledUp ? new Date().toISOString() : userLevelBefore.last_level_up_at,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Erreur mise à jour niveau utilisateur:', updateError);
        throw updateError;
      }

      // Si montée de niveau, créer une notification
      let levelUpNotification: LevelUpNotification | undefined;
      if (leveledUp) {
        levelUpNotification = await this.createLevelUpNotification(
          user_id,
          oldLevelRank,
          newLevelRank
        );
      }

      return {
        success: true,
        xp_awarded: xp_amount,
        total_xp: newTotalXP,
        current_level_rank: newLevelRank,
        current_level_name: newLevel.level_name,
        leveled_up: leveledUp,
        old_level_rank: oldLevelRank,
        new_level_rank: newLevelRank,
        level_up_notification: levelUpNotification
      };
    } catch (error) {
      console.error('Erreur attribution XP:', error);
      throw error;
    }
  }

  /**
   * Crée une notification de montée de niveau
   * Inclut également un marqueur pour déclencher une célébration
   */
  private async createLevelUpNotification(
    userId: string,
    fromRank: number,
    toRank: number
  ): Promise<LevelUpNotification | undefined> {
    try {
      const levels = await this.getAllLevelDefinitions();
      const fromLevel = levels.find(l => l.level_rank === fromRank);
      const toLevel = levels.find(l => l.level_rank === toRank);

      // Déterminer la rareté basée sur le niveau atteint
      let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
      if (toRank === 5) rarity = 'legendary'; // Légende
      else if (toRank === 4) rarity = 'epic'; // Maître
      else if (toRank === 3) rarity = 'rare'; // Expert
      else if (toRank === 2) rarity = 'rare'; // Apprenti

      const { data, error } = await this.supabase
        .from('level_up_notifications')
        .insert({
          user_id: userId,
          from_level_rank: fromRank,
          to_level_rank: toRank,
          from_level_name: fromLevel?.level_name_fr,
          to_level_name: toLevel?.level_name_fr,
          shown: false,
          rewards_unlocked: {
            celebration: true,
            rarity,
            icon_emoji: toLevel?.icon_emoji,
            color_hex: toLevel?.color_hex
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création notification de montée de niveau:', error);
        return undefined;
      }

      return data as LevelUpNotification;
    } catch (error) {
      console.error('Erreur création notification:', error);
      return undefined;
    }
  }

  /**
   * Génère les données de célébration pour une montée de niveau
   * Ces données peuvent être utilisées pour afficher l'animation de célébration
   */
  async getCelebrationDataForLevelUp(
    levelUpNotification: LevelUpNotification
  ): Promise<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'completion' | 'performance' | 'streak' | 'social' | 'special';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    points: number;
    celebrationType: 'level_up';
    data: any;
  } | null> {
    try {
      const toLevel = await this.getLevelDefinition(levelUpNotification.to_level_rank);
      if (!toLevel) return null;

      // Déterminer la rareté
      let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
      if (levelUpNotification.to_level_rank === 5) rarity = 'legendary';
      else if (levelUpNotification.to_level_rank === 4) rarity = 'epic';
      else if (levelUpNotification.to_level_rank === 3) rarity = 'rare';
      else if (levelUpNotification.to_level_rank === 2) rarity = 'rare';

      // Points basés sur le niveau
      const points = levelUpNotification.to_level_rank * 200;

      return {
        id: levelUpNotification.id,
        name: `Niveau ${toLevel.level_name_fr}`,
        description: `Félicitations ! Vous avez atteint le niveau ${toLevel.level_name_fr} ${toLevel.icon_emoji}`,
        icon: toLevel.icon_emoji || '🎉',
        category: 'special',
        rarity,
        points,
        celebrationType: 'level_up',
        data: {
          from_level: levelUpNotification.from_level_name,
          to_level: levelUpNotification.to_level_name,
          level_rank: levelUpNotification.to_level_rank,
          xp_required: toLevel.xp_required
        }
      };
    } catch (error) {
      console.error('Erreur génération données célébration:', error);
      return null;
    }
  }

  /**
   * Calcule le niveau basé sur l'XP total
   */
  async calculateLevel(totalXP: number): Promise<LevelDefinition | null> {
    try {
      const levels = await this.getAllLevelDefinitions();
      return calculateLevelFromXP(totalXP, levels);
    } catch (error) {
      console.error('Erreur calcul niveau:', error);
      return null;
    }
  }

  /**
   * Récupère une définition de niveau par rang
   */
  async getLevelDefinition(rank: number): Promise<LevelDefinition | null> {
    try {
      const { data, error } = await this.supabase
        .from('level_definitions')
        .select('*')
        .eq('level_rank', rank)
        .single();

      if (error) {
        console.error('Erreur récupération définition niveau:', error);
        return null;
      }

      return data as LevelDefinition;
    } catch (error) {
      console.error('Erreur récupération niveau:', error);
      return null;
    }
  }

  /**
   * Récupère toutes les définitions de niveau
   */
  async getAllLevelDefinitions(): Promise<LevelDefinition[]> {
    try {
      const { data, error } = await this.supabase
        .from('level_definitions')
        .select('*')
        .order('level_rank', { ascending: true });

      if (error) {
        console.error('Erreur récupération définitions de niveau:', error);
        return [];
      }

      return (data as LevelDefinition[]) || [];
    } catch (error) {
      console.error('Erreur récupération niveaux:', error);
      return [];
    }
  }

  /**
   * Récupère le niveau actuel d'un utilisateur
   */
  async getUserLevel(userId: string): Promise<UserLevel | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_levels')
        .select(`
          *,
          level_definition:level_definitions(*)
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        // Si l'utilisateur n'a pas encore de niveau, l'initialiser
        if (error.code === 'PGRST116') {
          return await this.initializeUserLevel(userId);
        }
        console.error('Erreur récupération niveau utilisateur:', error);
        return null;
      }

      return data as UserLevel;
    } catch (error) {
      console.error('Erreur récupération niveau utilisateur:', error);
      return null;
    }
  }

  /**
   * Initialise le niveau d'un nouvel utilisateur
   */
  private async initializeUserLevel(userId: string): Promise<UserLevel | null> {
    try {
      // Récupérer le premier niveau (Novice)
      const firstLevel = await this.getLevelDefinition(1);

      if (!firstLevel) {
        console.error('Niveau de départ non trouvé');
        return null;
      }

      const { data, error } = await this.supabase
        .from('user_levels')
        .insert({
          user_id: userId,
          current_level_id: firstLevel.id,
          current_level_rank: 1,
          total_xp: 0,
          current_level_xp: 0,
          total_level_ups: 0
        })
        .select(`
          *,
          level_definition:level_definitions(*)
        `)
        .single();

      if (error) {
        console.error('Erreur initialisation niveau utilisateur:', error);
        return null;
      }

      return data as UserLevel;
    } catch (error) {
      console.error('Erreur initialisation niveau:', error);
      return null;
    }
  }

  /**
   * Récupère l'XP requis pour un niveau spécifique
   */
  async getXPRequirement(rank: number): Promise<number> {
    try {
      const level = await this.getLevelDefinition(rank);
      return level?.xp_required || 0;
    } catch (error) {
      console.error('Erreur récupération XP requis:', error);
      return 0;
    }
  }

  /**
   * Récupère la progression de niveau d'un utilisateur
   */
  async getLevelProgress(userId: string): Promise<LevelProgress | null> {
    try {
      const userLevel = await this.getUserLevel(userId);

      if (!userLevel) {
        return null;
      }

      const levels = await this.getAllLevelDefinitions();
      const currentLevel = levels.find(l => l.level_rank === userLevel.current_level_rank);

      if (!currentLevel) {
        return null;
      }

      const nextLevel = levels.find(l => l.level_rank === userLevel.current_level_rank + 1);

      const xpToNextLevel = nextLevel
        ? nextLevel.xp_required - userLevel.total_xp
        : 0;

      const progressPercentage = calculateProgressPercentage(
        userLevel.total_xp,
        currentLevel.xp_required,
        nextLevel?.xp_required || null
      );

      return {
        current_level: currentLevel,
        next_level: nextLevel || null,
        current_xp: userLevel.current_level_xp,
        total_xp: userLevel.total_xp,
        xp_to_next_level: xpToNextLevel,
        progress_percentage: progressPercentage,
        level_rank: currentLevel.level_rank,
        level_name: currentLevel.level_name,
        level_name_fr: currentLevel.level_name_fr
      };
    } catch (error) {
      console.error('Erreur récupération progression niveau:', error);
      return null;
    }
  }

  /**
   * Gère une montée de niveau (appelé après vérification)
   * Crée les notifications et débloque les récompenses
   */
  async handleLevelUp(
    userId: string,
    oldRank: number,
    newRank: number
  ): Promise<LevelUpNotification | null> {
    try {
      const notification = await this.createLevelUpNotification(userId, oldRank, newRank);

      // Ici, on pourrait ajouter des récompenses automatiques
      // Débloquer des compétences, donner des badges, etc.

      return notification || null;
    } catch (error) {
      console.error('Erreur gestion montée de niveau:', error);
      return null;
    }
  }

  /**
   * Récupère l'historique des transactions XP d'un utilisateur
   */
  async getXPHistory(
    userId: string,
    limit: number = 50
  ): Promise<XPTransaction[]> {
    try {
      const { data, error } = await this.supabase
        .from('xp_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erreur récupération historique XP:', error);
        return [];
      }

      return (data as XPTransaction[]) || [];
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      return [];
    }
  }

  /**
   * Récupère les notifications de montée de niveau
   */
  async getLevelUpNotifications(
    userId: string,
    onlyUnshown: boolean = false
  ): Promise<LevelUpNotification[]> {
    try {
      let query = this.supabase
        .from('level_up_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (onlyUnshown) {
        query = query.eq('shown', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur récupération notifications:', error);
        return [];
      }

      return (data as LevelUpNotification[]) || [];
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }
  }

  /**
   * Marque une notification comme affichée
   */
  async markNotificationAsShown(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('level_up_notifications')
        .update({
          shown: true,
          shown_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Erreur marquage notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      return false;
    }
  }

  /**
   * Récupère les statistiques de niveau d'un utilisateur
   */
  async getUserLevelStats(userId: string): Promise<UserLevelStats | null> {
    try {
      const userLevel = await this.getUserLevel(userId);

      if (!userLevel || !userLevel.level_definition) {
        return null;
      }

      // Récupérer les transactions XP
      const xpHistory = await this.getXPHistory(userId, 100);

      // Calculer l'XP par source
      const xpBySource: Record<XPSourceType, number> = {
        challenge_complete: 0,
        tournament_win: 0,
        daily_streak: 0,
        peer_review: 0,
        team_challenge: 0,
        skill_unlock: 0,
        manual_award: 0
      };

      xpHistory.forEach(transaction => {
        xpBySource[transaction.source_type] =
          (xpBySource[transaction.source_type] || 0) + transaction.xp_amount;
      });

      // Récupérer l'historique des montées de niveau
      const levelUpHistory = await this.getLevelUpNotifications(userId);

      return {
        user_id: userId,
        current_level: userLevel.level_definition,
        total_xp: userLevel.total_xp,
        total_level_ups: userLevel.total_level_ups,
        xp_by_source: xpBySource,
        recent_xp_gains: xpHistory.slice(0, 10),
        level_up_history: levelUpHistory
      };
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      return null;
    }
  }

  /**
   * Récupère le classement global d'un utilisateur basé sur l'XP total
   */
  async getUserGlobalRank(userId: string): Promise<number | null> {
    try {
      const userLevel = await this.getUserLevel(userId);

      if (!userLevel) {
        return null;
      }

      // Compter combien d'utilisateurs ont plus d'XP
      const { count, error } = await this.supabase
        .from('user_levels')
        .select('*', { count: 'exact', head: true })
        .gt('total_xp', userLevel.total_xp);

      if (error) {
        console.error('Erreur calcul classement:', error);
        return null;
      }

      // Le rang est le nombre d'utilisateurs avec plus d'XP + 1
      return (count || 0) + 1;
    } catch (error) {
      console.error('Erreur récupération classement:', error);
      return null;
    }
  }

  /**
   * Récupère le top N des utilisateurs par XP
   */
  async getTopUsersByXP(limit: number = 100): Promise<UserLevel[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_levels')
        .select(`
          *,
          level_definition:level_definitions(*)
        `)
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erreur récupération top utilisateurs:', error);
        return [];
      }

      return (data as UserLevel[]) || [];
    } catch (error) {
      console.error('Erreur récupération top:', error);
      return [];
    }
  }
}

// Export singleton
export const levelProgressionService = new LevelProgressionService();
