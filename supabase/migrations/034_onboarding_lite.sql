-- Two-tier onboarding: add fields for lite mode
-- Existing accounts have onboarding_completed = true but version_seen = 0
-- New accounts get the full 6-step tour; existing get a feature discovery button

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_lite_dismissed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_version_seen INTEGER DEFAULT 0;
