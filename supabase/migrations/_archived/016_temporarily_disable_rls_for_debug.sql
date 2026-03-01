-- =================================================================
-- MIGRATION DE DÉBOGAGE RLS PAR ISOLATION
-- Version: 1.0
-- Description: Désactive temporairement toute la sécurité sur
--              user_profiles pour valider la source du problème.
-- =================================================================

-- 1. Supprimer TOUTES les politiques existantes sur user_profiles
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;

-- 2. Créer une politique unique et totalement permissive pour la lecture
--    Cette politique autorise n'importe qui (même non authentifié) à lire la table.
CREATE POLICY "TEMP_DEBUG_ALLOW_ANY_READ" ON public.user_profiles
  FOR SELECT
  USING (true);

-- Fin de la migration
