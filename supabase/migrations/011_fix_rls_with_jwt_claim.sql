-- =================================================================
-- MIGRATION FINALE DE CORRECTION RLS
-- Version: 2.0
-- Description: Corrige la récursion RLS en lisant le rôle admin
--              directement depuis les métadonnées du JWT.
-- =================================================================

-- 1. Créer une fonction pour obtenir le rôle depuis les métadonnées de l'utilisateur (JWT)
CREATE OR REPLACE FUNCTION public.get_role_from_jwt()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- La fonction auth.jwt() donne accès aux claims du JWT actuel
  -- Nous regardons dans raw_app_meta_data, là où le rôle est stocké.
  SELECT COALESCE(auth.jwt()->'raw_app_meta_data'->>'role', 'authenticated')
  INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;


-- 2. Supprimer les anciennes politiques RLS qui utilisaient la fonction récursive
--    (USER_PROFILES)
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;
--    (DAILY_CHALLENGES)
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.daily_challenges;
--    (On supprime aussi l'ancienne fonction devenue inutile)
DROP FUNCTION IF EXISTS public.get_user_role(p_user_id UUID);


-- 3. Recréer la politique admin pour user_profiles en utilisant la nouvelle fonction JWT
CREATE POLICY "Allow admins full access" ON public.user_profiles
  FOR ALL
  USING (public.get_role_from_jwt() = 'admin')
  WITH CHECK (public.get_role_from_jwt() = 'admin');


-- 4. Recréer la politique admin pour daily_challenges en utilisant la nouvelle fonction JWT
CREATE POLICY "Admins can manage challenges" ON public.daily_challenges
  FOR ALL
  USING (public.get_role_from_jwt() = 'admin')
  WITH CHECK (public.get_role_from_jwt() = 'admin');

-- Fin de la migration
