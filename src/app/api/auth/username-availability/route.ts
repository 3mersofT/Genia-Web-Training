import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { UsernameAvailabilitySchema } from '@/lib/validations/auth.schema'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const rawUsername = url.searchParams.get('username')

    // Validate query parameters with Zod schema
    const validationResult = UsernameAvailabilitySchema.safeParse({ username: rawUsername })

    if (!validationResult.success) {
      return NextResponse.json(
        { available: false, error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { username } = validationResult.data

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
