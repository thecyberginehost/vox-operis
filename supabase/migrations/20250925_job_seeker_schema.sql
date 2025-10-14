-- Update profiles table for job seeker/recruiter functionality
-- Remove voice-over specific fields and add professional profile fields

-- Add new professional profile fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_role text,
ADD COLUMN IF NOT EXISTS professional_summary text,
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS soft_skills text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS career_goals text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vo_style text CHECK (vo_style IN ('professional', 'conversational', 'creative')),
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS portfolio_url text,
ADD COLUMN IF NOT EXISTS years_of_experience integer,
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS availability_status text CHECK (availability_status IN ('available', 'busy', 'not_looking')) DEFAULT 'available',
ADD COLUMN IF NOT EXISTS preferred_work_type text CHECK (preferred_work_type IN ('remote', 'hybrid', 'onsite', 'flexible')) DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS salary_expectation text;

-- Update existing onboarding fields to be more generic
-- user_type remains: 'artist' becomes 'job_seeker', 'client' becomes 'recruiter', 'both' stays
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

-- Update comments for new fields
COMMENT ON COLUMN profiles.user_type IS 'User type: job_seeker (looking for work), recruiter (hiring), artist (legacy voice talent), client (legacy), or both';
COMMENT ON COLUMN profiles.has_recording_setup IS 'Whether user has video/audio recording setup for creating VO profiles';
COMMENT ON COLUMN profiles.current_role IS 'Current job title or professional role';
COMMENT ON COLUMN profiles.professional_summary IS 'Brief professional summary or bio';
COMMENT ON COLUMN profiles.skills IS 'Professional/technical skills array';
COMMENT ON COLUMN profiles.soft_skills IS 'Soft skills and personality traits array';
COMMENT ON COLUMN profiles.career_goals IS 'Career objectives and goals array';
COMMENT ON COLUMN profiles.vo_style IS 'Preferred style for VO profile presentations';
COMMENT ON COLUMN profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN profiles.portfolio_url IS 'Personal portfolio or website URL';
COMMENT ON COLUMN profiles.years_of_experience IS 'Total years of professional experience';
COMMENT ON COLUMN profiles.education IS 'Educational background';
COMMENT ON COLUMN profiles.certifications IS 'Professional certifications array';
COMMENT ON COLUMN profiles.languages IS 'Spoken languages array';
COMMENT ON COLUMN profiles.availability_status IS 'Current job seeking status';
COMMENT ON COLUMN profiles.preferred_work_type IS 'Preferred working arrangement';
COMMENT ON COLUMN profiles.salary_expectation IS 'Expected salary range or rate';

-- Update the search function for job seekers and recruiters
CREATE OR REPLACE FUNCTION search_professional_profiles(
  p_search_term text DEFAULT NULL,
  p_user_type_filter text DEFAULT NULL,
  p_location_filter text DEFAULT NULL,
  p_skills_filter text[] DEFAULT NULL,
  p_availability_filter text DEFAULT NULL,
  p_work_type_filter text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
) RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  current_role text,
  professional_summary text,
  avatar_url text,
  location text,
  skills text[],
  soft_skills text[],
  years_of_experience integer,
  user_type text,
  availability_status text,
  preferred_work_type text,
  is_available boolean,
  profile_views_count integer,
  last_active_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.current_role,
    p.professional_summary,
    p.avatar_url,
    p.location,
    p.skills,
    p.soft_skills,
    p.years_of_experience,
    p.user_type,
    p.availability_status,
    p.preferred_work_type,
    p.is_available,
    p.profile_views_count,
    p.last_active_at
  FROM profiles p
  WHERE p.is_profile_public = true
    AND p.is_active = true
    AND (p_search_term IS NULL OR (
      p.full_name ILIKE '%' || p_search_term || '%' OR
      p.current_role ILIKE '%' || p_search_term || '%' OR
      p.professional_summary ILIKE '%' || p_search_term || '%' OR
      p.skills::text ILIKE '%' || p_search_term || '%'
    ))
    AND (p_user_type_filter IS NULL OR p.user_type = p_user_type_filter)
    AND (p_location_filter IS NULL OR p.location ILIKE '%' || p_location_filter || '%')
    AND (p_skills_filter IS NULL OR p.skills && p_skills_filter)
    AND (p_availability_filter IS NULL OR p.availability_status = p_availability_filter)
    AND (p_work_type_filter IS NULL OR p.preferred_work_type = p_work_type_filter)
  ORDER BY
    p.last_active_at DESC NULLS LAST,
    p.profile_views_count DESC,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_professional_profiles TO authenticated;