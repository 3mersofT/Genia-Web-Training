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

    // Verifier le role admin via user_profiles (source de verite unique,
    // coherent avec le middleware qui utilise la meme table)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ isAdmin: false }, { status: 403 });
    }

    return NextResponse.json({ isAdmin: true });
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
