// app/api/progress/complete-direct/route.ts
// Direct API that bypasses RLS for testing

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { userId, capsuleId, score } = await req.json();

    if (!userId || !capsuleId) {
      return NextResponse.json({ error: 'userId et capsuleId requis' }, { status: 400 });
    }

    // Use direct Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Direct upsert without RLS
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        capsule_id: capsuleId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        exercise_score: typeof score === 'number' ? score : null
      }, { onConflict: 'user_id,capsule_id' });

    if (error) {
      console.error('Erreur completion capsule (direct):', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur completion capsule (direct):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
