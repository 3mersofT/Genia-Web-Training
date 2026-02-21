-- =================================================================
-- MIGRATION: Fix user_progress RLS policies
-- Version: 1.0
-- Description: Fix RLS policies for user_progress to allow proper API access
-- =================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;

-- Create more permissive policies for user_progress
-- Users can read all progress (needed for module completion display)
CREATE POLICY "Allow authenticated users to read progress" ON user_progress
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own progress
CREATE POLICY "Allow users to insert own progress" ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Allow users to update own progress" ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON TABLE user_progress TO authenticated;

-- Also grant permissions for service role (for admin operations)
GRANT ALL ON TABLE user_progress TO service_role;
