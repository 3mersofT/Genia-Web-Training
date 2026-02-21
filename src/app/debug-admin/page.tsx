'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugAdminPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const runTest = async () => {
      try {
        console.log('🔍 Test d\'accès admin...');
        
        // 1. Session et JWT
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error(`Pas de session: ${sessionError?.message}`);
        }
        
        const jwtPayload = JSON.parse(atob(session.access_token.split('.')[1]));
        console.log('JWT claims:', jwtPayload);
        
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
