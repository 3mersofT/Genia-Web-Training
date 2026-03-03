-- =================================================================
-- MIGRATION DE PERMISSION D'EXÉCUTION
-- Version: 1.0
-- Description: Accorde la permission d'EXÉCUTER la fonction
--              get_role_from_jwt au rôle 'authenticated'.
-- =================================================================

-- Donne la permission d'exécuter la fonction get_role_from_jwt
-- au groupe de tous les utilisateurs connectés ('authenticated').
-- Sans cela, l'API Route ne peut pas vérifier le rôle et retourne une erreur.
GRANT EXECUTE ON FUNCTION public.get_role_from_jwt() TO authenticated;

-- Fin de la migration
