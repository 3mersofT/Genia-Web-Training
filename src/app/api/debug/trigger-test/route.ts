import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const results: Record<string, unknown> = {}

  try {
    const supabase = await createAdminClient()

    // 1. Get the ACTUAL function source code from pg_proc
    const { data: funcDef, error: funcErr } = await supabase.rpc('get_trigger_source')
    if (funcErr) {
      // Function doesn't exist yet, try raw query approach
      results.func_source = { error: funcErr.message }
    } else {
      results.func_source = funcDef
    }

    // 2. Check user_profiles columns
    const { data: cols, error: colsErr } = await supabase.rpc('get_profile_columns')
    results.columns = colsErr ? { error: colsErr.message } : cols

    // 3. Try signup and capture the EXACT error from auth logs
    const { data: signupData, error: signupErr } = await supabase.auth.admin.createUser({
      email: 'trigger_diag_002@debug-test.com',
      password: 'TestDiag123456',
      user_metadata: { full_name: 'Trigger Diag 2', username: 'trigdiag002' },
      email_confirm: true,
    })
    if (signupErr) {
      results.signup = { error: signupErr.message, status: signupErr.status }

      // Check if user was partially created
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const partialUser = authUsers?.users?.find(u => u.email === 'trigger_diag_002@debug-test.com')
      if (partialUser) {
        results.partial_user = { id: partialUser.id, created: true }
        // Check if profile exists
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', partialUser.id)
          .maybeSingle()
        results.partial_profile = prof || 'no profile'
        // Cleanup
        await supabase.auth.admin.deleteUser(partialUser.id)
        results.partial_cleanup = 'done'
      }
    } else {
      results.signup = { ok: true, user_id: signupData.user?.id }

      // Check trigger result
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', signupData.user!.id)
        .maybeSingle()
      results.trigger_profile = profile || 'NO PROFILE'

      const { data: pts } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', signupData.user!.id)
        .maybeSingle()
      results.trigger_points = pts || 'NO POINTS'

      // Cleanup
      await supabase.auth.admin.deleteUser(signupData.user!.id)
    }

    // 4. Check auth.users for orphaned entries from previous failed attempts
    const { data: allUsers } = await supabase.auth.admin.listUsers()
    results.auth_users_count = allUsers?.users?.length || 0
    results.auth_users = allUsers?.users?.map(u => ({ id: u.id, email: u.email, created: u.created_at })) || []

  } catch (e: any) {
    results.fatal = e.message + ' | ' + e.stack
  }

  return NextResponse.json(results, { status: 200 })
}
