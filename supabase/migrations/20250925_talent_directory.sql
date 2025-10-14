-- Talent Directory: Enhanced profile search and discovery functionality

-- Add profile visibility and availability columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_profile_public boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_contact_info boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_rates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now();

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_profiles_public ON profiles (is_profile_public, is_active) WHERE is_profile_public = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_specialties_gin ON profiles USING GIN (specialties);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles (location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_hourly_rate ON profiles (hourly_rate) WHERE hourly_rate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_experience ON profiles (experience_years) WHERE experience_years IS NOT NULL;

-- Function to search talent profiles
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
            user_id,
            COUNT(CASE WHEN event_type = 'profile_view' THEN 1 END) as total_views,
            COUNT(CASE WHEN event_type = 'like' THEN 1 END) as total_likes,
            AVG(CASE WHEN event_type = 'rating' AND (metadata->>'rating')::numeric BETWEEN 1 AND 5
                THEN (metadata->>'rating')::numeric
                ELSE NULL END) as avg_rating
        FROM profile_analytics
        GROUP BY user_id
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

-- Function to get a single public profile by ID
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
            user_id,
            COUNT(CASE WHEN event_type = 'profile_view' THEN 1 END) as total_views,
            COUNT(CASE WHEN event_type = 'like' THEN 1 END) as total_likes,
            AVG(CASE WHEN event_type = 'rating' AND (metadata->>'rating')::numeric BETWEEN 1 AND 5
                THEN (metadata->>'rating')::numeric
                ELSE NULL END) as avg_rating
        FROM profile_analytics
        GROUP BY user_id
    ) stats ON p.id = stats.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as count
        FROM vo_profiles
        WHERE is_active = true
        GROUP BY user_id
    ) vo_count ON p.id = vo_count.user_id
    WHERE
        p.id = p_user_id
        AND p.is_profile_public = true
        AND p.is_active = true;
END;
$$;

-- Function to track profile views
CREATE OR REPLACE FUNCTION track_profile_view_enhanced(
    p_viewed_user_id uuid,
    p_viewer_ip text DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_referrer text DEFAULT NULL,
    p_session_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile view event
    INSERT INTO profile_analytics (
        user_id,
        event_type,
        visitor_ip,
        user_agent,
        referrer,
        session_id,
        metadata
    ) VALUES (
        p_viewed_user_id,
        'profile_view',
        p_viewer_ip,
        p_user_agent,
        p_referrer,
        p_session_id,
        json_build_object('timestamp', now())
    );

    -- Update profile views counter
    UPDATE profiles
    SET profile_views_count = profile_views_count + 1,
        last_active_at = now()
    WHERE id = p_viewed_user_id;
END;
$$;

-- Function to get talent directory stats
CREATE OR REPLACE FUNCTION get_talent_directory_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    total_artists integer;
    available_artists integer;
    avg_hourly_rate numeric;
    top_specialties text[];
BEGIN
    -- Get basic stats
    SELECT
        COUNT(*),
        COUNT(CASE WHEN is_available = true THEN 1 END),
        AVG(hourly_rate)
    INTO total_artists, available_artists, avg_hourly_rate
    FROM profiles
    WHERE is_profile_public = true AND is_active = true;

    -- Get top 5 specialties
    SELECT ARRAY(
        SELECT specialty
        FROM (
            SELECT specialty, COUNT(*) as count
            FROM profiles p
            CROSS JOIN UNNEST(p.specialties) as specialty
            WHERE p.is_profile_public = true AND p.is_active = true
            GROUP BY specialty
            ORDER BY count DESC
            LIMIT 5
        ) top_specs
    ) INTO top_specialties;

    result := json_build_object(
        'total_artists', COALESCE(total_artists, 0),
        'available_artists', COALESCE(available_artists, 0),
        'avg_hourly_rate', COALESCE(avg_hourly_rate, 0),
        'top_specialties', COALESCE(top_specialties, '{}')
    );

    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_talent_profiles TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_public_profile TO authenticated, anon;
GRANT EXECUTE ON FUNCTION track_profile_view_enhanced TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_talent_directory_stats TO authenticated, anon;

-- Update RLS policies for public profile access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
FOR SELECT USING (is_profile_public = true AND is_active = true);

-- Comments for documentation
COMMENT ON COLUMN profiles.is_profile_public IS 'Whether profile appears in public talent directory';
COMMENT ON COLUMN profiles.is_available IS 'Whether artist is currently available for work';
COMMENT ON COLUMN profiles.show_contact_info IS 'Whether to show contact info (website, phone) publicly';
COMMENT ON COLUMN profiles.show_rates IS 'Whether to show hourly rate publicly';
COMMENT ON COLUMN profiles.profile_views_count IS 'Total number of profile views';
COMMENT ON COLUMN profiles.last_active_at IS 'Last time profile was active or viewed';