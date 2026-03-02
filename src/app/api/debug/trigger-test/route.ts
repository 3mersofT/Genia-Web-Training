import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const results: Record<string, unknown> = {}

  try {
    const supabase = await createAdminClient()

    // 1. Test select on user_profiles
    const { data: profiles, error: profilesErr } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    results.profiles_select = profilesErr ? { error: profilesErr.message } : { ok: true, count: profiles?.length }

    // 2. Test select on user_points
    const { data: points, error: pointsErr } = await supabase
      .from('user_points')
      .select('id')
      .limit(1)
    results.points_select = pointsErr ? { error: pointsErr.message } : { ok: true, count: points?.length }

    // 3. Test insert into user_profiles (with fake uuid, will fail FK but shows other errors)
    const { error: insertProfileErr } = await supabase
      .from('user_profiles')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000099',
        email: 'diagtest@test.com',
        display_name: 'Diag Test',
        role: 'student',
        username: 'diagtest99',
      })
    results.profiles_insert = insertProfileErr
      ? { error: insertProfileErr.message, code: insertProfileErr.code, details: insertProfileErr.details }
      : { ok: true }

    // 4. Try actual signup via auth
    const { data: signupData, error: signupErr } = await supabase.auth.admin.createUser({
      email: 'trigger_diag_test@debug-test.com',
      password: 'TestDiag123456',
      user_metadata: { full_name: 'Trigger Diag', username: 'trigdiag' },
      email_confirm: true,
    })
    if (signupErr) {
      results.signup = { error: signupErr.message, status: signupErr.status }
    } else {
      results.signup = { ok: true, user_id: signupData.user?.id }

      // 5. Check if trigger created the profile
      const { data: profile, error: profileCheckErr } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', signupData.user!.id)
        .maybeSingle()
      results.trigger_profile = profileCheckErr
        ? { error: profileCheckErr.message }
        : profile
          ? { ok: true, username: profile.username, display_name: profile.display_name }
          : { error: 'NO PROFILE CREATED - trigger failed silently' }

      // 6. Cleanup test user
      await supabase.auth.admin.deleteUser(signupData.user!.id)
      results.cleanup = 'done'
    }
  } catch (e: any) {
    results.fatal = e.message
  }

  return NextResponse.json(results, { status: 200 })
}
