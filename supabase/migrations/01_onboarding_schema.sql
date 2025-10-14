-- Add onboarding fields to profiles table (one column at a time)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type text CHECK (user_type IN ('artist', 'client', 'both'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_home_studio boolean;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS project_types text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget_range text;

-- Create index for efficient onboarding status queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles (onboarding_completed) WHERE onboarding_completed = false;

-- Add comments for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the initial onboarding flow';
COMMENT ON COLUMN profiles.user_type IS 'User type: artist (voice talent), client (hiring), or both';
COMMENT ON COLUMN profiles.has_home_studio IS 'Whether voice artist has home studio setup: true=yes, false=planning, null=studio access only';
COMMENT ON COLUMN profiles.company_name IS 'Company name for clients';
COMMENT ON COLUMN profiles.industry IS 'Industry sector for clients';
COMMENT ON COLUMN profiles.project_types IS 'Types of projects client typically needs';
COMMENT ON COLUMN profiles.budget_range IS 'Typical budget range for client projects';