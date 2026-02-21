// Test direct de l'API admin avec le JWT
// À exécuter dans la console du navigateur sur http://localhost:3000/admin/users

async function testAdminAccess() {
  console.log('🔍 Test d\'accès admin...');
  
  // 1. Récupérer le JWT actuel
  const { createClient } = await import('/src/lib/supabase/client.js');
  const supabase = createClient();
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error('❌ Pas de session:', sessionError);
    return;
  }
  
  console.log('✅ Session trouvée');
  console.log('JWT claims:', {
    role: session.access_token ? JSON.parse(atob(session.access_token.split('.')[1])).role : 'N/A',
    app_metadata_role: session.access_token ? JSON.parse(atob(session.access_token.split('.')[1])).app_metadata?.role : 'N/A'
  });
  
  // 2. Test direct de la table user_profiles
  console.log('📊 Test accès user_profiles...');
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*');
    
  console.log('Résultat:', {
    count: profiles?.length || 0,
    error: profilesError,
    data: profiles
  });
  
  // 3. Test avec auth.uid()
  console.log('🆔 Test auth.uid()...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('User:', {
    id: user?.id,
    email: user?.email,
    error: userError
  });
  
  // 4. Test de la fonction auth_is_admin (si elle existe)
  console.log('🔧 Test fonction auth_is_admin...');
  const { data: adminTest, error: adminTestError } = await supabase
    .rpc('auth_is_admin');
  console.log('Admin test:', {
    result: adminTest,
    error: adminTestError
  });
}

// Exécuter le test
testAdminAccess();
