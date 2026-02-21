-- =================================================================
-- RLS POLICY INTEGRATION TEST QUERIES
-- =================================================================
-- These test queries validate Row Level Security policies on
-- user_profiles and daily_challenges tables as defined in
-- migration 026_consolidate_rls_policies.sql
--
-- Test Scenarios:
-- 1. Authenticated user can read all profiles
-- 2. User can only update own profile (cannot update others)
-- 3. Admin can read/write all profiles
-- 4. Unauthenticated user cannot access profiles
-- =================================================================

-- =================================================================
-- SETUP: Test Data Prerequisites
-- =================================================================
-- Assumes the following test users exist in auth.users:
-- - Regular User 1: user1@test.com (uuid: '11111111-1111-1111-1111-111111111111')
-- - Regular User 2: user2@test.com (uuid: '22222222-2222-2222-2222-222222222222')
-- - Admin User:     admin@test.com (uuid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
--
-- And corresponding profiles in user_profiles with roles:
-- - user1: role = 'authenticated'
-- - user2: role = 'authenticated'
-- - admin: role = 'admin'
-- =================================================================

-- =================================================================
-- TEST 1: Authenticated User Can Read All Profiles
-- =================================================================
-- Policy: authenticated_read_all_profiles
-- Expected: User1 should be able to read User1, User2, and Admin profiles
-- How to test: Execute as authenticated user1@test.com

-- Set role to simulate authenticated user1
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

-- Query should return all profiles (user1, user2, admin)
SELECT
  user_id,
  display_name,
  role,
  'TEST 1: User1 can read all profiles' AS test_name
FROM public.user_profiles
ORDER BY created_at;

-- Expected: 3 rows returned (or however many profiles exist)
-- Status: PASS if query returns multiple rows including other users


-- =================================================================
-- TEST 2: User Can Only Update Own Profile
-- =================================================================
-- Policy: users_update_own_profile
-- Expected: User1 can update own profile but NOT User2's profile

-- Test 2a: User1 updates own profile (SHOULD SUCCEED)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

UPDATE public.user_profiles
SET display_name = 'User1 Updated Name'
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Expected: 1 row affected
-- Status: PASS if UPDATE succeeds

-- Test 2b: User1 tries to update User2's profile (SHOULD FAIL)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

UPDATE public.user_profiles
SET display_name = 'Unauthorized Update'
WHERE user_id = '22222222-2222-2222-2222-222222222222';

-- Expected: 0 rows affected (policy blocks update)
-- Status: PASS if UPDATE affects 0 rows or throws permission error

-- Verify User2's profile was NOT modified
SELECT
  user_id,
  display_name,
  'TEST 2b: Verify User2 profile unchanged' AS test_name
FROM public.user_profiles
WHERE user_id = '22222222-2222-2222-2222-222222222222';

-- Expected: display_name should NOT be 'Unauthorized Update'
-- Status: PASS if display_name is original value


-- =================================================================
-- TEST 3: Admin Can Read/Write All Profiles
-- =================================================================
-- Policy: admins_full_access_profiles
-- Expected: Admin can SELECT, UPDATE, INSERT, DELETE any profile

-- Test 3a: Admin reads all profiles (SHOULD SUCCEED)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "app_metadata": {"role": "admin"}}';

SELECT
  user_id,
  display_name,
  role,
  'TEST 3a: Admin reads all profiles' AS test_name
FROM public.user_profiles
ORDER BY created_at;

-- Expected: All profiles returned
-- Status: PASS if query returns all rows

-- Test 3b: Admin updates User2's profile (SHOULD SUCCEED)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "app_metadata": {"role": "admin"}}';

UPDATE public.user_profiles
SET display_name = 'Admin Updated User2'
WHERE user_id = '22222222-2222-2222-2222-222222222222';

-- Expected: 1 row affected
-- Status: PASS if UPDATE succeeds

-- Test 3c: Admin can insert new profile (SHOULD SUCCEED)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "app_metadata": {"role": "admin"}}';

INSERT INTO public.user_profiles (user_id, display_name, role)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Test User Created by Admin',
  'authenticated'
);

-- Expected: 1 row inserted
-- Status: PASS if INSERT succeeds

-- Clean up test insert
DELETE FROM public.user_profiles
WHERE user_id = '33333333-3333-3333-3333-333333333333';


-- =================================================================
-- TEST 4: Unauthenticated User Cannot Access Profiles
-- =================================================================
-- Policy: No policy grants access to anon role on user_profiles
-- Expected: Anonymous users should get 0 rows or permission error

-- Set role to anonymous (unauthenticated)
SET LOCAL ROLE anon;
RESET request.jwt.claims;

-- Query should return 0 rows due to RLS
SELECT
  user_id,
  display_name,
  'TEST 4: Anon cannot read profiles' AS test_name
FROM public.user_profiles;

-- Expected: 0 rows returned (RLS blocks access)
-- Status: PASS if query returns 0 rows

-- Anon tries to update (SHOULD FAIL)
SET LOCAL ROLE anon;

UPDATE public.user_profiles
SET display_name = 'Anon Unauthorized Update'
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Expected: 0 rows affected or permission error
-- Status: PASS if UPDATE affects 0 rows or throws error


-- =================================================================
-- BONUS TEST: Daily Challenges RLS
-- =================================================================
-- Validates public_read_active_challenges and admins_manage_challenges

-- Test: Anonymous can read active challenges
SET LOCAL ROLE anon;
RESET request.jwt.claims;

SELECT
  challenge_id,
  title,
  active,
  'BONUS: Anon reads active challenges' AS test_name
FROM public.daily_challenges
WHERE active = true;

-- Expected: Returns active challenges only
-- Status: PASS if query returns rows with active=true

-- Test: Anonymous cannot read inactive challenges
SELECT
  challenge_id,
  title,
  active,
  'BONUS: Anon cannot read inactive challenges' AS test_name
FROM public.daily_challenges
WHERE active = false;

-- Expected: 0 rows returned (policy blocks inactive challenges)
-- Status: PASS if query returns 0 rows

-- Test: Regular user cannot create challenges
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

INSERT INTO public.daily_challenges (title, description, difficulty, active)
VALUES ('Unauthorized Challenge', 'Should fail', 'beginner', true);

-- Expected: Permission error or 0 rows inserted
-- Status: PASS if INSERT fails

-- Test: Admin can create challenges
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "app_metadata": {"role": "admin"}}';

INSERT INTO public.daily_challenges (title, description, difficulty, active)
VALUES ('Admin Test Challenge', 'Admin created', 'beginner', false);

-- Expected: 1 row inserted
-- Status: PASS if INSERT succeeds

-- Clean up
DELETE FROM public.daily_challenges WHERE title = 'Admin Test Challenge';


-- =================================================================
-- TEST EXECUTION NOTES
-- =================================================================
-- To run these tests in Supabase SQL Editor:
--
-- 1. Execute tests individually (not all at once) as SET LOCAL
--    commands affect the current transaction scope
--
-- 2. For proper testing, create actual test users in auth.users
--    or use your existing demo accounts from migration 004
--
-- 3. Check for:
--    - Expected row counts
--    - No permission errors where access should be granted
--    - Permission errors or 0 rows where access should be denied
--
-- 4. If using Supabase Studio SQL Editor, wrap each test in:
--    BEGIN;
--      -- test queries here
--    ROLLBACK; -- to avoid modifying real data
--
-- =================================================================
-- INTEGRATION TEST CHECKLIST
-- =================================================================
-- [ ] Test 1 PASS: Authenticated user reads all profiles
-- [ ] Test 2a PASS: User updates own profile successfully
-- [ ] Test 2b PASS: User cannot update other user's profile
-- [ ] Test 3a PASS: Admin reads all profiles
-- [ ] Test 3b PASS: Admin updates any profile
-- [ ] Test 3c PASS: Admin inserts new profile
-- [ ] Test 4 PASS: Unauthenticated user gets 0 rows for profiles
-- [ ] BONUS PASS: Anon reads active challenges only
-- [ ] BONUS PASS: Regular user cannot create challenges
-- [ ] BONUS PASS: Admin can create challenges
-- =================================================================
