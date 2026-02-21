import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyticsService } from '@/lib/services/analyticsService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

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

    // Récupérer les analytics via le service
    const analytics = await analyticsService.getStudentAnalytics(userId);

    if (!analytics) {
      return NextResponse.json(
        { error: 'Impossible de récupérer les analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Erreur API analytics étudiant:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
