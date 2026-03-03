-- =============================================
-- Update new-user trigger to set username
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Prefer username from auth metadata; fallback to email prefix (lowercased)
  v_username := COALESCE(LOWER(NEW.raw_user_meta_data->>'username'), LOWER(SPLIT_PART(NEW.email, '@', 1)));

  INSERT INTO public.user_profiles (
      user_id,
      email,
      display_name,
      role,
      username,
      created_at,
      updated_at
  )
  VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'student',
      v_username,
      NOW(),
      NOW()
  );

  -- Initialize points row as before
  INSERT INTO public.user_points (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (noop if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
