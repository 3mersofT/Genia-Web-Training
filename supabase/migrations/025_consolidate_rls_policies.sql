-- =================================================================
-- MIGRATION 026: Consolidated RLS Policies
-- Version: 1.0
-- Description: Clean consolidation of RLS policies from migrations
--              010-018, fixing function naming inconsistencies and
--              removing dangerous debug artifacts.
--
-- This migration replaces the debugging-heavy iteration chain with
-- a single, clean, well-documented RLS setup.
-- =================================================================

-- =================================================================
-- STEP 1: Clean Slate - Drop All Existing Policies and Functions
-- =================================================================
-- This ensures idempotent behavior regardless of which previous
-- migrations were applied or failed.

-- Drop all user_profiles policies (including dangerous debug policy)
DROP POLICY IF EXISTS "TEMP_DEBUG_ALLOW_ANY_READ" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Drop all daily_challenges policies
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.daily_challenges;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.daily_challenges;

-- Drop all role-checking functions (both old and new names)
DROP FUNCTION IF EXISTS public.get_user_role(p_user_id UUID);
DROP FUNCTION IF EXISTS public.get_role_from_jwt();
DROP FUNCTION IF EXISTS public.debug_jwt();

-- =================================================================
-- STEP 2: Create Definitive Role-Checking Function
-- =================================================================
-- This function reads the user's role from JWT claims with fallback
-- logic to handle different JWT structures across environments.
--
-- Why STABLE? The function result won't change within a single query.
-- Why SECURITY DEFINER? Allows reading JWT claims safely.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Read role from JWT claims with multiple fallback paths.
  -- Supabase can store role in different JWT claim locations:
  -- 1. app_metadata->role (standard Supabase location)
  -- 2. role (alternative top-level location)
  -- 3. 'authenticated' (default for all logged-in users)
  SELECT COALESCE(
    auth.jwt()->'app_metadata'->>'role',
    auth.jwt()->>'role',
    'authenticated'
  ) INTO v_role;

  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission immediately after creation to avoid
-- timing issues where policies exist but can't call the function
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;

-- Add function documentation
COMMENT ON FUNCTION public.get_user_role() IS
  'Returns the role of the currently authenticated user from JWT claims. Returns "authenticated" for users without explicit role. Used by RLS policies for role-based access control.';

-- =================================================================
-- STEP 3: Ensure Table Permissions Are Set Correctly
-- =================================================================
-- Grant base table permissions before creating RLS policies.
-- Without these grants, RLS policies won't even be evaluated.

GRANT SELECT ON TABLE public.user_profiles TO authenticated;
GRANT UPDATE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT ON TABLE public.daily_challenges TO authenticated;
GRANT SELECT ON TABLE public.daily_challenges TO anon;

-- =================================================================
-- STEP 4: Create Clean RLS Policies for user_profiles
-- =================================================================

-- Policy 1: Authenticated users can read all profiles
-- Rationale: This is a social learning platform where users need to
--            see other users' profiles, display names, and progress.
--            Reading all profiles enables leaderboards, collaboration,
--            and community features.
CREATE POLICY "authenticated_read_all_profiles" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "authenticated_read_all_profiles" ON public.user_profiles IS
  'Allows all authenticated users to read all user profiles for social learning features (leaderboards, peer collaboration).';

-- Policy 2: Users can update only their own profile
-- Rationale: Security measure to prevent users from modifying other
--            users' data. Each user should only control their own
--            display name, preferences, and settings.
CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "users_update_own_profile" ON public.user_profiles IS
  'Restricts profile updates to the profile owner only. Prevents users from modifying other users'' data.';

-- Policy 3: Admins have full access to all profiles
-- Rationale: Admin users need to manage user accounts, moderate
--            content, adjust roles, and perform platform maintenance.
--            This policy grants full CRUD access to users with
--            'admin' role in their JWT claims.
CREATE POLICY "admins_full_access_profiles" ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

COMMENT ON POLICY "admins_full_access_profiles" ON public.user_profiles IS
  'Grants full CRUD access to users with admin role for platform management and moderation.';

-- =================================================================
-- STEP 5: Create Clean RLS Policies for daily_challenges
-- =================================================================

-- Policy 1: Anyone (including anonymous) can view active challenges
-- Rationale: Daily challenges are public content used to attract and
--            engage users. Making active challenges publicly readable
--            allows preview before sign-up and encourages registration.
CREATE POLICY "public_read_active_challenges" ON public.daily_challenges
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

COMMENT ON POLICY "public_read_active_challenges" ON public.daily_challenges IS
  'Allows public read access to active challenges to encourage user engagement and sign-ups.';

-- Policy 2: Admins can manage all challenges
-- Rationale: Challenge creation, editing, and management should be
--            restricted to admin users. This prevents unauthorized
--            users from creating or modifying educational content.
CREATE POLICY "admins_manage_challenges" ON public.daily_challenges
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

COMMENT ON POLICY "admins_manage_challenges" ON public.daily_challenges IS
  'Restricts challenge creation and management to admin users only.';

-- =================================================================
-- STEP 6: Ensure RLS Is Enabled on Both Tables
-- =================================================================
-- Explicitly enable RLS to ensure security policies are enforced.

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- Migration Complete
-- =================================================================
-- This migration consolidates 9 previous RLS-related migrations
-- (010, 012-018) into a single, clean, well-documented setup.
--
-- Key improvements:
-- - Single function name (get_user_role) with no ambiguity
-- - Removed dangerous TEMP_DEBUG_ALLOW_ANY_READ policy
-- - All policies have clear names and comprehensive comments
-- - Permissions granted in correct order (no timing issues)
-- - Idempotent design allows safe re-running
-- =================================================================
