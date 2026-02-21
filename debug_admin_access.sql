-- Script de diagnostic pour débugger l'accès admin
-- À exécuter dans l'éditeur SQL Supabase

-- 1. Vérifier l'utilisateur admin
SELECT 
    id,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email = 'admin@geniawebtraining.com';

-- 2. Vérifier les profils utilisateur
SELECT 
    user_id,
    email,
    display_name,
    role,
    created_at
FROM public.user_profiles;

-- 3. Tester le JWT actuel (à exécuter quand connecté)
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() as current_jwt,
    auth.jwt()->>'role' as jwt_role_direct,
    auth.jwt()->'app_metadata'->>'role' as jwt_role_app_metadata;

-- 4. Vérifier les policies RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 5. Test manuel de la policy
SELECT 
    *,
    CASE 
        WHEN user_id = auth.uid() THEN 'OWN_PROFILE'
        WHEN coalesce(auth.jwt()->>'role', auth.jwt()->'app_metadata'->>'role', '') = 'admin' THEN 'ADMIN_ACCESS'
        ELSE 'NO_ACCESS'
    END as access_reason
FROM public.user_profiles;
