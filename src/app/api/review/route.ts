import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limiter';
import { submitReviewSchema, createCardSchema } from '@/lib/validations/review.schema';
import { calculateSM2 } from '@/lib/services/spacedRepetitionService';

const rateLimiter = createRateLimiter({
  interval: 60000,
  limit: 30,
});

// GET: Récupérer les cartes dues ou toutes les cartes
export async function GET(req: NextRequest) {
  const { response: rateLimitResponse } = await rateLimiter(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'due';

    if (type === 'stats') {
      const { data, error } = await supabase
        .from('spaced_repetition_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      return NextResponse.json({
        stats: data || {
          total_cards: 0,
          cards_due_today: 0,
          total_reviews: 0,
          average_easiness: 2.5,
          retention_rate: 0
        }
      });
    }

    if (type === 'all') {
      const { data, error } = await supabase
        .from('spaced_repetition_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('next_review_date', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ cards: data || [] });
    }

    // type === 'due' (défaut)
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('spaced_repetition_cards')
      .select('*')
      .eq('user_id', user.id)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ cards: data || [] });
  } catch (error) {
    console.error('GET /api/review error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST: Soumettre une révision ou créer une carte
export async function POST(req: NextRequest) {
  const { response: rateLimitResponse } = await rateLimiter(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action || 'review';

    if (action === 'create') {
      const parsed = createCardSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Données invalides', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      // Vérifier si la carte existe déjà
      const { data: existing } = await supabase
        .from('spaced_repetition_cards')
        .select('id')
        .eq('user_id', user.id)
        .eq('capsule_id', parsed.data.capsuleId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ card: existing, created: false });
      }

      const { data: card, error } = await supabase
        .from('spaced_repetition_cards')
        .insert({
          user_id: user.id,
          capsule_id: parsed.data.capsuleId,
          easiness_factor: 2.5,
          interval_days: 1,
          repetitions: 0,
          next_review_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ card, created: true }, { status: 201 });
    }

    // action === 'review'
    const parsed = submitReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Récupérer la carte
    const { data: card, error: cardError } = await supabase
      .from('spaced_repetition_cards')
      .select('*')
      .eq('id', parsed.data.cardId)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: 'Carte non trouvée' }, { status: 404 });
    }

    // Calculer SM-2
    const result = calculateSM2(
      parsed.data.quality as 0 | 1 | 2 | 3 | 4 | 5,
      card.easiness_factor,
      card.interval_days,
      card.repetitions
    );

    // Enregistrer la révision
    const { error: reviewError } = await supabase
      .from('spaced_repetition_reviews')
      .insert({
        card_id: card.id,
        user_id: user.id,
        quality: parsed.data.quality,
        previous_interval: card.interval_days,
        previous_easiness: card.easiness_factor,
        previous_repetitions: card.repetitions,
        new_interval: result.interval,
        new_easiness: result.easinessFactor,
        new_repetitions: result.repetitions,
        time_spent_seconds: parsed.data.timeSpentSeconds
      });

    if (reviewError) throw reviewError;

    // Mettre à jour la carte
    const newTotalReviews = (card.total_reviews || 0) + 1;
    const newCorrectReviews = (card.correct_reviews || 0) + (parsed.data.quality >= 3 ? 1 : 0);

    const { error: updateError } = await supabase
      .from('spaced_repetition_cards')
      .update({
        easiness_factor: result.easinessFactor,
        interval_days: result.interval,
        repetitions: result.repetitions,
        next_review_date: result.nextReviewDate,
        last_review_date: new Date().toISOString().split('T')[0],
        total_reviews: newTotalReviews,
        correct_reviews: newCorrectReviews,
        average_quality: Math.round(
          ((card.average_quality || 0) * (newTotalReviews - 1) + parsed.data.quality) / newTotalReviews * 100
        ) / 100
      })
      .eq('id', card.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      result,
      card: {
        ...card,
        easiness_factor: result.easinessFactor,
        interval_days: result.interval,
        repetitions: result.repetitions,
        next_review_date: result.nextReviewDate
      }
    });
  } catch (error) {
    console.error('POST /api/review error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
