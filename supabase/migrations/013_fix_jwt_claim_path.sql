-- =================================================================
-- MIGRATION DE CORRECTION DE LA FONCTION JWT
-- Version: 2.1
-- Description: Corrige le chemin d'accès au claim 'role' dans le JWT.
-- =================================================================

-- 1. Remplacer la fonction existante par la version corrigée
--    Le chemin correct est 'app_metadata', et non 'raw_app_meta_data'.
CREATE OR REPLACE FUNCTION public.get_role_from_jwt()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT COALESCE(auth.jwt()->'app_metadata'->>'role', 'authenticated')
  INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fin de la migration
