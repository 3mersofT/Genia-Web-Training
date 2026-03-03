-- =================================================================
-- MIGRATION: Remove capsule foreign key constraint
-- Version: 1.0
-- Description: Remove foreign key constraint since system uses JSON files
-- =================================================================

-- Remove the foreign key constraint that requires capsules to exist in database
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_capsule_id_fkey;

-- Remove the foreign key constraint for generated_exercises as well
ALTER TABLE generated_exercises DROP CONSTRAINT IF EXISTS generated_exercises_capsule_id_fkey;

-- The system works with JSON files, so we don't need database capsules
-- This allows user_progress to store capsule IDs like "cap-1-1" without
-- requiring them to exist in the capsules table
