-- =================================================================
-- MIGRATION: Fix llm_usage table permissions
-- Version: 1.0
-- Description: Fix RLS policies and permissions for llm_usage table
-- =================================================================

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON TABLE llm_usage TO authenticated;

-- Grant permissions for service role (for admin operations)
GRANT ALL ON TABLE llm_usage TO service_role;

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Users can view own LLM usage" ON llm_usage;
DROP POLICY IF EXISTS "System can insert LLM usage" ON llm_usage;
DROP POLICY IF EXISTS "System can update LLM usage" ON llm_usage;

-- Recreate policies with proper permissions
CREATE POLICY "Users can view own LLM usage" ON llm_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own LLM usage" ON llm_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own LLM usage" ON llm_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant execute permission on the quota function
GRANT EXECUTE ON FUNCTION get_user_quota_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_quota_status(UUID) TO service_role;
