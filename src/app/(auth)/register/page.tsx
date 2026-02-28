'use client';

// Désactiver le prerendering pour éviter l'erreur Supabase sur Vercel
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle, AtSign, CheckCircle2, XCircle } from 'lucide-react';

export default function RegisterPage() {
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  const usernameValue = watch('username');

  // Check username availability when it changes
  useEffect(() => {
    const checkUsername = async (value: string) => {
      if (!value) {
        setUsernameOk(null);
        return;
      }

      const val = value.toLowerCase().trim();
      setUsernameOk(null);
      setIsChecking(true);

      try {
        if (!/^[a-z0-9_-]{3,20}$/.test(val)) {
          setUsernameOk(false);
          return;
        }
        const res = await fetch(`/api/auth/username-availability?username=${encodeURIComponent(val)}`);
        const data = await res.json();
        setUsernameOk(Boolean(data?.available));
      } finally {
        setIsChecking(false);
      }
    };

    if (usernameValue) {
      const debounce = setTimeout(() => {
        checkUsername(usernameValue);
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [usernameValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (!usernameOk) {
        setError("Nom d'utilisateur indisponible ou invalide");
        setLoading(false);
        return;
      }

      // 1. Créer l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            username: data.username, // picked by trigger to fill user_profiles.username
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
        }
      });

      if (authError) throw authError;

      // 3. Si la confirmation email est requise, prévenir l'utilisateur et ne pas rediriger
      if (!authData.session) {
        setInfo("Inscription réussie. Merci de confirmer votre adresse email pour activer votre compte.");
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              GENIA Web Training
            </span>
          </Link>
          <p className="text-gray-600 mt-2">Créez votre compte pour commencer</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Inscription</h2>

          {error && (
            <div
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {info && (
            <div
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{info}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  {...register('fullName')}
                  aria-invalid={errors.fullName ? 'true' : 'false'}
                  aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fullName
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Jean Dupont"
                />
              </div>
              {errors.fullName && (
                <p
                  id="fullName-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  {...register('username')}
                  aria-invalid={errors.username ? 'true' : 'false'}
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.username
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="mon_username"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isChecking ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  ) : usernameOk === true ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : usernameOk === false ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : null}
                </div>
              </div>
              {errors.username && (
                <p
                  id="username-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors.username.message}
                </p>
              )}
              {!errors.username && (
                <p className="text-xs text-gray-500 mt-1">3–20 caractères, a–z, 0–9, _ et -</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="vous@exemple.com"
                />
              </div>
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
              {!errors.password && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
              )}
            </div>

            <div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  {...register('terms')}
                  aria-invalid={errors.terms ? 'true' : 'false'}
                  aria-describedby={errors.terms ? 'terms-error' : undefined}
                  className={`mt-1 w-4 h-4 text-blue-600 rounded ${
                    errors.terms
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  J'accepte les{' '}
                  <Link href="#" className="text-blue-600 hover:underline">conditions d'utilisation</Link>{' '}
                  et la{' '}
                  <Link href="#" className="text-blue-600 hover:underline">politique de confidentialité</Link>
                </label>
              </div>
              {errors.terms && (
                <p
                  id="terms-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {errors.terms.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Inscription...
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">© 2025 GENIA Web Training. Créé par Hemerson KOFFI.</p>
      </div>
    </div>
  );
}