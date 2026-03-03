-- =============================================
-- Add username support alongside email login
-- =============================================

-- 1) Add column (nullable first for safe backfill)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- 2) Backfill from email prefix (lowercased), ensuring uniqueness with suffixes
DO $$
DECLARE
  rec RECORD;
  base TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR rec IN
    SELECT user_id, email FROM public.user_profiles WHERE (username IS NULL OR username = '') AND email IS NOT NULL
  LOOP
    base := LOWER(SPLIT_PART(rec.email, '@', 1));
    candidate := base;
    suffix := 1;
    -- ensure uniqueness case-insensitively
    WHILE EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE LOWER(username) = LOWER(candidate)
    ) LOOP
      candidate := base || '_' || suffix::TEXT;
      suffix := suffix + 1;
    END LOOP;

    UPDATE public.user_profiles
      SET username = candidate
      WHERE user_id = rec.user_id;
  END LOOP;
END $$;

-- 3) Create case-insensitive unique index
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'user_profiles_username_ci'
  ) THEN
    CREATE UNIQUE INDEX user_profiles_username_ci ON public.user_profiles (LOWER(username));
  END IF;
END $$;

-- 4) Make column NOT NULL (after backfill)
ALTER TABLE public.user_profiles
  ALTER COLUMN username SET NOT NULL;

-- 5) Optional: simple check constraint for allowed chars (letters, digits, underscore, dash), length 3–20
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_username_format_chk'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_username_format_chk
      CHECK (
        username ~ '^[a-z0-9_-]{3,20}$'
      );
  END IF;
END $$;

-- 6) RLS: allow user to update only their own username (keep existing read policies)
DROP POLICY IF EXISTS "Allow users to update their own username" ON public.user_profiles;
CREATE POLICY "Allow users to update their own username" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- End of migration
