import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription } = body;

    // Validation
    if (!subscription) {
      return NextResponse.json(
        { error: 'Données de subscription manquantes' },
        { status: 400 }
      );
    }

    // Valider la structure de la subscription
    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Format de subscription invalide' },
        { status: 400 }
      );
    }

    // Vérifier si des préférences existent déjà
    const { data: existingPrefs, error: fetchError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Si les préférences n'existent pas, les créer
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          push_enabled: true,
          push_subscription: subscription,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: 'Erreur lors de la création de la subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        subscription: newPrefs.push_subscription
      });
    }

    // Sinon, mettre à jour les préférences existantes
    const { data: updatedPrefs, error: updateError } = await supabase
      .from('notification_preferences')
      .update({
        push_enabled: true,
        push_subscription: subscription,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: updatedPrefs.push_subscription
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
