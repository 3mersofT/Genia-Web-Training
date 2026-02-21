import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

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

    if (profile?.role !== 'admin') {
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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, display_name, role = 'student', username } = body;

    if (!email || !password || !display_name) {
      return NextResponse.json({ error: 'Email, mot de passe et nom requis' }, { status: 400 });
    }

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
      console.error('Erreur création auth:', authCreateError);
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
      console.error('Erreur création profil:', profileError);
      // Nettoyer l'utilisateur auth si le profil échoue
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Erreur création profil' }, { status: 500 });
    }

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
    console.error('Erreur API création utilisateur:', error);
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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    // Supprimer le profil utilisateur
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Erreur suppression profil:', profileError);
      return NextResponse.json({ error: 'Erreur suppression profil' }, { status: 500 });
    }

    // Supprimer l'utilisateur de l'authentification
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      console.error('Erreur suppression auth:', deleteAuthError);
      return NextResponse.json({ error: 'Erreur suppression authentification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur API suppression utilisateur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
