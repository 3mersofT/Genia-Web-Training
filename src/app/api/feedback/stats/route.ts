import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: 'targetType et targetId requis' },
        { status: 400 }
      );
    }

    // Récupérer les statistiques - retourner des valeurs par défaut si erreur
    const { data: stats, error } = await supabase
      .from('feedback_stats')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .maybeSingle();

    if (error) {
      logger.error('Erreur récupération stats', { component: 'FeedbackStatsAPI', action: 'GET', error: error instanceof Error ? error.message : String(error) });
      // Retourner des valeurs par défaut au lieu d'erreur
      return NextResponse.json({
        total_feedbacks: 0,
        average_rating: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        category_stats: {}
      });
    }

    // Si pas de stats, retourner des valeurs par défaut
    if (!stats) {
      return NextResponse.json({
        total_feedbacks: 0,
        average_rating: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        category_stats: {}
      });
    }

    return NextResponse.json({
      total_feedbacks: stats.total_feedbacks,
      average_rating: parseFloat(stats.average_rating),
      rating_distribution: stats.rating_distribution,
      category_stats: stats.category_stats
    });

  } catch (error) {
    logger.error('Erreur API feedback stats', { component: 'FeedbackStatsAPI', action: 'GET', error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
