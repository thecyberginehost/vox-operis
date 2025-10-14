-- Add new professional profile fields (one column at a time with safer syntax)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_summary TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS soft_skills TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS career_goals TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary_expectation TEXT;

-- Add vo_style column with constraint
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vo_style TEXT;
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_vo_style
  CHECK (vo_style IN ('professional', 'conversational', 'creative'));

-- Add availability_status column with constraint
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_availability_status
  CHECK (availability_status IN ('available', 'busy', 'not_looking'));

-- Add preferred_work_type column with constraint
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_work_type TEXT DEFAULT 'flexible';
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_preferred_work_type
  CHECK (preferred_work_type IN ('remote', 'hybrid', 'onsite', 'flexible'));

-- Try to rename has_home_studio to has_recording_setup (skip if column doesn't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'profiles' AND column_name = 'has_home_studio') THEN
    ALTER TABLE profiles RENAME COLUMN has_home_studio TO has_recording_setup;
  END IF;
END $$;

-- Update check constraint for user_type to include job_seeker/recruiter
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check
  CHECK (user_type IN ('artist', 'client', 'both', 'job_seeker', 'recruiter'));

-- Create indexes for efficient searching
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles (user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON profiles (availability_status) WHERE availability_status = 'available';
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_profiles_soft_skills ON profiles USING GIN (soft_skills);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles (location) WHERE location IS NOT NULL;