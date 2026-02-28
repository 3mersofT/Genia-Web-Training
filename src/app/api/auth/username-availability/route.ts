import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createRateLimiter } from '@/lib/rate-limiter'
import { UsernameAvailabilitySchema } from '@/lib/validations/auth.schema'

// Rate limiter: 5 requests per minute
const rateLimiter = createRateLimiter({
  interval: 60000, // 1 minute in milliseconds
  limit: 5, // 5 requests per minute
})

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse, result: rateLimitResult } = await rateLimiter(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Helper to add rate limit headers
  const addHeaders = (response: NextResponse) => {
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('Retry-After', Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString())
    return response
  }

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

    if (error) return addHeaders(NextResponse.json({ error: error.message }, { status: 500 }))

    return addHeaders(NextResponse.json({ available: !data }))
  } catch (e: any) {
    return addHeaders(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
