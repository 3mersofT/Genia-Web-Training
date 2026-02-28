import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ResolveIdentifierSchema } from '@/lib/validations/auth.schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request body with Zod schema
    const validationResult = ResolveIdentifierSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { identifier } = validationResult.data

    // If it looks like an email, return directly
    if (identifier.includes('@')) return NextResponse.json({ email: identifier })

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email')
      .ilike('username', identifier)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.email) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    return NextResponse.json({ email: data.email })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
