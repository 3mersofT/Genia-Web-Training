-- =================================================================
-- MIGRATION 030: Restore Supabase Role Permissions
-- Version: 1.0
-- Description: The initial migration (001) ran DROP SCHEMA public CASCADE
--              which wiped all default Supabase grants for anon,
--              authenticated, and service_role. This migration restores
--              the standard Supabase permission structure.
--
-- Root cause: "permission denied for table user_profiles" on all
--             PostgREST API calls, including with the service_role key.
-- =================================================================

-- =================================================================
-- STEP 1: Schema-level permissions
-- =================================================================
-- Without USAGE on the schema, no role can access any object in it.

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- =================================================================
-- STEP 2: service_role - Full access to all tables
-- =================================================================
-- The service_role is used by server-side admin clients (via
-- SUPABASE_SERVICE_ROLE_KEY). It bypasses RLS by default but still
-- needs base table grants.

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- =================================================================
-- STEP 3: authenticated - Base permissions on all tables
-- =================================================================
-- RLS policies control the actual row-level access. These grants
-- only enable the policies to be evaluated.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- =================================================================
-- STEP 4: anon - Read-only on public content tables
-- =================================================================
-- Anonymous users can read public tables (modules, capsules, badges,
-- daily_challenges). RLS policies further restrict which rows.

GRANT SELECT ON TABLE public.modules TO anon;
GRANT SELECT ON TABLE public.capsules TO anon;
GRANT SELECT ON TABLE public.badges TO anon;
GRANT SELECT ON TABLE public.daily_challenges TO anon;
GRANT SELECT ON TABLE public.seasons TO anon;
GRANT SELECT ON TABLE public.tournaments TO anon;
GRANT SELECT ON TABLE public.seasonal_leaderboard_entries TO anon;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO anon;

-- =================================================================
-- STEP 5: Default privileges for future tables
-- =================================================================
-- Ensures any table created in the future automatically gets the
-- correct grants, preventing this issue from recurring.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON ROUTINES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON ROUTINES TO authenticated;

-- =================================================================
-- Migration Complete
-- =================================================================
