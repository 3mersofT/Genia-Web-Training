import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateFeedbackSchema } from '@/lib/validations/feedback.schema';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification (optionnel pour les feedbacks anonymes)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const body = await request.json();

    // Validate request body with Zod schema
    const validationResult = CreateFeedbackSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Insérer le feedback
    const { data: feedback, error } = await supabase
      .from('feedbacks')
      .insert({
        user_id: user?.id || null,
        feedback_type: validatedData.feedbackType,
        target_id: validatedData.targetId,
        rating: validatedData.rating,
        comment: validatedData.comment || null,
        categories: validatedData.categories,
        is_anonymous: validatedData.isAnonymous,
        user_name: validatedData.isAnonymous ? null : validatedData.userName || null,
        user_email: validatedData.isAnonymous ? null : validatedData.userEmail || null,
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
