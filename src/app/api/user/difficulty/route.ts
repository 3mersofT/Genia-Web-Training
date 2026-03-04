import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AdaptiveDifficultyService } from '@/lib/services/adaptiveDifficultyService';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const profile = await AdaptiveDifficultyService.getUserPerformanceProfile(user.id);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[API /user/difficulty] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul du niveau adaptatif' },
      { status: 500 }
    );
  }
}
