// app/api/progress/complete-direct/route.ts
// ADMIN-ONLY Direct API that bypasses RLS for testing purposes
// This route intentionally uses service role key to bypass RLS,
// but requires admin authentication to prevent unauthorized access

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { CompleteProgressDirectSchema } from '@/lib/validations/progress.schema';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin authentication before allowing service-role operations
    const adminSupabase = await createAdminClient();
    const { data: { user } } = await adminSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // 2. Verify user has admin role
    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès interdit - admin requis' }, { status: 403 });
    }

    // 3. Parse and validate request body (userId can be different from authenticated user for admin operations)
    const body = await req.json();

    // Validation with Zod
    const validationResult = CompleteProgressDirectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { userId, capsuleId, score } = validationResult.data;

    // 4. Use direct Supabase client with service role key (admin-authorized operation)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 5. Direct upsert without RLS (bypasses security for admin/testing purposes)
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        capsule_id: capsuleId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        exercise_score: typeof score === 'number' ? score : null
      }, { onConflict: 'user_id,capsule_id' });

    if (error) {
      logger.error('Erreur completion capsule (direct)', { component: 'ProgressDirectAPI', action: 'POST', error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur completion capsule (direct):', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
