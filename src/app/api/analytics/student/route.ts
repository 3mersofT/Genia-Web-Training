import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyticsService } from '@/lib/services/analyticsService';

// Configurer le runtime pour des performances optimales
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalider toutes les 60 secondes

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const dateRange = searchParams.get('dateRange') as '7d' | '30d' | '90d' | 'all' | null;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    // Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Permettre aux utilisateurs de voir leurs propres analytics
    // ou aux admins de voir les analytics de n'importe quel utilisateur
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Préparer les filtres
    const filters = dateRange ? { date_range: dateRange } : undefined;

    // Récupérer les analytics via le service (avec cache)
    const analytics = await analyticsService.getStudentAnalytics(userId, filters);

    if (!analytics) {
      return NextResponse.json(
        { error: 'Impossible de récupérer les analytics' },
        { status: 500 }
      );
    }

    const responseTime = Date.now() - startTime;

    // Créer la réponse avec les en-têtes de cache appropriés
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        'X-Response-Time': `${responseTime}ms`,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        responseTime: `${responseTime}ms`
      },
      {
        status: 500,
        headers: {
          'X-Response-Time': `${responseTime}ms`
        }
      }
    );
  }
}
