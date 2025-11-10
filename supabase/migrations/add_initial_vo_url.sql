-- Add initial_vo_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS initial_vo_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.initial_vo_url IS 'URL to the user''s initial culture check VO video recorded during onboarding';
