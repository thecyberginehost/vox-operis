-- ================================================================
-- Fix All Data Issues - Complete Solution
-- This script fixes both analytics user count and removes mock data
-- ================================================================

-- Step 1: Fix analytics user count issue
-- Drop and recreate the calculate_daily_analytics function
DROP FUNCTION IF EXISTS public.calculate_daily_analytics(DATE);

-- Recreate with corrected logic for user counting
CREATE OR REPLACE FUNCTION public.calculate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    total_count INTEGER;
    new_reg_count INTEGER;
    active_count INTEGER;
    admin_count INTEGER;
    codes_gen_count INTEGER;
    codes_used_count INTEGER;
    failed_login_count INTEGER;
    security_incident_count INTEGER;
    result JSONB;
BEGIN
    -- Calculate all counts correctly
    SELECT COUNT(*) INTO total_count FROM public.profiles WHERE is_active = true;
    SELECT COUNT(*) INTO new_reg_count FROM public.profiles WHERE DATE(created_at) = target_date;

    -- Active users are those who logged in on the target date OR recently
    SELECT COUNT(*) INTO active_count
    FROM public.profiles
    WHERE is_active = true AND (
        DATE(last_login_at) = target_date OR
        last_login_at >= (target_date - INTERVAL '7 days')
    );

    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin' AND is_active = true;
    SELECT COUNT(*) INTO codes_gen_count FROM public.invite_codes WHERE DATE(created_at) = target_date;
    SELECT COUNT(*) INTO codes_used_count FROM public.invite_codes WHERE DATE(used_at) = target_date AND is_used = true;

    -- Handle security_logs if it exists, otherwise set to 0
    BEGIN
        SELECT COUNT(*) INTO failed_login_count
        FROM public.security_logs
        WHERE DATE(created_at) = target_date AND event_type = 'failed_login';

        SELECT COUNT(*) INTO security_incident_count
        FROM public.security_logs
        WHERE DATE(created_at) = target_date AND severity IN ('high', 'critical');
    EXCEPTION
        WHEN undefined_table THEN
            failed_login_count := 0;
            security_incident_count := 0;
    END;

    -- Insert or update analytics
    INSERT INTO public.user_analytics (
        date,
        total_users,
        new_registrations,
        active_users,
        admin_users,
        invite_codes_generated,
        invite_codes_used,
        failed_login_attempts,
        security_incidents
    ) VALUES (
        target_date,
        total_count,
        new_reg_count,
        active_count,
        admin_count,
        codes_gen_count,
        codes_used_count,
        failed_login_count,
        security_incident_count
    )
    ON CONFLICT (date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        new_registrations = EXCLUDED.new_registrations,
        active_users = EXCLUDED.active_users,
        admin_users = EXCLUDED.admin_users,
        invite_codes_generated = EXCLUDED.invite_codes_generated,
        invite_codes_used = EXCLUDED.invite_codes_used,
        failed_login_attempts = EXCLUDED.failed_login_attempts,
        security_incidents = EXCLUDED.security_incidents,
        created_at = NOW();

    -- Return the calculated values
    result := jsonb_build_object(
        'date', target_date,
        'total_users', total_count,
        'new_registrations', new_reg_count,
        'active_users', active_count,
        'admin_users', admin_count,
        'invite_codes_generated', codes_gen_count,
        'invite_codes_used', codes_used_count,
        'failed_login_attempts', failed_login_count,
        'security_incidents', security_incident_count,
        'calculated_at', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Clear all mock opportunities data
-- First, let's see what mock data exists
DO $$
DECLARE
    mock_count INTEGER;
BEGIN
    -- Count existing mock opportunities
    SELECT COUNT(*) INTO mock_count
    FROM public.opportunities
    WHERE title LIKE '%Commercial Voice-Over%' OR
          title LIKE '%Audiobook Narration%' OR
          title LIKE '%E-Learning Module%' OR
          title LIKE '%Podcast Intro%' OR
          company_name IN ('TechFlow Inc.', 'Indie Publishers', 'Learning Corp', 'Digital Media Co.') OR
          description LIKE '%sample%' OR
          description LIKE '%mock%' OR
          description LIKE '%test%';

    RAISE NOTICE 'Found % mock opportunities to delete', mock_count;

    -- Delete all mock opportunities
    DELETE FROM public.opportunities
    WHERE title LIKE '%Commercial Voice-Over%' OR
          title LIKE '%Audiobook Narration%' OR
          title LIKE '%E-Learning Module%' OR
          title LIKE '%Podcast Intro%' OR
          company_name IN ('TechFlow Inc.', 'Indie Publishers', 'Learning Corp', 'Digital Media Co.') OR
          description LIKE '%sample%' OR
          description LIKE '%mock%' OR
          description LIKE '%test%';

    GET DIAGNOSTICS mock_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % mock opportunities', mock_count;
END $$;

-- Step 3: Ensure the get_user_dashboard_stats function exists and works correctly
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    vo_count INTEGER;
    profile_views INTEGER;
    opportunities_count INTEGER;
    this_month_views INTEGER;
BEGIN
    -- Get VO count (active profiles only)
    SELECT COUNT(*) INTO vo_count
    FROM public.vo_profiles
    WHERE user_id = p_user_id AND is_active = true;

    -- Get total profile views
    SELECT COALESCE(SUM(view_count), 0) INTO profile_views
    FROM public.vo_profiles
    WHERE user_id = p_user_id AND is_active = true;

    -- Get new opportunities count (excluding mock data)
    SELECT COUNT(*) INTO opportunities_count
    FROM public.opportunities
    WHERE user_id = p_user_id
      AND status = 'new'
      AND title NOT LIKE '%Commercial Voice-Over%'
      AND title NOT LIKE '%Audiobook Narration%'
      AND title NOT LIKE '%E-Learning Module%'
      AND title NOT LIKE '%Podcast Intro%'
      AND COALESCE(company_name, '') NOT IN ('TechFlow Inc.', 'Indie Publishers', 'Learning Corp', 'Digital Media Co.')
      AND COALESCE(description, '') NOT LIKE '%sample%'
      AND COALESCE(description, '') NOT LIKE '%mock%'
      AND COALESCE(description, '') NOT LIKE '%test%';

    -- Get this month's profile views
    SELECT COALESCE(COUNT(*), 0) INTO this_month_views
    FROM public.profile_analytics
    WHERE user_id = p_user_id
      AND event_type = 'profile_view'
      AND DATE_TRUNC('month', created_at::date) = DATE_TRUNC('month', CURRENT_DATE);

    result := jsonb_build_object(
        'vo_count', vo_count,
        'total_profile_views', profile_views,
        'new_opportunities', opportunities_count,
        'monthly_profile_views', this_month_views,
        'calculated_at', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.calculate_daily_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats TO authenticated;

-- Step 5: Recalculate today's analytics with correct user count
SELECT public.calculate_daily_analytics(CURRENT_DATE);

-- Step 6: Show the current actual user counts for verification
SELECT
    'Total Active Users' as metric,
    COUNT(*) as count
FROM public.profiles
WHERE is_active = true

UNION ALL

SELECT
    'Total Admin Users' as metric,
    COUNT(*) as count
FROM public.profiles
WHERE role = 'admin' AND is_active = true

UNION ALL

SELECT
    'All Users (including inactive)' as metric,
    COUNT(*) as count
FROM public.profiles;

-- Step 7: Show what the analytics table now contains
SELECT
    date,
    total_users,
    admin_users,
    created_at
FROM public.user_analytics
ORDER BY date DESC
LIMIT 5;

COMMENT ON FUNCTION public.calculate_daily_analytics IS 'Fixed analytics calculation with proper user counting (active users only)';
COMMENT ON FUNCTION public.get_user_dashboard_stats IS 'Dashboard stats excluding all mock/sample data';