import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json() as { identifier?: string }
    const value = (identifier || '').trim()
    if (!value) return NextResponse.json({ error: 'empty' }, { status: 400 })

    // If it looks like an email, return directly
    if (value.includes('@')) return NextResponse.json({ email: value })

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email')
      .ilike('username', value)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.email) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    return NextResponse.json({ email: data.email })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
