-- Fix ambiguous column references in talent directory functions

-- Drop and recreate the get_public_profile function with proper table aliases
DROP FUNCTION IF EXISTS get_public_profile(uuid);

CREATE OR REPLACE FUNCTION get_public_profile(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    bio text,
    location text,
    website text,
    phone text,
    specialties text[],
    hourly_rate integer,
    experience_years integer,
    is_active boolean,
    is_available boolean,
    created_at timestamp with time zone,
    total_views bigint,
    total_likes bigint,
    avg_rating numeric,
    show_contact_info boolean,
    show_rates boolean,
    last_active_at timestamp with time zone,
    vo_profiles_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        p.email,
        p.avatar_url,
        p.bio,
        p.location,
        CASE WHEN p.show_contact_info THEN p.website ELSE NULL END as website,
        CASE WHEN p.show_contact_info THEN p.phone ELSE NULL END as phone,
        p.specialties,
        CASE WHEN p.show_rates THEN p.hourly_rate ELSE NULL END as hourly_rate,
        p.experience_years,
        p.is_active,
        p.is_available,
        p.created_at,
        COALESCE(stats.total_views, 0) as total_views,
        COALESCE(stats.total_likes, 0) as total_likes,
        COALESCE(stats.avg_rating, 0) as avg_rating,
        p.show_contact_info,
        p.show_rates,
        p.last_active_at,
        COALESCE(vo_count.count, 0) as vo_profiles_count
    FROM profiles p
    LEFT JOIN (
        SELECT
            pa.user_id,
            COUNT(CASE WHEN pa.event_type = 'profile_view' THEN 1 END) as total_views,
            COUNT(CASE WHEN pa.event_type = 'like' THEN 1 END) as total_likes,
            AVG(CASE WHEN pa.event_type = 'rating' AND (pa.metadata->>'rating')::numeric BETWEEN 1 AND 5
                THEN (pa.metadata->>'rating')::numeric
                ELSE NULL END) as avg_rating
        FROM profile_analytics pa
        GROUP BY pa.user_id
    ) stats ON p.id = stats.user_id
    LEFT JOIN (
        SELECT vo.user_id, COUNT(*) as count
        FROM vo_profiles vo
        WHERE vo.is_active = true
        GROUP BY vo.user_id
    ) vo_count ON p.id = vo_count.user_id
    WHERE
        p.id = p_user_id
        AND p.is_profile_public = true
        AND p.is_active = true;
END;
$$;

-- Drop and recreate the search_talent_profiles function with proper table aliases
DROP FUNCTION IF EXISTS search_talent_profiles(text, text, text, integer, integer, integer, integer, boolean, integer, integer);

CREATE OR REPLACE FUNCTION search_talent_profiles(
    p_query text DEFAULT NULL,
    p_specialty text DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_min_rate integer DEFAULT NULL,
    p_max_rate integer DEFAULT NULL,
    p_min_experience integer DEFAULT NULL,
    p_max_experience integer DEFAULT NULL,
    p_availability_only boolean DEFAULT false,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    bio text,
    location text,
    website text,
    phone text,
    specialties text[],
    hourly_rate integer,
    experience_years integer,
    is_active boolean,
    is_available boolean,
    created_at timestamp with time zone,
    total_views bigint,
    total_likes bigint,
    avg_rating numeric,
    show_contact_info boolean,
    show_rates boolean,
    last_active_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        p.email,
        p.avatar_url,
        p.bio,
        p.location,
        CASE WHEN p.show_contact_info THEN p.website ELSE NULL END as website,
        CASE WHEN p.show_contact_info THEN p.phone ELSE NULL END as phone,
        p.specialties,
        CASE WHEN p.show_rates THEN p.hourly_rate ELSE NULL END as hourly_rate,
        p.experience_years,
        p.is_active,
        p.is_available,
        p.created_at,
        COALESCE(stats.total_views, 0) as total_views,
        COALESCE(stats.total_likes, 0) as total_likes,
        COALESCE(stats.avg_rating, 0) as avg_rating,
        p.show_contact_info,
        p.show_rates,
        p.last_active_at
    FROM profiles p
    LEFT JOIN (
        SELECT
            pa.user_id,
            COUNT(CASE WHEN pa.event_type = 'profile_view' THEN 1 END) as total_views,
            COUNT(CASE WHEN pa.event_type = 'like' THEN 1 END) as total_likes,
            AVG(CASE WHEN pa.event_type = 'rating' AND (pa.metadata->>'rating')::numeric BETWEEN 1 AND 5
                THEN (pa.metadata->>'rating')::numeric
                ELSE NULL END) as avg_rating
        FROM profile_analytics pa
        GROUP BY pa.user_id
    ) stats ON p.id = stats.user_id
    WHERE
        p.is_profile_public = true
        AND p.is_active = true
        AND (p_query IS NULL OR (
            p.full_name ILIKE '%' || p_query || '%'
            OR p.bio ILIKE '%' || p_query || '%'
            OR p.location ILIKE '%' || p_query || '%'
            OR EXISTS (
                SELECT 1 FROM UNNEST(p.specialties) as specialty
                WHERE specialty ILIKE '%' || p_query || '%'
            )
        ))
        AND (p_specialty IS NULL OR p_specialty = ANY(p.specialties))
        AND (p_location IS NULL OR p.location ILIKE '%' || p_location || '%')
        AND (p_min_rate IS NULL OR p.hourly_rate IS NULL OR p.hourly_rate >= p_min_rate)
        AND (p_max_rate IS NULL OR p.hourly_rate IS NULL OR p.hourly_rate <= p_max_rate)
        AND (p_min_experience IS NULL OR p.experience_years IS NULL OR p.experience_years >= p_min_experience)
        AND (p_max_experience IS NULL OR p.experience_years IS NULL OR p.experience_years <= p_max_experience)
        AND (p_availability_only = false OR p.is_available = true)
    ORDER BY
        -- Prioritize profiles with more data
        (CASE WHEN p.bio IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN p.avatar_url IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN p.hourly_rate IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN array_length(p.specialties, 1) > 0 THEN 1 ELSE 0 END +
         CASE WHEN p.experience_years IS NOT NULL THEN 1 ELSE 0 END) DESC,
        COALESCE(stats.total_views, 0) DESC,
        p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_talent_profiles TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_public_profile TO authenticated, anon;