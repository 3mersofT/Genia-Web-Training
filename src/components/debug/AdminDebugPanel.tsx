'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

export default function AdminDebugPanel() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const runDebug = async () => {
      if (!user) {
        setDebugInfo({ error: 'No user logged in' });
        setLoading(false);
        return;
      }

      try {
        // 1. Vérifier l'utilisateur actuel
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        
        // 2. Vérifier les profils
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*');

        // 3. Tester l'accès admin spécifique
        const { data: adminTest, error: adminError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', 'admin@geniawebtraining.com');

        // 4. Vérifier les métadonnées JWT
        const session = await supabase.auth.getSession();
        const jwt = session.data.session?.access_token;
        let decodedJWT = null;
        if (jwt) {
          try {
            const payload = jwt.split('.')[1];
            decodedJWT = JSON.parse(atob(payload));
          } catch (e) {
            decodedJWT = { error: 'Failed to decode JWT' };
          }
        }

        setDebugInfo({
          currentUser: {
            id: user.id,
            email: user.email,
            authUser: authUser.user,
            authError
          },
          profiles: {
            data: profiles,
            error: profilesError,
            count: profiles?.length || 0
          },
          adminTest: {
            data: adminTest,
            error: adminError,
            count: adminTest?.length || 0
          },
          jwt: {
            raw: jwt,
            decoded: decodedJWT,
            role: decodedJWT?.role,
            appMetadataRole: decodedJWT?.app_metadata?.role
          }
        });
      } catch (error) {
        setDebugInfo({ error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    runDebug();
  }, [user]);

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded">Chargement du diagnostic...</div>;
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-bold text-red-800 mb-4">🔧 Diagnostic Admin</h3>
      
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-semibold text-red-700">Utilisateur actuel:</h4>
          <pre className="bg-white p-2 rounded overflow-x-auto">
            {JSON.stringify(debugInfo?.currentUser, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold text-red-700">Profils trouvés ({debugInfo?.profiles?.count || 0}):</h4>
          <pre className="bg-white p-2 rounded overflow-x-auto">
            {JSON.stringify(debugInfo?.profiles, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold text-red-700">Test accès admin ({debugInfo?.adminTest?.count || 0}):</h4>
          <pre className="bg-white p-2 rounded overflow-x-auto">
            {JSON.stringify(debugInfo?.adminTest, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold text-red-700">JWT Analysis:</h4>
          <pre className="bg-white p-2 rounded overflow-x-auto">
            {JSON.stringify(debugInfo?.jwt, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-100 rounded">
        <h4 className="font-semibold text-yellow-800">Actions suggérées:</h4>
        <ol className="list-decimal list-inside text-yellow-700 mt-2">
          <li>Vérifier que les profils sont visibles (count &gt; 0)</li>
          <li>Vérifier que le JWT contient le rôle admin</li>
          <li>Si JWT n&apos;a pas le rôle, ajouter via Supabase Auth UI</li>
          <li>Se déconnecter/reconnecter après modification</li>
        </ol>
      </div>
    </div>
  );
}
