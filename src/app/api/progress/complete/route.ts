// app/api/progress/complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LevelProgressionService } from '@/services/levelProgressionService';
import type { AwardXPResult } from '@/types/levels.types';
import { studentNotificationService } from '@/lib/services/studentNotificationService';
import { createRateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

// Rate limiter: 30 requests per minute
const rateLimiter = createRateLimiter({
  interval: 60000, // 1 minute in milliseconds
  limit: 30, // 30 requests per minute
});
import { CompleteProgressSchema } from '@/lib/validations/progress.schema';

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse, result: rateLimitResult } = await rateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Helper to add rate limit headers
  const addHeaders = (response: NextResponse) => {
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('Retry-After', Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString());
    return response;
  };

  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return addHeaders(NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      ));
    }

    // Valider les données de la requête
    const body = await req.json();
    const validation = CompleteProgressSchema.safeParse(body);

    if (!validation.success) {
      return addHeaders(NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      ));
    }

    const { capsuleId, score } = validation.data;

    // Utiliser l'ID de l'utilisateur authentifié au lieu de faire confiance au client
    const userId = user.id;
    const levelProgressionService = new LevelProgressionService();

    // Vérifier d'abord si l'entrée existe
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id, status')
      .eq('user_id', userId)
      .eq('capsule_id', capsuleId)
      .single();

    // Déterminer si c'est une première completion (pour attribuer l'XP)
    const isFirstCompletion = !existing || existing.status !== 'completed';

    let result;
    if (existing) {
      // Mettre à jour l'entrée existante
      result = await supabase
        .from('user_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          exercise_score: typeof score === 'number' ? score : null
        })
        .eq('user_id', userId)
        .eq('capsule_id', capsuleId);
    } else {
      // Créer une nouvelle entrée
      result = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          capsule_id: capsuleId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          exercise_score: typeof score === 'number' ? score : null
        });
    }

    const { error } = result;

    if (error) throw error;

    // Attribuer l'XP seulement si c'est une première completion
    let xpResult: AwardXPResult | null = null;
    if (isFirstCompletion) {
      try {
        // Calculer l'XP basé sur le score (si fourni) ou attribuer un montant par défaut
        const baseXP = 75; // XP de base pour compléter une capsule
        let xpAmount = baseXP;

        if (typeof score === 'number') {
          // Bonus XP basé sur le score (0-100)
          const scoreMultiplier = score >= 80 ? 1.5 : score >= 60 ? 1.2 : 1.0;
          xpAmount = Math.floor(baseXP * scoreMultiplier);
        }

        xpResult = await levelProgressionService.awardXP({
          user_id: userId,
          xp_amount: xpAmount,
          source_type: 'challenge_complete', // Utiliser le même type pour les capsules
          source_id: capsuleId,
          description: `Capsule ${capsuleId} complétée${typeof score === 'number' ? ` avec un score de ${score}` : ''}`
        });
      } catch (xpError) {
        // Ne pas bloquer la completion si l'attribution d'XP échoue
        logger.warn('Erreur attribution XP', { component: 'ProgressCompleteAPI', error: xpError instanceof Error ? xpError.message : String(xpError) });
      }
    }

    // 🏆 Vérifier et notifier pour les badges récemment gagnés
    await checkAndNotifyBadges(userId, supabase);

    return addHeaders(NextResponse.json({
      ok: true,
      xpResult: xpResult || undefined
    }));
  } catch (error) {
    logger.error('Erreur completion capsule', { component: 'ProgressCompleteAPI', action: 'POST', error: error instanceof Error ? error.message : String(error) });
    return addHeaders(NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }));
  }
}

/**
 * 🏆 Vérifie les badges récemment gagnés et envoie des notifications
 */
async function checkAndNotifyBadges(userId: string, supabase: any) {
  try {
    // Récupérer les badges gagnés dans les dernières 10 secondes
    const tenSecondsAgo = new Date();
    tenSecondsAgo.setSeconds(tenSecondsAgo.getSeconds() - 10);

    const { data: recentBadges, error: badgesError } = await supabase
      .from('user_badges')
      .select(`
        id,
        badge_id,
        earned_at,
        badges (
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .gte('earned_at', tenSecondsAgo.toISOString())
      .order('earned_at', { ascending: false });

    if (badgesError) {
      logger.warn('Erreur récupération badges récents', { component: 'ProgressCompleteAPI', error: badgesError instanceof Error ? badgesError.message : String(badgesError) });
      return;
    }

    if (!recentBadges || recentBadges.length === 0) {
      return;
    }

    // Pour chaque badge récent, vérifier si une notification a déjà été envoyée
    for (const userBadge of recentBadges) {
      const badge = userBadge.badges;
      if (!badge) continue;

      // Vérifier si une notification existe déjà pour ce badge
      const { data: existingNotification } = await supabase
        .from('student_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'badge_earned')
        .contains('data', { badgeName: badge.name })
        .single();

      // Si pas de notification existante, en créer une
      if (!existingNotification) {
        await studentNotificationService.notifyBadgeEarned(
          userId,
          badge.name,
          badge.description || ''
        );
      }
    }
  } catch (error) {
    // Ne pas faire échouer la requête si la notification échoue
    logger.warn('Erreur vérification badges', { component: 'ProgressCompleteAPI', error: error instanceof Error ? error.message : String(error) });
  }
}


