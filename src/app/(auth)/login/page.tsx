'use client'

// Désactiver le prerendering pour éviter l'erreur Supabase sur Vercel
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur for better UX
  })

  const resolveIdentifierToEmail = async (value: string): Promise<string> => {
    if (value.includes('@')) return value
    const res = await fetch('/api/auth/resolve-identifier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: value })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error === 'not_found' ? "Nom d'utilisateur introuvable" : 'Erreur de résolution')
    }
    const data = await res.json()
    return data.email as string
  }

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setLoading(true)

    try {
      const email = await resolveIdentifierToEmail(data.identifier.trim().toLowerCase())

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      })

      if (error) throw error

      // Vérifier le rôle de l'utilisateur pour rediriger correctement
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        const userRole = profile?.role
        router.push(userRole === 'admin' ? '/admin' : '/dashboard')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] px-4">
      <div className="max-w-md w-full">
        <div className="bg-card text-card-foreground rounded-2xl shadow-xl border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('subtitle')}
            </h1>
            <p className="text-muted-foreground">
              {t('description')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {error && (
              <div
                className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-foreground mb-2">
                {t('emailOrUsername')}
              </label>
              <input
                id="identifier"
                type="text"
                {...register('identifier')}
                aria-invalid={errors.identifier ? 'true' : 'false'}
                aria-describedby={errors.identifier ? 'identifier-error' : undefined}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent ${
                  errors.identifier
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-input'
                }`}
                placeholder="vous@exemple.com ou mon_username"
              />
              {errors.identifier && (
                <p
                  id="identifier-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-input'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="remember" className="flex items-center">
                <input id="remember" type="checkbox" className="rounded border-input text-blue-600 focus-visible:ring-ring" />
                <span className="ml-2 text-sm text-muted-foreground">{t('rememberMe')}</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                {t('forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? t('submitting') : t('submit')}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
