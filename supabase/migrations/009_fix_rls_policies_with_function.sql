-- =================================================================
-- MIGRATION DE CORRECTION RLS
-- Version: 1.0
-- Description: Corrige les politiques RLS récursives en utilisant
--              une fonction SQL pour vérifier le rôle de l'utilisateur.
-- =================================================================

-- 1. Créer une fonction pour obtenir le rôle de l'utilisateur de manière sécurisée
--    SECURITY DEFINER permet à la fonction de s'exécuter avec les droits du créateur,
--    contournant temporairement RLS pour lire le rôle dans user_profiles.
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Supprimer les anciennes politiques RLS problématiques
--    (USER_PROFILES)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

--    (DAILY_CHALLENGES)
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.daily_challenges;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.daily_challenges;

-- 3. Recréer des politiques RLS saines pour user_profiles
--    - Tout utilisateur authentifié peut voir tous les profils (comportement commun pour une app sociale).
--    - Un utilisateur ne peut modifier que son propre profil.
--    - Les administrateurs peuvent tout faire (gérer tous les profils).
CREATE POLICY "Allow authenticated users to read all profiles" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow admins full access" ON public.user_profiles
  FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 4. Recréer des politiques RLS saines pour daily_challenges
--    - Tout le monde peut voir les défis actifs.
--    - Seuls les administrateurs peuvent créer, modifier ou supprimer des défis.
CREATE POLICY "Anyone can view active challenges" ON public.daily_challenges
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage challenges" ON public.daily_challenges
  FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Fin de la migration
