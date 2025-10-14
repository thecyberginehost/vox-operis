-- Profile schema updates for enhanced profile functionality
-- Add new columns to profiles table for professional information

-- Add new columns to the profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hourly_rate integer,
ADD COLUMN IF NOT EXISTS experience_years integer;

-- Create an index on specialties for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_specialties ON profiles USING GIN (specialties);

-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Set up RLS policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Function to get profile statistics
CREATE OR REPLACE FUNCTION get_profile_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    total_views integer := 0;
    total_likes integer := 0;
    total_shares integer := 0;
    monthly_views integer := 0;
    monthly_likes integer := 0;
    monthly_shares integer := 0;
BEGIN
    -- Get total stats from profile_analytics
    SELECT
        COALESCE(SUM(CASE WHEN event_type = 'profile_view' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN event_type = 'like' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN event_type = 'share' THEN 1 ELSE 0 END), 0)
    INTO total_views, total_likes, total_shares
    FROM profile_analytics
    WHERE user_id = p_user_id;

    -- Get monthly stats (last 30 days)
    SELECT
        COALESCE(SUM(CASE WHEN event_type = 'profile_view' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN event_type = 'like' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN event_type = 'share' THEN 1 ELSE 0 END), 0)
    INTO monthly_views, monthly_likes, monthly_shares
    FROM profile_analytics
    WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';

    -- Also get stats from vo_profiles if they exist
    SELECT
        COALESCE(total_views + COALESCE(SUM(view_count), 0), total_views),
        COALESCE(total_likes + COALESCE(SUM(like_count), 0), total_likes),
        COALESCE(total_shares + COALESCE(SUM(share_count), 0), total_shares)
    INTO total_views, total_likes, total_shares
    FROM vo_profiles
    WHERE user_id = p_user_id;

    -- Build result JSON
    result := json_build_object(
        'total_views', total_views,
        'total_likes', total_likes,
        'total_shares', total_shares,
        'monthly_views', monthly_views,
        'monthly_likes', monthly_likes,
        'monthly_shares', monthly_shares
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return default values if any error occurs
        RETURN json_build_object(
            'total_views', 0,
            'total_likes', 0,
            'total_shares', 0,
            'monthly_views', 0,
            'monthly_likes', 0,
            'monthly_shares', 0
        );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_profile_stats(uuid) TO authenticated;

-- Update RLS policies for profiles table
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Create RLS policy for profiles table to allow users to view their own profiles
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id OR is_active = true);

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON COLUMN profiles.specialties IS 'Array of voice-over specialties (e.g., Commercial, Narration, Character Voice, etc.)';
COMMENT ON COLUMN profiles.hourly_rate IS 'Hourly rate in USD cents (e.g., 15000 = $150/hour)';
COMMENT ON COLUMN profiles.experience_years IS 'Years of voice-over experience';
COMMENT ON COLUMN profiles.bio IS 'Professional bio and description';
COMMENT ON COLUMN profiles.location IS 'User location (city, state/country)';
COMMENT ON COLUMN profiles.website IS 'Personal or professional website URL';
COMMENT ON COLUMN profiles.phone IS 'Contact phone number';