-- ================================================================
-- Voice-Over Profiles and Analytics Schema
-- Replaces mock data with real database-driven content
-- ================================================================

-- Voice-Over Profiles table
CREATE TABLE IF NOT EXISTS public.vo_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    audio_file_url TEXT,
    cover_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile Analytics table (tracks views, interactions)
CREATE TABLE IF NOT EXISTS public.profile_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vo_profile_id UUID REFERENCES public.vo_profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('profile_view', 'audio_play', 'download', 'share', 'like', 'contact_request')),
    visitor_ip TEXT,
    visitor_country TEXT,
    visitor_city TEXT,
    user_agent TEXT,
    referrer TEXT,
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities/Job Matches table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    company_name TEXT,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    deadline DATE,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'applied', 'shortlisted', 'hired', 'declined', 'expired')),
    tags TEXT[] DEFAULT '{}',
    contact_email TEXT,
    contact_phone TEXT,
    project_type TEXT CHECK (project_type IN ('commercial', 'narration', 'character', 'audiobook', 'podcast', 'e-learning', 'other')),
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'expert', 'any')),
    match_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    is_premium BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update profiles table to track VO count
UPDATE public.profiles
SET vo_count = (
    SELECT COUNT(*)
    FROM public.vo_profiles
    WHERE vo_profiles.user_id = profiles.id AND vo_profiles.is_active = true
)
WHERE vo_count = 0 OR vo_count IS NULL;

-- Function to get user dashboard stats
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    vo_count INTEGER;
    profile_views INTEGER;
    opportunities_count INTEGER;
    this_month_views INTEGER;
BEGIN
    -- Get VO count
    SELECT COUNT(*) INTO vo_count
    FROM public.vo_profiles
    WHERE user_id = p_user_id AND is_active = true;

    -- Get total profile views
    SELECT COUNT(*) INTO profile_views
    FROM public.profile_analytics
    WHERE user_id = p_user_id AND event_type = 'profile_view';

    -- Get this month's views
    SELECT COUNT(*) INTO this_month_views
    FROM public.profile_analytics
    WHERE user_id = p_user_id
      AND event_type = 'profile_view'
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE);

    -- Get new opportunities count
    SELECT COUNT(*) INTO opportunities_count
    FROM public.opportunities
    WHERE user_id = p_user_id AND status = 'new';

    -- Build result
    result := jsonb_build_object(
        'vo_count', vo_count,
        'total_profile_views', profile_views,
        'monthly_profile_views', this_month_views,
        'new_opportunities', opportunities_count,
        'generated_at', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's VO profiles
CREATE OR REPLACE FUNCTION public.get_user_vo_profiles(p_user_id UUID)
RETURNS SETOF public.vo_profiles AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.vo_profiles
    WHERE user_id = p_user_id
    ORDER BY updated_at DESC, created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track profile view
CREATE OR REPLACE FUNCTION public.track_profile_view(
    p_user_id UUID,
    p_vo_profile_id UUID DEFAULT NULL,
    p_visitor_ip TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    analytics_id UUID;
BEGIN
    -- Insert analytics record
    INSERT INTO public.profile_analytics (
        user_id, vo_profile_id, event_type, visitor_ip, user_agent, referrer
    ) VALUES (
        p_user_id, p_vo_profile_id, 'profile_view', p_visitor_ip, p_user_agent, p_referrer
    ) RETURNING id INTO analytics_id;

    -- Update view count on VO profile if specified
    IF p_vo_profile_id IS NOT NULL THEN
        UPDATE public.vo_profiles
        SET view_count = view_count + 1,
            updated_at = NOW()
        WHERE id = p_vo_profile_id;
    END IF;

    RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create sample opportunities (for testing)
CREATE OR REPLACE FUNCTION public.create_sample_opportunities(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    created_count INTEGER := 0;
BEGIN
    -- Only create if user has no opportunities
    IF NOT EXISTS (SELECT 1 FROM public.opportunities WHERE user_id = p_user_id) THEN
        -- Create sample opportunities
        INSERT INTO public.opportunities (
            user_id, title, description, company_name, budget_min, budget_max,
            project_type, experience_level, match_score, expires_at
        ) VALUES
        (p_user_id, 'Commercial Voice-Over for Tech Startup', 'Looking for a professional voice to narrate our product demo video. Clean, modern sound required.', 'TechFlow Inc.', 500.00, 1000.00, 'commercial', 'intermediate', 0.87, NOW() + INTERVAL '7 days'),
        (p_user_id, 'Audiobook Narration - Fiction Novel', 'Need an engaging narrator for a 300-page fantasy novel. Previous experience with character voices preferred.', 'Indie Publishers', 2000.00, 4000.00, 'audiobook', 'expert', 0.92, NOW() + INTERVAL '14 days'),
        (p_user_id, 'E-Learning Module Voice-Over', 'Professional corporate training modules require clear, authoritative voice-over work.', 'Learning Corp', 300.00, 600.00, 'e-learning', 'any', 0.75, NOW() + INTERVAL '10 days'),
        (p_user_id, 'Podcast Intro and Outro', 'Tech podcast needs professional intro/outro recordings. Modern, energetic style.', 'Digital Media Co.', 150.00, 300.00, 'podcast', 'beginner', 0.68, NOW() + INTERVAL '5 days');

        created_count := 4;
    END IF;

    RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vo_profiles_user_id ON public.vo_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vo_profiles_active ON public.vo_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profile_analytics_user_id ON public.profile_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_analytics_event_type ON public.profile_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_profile_analytics_created_at ON public.profile_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON public.opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);

-- Enable RLS
ALTER TABLE public.vo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vo_profiles
CREATE POLICY "Users can view their own VO profiles" ON public.vo_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own VO profiles" ON public.vo_profiles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public can view active VO profiles" ON public.vo_profiles
    FOR SELECT USING (is_active = true);

-- RLS Policies for profile_analytics
CREATE POLICY "Users can view their own analytics" ON public.profile_analytics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Analytics can be inserted by anyone" ON public.profile_analytics
    FOR INSERT WITH CHECK (true);

-- RLS Policies for opportunities
CREATE POLICY "Users can view their own opportunities" ON public.opportunities
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own opportunities" ON public.opportunities
    FOR ALL USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vo_profiles TO authenticated;
GRANT SELECT, INSERT ON public.profile_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.opportunities TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_vo_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_profile_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_sample_opportunities TO authenticated;

-- Add comments
COMMENT ON TABLE public.vo_profiles IS 'Voice-over profiles created by users';
COMMENT ON TABLE public.profile_analytics IS 'Tracks user profile and VO interactions';
COMMENT ON TABLE public.opportunities IS 'Job opportunities and matches for voice artists';
COMMENT ON FUNCTION public.get_user_dashboard_stats IS 'Returns real-time dashboard statistics for a user';
COMMENT ON FUNCTION public.track_profile_view IS 'Records profile views and updates analytics';
COMMENT ON FUNCTION public.create_sample_opportunities IS 'Creates sample opportunities for testing (only if none exist)';