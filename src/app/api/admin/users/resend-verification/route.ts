import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const supabase = await createAdminClient();

  try {
    // 1. Vérifier si l'utilisateur est un admin (méthode serveur)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Non autorisé' }), { status: 401 });
    }
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single();
    if (profile?.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Accès interdit' }), { status: 403 });
    }

    // 2. Lire l'email de la requête
    const { email } = await request.json();
    if (!email) {
      return new NextResponse(JSON.stringify({ error: 'Email manquant' }), { status: 400 });
    }

    // 3. Renvoyer l'email de vérification via auth.resend (type 'signup')
    const origin = new URL(request.url).origin;
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${origin}/login` }
    });

    if (resendError) throw resendError;

    logger.info('Admin resent verification email', { component: 'AdminResendVerificationAPI', action: 'resendVerification', userId: user.id });

    return NextResponse.json({ message: 'Email de vérification renvoyé avec succès' });

  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
