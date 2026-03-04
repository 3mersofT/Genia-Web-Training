import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is a reset request
    let reset = false;
    try {
      const body = await request.json();
      reset = body?.reset === true;
    } catch {
      // No body or invalid JSON - default to complete (not reset)
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        onboarding_completed: !reset,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
