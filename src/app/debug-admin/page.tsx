'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugAdminPage() {
  // Move ALL hooks to the top, before any conditional logic
  // Hooks must be called before any conditional returns
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const runTest = async () => {
      try {
        // 1. Session et JWT
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error(`Pas de session: ${sessionError?.message}`);
        }

        const jwtPayload = JSON.parse(atob(session.access_token.split('.')[1]));

        // 2. Test user_profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*');

        // 3. Test auth.uid()
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        setResults({
          session: {
            exists: !!session,
            error: sessionError?.message
          },
          jwt: {
            role: jwtPayload.role,
            app_metadata_role: jwtPayload.app_metadata?.role,
            user_metadata_role: jwtPayload.user_metadata?.role
          },
          profiles: {
            count: profiles?.length || 0,
            error: profilesError?.message,
            data: profiles
          },
          user: {
            id: user?.id,
            email: user?.email,
            error: userError?.message
          }
        });

      } catch (error) {
        setResults({ error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    runTest();
  }, []);

  // NOW check for production environment AFTER hooks
    // Only run in development
    if (process.env.NODE_ENV !== 'production') {
      const runTest = async () => {
        try {
          // 1. Session et JWT
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            throw new Error(`Pas de session: ${sessionError?.message}`);
          }

          const jwtPayload = JSON.parse(atob(session.access_token.split('.')[1]));

          // 2. Test user_profiles
          const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('*');

          // 3. Test auth.uid()
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          setResults({
            session: {
              exists: !!session,
              error: sessionError?.message
            },
            jwt: {
              role: jwtPayload.role,
              app_metadata_role: jwtPayload.app_metadata?.role,
              user_metadata_role: jwtPayload.user_metadata?.role
            },
            profiles: {
              count: profiles?.length || 0,
              error: profilesError?.message,
              data: profiles
            },
            user: {
              id: user?.id,
              email: user?.email,
              error: userError?.message
            }
          });

        } catch (error) {
          setResults({ error: error instanceof Error ? error.message : String(error) });
        } finally {
          setLoading(false);
        }
      };

      runTest();
    } else {
      setLoading(false);
    }
  }, []);

  // Block access in production environment
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Not Available in Production
          </h1>
          <p className="text-gray-600 mb-6">
            This debug page is only accessible in development environments for security reasons.
          </p>
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500">
              If you need access to administrative features, please use the main admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8">Chargement du diagnostic...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Diagnostic Admin</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Session & JWT</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(results?.session, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">JWT Claims</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(results?.jwt, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Profils User (Count: {results?.profiles?.count || 0})</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(results?.profiles, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">User Auth</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(results?.user, null, 2)}
          </pre>
        </div>

        {results?.error && (
          <div className="bg-red-100 p-4 rounded border border-red-300">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-700">{results.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
