-- ================================================================
-- Migration: Rename 'job_seeker' to 'candidate' in user_type enum
-- Date: 2025-01-10
-- ================================================================

-- Step 1: Update existing data from 'job_seeker' to 'candidate'
UPDATE public.profiles
SET user_type = 'candidate'
WHERE user_type = 'job_seeker';

-- Step 2: Create a new enum type with 'candidate' instead of 'job_seeker'
-- Note: PostgreSQL doesn't allow direct enum value renaming, so we need to:
-- 1. Add the new value to the existing enum
-- 2. Update all references
-- 3. Remove the old value (if needed)

-- First, check if we need to create the enum or if it exists
DO $$
BEGIN
    -- Add 'candidate' to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'user_type_enum' AND e.enumlabel = 'candidate'
    ) THEN
        -- If there's no enum type constraint, we can just update the check constraint
        -- Most likely this is using a CHECK constraint, not an actual enum type
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check';
        EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check CHECK (user_type IN (''candidate'', ''recruiter'', ''both'', ''admin''))';
    END IF;
END $$;

-- Step 3: Verify the migration
DO $$
DECLARE
    job_seeker_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_seeker_count
    FROM public.profiles
    WHERE user_type = 'job_seeker';

    IF job_seeker_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % rows still have user_type = ''job_seeker''', job_seeker_count;
    END IF;

    RAISE NOTICE 'Migration successful: All job_seeker user types have been renamed to candidate';
END $$;

-- Add comment
COMMENT ON COLUMN public.profiles.user_type IS 'User type: candidate (looking for work), recruiter (hiring), both, or admin';
