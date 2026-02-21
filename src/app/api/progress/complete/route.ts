// app/api/progress/complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, capsuleId, score } = await req.json();

    if (!userId || !capsuleId) {
      return NextResponse.json({ error: 'userId et capsuleId requis' }, { status: 400 });
    }

    const supabase = await createClient();

    // Vérifier d'abord si l'entrée existe
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('capsule_id', capsuleId)
      .single();

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur completion capsule:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


