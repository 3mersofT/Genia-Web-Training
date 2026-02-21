// app/api/quotas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

const MODELS_CONFIG = {
  'magistral-medium': { dailyQuota: 30 }, // Quota par utilisateur par jour (réduit de moitié)
  'mistral-medium-3': { dailyQuota: 150 }, // Quota par utilisateur par jour (réduit de moitié)
  'mistral-small': { dailyQuota: 500 } // Quota par utilisateur par jour (réduit de moitié)
};

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }
    
    const supabase = await createAdminClient();
    
    // Utiliser la fonction de base de données pour obtenir les quotas par utilisateur
    const { data: quotaStatus, error } = await supabase
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
    const { data: usage } = await supabase
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