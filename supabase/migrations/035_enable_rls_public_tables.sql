-- ========================================
-- MIGRATION 035: Enable RLS on public tables
-- ========================================
-- modules, capsules, and badges tables had SELECT policies
-- but RLS was never enabled, making the policies ineffective.
-- This enables RLS so the existing policies are enforced,
-- preventing unauthorized INSERT/UPDATE/DELETE.

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Admin write policies (only admins can modify these tables)
CREATE POLICY "Admins can manage modules" ON modules
    FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage capsules" ON capsules
    FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage badges" ON badges
    FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');
