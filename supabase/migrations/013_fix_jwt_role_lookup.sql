-- =================================================================
-- MIGRATION DE CORRECTION FINALE DE LA FONCTION JWT
-- Version: 2.2
-- Description: Corrige la fonction pour lire le rôle dans app_metadata.
-- =================================================================

-- 1. Remplacer la fonction existante par la version corrigée
--    Le chemin correct est auth.jwt()->'app_metadata'->>'role'.
CREATE OR REPLACE FUNCTION public.get_role_from_jwt()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT
    COALESCE(auth.jwt()->'app_metadata'->>'role', auth.jwt()->>'role', 'authenticated')
  INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Supprimer la fonction de débogage
DROP FUNCTION IF EXISTS public.debug_jwt();

-- Fin de la migration
