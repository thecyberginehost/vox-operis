-- Add cv_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.cv_url IS 'URL to user CV/Resume document (PDF or DOCX)';
