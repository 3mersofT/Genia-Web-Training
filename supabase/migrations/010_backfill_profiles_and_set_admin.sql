-- =================================================================
-- MIGRATION DE SYNCHRONISATION DES PROFILS UTILISATEURS
-- Version: 1.0
-- Description: Remplit les profils manquants depuis auth.users et
--              définit le rôle de l'administrateur.
-- =================================================================

-- 1. Désactiver temporairement RLS pour effectuer la maintenance
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remplir les profils manquants depuis auth.users
--    Cela garantit que les utilisateurs existants ont bien un profil.
INSERT INTO public.user_profiles (user_id, email, display_name, role)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'display_name', u.email),
    'student' -- Le rôle par défaut est 'student'
FROM
    auth.users u
WHERE
    NOT EXISTS (
        SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
    );

-- 3. Remplir aussi les points pour les utilisateurs manquants
INSERT INTO public.user_points (user_id)
SELECT
    u.id
FROM
    auth.users u
WHERE
    NOT EXISTS (
        SELECT 1 FROM public.user_points up WHERE up.user_id = u.id
    );

-- 4. Définir le rôle 'admin' pour l'utilisateur administrateur
--    C'est l'étape cruciale pour débloquer l'accès admin.
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'admin@geniawebtraining.com';

-- 5. Réactiver RLS une fois la maintenance terminée
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Fin de la migration
