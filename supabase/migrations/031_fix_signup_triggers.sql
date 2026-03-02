-- ============================================================================
-- Migration 031: Fix signup triggers
-- ============================================================================
-- Root cause: Multiple AFTER INSERT triggers on auth.users caused failures.
-- The cascaded trigger chain (auth.users → user_profiles → notification_preferences)
-- and the separate trigger (initialize_user_level) failed when running alongside
-- handle_new_user due to FK validation issues in nested trigger contexts.
--
-- Fix: Consolidate ALL user initialization into handle_new_user with error
-- handling. Make the other triggers no-ops to prevent cascaded failures.
-- ============================================================================

-- 1. Replace handle_new_user with a consolidated version
--    that creates profile, points, notification prefs, AND levels.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_default_level_id UUID;
BEGIN
  -- Extract username from auth metadata; fallback to email prefix
  v_username := COALESCE(
    LOWER(NEW.raw_user_meta_data->>'username'),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  -- Sanitize for CHECK constraint: ^[a-z0-9_-]{3,20}$
  v_username := LEFT(REGEXP_REPLACE(v_username, '[^a-z0-9_-]', '', 'g'), 20);
  IF LENGTH(v_username) < 3 THEN
    v_username := v_username || SUBSTR(REPLACE(NEW.id::text, '-', ''), 1, 20 - LENGTH(v_username));
    v_username := LEFT(v_username, 20);
  END IF;

  -- Create user profile
  INSERT INTO public.user_profiles (
    user_id, email, display_name, role, username, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student',
    v_username,
    NOW(),
    NOW()
  );

  -- Create user points
  INSERT INTO public.user_points (user_id) VALUES (NEW.id);

  -- Create notification preferences (safe: won't block signup on failure)
  BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Initialize user level to Novice (safe: won't block signup on failure)
  BEGIN
    SELECT id INTO v_default_level_id
    FROM public.level_definitions
    WHERE level_rank = 1
    LIMIT 1;

    IF v_default_level_id IS NOT NULL THEN
      INSERT INTO public.user_levels (
        user_id, current_level_id, current_level_rank, total_xp, current_level_xp
      ) VALUES (
        NEW.id, v_default_level_id, 1, 0, 0
      ) ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Make initialize_user_level a no-op (now handled by handle_new_user)
CREATE OR REPLACE FUNCTION initialize_user_level()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Make create_default_notification_preferences a no-op (now handled by handle_new_user)
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
