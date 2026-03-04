import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ONBOARDING_CURRENT_VERSION } from '@/lib/constants/onboarding';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body — support both new action format and legacy { reset: true }
    let action = 'complete';
    try {
      const body = await request.json();
      if (body?.action) {
        action = body.action;
      } else if (body?.reset === true) {
        // Legacy backwards compatibility
        action = 'reset';
      }
    } catch {
      // No body — default to 'complete'
    }

    let updateData: Record<string, unknown>;

    switch (action) {
      case 'complete':
        updateData = {
          onboarding_completed: true,
          onboarding_version_seen: ONBOARDING_CURRENT_VERSION,
          updated_at: new Date().toISOString(),
        };
        break;

      case 'reset':
        updateData = {
          onboarding_completed: false,
          onboarding_version_seen: 0,
          onboarding_lite_dismissed: false,
          updated_at: new Date().toISOString(),
        };
        break;

      case 'dismiss_lite':
        updateData = {
          onboarding_lite_dismissed: true,
          onboarding_version_seen: ONBOARDING_CURRENT_VERSION,
          updated_at: new Date().toISOString(),
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
