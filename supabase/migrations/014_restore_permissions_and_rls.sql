-- =================================================================
-- MIGRATION FINALE DE RESTAURATION DES PERMISSIONS
-- Version: 1.0
-- Description: Restaure les permissions de base sur la table
--              user_profiles et réactive les politiques RLS propres.
-- =================================================================

-- 1. Redonner la permission de LECTURE de base au rôle 'authenticated'
--    C'est l'étape la plus importante qui manquait. Sans cela,
--    les politiques RLS ne sont même pas évaluées.
GRANT SELECT ON TABLE public.user_profiles TO authenticated;

-- 2. Supprimer la politique de débogage temporaire
DROP POLICY IF EXISTS "TEMP_DEBUG_ALLOW_ANY_READ" ON public.user_profiles;

-- 3. Ré-activer les politiques de sécurité finales et propres
--    (On les recrée pour être sûr qu'elles sont dans le bon état)

-- 3a. Les utilisateurs peuvent lire tous les profils (comportement normal)
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.user_profiles;
CREATE POLICY "Allow authenticated users to read all profiles" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 3b. Les utilisateurs ne peuvent modifier que leur propre profil
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
CREATE POLICY "Allow users to update their own profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3c. Les admins (vérifiés via JWT) ont tous les droits
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;
CREATE POLICY "Allow admins full access" ON public.user_profiles
  FOR ALL
  USING (public.get_role_from_jwt() = 'admin')
  WITH CHECK (public.get_role_from_jwt() = 'admin');

-- Fin de la migration
