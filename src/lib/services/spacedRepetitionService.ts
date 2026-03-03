// Service de révision espacée basé sur l'algorithme SM-2 de Piotr Wozniak
// Gère le calcul des intervalles de révision et la planification

import { createClient } from '@/lib/supabase/client';

// Qualité d'évaluation SM-2 (0-5)
// 0: Aucune mémoire (blackout)
// 1: Mauvaise réponse, le contenu est vaguement familier
// 2: Mauvaise réponse, mais le contenu était reconnaissable
// 3: Bonne réponse avec difficulté significative
// 4: Bonne réponse avec quelques hésitations
// 5: Réponse parfaite sans hésitation
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2Result {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
}

export interface ReviewCard {
  id: string;
  userId: string;
  capsuleId: string;
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  totalReviews: number;
  correctReviews: number;
  averageQuality: number;
}

export interface ReviewStats {
  totalCards: number;
  cardsDueToday: number;
  totalReviews: number;
  averageEasiness: number;
  retentionRate: number;
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string | null;
}

export interface DueCard extends ReviewCard {
  capsuleTitle?: string;
  moduleTitle?: string;
}

/**
 * Calcul SM-2 pur (sans side-effects)
 */
export function calculateSM2(
  quality: SM2Quality,
  previousEasiness: number,
  previousInterval: number,
  previousRepetitions: number
): SM2Result {
  // Limiter l'easiness factor à minimum 1.3
  let newEasiness = previousEasiness +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (newEasiness < 1.3) newEasiness = 1.3;

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Échec : recommencer
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Succès
    newRepetitions = previousRepetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(previousInterval * newEasiness);
    }
  }

  // Calculer la prochaine date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    easinessFactor: Math.round(newEasiness * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate: nextDate.toISOString().split('T')[0]
  };
}

/**
 * Label de qualité pour l'UI
 */
export function getQualityLabel(quality: SM2Quality): string {
  const labels: Record<SM2Quality, string> = {
    0: 'Aucun souvenir',
    1: 'Très difficile',
    2: 'Difficile',
    3: 'Correct',
    4: 'Facile',
    5: 'Parfait'
  };
  return labels[quality];
}

/**
 * Couleur de qualité pour l'UI
 */
export function getQualityColor(quality: SM2Quality): string {
  const colors: Record<SM2Quality, string> = {
    0: 'bg-red-500',
    1: 'bg-red-400',
    2: 'bg-orange-400',
    3: 'bg-yellow-400',
    4: 'bg-green-400',
    5: 'bg-green-500'
  };
  return colors[quality];
}

/**
 * Service de révision espacée avec persistance Supabase
 */
export class SpacedRepetitionService {
  private supabase = createClient();

  /**
   * Créer ou récupérer une carte pour une capsule
   */
  async getOrCreateCard(userId: string, capsuleId: string): Promise<ReviewCard | null> {
    try {
      // Chercher une carte existante
      const { data: existing, error: selectError } = await this.supabase
        .from('spaced_repetition_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('capsule_id', capsuleId)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        return this.mapDbToCard(existing);
      }

      // Créer une nouvelle carte
      const { data: created, error: insertError } = await this.supabase
        .from('spaced_repetition_cards')
        .insert({
          user_id: userId,
          capsule_id: capsuleId,
          easiness_factor: 2.5,
          interval_days: 1,
          repetitions: 0,
          next_review_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return this.mapDbToCard(created);
    } catch (error) {
      console.error('Erreur getOrCreateCard:', error);
      return null;
    }
  }

  /**
   * Soumettre une révision
   */
  async submitReview(
    cardId: string,
    userId: string,
    quality: SM2Quality,
    timeSpentSeconds: number = 0
  ): Promise<SM2Result | null> {
    try {
      // Récupérer la carte actuelle
      const { data: card, error: cardError } = await this.supabase
        .from('spaced_repetition_cards')
        .select('*')
        .eq('id', cardId)
        .eq('user_id', userId)
        .single();

      if (cardError || !card) throw cardError || new Error('Card not found');

      // Calculer SM-2
      const result = calculateSM2(
        quality,
        card.easiness_factor,
        card.interval_days,
        card.repetitions
      );

      // Enregistrer la révision
      const { error: reviewError } = await this.supabase
        .from('spaced_repetition_reviews')
        .insert({
          card_id: cardId,
          user_id: userId,
          quality,
          previous_interval: card.interval_days,
          previous_easiness: card.easiness_factor,
          previous_repetitions: card.repetitions,
          new_interval: result.interval,
          new_easiness: result.easinessFactor,
          new_repetitions: result.repetitions,
          time_spent_seconds: timeSpentSeconds
        });

      if (reviewError) throw reviewError;

      // Mettre à jour la carte
      const newTotalReviews = (card.total_reviews || 0) + 1;
      const newCorrectReviews = (card.correct_reviews || 0) + (quality >= 3 ? 1 : 0);

      const { error: updateError } = await this.supabase
        .from('spaced_repetition_cards')
        .update({
          easiness_factor: result.easinessFactor,
          interval_days: result.interval,
          repetitions: result.repetitions,
          next_review_date: result.nextReviewDate,
          last_review_date: new Date().toISOString().split('T')[0],
          total_reviews: newTotalReviews,
          correct_reviews: newCorrectReviews,
          average_quality: Math.round(
            ((card.average_quality || 0) * (newTotalReviews - 1) + quality) / newTotalReviews * 100
          ) / 100
        })
        .eq('id', cardId);

      if (updateError) throw updateError;

      return result;
    } catch (error) {
      console.error('Erreur submitReview:', error);
      return null;
    }
  }

  /**
   * Récupérer les cartes dues pour révision
   */
  async getDueCards(userId: string): Promise<ReviewCard[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .from('spaced_repetition_cards')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review_date', today)
        .order('next_review_date', { ascending: true });

      if (error) throw error;
      return (data || []).map(this.mapDbToCard);
    } catch (error) {
      console.error('Erreur getDueCards:', error);
      return [];
    }
  }

  /**
   * Récupérer toutes les cartes d'un utilisateur
   */
  async getAllCards(userId: string): Promise<ReviewCard[]> {
    try {
      const { data, error } = await this.supabase
        .from('spaced_repetition_cards')
        .select('*')
        .eq('user_id', userId)
        .order('next_review_date', { ascending: true });

      if (error) throw error;
      return (data || []).map(this.mapDbToCard);
    } catch (error) {
      console.error('Erreur getAllCards:', error);
      return [];
    }
  }

  /**
   * Récupérer les statistiques de révision
   */
  async getStats(userId: string): Promise<ReviewStats> {
    try {
      const { data, error } = await this.supabase
        .from('spaced_repetition_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          totalCards: 0,
          cardsDueToday: 0,
          totalReviews: 0,
          averageEasiness: 2.5,
          retentionRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastReviewDate: null
        };
      }

      return {
        totalCards: data.total_cards || 0,
        cardsDueToday: data.cards_due_today || 0,
        totalReviews: data.total_reviews || 0,
        averageEasiness: data.average_easiness || 2.5,
        retentionRate: data.retention_rate || 0,
        currentStreak: data.current_streak || 0,
        longestStreak: data.longest_streak || 0,
        lastReviewDate: data.last_review_date || null
      };
    } catch (error) {
      console.error('Erreur getStats:', error);
      return {
        totalCards: 0,
        cardsDueToday: 0,
        totalReviews: 0,
        averageEasiness: 2.5,
        retentionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastReviewDate: null
      };
    }
  }

  /**
   * Obtenir l'historique des révisions pour une carte
   */
  async getCardHistory(cardId: string, userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('spaced_repetition_reviews')
        .select('*')
        .eq('card_id', cardId)
        .eq('user_id', userId)
        .order('reviewed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur getCardHistory:', error);
      return [];
    }
  }

  private mapDbToCard(row: any): ReviewCard {
    return {
      id: row.id,
      userId: row.user_id,
      capsuleId: row.capsule_id,
      easinessFactor: row.easiness_factor,
      intervalDays: row.interval_days,
      repetitions: row.repetitions,
      nextReviewDate: row.next_review_date,
      lastReviewDate: row.last_review_date,
      totalReviews: row.total_reviews || 0,
      correctReviews: row.correct_reviews || 0,
      averageQuality: row.average_quality || 0
    };
  }
}

// Instance singleton
export const spacedRepetitionService = new SpacedRepetitionService();
