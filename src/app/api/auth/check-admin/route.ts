// app/api/auth/check-admin/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // Verifier le role admin dans les metadata du user
    const isAdmin =
      user.app_metadata?.role === 'admin' ||
      user.user_metadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ isAdmin: false }, { status: 403 });
    }

    return NextResponse.json({ isAdmin: true });
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
