// app/api/progress/complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LevelProgressionService } from '@/services/levelProgressionService';
import type { AwardXPResult } from '@/types/levels.types';

export async function POST(req: NextRequest) {
  try {
    const { userId, capsuleId, score } = await req.json();

    if (!userId || !capsuleId) {
      return NextResponse.json({ error: 'userId et capsuleId requis' }, { status: 400 });
    }

    const supabase = await createClient();
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
        console.error('Erreur attribution XP:', xpError);
      }
    }

    return NextResponse.json({
      ok: true,
      xpResult: xpResult || undefined
    });
  } catch (error) {
    console.error('Erreur completion capsule:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


