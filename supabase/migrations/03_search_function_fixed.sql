-- Update the search function for job seekers and recruiters with correct column names
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
  job_title text,
  summary_text text,
  avatar_url text,
  location text,
  skill_list text[],
  soft_skill_list text[],
  experience_years integer,
  user_type text,
  work_status text,
  work_preference text,
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
    p.job_title,
    p.summary_text,
    p.avatar_url,
    p.location,
    p.skill_list,
    p.soft_skill_list,
    p.experience_years,
    p.user_type,
    p.work_status,
    p.work_preference,
    p.is_available,
    p.profile_views_count,
    p.last_active_at
  FROM profiles p
  WHERE p.is_profile_public = true
    AND p.is_active = true
    AND (p_search_term IS NULL OR (
      p.full_name ILIKE '%' || p_search_term || '%' OR
      p.job_title ILIKE '%' || p_search_term || '%' OR
      p.summary_text ILIKE '%' || p_search_term || '%' OR
      p.skill_list::text ILIKE '%' || p_search_term || '%'
    ))
    AND (p_user_type_filter IS NULL OR p.user_type = p_user_type_filter)
    AND (p_location_filter IS NULL OR p.location ILIKE '%' || p_location_filter || '%')
    AND (p_skills_filter IS NULL OR p.skill_list && p_skills_filter)
    AND (p_availability_filter IS NULL OR p.work_status = p_availability_filter)
    AND (p_work_type_filter IS NULL OR p.work_preference = p_work_type_filter)
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