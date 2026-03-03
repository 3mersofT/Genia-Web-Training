-- =================================================================
-- MIGRATION: Change capsule_id from UUID to TEXT
-- Version: 1.0
-- Description: Change capsule_id columns to accept string IDs like "cap-1-1"
-- =================================================================

-- First, drop the foreign key constraints
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_capsule_id_fkey;
ALTER TABLE generated_exercises DROP CONSTRAINT IF EXISTS generated_exercises_capsule_id_fkey;
ALTER TABLE feedback_stats DROP CONSTRAINT IF EXISTS feedback_stats_target_id_fkey;

-- Change the column types from UUID to TEXT
ALTER TABLE user_progress ALTER COLUMN capsule_id TYPE TEXT;
ALTER TABLE generated_exercises ALTER COLUMN capsule_id TYPE TEXT;
ALTER TABLE feedback_stats ALTER COLUMN target_id TYPE TEXT;

-- Change the capsules table id to TEXT as well
ALTER TABLE capsules ALTER COLUMN id TYPE TEXT;

-- Update the primary key constraint
ALTER TABLE capsules DROP CONSTRAINT IF EXISTS capsules_pkey;
ALTER TABLE capsules ADD PRIMARY KEY (id);

-- Recreate the foreign key constraints
ALTER TABLE user_progress ADD CONSTRAINT user_progress_capsule_id_fkey 
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE;

ALTER TABLE generated_exercises ADD CONSTRAINT generated_exercises_capsule_id_fkey 
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE;

-- For feedback_stats, we'll make it more flexible since it can reference different types
-- ALTER TABLE feedback_stats ADD CONSTRAINT feedback_stats_target_id_fkey 
--   FOREIGN KEY (target_id) REFERENCES capsules(id) ON DELETE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS idx_user_progress_capsule_id;
CREATE INDEX idx_user_progress_capsule_id ON user_progress(capsule_id);

DROP INDEX IF EXISTS idx_generated_exercises_capsule;
CREATE INDEX idx_generated_exercises_capsule ON generated_exercises(capsule_id);
