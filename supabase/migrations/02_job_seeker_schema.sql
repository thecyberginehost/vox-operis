-- Add new professional profile fields (one column at a time)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_role text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_summary text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS soft_skills text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS career_goals text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vo_style text CHECK (vo_style IN ('professional', 'conversational', 'creative'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_of_experience integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_status text CHECK (availability_status IN ('available', 'busy', 'not_looking')) DEFAULT 'available';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_work_type text CHECK (preferred_work_type IN ('remote', 'hybrid', 'onsite', 'flexible')) DEFAULT 'flexible';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary_expectation text;

-- Rename has_home_studio to has_recording_setup for VO profiles
ALTER TABLE profiles RENAME COLUMN has_home_studio TO has_recording_setup;

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