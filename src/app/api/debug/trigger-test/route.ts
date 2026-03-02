import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const results: Record<string, unknown> = {}

  try {
    const supabase = await createAdminClient()

    // 1. Check table owners and RLS status
    const { data: tableInfo, error: tableErr } = await supabase.rpc('debug_table_info')
    results.table_info = tableErr ? { error: tableErr.message } : tableInfo

    // 2. List ALL triggers on auth.users
    const { data: triggers, error: trigErr } = await supabase.rpc('debug_auth_triggers')
    results.auth_triggers = trigErr ? { error: trigErr.message } : triggers

    // 3. Check grants on handle_new_user function
    const { data: funcGrants, error: grantErr } = await supabase.rpc('debug_func_grants')
    results.func_grants = grantErr ? { error: grantErr.message } : funcGrants

    // 4. Try signup
    const { data: signupData, error: signupErr } = await supabase.auth.admin.createUser({
      email: 'trigger_diag_003@debug-test.com',
      password: 'TestDiag123456',
      user_metadata: { full_name: 'Trigger Diag 3', username: 'trigdiag003' },
      email_confirm: true,
    })
    if (signupErr) {
      results.signup = { error: signupErr.message, status: signupErr.status }
    } else {
      results.signup = { ok: true, user_id: signupData.user?.id }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', signupData.user!.id)
        .maybeSingle()
      results.trigger_profile = profile || 'NO PROFILE'
      await supabase.auth.admin.deleteUser(signupData.user!.id)
    }

  } catch (e: any) {
    results.fatal = e.message
  }

  return NextResponse.json(results, { status: 200 })
}
