-- Migration: 005_update_rate_limits.sql
-- Description: Mise à jour des rate limits avec nouveau budget 100€
-- Date: 13/09/2025

-- ============================================
-- MISE À JOUR DES VUES POUR LES NOUVEAUX QUOTAS
-- ============================================

-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS v_user_quotas;

-- Recréer avec les nouveaux quotas doublés
CREATE OR REPLACE VIEW v_user_quotas AS
SELECT 
    u.user_id,
    u.model,
    u.date,
    u.request_count as used,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 60    -- Doublé : 30 → 60
        WHEN u.model = 'mistral-medium-3' THEN 300   -- Doublé : 150 → 300
        WHEN u.model = 'mistral-small' THEN 1000     -- Doublé : 500 → 1000
    END as daily_limit,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 60 - u.request_count
        WHEN u.model = 'mistral-medium-3' THEN 300 - u.request_count
        WHEN u.model = 'mistral-small' THEN 1000 - u.request_count
    END as remaining,
    u.total_tokens,
    u.total_cost
FROM llm_usage u
WHERE u.date = CURRENT_DATE;

-- ============================================
-- MISE À JOUR DE LA FONCTION DE QUOTAS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_quota_status(p_user_id UUID)
RETURNS TABLE(
    model TEXT,
    used INT,
    daily_limit INT,
    remaining INT
) AS $$
BEGIN
    RETURN QUERY
    WITH model_limits AS (
        SELECT 
            'magistral-medium'::TEXT as model,
            60 as daily_limit -- Doublé avec nouveau budget
        UNION ALL
        SELECT 
            'mistral-medium-3'::TEXT,
            300 -- Doublé avec nouveau budget
        UNION ALL
        SELECT 
            'mistral-small'::TEXT,
            1000 -- Doublé avec nouveau budget
    ),
    today_usage AS (
        SELECT 
            u.model,
            COALESCE(u.request_count, 0) as used
        FROM llm_usage u
        WHERE u.user_id = p_user_id
        AND u.date = CURRENT_DATE
    )
    SELECT 
        ml.model,
        COALESCE(tu.used, 0)::INT as used,
        ml.daily_limit,
        (ml.daily_limit - COALESCE(tu.used, 0))::INT as remaining
    FROM model_limits ml
    LEFT JOIN today_usage tu ON ml.model = tu.model
    ORDER BY ml.model;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTAIRES DE DOCUMENTATION
-- ============================================

COMMENT ON VIEW v_user_quotas IS 'Vue des quotas utilisateurs avec limites doublées (budget 100€/mois)';
COMMENT ON FUNCTION get_user_quota_status IS 'Fonction pour obtenir le statut des quotas avec les nouvelles limites (budget 100€/mois)';

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Afficher les nouvelles limites pour vérification
SELECT 
    'magistral-medium' as model, 
    60 as daily_limit,
    '10k → 20k tokens/jour' as description
UNION ALL
SELECT 
    'mistral-medium-3', 
    300,
    '50k → 100k tokens/jour'
UNION ALL
SELECT 
    'mistral-small', 
    1000,
    '200k → 400k tokens/jour';
