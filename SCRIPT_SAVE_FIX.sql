-- ================================================================
-- FIX SCRIPT SAVE ISSUE
-- Run this in Supabase SQL Editor to allow saving edited scripts
-- ================================================================

-- Drop existing constraints on script_generations table
ALTER TABLE script_generations
  DROP CONSTRAINT IF EXISTS script_generations_script_type_check;

ALTER TABLE script_generations
  DROP CONSTRAINT IF EXISTS script_generations_target_audience_check;

ALTER TABLE script_generations
  DROP CONSTRAINT IF EXISTS script_generations_script_length_check;

-- Add more flexible constraints that allow 'custom' and 'edited' values
ALTER TABLE script_generations
  ADD CONSTRAINT script_generations_script_type_check
  CHECK (script_type IN ('professional', 'conversational', 'enthusiastic', 'storytelling', 'custom', 'edited'));

ALTER TABLE script_generations
  ADD CONSTRAINT script_generations_target_audience_check
  CHECK (target_audience IN ('business', 'creative', 'tech', 'general', 'custom'));

ALTER TABLE script_generations
  ADD CONSTRAINT script_generations_script_length_check
  CHECK (script_length IN ('1min', '2min', '3min', '5min', 'custom'));

-- Make certain fields optional for custom scripts
ALTER TABLE script_generations
  ALTER COLUMN script_type DROP NOT NULL;

ALTER TABLE script_generations
  ALTER COLUMN target_audience DROP NOT NULL;

ALTER TABLE script_generations
  ALTER COLUMN script_length DROP NOT NULL;

-- Set defaults for nullable fields
ALTER TABLE script_generations
  ALTER COLUMN script_type SET DEFAULT 'custom';

ALTER TABLE script_generations
  ALTER COLUMN target_audience SET DEFAULT 'general';

ALTER TABLE script_generations
  ALTER COLUMN script_length SET DEFAULT 'custom';

-- ================================================================
-- DONE!
-- ================================================================
-- After running this:
-- - Scripts can now be saved with more flexible types
-- - 'custom' and 'edited' are now valid values
-- - Fields are now optional for user-created scripts
-- ================================================================
