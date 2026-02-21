import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, suspended } = body;

    if (!userId || typeof suspended !== 'boolean') {
      return NextResponse.json({ error: 'ID utilisateur et statut requis' }, { status: 400 });
    }

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
      console.error('Erreur suspension utilisateur:', updateError);
      return NextResponse.json({ error: 'Erreur suspension utilisateur' }, { status: 500 });
    }

    // Optionnel : Suspendre aussi dans auth.users
    if (suspended) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: '876000h' // 100 ans (suspension permanente)
      });
      
      if (authError) {
        console.error('Erreur suspension auth:', authError);
        // Ne pas échouer si la suspension auth échoue
      }
    } else {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      });
      
      if (authError) {
        console.error('Erreur activation auth:', authError);
        // Ne pas échouer si l'activation auth échoue
      }
    }

    return NextResponse.json({ 
      success: true, 
      suspended: suspended 
    });

  } catch (error) {
    console.error('Erreur API suspension utilisateur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
