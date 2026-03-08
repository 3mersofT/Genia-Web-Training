import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SuspendUserSchema } from '@/lib/validations/admin.schema';
import { logger } from '@/lib/logger';

// Suspendre/Activer un utilisateur (admin seulement)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier que l'utilisateur est admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const validation = SuspendUserSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    const { userId, suspended } = validation.data;

    // Mettre à jour le statut de suspension
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        preferences: { 
          suspended: suspended 
        } 
      })
      .eq('user_id', userId);

    if (updateError) {
      logger.error('Erreur suspension utilisateur');
      return NextResponse.json({ error: 'Erreur suspension utilisateur' }, { status: 500 });
    }

    // Suspendre aussi dans auth.users
    if (suspended) {
      const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: '876000h' // 100 ans (suspension permanente)
      });

      if (banError) {
        logger.error('Erreur suspension auth');
      }
    } else {
      const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      });

      if (unbanError) {
        logger.error('Erreur activation auth');
      }
    }

    return NextResponse.json({
      success: true,
      suspended: suspended
    });

  } catch (error) {
    logger.error('Erreur API suspension utilisateur');
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
