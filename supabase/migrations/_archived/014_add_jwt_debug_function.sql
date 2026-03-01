-- =================================================================
-- MIGRATION DE DÉBOGAGE JWT
-- Version: 1.0
-- Description: Ajoute une fonction pour inspecter le contenu
--              complet du JWT de la session en cours.
-- =================================================================

CREATE OR REPLACE FUNCTION public.debug_jwt()
RETURNS jsonb AS $$
BEGIN
  -- Retourne l'intégralité du JWT de la session actuelle sous forme de JSON
  RETURN auth.jwt();
END;
$$ LANGUAGE plpgsql STABLE;

-- Fin de la migration
