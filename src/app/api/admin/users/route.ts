import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { CreateUserSchema, DeleteUserSchema } from '@/lib/validations/admin.schema';
import { logger } from '@/lib/logger';

export async function GET() {
  const supabase = await createAdminClient();

  try {
    // 1. Vérifier si l'utilisateur est un admin (méthode serveur)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Non autorisé' }), { status: 401 });
    }
    // Lecture directe (service role bypass RLS)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Accès interdit' }), { status: 403 });
    }

    // 2. Récupérer les profils
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // 3. Récupérer les données d'authentification
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // 4. Fusionner les données
    const users = profilesData.map((p: any) => {
      const authUser = authData.users.find((u: any) => u.id === p.user_id);
      return {
        ...p,
        last_sign_in_at: authUser?.last_sign_in_at,
        email_confirmed_at: authUser?.email_confirmed_at,
      };
    });

    return NextResponse.json(users);

  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// Créer un utilisateur (admin seulement)
export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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

    // Validate request body with Zod schema
    const validation = CreateUserSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    const { email, password, display_name, role, username } = validation.data;

    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: display_name,
      },
      app_metadata: { role },
    });

    if (authCreateError) {
      return NextResponse.json({ error: 'Erreur création utilisateur' }, { status: 500 });
    }

    // Créer le profil utilisateur
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        email,
        display_name,
        role,
        username,
        onboarding_completed: true
      });

    if (profileError) {
      // Nettoyer l'utilisateur auth si le profil échoue
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Erreur création profil' }, { status: 500 });
    }

    logger.info('Admin created user', { component: 'AdminUsersAPI', action: 'createUser', userId: user.id, targetUserId: authData.user.id, role });

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        display_name,
        role
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

// Supprimer un utilisateur (admin seulement)
export async function DELETE(request: Request) {
  try {
    const supabase = await createAdminClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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

    const { searchParams } = new URL(request.url);

    // Validate query parameters with Zod schema
    const validation = DeleteUserSchema.safeParse({
      userId: searchParams.get('userId')
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    const { userId } = validation.data;

    // Supprimer le profil utilisateur
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      return NextResponse.json({ error: 'Erreur suppression profil' }, { status: 500 });
    }

    // Supprimer l'utilisateur de l'authentification
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      return NextResponse.json({ error: 'Erreur suppression authentification' }, { status: 500 });
    }

    logger.info('Admin deleted user', { component: 'AdminUsersAPI', action: 'deleteUser', userId: user.id, targetUserId: userId });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
