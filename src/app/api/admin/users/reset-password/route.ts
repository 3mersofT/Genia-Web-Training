import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ResetPasswordSchema, ResetPasswordEmailSchema } from '@/lib/validations/admin.schema';
import { logger } from '@/lib/logger';

// Reset du mot de passe d'un utilisateur (admin seulement)
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
    const validation = ResetPasswordSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    const { userId, newPassword } = validation.data;

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (updateError) {
      logger.error('Erreur reset mot de passe');
      return NextResponse.json({ error: 'Erreur reset mot de passe' }, { status: 500 });
    }

    logger.info('Admin reset user password', { component: 'AdminResetPasswordAPI', action: 'resetPassword', userId: user.id, targetUserId: userId });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Erreur API reset mot de passe');
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

// Envoyer un email de reset de mot de passe
export async function PUT(request: NextRequest) {
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
    const validation = ResetPasswordEmailSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    const { email } = validation.data;

    // Envoyer l'email de reset
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      }
    });

    if (resetError) {
      logger.error('Erreur envoi email reset');
      return NextResponse.json({ error: 'Erreur envoi email reset' }, { status: 500 });
    }

    logger.info('Admin sent password reset email', { component: 'AdminResetPasswordAPI', action: 'sendResetEmail', userId: user.id });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Erreur API envoi reset');
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
