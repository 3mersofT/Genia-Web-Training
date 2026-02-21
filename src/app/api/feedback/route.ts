import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification (optionnel pour les feedbacks anonymes)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const body = await request.json();
    const {
      feedbackType,
      targetId,
      rating,
      comment,
      categories,
      isAnonymous,
      userName,
      userEmail
    } = body;

    // Validation
    if (!feedbackType || !targetId || !rating || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Note invalide' },
        { status: 400 }
      );
    }

    if (!['module', 'capsule', 'platform'].includes(feedbackType)) {
      return NextResponse.json(
        { error: 'Type de feedback invalide' },
        { status: 400 }
      );
    }

    // Insérer le feedback
    const { data: feedback, error } = await supabase
      .from('feedbacks')
      .insert({
        user_id: user?.id || null,
        feedback_type: feedbackType,
        target_id: targetId,
        rating,
        comment: comment || null,
        categories,
        is_anonymous: isAnonymous,
        user_name: isAnonymous ? null : userName || null,
        user_email: isAnonymous ? null : userEmail || null,
        status: 'pending' // En attente de modération
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur insertion feedback:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        message: 'Feedback enregistré avec succès ! Merci pour votre contribution.'
      }
    });

  } catch (error) {
    console.error('Erreur API feedback:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Vérifier l'authentification pour les admins
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur est admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    let query = supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (targetType && targetId) {
      query = query.eq('feedback_type', targetType).eq('target_id', targetId);
    }

    const { data: feedbacks, error } = await query;

    if (error) {
      console.error('Erreur récupération feedbacks:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des feedbacks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedbacks });

  } catch (error) {
    console.error('Erreur API feedback GET:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
