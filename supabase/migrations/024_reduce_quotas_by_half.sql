-- =================================================================
-- MIGRATION: Reduce quotas by half
-- Version: 1.0
-- Description: Cut all daily quotas in half to reduce costs
-- =================================================================

-- Update the quota function with half the limits
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
            30 as daily_limit -- Reduced from 60 to 30
        UNION ALL
        SELECT 
            'mistral-medium-3'::TEXT,
            150 -- Reduced from 300 to 150
        UNION ALL
        SELECT 
            'mistral-small'::TEXT,
            500 -- Reduced from 1000 to 500
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

-- Update the view with new limits
CREATE OR REPLACE VIEW v_user_quotas AS
SELECT 
    u.user_id,
    u.model,
    u.date,
    u.request_count as used,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 30 -- Reduced from 60
        WHEN u.model = 'mistral-medium-3' THEN 150 -- Reduced from 300
        WHEN u.model = 'mistral-small' THEN 500 -- Reduced from 1000
    END as daily_limit,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 30 - u.request_count
        WHEN u.model = 'mistral-medium-3' THEN 150 - u.request_count
        WHEN u.model = 'mistral-small' THEN 500 - u.request_count
    END as remaining,
    u.total_tokens,
    u.total_cost
FROM llm_usage u
WHERE u.date = CURRENT_DATE;

-- Update comments
COMMENT ON FUNCTION get_user_quota_status IS 'Fonction pour obtenir le statut des quotas avec limites réduites de moitié';
COMMENT ON VIEW v_user_quotas IS 'Vue des quotas utilisateurs avec limites réduites de moitié';
