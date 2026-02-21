import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const username = (url.searchParams.get('username') || '').toLowerCase().trim()

    if (!username) {
      return NextResponse.json({ available: false, reason: 'empty' }, { status: 400 })
    }
    // Simple format guard mirroring DB constraint
    if (!/^[a-z0-9_-]{3,20}$/.test(username)) {
      return NextResponse.json({ available: false, reason: 'format' }, { status: 200 })
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .ilike('username', username)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ available: !data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
