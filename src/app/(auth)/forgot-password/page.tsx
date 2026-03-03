'use client';

// Désactiver le prerendering pour éviter l'erreur Supabase sur Vercel
export const dynamic = 'force-dynamic'

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { Sparkles, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSubmittedEmail(data.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-end))] to-[hsl(var(--gradient-start))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              GENIA Web Training
            </span>
          </Link>
          <p className="text-muted-foreground mt-2">Réinitialisation du mot de passe</p>
        </div>

        {/* Formulaire */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-xl border p-8">
          {!success ? (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Mot de passe oublié ?
              </h2>
              <p className="text-muted-foreground mb-6">
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              {error && (
                <div
                  className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus-visible:ring-ring focus:border-transparent ${
                        errors.email
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-input'
                      }`}
                      placeholder="vous@exemple.com"
                    />
                  </div>
                  {errors.email && (
                    <p
                      id="email-error"
                      className="mt-1 text-sm text-destructive"
                      role="alert"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi en cours...
                    </div>
                  ) : (
                    'Envoyer le lien de réinitialisation'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Email envoyé !
              </h2>
              <p className="text-muted-foreground mb-6">
                Vérifiez votre boîte de réception. Nous avons envoyé un lien de réinitialisation à{' '}
                <span className="font-medium">{submittedEmail}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas reçu l'email ? Vérifiez vos spams ou{' '}
                <button
                  onClick={() => {
                    setSuccess(false);
                    setSubmittedEmail('');
                    reset();
                  }}
                  className="text-primary hover:underline"
                >
                  réessayez
                </button>
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          © 2025 GENIA Web Training. Créé par Hemerson KOFFI.
        </p>
      </div>
    </div>
  );
}