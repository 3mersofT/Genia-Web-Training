import { createBrowserClient } from '@supabase/ssr'
// TODO: Re-enable Database generic once types are regenerated with `supabase gen types`
// import type { Database } from '@/types/database.types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    // En cas d'absence des variables d'environnement (build Vercel), retourner un client mock
    console.warn('Variables Supabase manquantes - utilisation d\'un client mock')
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase non configuré' } }),
        signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase non configuré' } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      })
    } as any
  }
  
  return createBrowserClient(url, key)
}
