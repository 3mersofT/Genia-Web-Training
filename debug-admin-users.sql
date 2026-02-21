-- Script pour diagnostiquer le problème des utilisateurs admin
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si RLS est activé sur user_profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 2. Compter les utilisateurs dans user_profiles
SELECT 
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_profiles,
    COUNT(*) FILTER (WHERE role = 'student') as student_profiles
FROM user_profiles;

-- 3. Lister les profils existants
SELECT 
    user_id,
    email,
    display_name,
    role,
    created_at,
    onboarding_completed
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Vérifier les utilisateurs auth
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_app_meta_data
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- 5. Tester l'accès sans RLS
SET row_security = off;
SELECT COUNT(*) as profiles_without_rls FROM user_profiles;
SET row_security = on;
