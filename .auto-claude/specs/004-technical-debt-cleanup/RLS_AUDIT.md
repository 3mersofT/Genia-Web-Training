# RLS Policies Audit - Migrations 010-018

**Audit Date:** 2026-02-21
**Auditor:** Claude Code Agent
**Scope:** Supabase RLS migrations 010 through 018

---

## Executive Summary

The RLS migration chain (010-018) reveals **debugging-heavy development** with multiple iterations attempting to solve RLS recursion issues and JWT claim access problems. While the final state (after migration 018) should be functional, the migration history contains:

- **9 migrations** to achieve what should have been 1-2 migrations
- **2 different function names** for role checking (`get_user_role` → `get_role_from_jwt`)
- **1 temporary debug policy** that may still exist in some environments
- **3 iterations** of JWT claim path corrections
- **Missing function risk** in migration 017 (references `get_role_from_jwt` without ensuring it exists)

**Recommendation:** Consolidate into a single clean migration that drops all old policies/functions and creates a final, well-tested RLS setup.

---

## Detailed Migration Timeline

### Migration 010: Initial RLS Fix with Function (❌ Flawed Approach)
**File:** `010_fix_rls_policies_with_function.sql`

**Created:**
- Function `get_user_role(p_user_id UUID)` - SECURITY DEFINER to bypass RLS
- Policies:
  - `Allow authenticated users to read all profiles` - authenticated users can SELECT all profiles
  - `Allow users to update their own profile` - users can UPDATE only their own profile (auth.uid() = user_id)
  - `Allow admins full access` - uses `get_user_role(auth.uid()) = 'admin'`
  - `Anyone can view active challenges` - public can SELECT active challenges
  - `Admins can manage challenges` - uses `get_user_role(auth.uid()) = 'admin'`

**Issues:**
- `get_user_role()` creates potential RLS recursion (function queries user_profiles which has RLS enabled)
- SECURITY DEFINER is a security risk if function is vulnerable

---

### Migration 011: Backfill Profiles and Set Admin (⚠️ Temporarily Disables RLS)
**File:** `011_backfill_profiles_and_set_admin.sql`

**Actions:**
1. **Disables RLS** on user_profiles
2. Backfills missing profiles from auth.users
3. Sets admin role for `admin@geniawebtraining.com`
4. Re-enables RLS

**Issues:**
- Temporary RLS disable is risky in production
- Hardcoded admin email (acceptable for setup, but should be documented)

---

### Migration 012: Switch to JWT-Based Role Check (✅ Better Approach)
**File:** `012_fix_rls_with_jwt_claim.sql`

**Changes:**
- **Drops** `get_user_role(p_user_id UUID)` function
- **Creates** `get_role_from_jwt()` function - reads from JWT claims directly
- **Updates** admin policies to use `get_role_from_jwt()`

**JWT Path Used:** `auth.jwt()->'raw_app_meta_data'->>'role'`

**Issues:**
- JWT path is **incorrect** - should be `app_metadata`, not `raw_app_meta_data`
- This is fixed in subsequent migrations

---

### Migration 013: Fix JWT Claim Path (🔧 Correction)
**File:** `013_fix_jwt_claim_path.sql`

**Changes:**
- Updates `get_role_from_jwt()` to use correct path: `auth.jwt()->'app_metadata'->>'role'`

**Status:** Partial fix, but still not handling all JWT structures

---

### Migration 014: Add JWT Debug Function (🔍 Debugging)
**File:** `014_add_jwt_debug_function.sql`

**Created:**
- `debug_jwt()` function to inspect JWT contents

**Analysis:** Indicates ongoing debugging of JWT claim issues. This function should NOT exist in production.

---

### Migration 015: Final JWT Role Lookup Fix (✅ Improved)
**File:** `015_fix_jwt_role_lookup.sql`

**Changes:**
- Updates `get_role_from_jwt()` with **fallback logic**:
  - First try: `auth.jwt()->'app_metadata'->>'role'`
  - Fallback: `auth.jwt()->>'role'`
  - Default: `'authenticated'`
- **Drops** `debug_jwt()` function

**Status:** This is the most robust version of the function

---

### Migration 016: Temporary Debug Policy (🚨 CRITICAL ISSUE)
**File:** `016_temporarily_disable_rls_for_debug.sql`

**Changes:**
- **Drops ALL** user_profiles policies
- **Creates** `TEMP_DEBUG_ALLOW_ANY_READ` policy - allows **anyone** (even unauthenticated) to read user_profiles

**Status:** 🔴 **EXTREMELY DANGEROUS** - completely bypasses RLS security
**Expected Cleanup:** Should be removed by migration 017

---

### Migration 017: Restore Permissions and RLS (⚠️ FUNCTION NAME MISMATCH)
**File:** `017_restore_permissions_and_rls.sql`

**Changes:**
1. **Grants SELECT** on user_profiles to authenticated role (critical missing permission)
2. **Drops** `TEMP_DEBUG_ALLOW_ANY_READ` policy
3. **Recreates** proper RLS policies:
   - `Allow authenticated users to read all profiles`
   - `Allow users to update their own profile`
   - `Allow admins full access` - **uses `get_role_from_jwt()`**

**CRITICAL ISSUE:**
- **Line 37-38** references `public.get_role_from_jwt()`
- **Risk:** If migrations 012-015 were not applied, this function doesn't exist
- **No safety check** to ensure function exists before using it

---

### Migration 018: Grant Execute Permission (🔧 Permission Fix)
**File:** `018_grant_execute_permission.sql`

**Changes:**
- Grants EXECUTE permission on `get_role_from_jwt()` to authenticated role

**Analysis:** This was likely causing errors in API routes when they tried to call the function

---

## Current Active RLS Policies (Post-Migration 018)

### Table: `user_profiles`

| Policy Name | Operation | Role | Condition | Notes |
|------------|-----------|------|-----------|-------|
| `Allow authenticated users to read all profiles` | SELECT | authenticated | `true` | All authenticated users can read all profiles |
| `Allow users to update their own profile` | UPDATE | authenticated | `auth.uid() = user_id` | Users can only update their own profile |
| `Allow admins full access` | ALL | authenticated | `get_role_from_jwt() = 'admin'` | Admins have full CRUD access |

### Table: `daily_challenges`

| Policy Name | Operation | Role | Condition | Notes |
|------------|-----------|------|-----------|-------|
| `Anyone can view active challenges` | SELECT | - | `active = true` | Public read access to active challenges |
| `Admins can manage challenges` | ALL | authenticated | `get_role_from_jwt() = 'admin'` | Admins have full CRUD access |

---

## Current Active Functions

### `get_role_from_jwt()`
**Definition (from migration 015):**
```sql
CREATE OR REPLACE FUNCTION public.get_role_from_jwt()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT
    COALESCE(
      auth.jwt()->'app_metadata'->>'role',
      auth.jwt()->>'role',
      'authenticated'
    )
  INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Permissions:**
- EXECUTE granted to `authenticated` role (migration 018)

**Usage:**
- RLS policies on `user_profiles` (admin check)
- RLS policies on `daily_challenges` (admin check)

---

## Issues Identified

### 1. Function Name Mismatch History
- **Migration 010:** Created `get_user_role(p_user_id UUID)` (later dropped)
- **Migration 012:** Created `get_role_from_jwt()` (current)
- **Risk:** Code or other migrations might reference the old function name

### 2. Temporary Debug Policy Status
- **Migration 016:** Created `TEMP_DEBUG_ALLOW_ANY_READ` (dangerous)
- **Migration 017:** Should have dropped it
- **Risk:** If migration 017 failed or wasn't applied, this insecure policy still exists

### 3. Multiple JWT Claim Path Corrections
- **Migration 012:** `raw_app_meta_data` (wrong)
- **Migration 013:** `app_metadata` (correct)
- **Migration 015:** `app_metadata` + fallback (most robust)

**Risk:** Inconsistent JWT structure handling across environments

### 4. Missing Dependency Checks
- **Migration 017** assumes `get_role_from_jwt()` exists
- **No validation** that migrations 012-015 were applied
- **Risk:** Function not found errors

### 5. Grant Timing Issue
- **Migration 017:** Uses `get_role_from_jwt()` in policies
- **Migration 018:** Grants EXECUTE permission on `get_role_from_jwt()`
- **Risk:** Brief window where policies exist but can't execute the function

---

## Recommended Consolidation Strategy

### Approach: Single Consolidated Migration (026)

**Objectives:**
1. ✅ Drop all legacy policies and functions
2. ✅ Create clean, well-documented RLS policies
3. ✅ Use single, tested function for role checking
4. ✅ Ensure all permissions are granted in correct order
5. ✅ Add comprehensive comments

### Proposed Migration 026 Structure

```sql
-- =================================================================
-- MIGRATION 026: Consolidated RLS Policies
-- Description: Clean consolidation of RLS policies from migrations
--              010-018, fixing function naming and removing debug
--              artifacts.
-- =================================================================

-- STEP 1: Clean up - Drop all existing policies and functions
-- This ensures a clean slate regardless of which migrations were applied

-- Drop all user_profiles policies (including debug ones)
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

-- Drop old functions (both names)
DROP FUNCTION IF EXISTS public.get_user_role(p_user_id UUID);
DROP FUNCTION IF EXISTS public.get_role_from_jwt();
DROP FUNCTION IF EXISTS public.debug_jwt();

-- STEP 2: Create the definitive role-checking function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Read role from JWT claims with multiple fallback paths
  -- Supabase can store role in different JWT claim locations
  SELECT COALESCE(
    auth.jwt()->'app_metadata'->>'role',  -- Standard Supabase location
    auth.jwt()->>'role',                   -- Alternative location
    'authenticated'                        -- Default for all logged-in users
  ) INTO v_role;

  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission immediately after creation
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;

-- Add function comment
COMMENT ON FUNCTION public.get_user_role() IS
  'Returns the role of the currently authenticated user from JWT claims. Returns "authenticated" for users without explicit role.';

-- STEP 3: Ensure table permissions are set correctly
GRANT SELECT ON TABLE public.user_profiles TO authenticated;
GRANT UPDATE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT ON TABLE public.daily_challenges TO authenticated;
GRANT SELECT ON TABLE public.daily_challenges TO anon; -- Public can view active challenges

-- STEP 4: Create clean, well-documented RLS policies for user_profiles

-- Policy 1: Authenticated users can read all profiles
-- Rationale: This is a social learning platform where users need to see other users
CREATE POLICY "authenticated_read_all_profiles" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Users can update only their own profile
-- Rationale: Security - prevent users from modifying others' data
CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admins have full access to all profiles
-- Rationale: Admin users need to manage user accounts
CREATE POLICY "admins_full_access_profiles" ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- STEP 5: Create clean RLS policies for daily_challenges

-- Policy 1: Anyone (including anonymous) can view active challenges
-- Rationale: Challenges are public content to attract users
CREATE POLICY "public_read_active_challenges" ON public.daily_challenges
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Policy 2: Admins can manage all challenges
-- Rationale: Challenge creation/editing is admin-only
CREATE POLICY "admins_manage_challenges" ON public.daily_challenges
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- STEP 6: Ensure RLS is enabled on both tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- End of consolidated migration
```

### Key Improvements in Proposed Migration

1. **Single Function Name:** `get_user_role()` (simpler, no "from_jwt" needed)
2. **Idempotent:** All DROP statements use IF EXISTS
3. **Clean Slate:** Drops ALL possible policy/function names from history
4. **Immediate Permissions:** Grants EXECUTE right after creating function
5. **Clear Naming:** Policy names are descriptive and consistent
6. **Comprehensive Comments:** Each policy explains its purpose
7. **Security:** SECURITY DEFINER on function, proper RLS on tables

---

## Testing Strategy

### Pre-Migration Tests
```sql
-- Verify current state
SELECT policyname, tablename, cmd, qual
FROM pg_policies
WHERE tablename IN ('user_profiles', 'daily_challenges');

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%role%';
```

### Post-Migration Tests
```sql
-- 1. Verify TEMP_DEBUG_ALLOW_ANY_READ is gone
SELECT policyname
FROM pg_policies
WHERE policyname = 'TEMP_DEBUG_ALLOW_ANY_READ';
-- Expected: 0 rows

-- 2. Verify get_user_role() function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_user_role';
-- Expected: 1 row

-- 3. Verify old function names are gone
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('get_role_from_jwt', 'debug_jwt');
-- Expected: 0 rows

-- 4. Verify correct policies exist
SELECT policyname, tablename
FROM pg_policies
WHERE tablename IN ('user_profiles', 'daily_challenges')
ORDER BY tablename, policyname;
-- Expected: 5 policies total (3 for user_profiles, 2 for daily_challenges)

-- 5. Test as authenticated user (non-admin)
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "test-user-id", "role": "authenticated"}';
SELECT COUNT(*) FROM user_profiles; -- Should succeed
UPDATE user_profiles SET display_name = 'Test' WHERE user_id = 'test-user-id'; -- Should succeed
UPDATE user_profiles SET display_name = 'Hack' WHERE user_id = 'other-user-id'; -- Should fail
RESET ROLE;

-- 6. Test as admin
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "admin-id", "app_metadata": {"role": "admin"}}';
SELECT COUNT(*) FROM user_profiles; -- Should succeed
UPDATE user_profiles SET role = 'student' WHERE user_id = 'any-user-id'; -- Should succeed
RESET ROLE;

-- 7. Test anonymous access to challenges
SET ROLE anon;
SELECT COUNT(*) FROM daily_challenges WHERE active = true; -- Should succeed
INSERT INTO daily_challenges (title) VALUES ('Hack'); -- Should fail
RESET ROLE;
```

---

## Migration Dependencies

### Prerequisites
- Migrations 001-009 must be applied (creates tables)
- Migration 011 should be applied (sets admin user)

### Replaces
- This migration **replaces** migrations 010, 012-018
- Safe to run even if those migrations were partially applied
- Idempotent design allows re-running if needed

### Follow-up Actions
- **Archive** migrations 010, 012-018 to `_archive/` folder
- **Update** documentation to reference migration 026 as the canonical RLS setup
- **Test** all auth flows (login, profile update, admin actions)

---

## Security Considerations

### Current Risks (if TEMP_DEBUG_ALLOW_ANY_READ still exists)
- 🔴 **Severity: CRITICAL**
- **Risk:** Anyone can read all user profiles without authentication
- **Data Exposed:** emails, display names, roles, points, streaks
- **Recommendation:** Verify immediately that migration 017 was applied

### Recommended Verification
```sql
-- Check for dangerous debug policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname LIKE '%DEBUG%' OR policyname LIKE '%TEMP%';
```

If any results are returned, apply migration 017 or the proposed migration 026 immediately.

---

## Conclusion

The RLS migration chain (010-018) successfully resolves security issues but reflects **trial-and-error debugging** rather than planned design. The consolidation into migration 026 will:

1. ✅ Eliminate technical debt from 9 iterative migrations
2. ✅ Remove function name ambiguity
3. ✅ Ensure no debug policies remain
4. ✅ Provide clear, documented security policies
5. ✅ Make future maintenance easier

**Status:** Ready for implementation in Phase 5 (RLS Consolidation)
