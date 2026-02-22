import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Récupérer les préférences de notification
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Si les préférences n'existent pas encore, retourner des valeurs par défaut
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          preferences: {
            user_id: user.id,
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
            email_digest_frequency: 'daily',
            notification_types_enabled: {
              daily_challenge: true,
              streak_reminder: true,
              badge_earned: true,
              peer_review: true,
              new_module: true,
              ai_nudge: true
            },
            quiet_hours_enabled: false,
            quiet_hours_start: '22:00',
            quiet_hours_end: '08:00'
          }
        });
      }

      return NextResponse.json(
        { error: 'Erreur lors de la récupération des préférences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const {
      email_enabled,
      push_enabled,
      in_app_enabled,
      email_digest_frequency,
      notification_types_enabled,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end
    } = body;

    // Vérifier si des préférences existent déjà
    const { data: existingPrefs, error: fetchError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let updates: any = {
      updated_at: new Date().toISOString()
    };

    // Ajouter uniquement les champs fournis
    if (email_enabled !== undefined) updates.email_enabled = email_enabled;
    if (push_enabled !== undefined) updates.push_enabled = push_enabled;
    if (in_app_enabled !== undefined) updates.in_app_enabled = in_app_enabled;
    if (email_digest_frequency !== undefined) updates.email_digest_frequency = email_digest_frequency;
    if (quiet_hours_enabled !== undefined) updates.quiet_hours_enabled = quiet_hours_enabled;
    if (quiet_hours_start !== undefined) updates.quiet_hours_start = quiet_hours_start;
    if (quiet_hours_end !== undefined) updates.quiet_hours_end = quiet_hours_end;

    // Gérer notification_types_enabled - fusionner avec les valeurs existantes
    if (notification_types_enabled) {
      const currentTypes = existingPrefs?.notification_types_enabled || {};
      updates.notification_types_enabled = {
        ...currentTypes,
        ...notification_types_enabled
      };
    }

    // Validation du digest frequency
    if (email_digest_frequency) {
      const validFrequencies = ['immediate', 'daily', 'weekly', 'never'];
      if (!validFrequencies.includes(email_digest_frequency)) {
        return NextResponse.json(
          { error: 'Fréquence de digest invalide' },
          { status: 400 }
        );
      }
    }

    // Si les préférences n'existent pas, les créer
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          ...updates
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: 'Erreur lors de la création des préférences' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        preferences: newPrefs
      });
    }

    // Sinon, mettre à jour les préférences existantes
    const { data: updatedPrefs, error: updateError } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour des préférences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: updatedPrefs
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
