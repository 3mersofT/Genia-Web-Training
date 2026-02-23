// app/api/quotas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { MODELS_CONFIG } from '@/lib/ai-config';

export async function GET(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur accède uniquement à ses propres quotas
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const adminSupabase = await createAdminClient();

    // Utiliser la fonction de base de données pour obtenir les quotas par utilisateur
    const { data: quotaStatus, error } = await adminSupabase
      .rpc('get_user_quota_status', { p_user_id: userId });

    if (error) {
      console.error('Erreur récupération quotas:', error);
      return NextResponse.json(
        { error: 'Erreur récupération quotas' },
        { status: 500 }
      );
    }

    // Récupérer les détails supplémentaires (tokens, coût) pour chaque modèle
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await adminSupabase
      .from('llm_usage')
      .select('model, total_tokens, total_cost')
      .eq('user_id', userId)
      .eq('date', today);
    
    // Formater les quotas avec les données de la fonction + détails supplémentaires
    const quotas = quotaStatus.reduce((acc: any, quota: any) => {
      const modelUsage = usage?.find((u: any) => u.model === quota.model);
      
      return {
        ...acc,
        [quota.model]: {
          used: quota.used,
          limit: quota.daily_limit,
          remaining: quota.remaining,
          tokensUsed: modelUsage?.total_tokens || 0,
          cost: modelUsage?.total_cost || 0
        }
      };
    }, {});
    
    return NextResponse.json({ quotas });
    
  } catch (error) {
    console.error('Erreur récupération quotas:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}