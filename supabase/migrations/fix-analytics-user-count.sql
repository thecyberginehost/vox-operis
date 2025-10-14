-- ================================================================
-- Fix Analytics User Count Issue
-- Ensures proper user counting and analytics recalculation
-- ================================================================

-- First, let's check current user count and analytics
-- Run this to see actual user count vs analytics count

-- Function to get current user counts for debugging
CREATE OR REPLACE FUNCTION public.debug_user_counts()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_users_count INTEGER;
    active_users_count INTEGER;
    admin_users_count INTEGER;
    latest_analytics_total INTEGER;
BEGIN
    -- Get actual counts from profiles table
    SELECT COUNT(*) INTO total_users_count FROM public.profiles;
    SELECT COUNT(*) INTO active_users_count FROM public.profiles WHERE is_active = true;
    SELECT COUNT(*) INTO admin_users_count FROM public.profiles WHERE role = 'admin';

    -- Get latest analytics count
    SELECT total_users INTO latest_analytics_total
    FROM public.user_analytics
    ORDER BY date DESC
    LIMIT 1;

    result := jsonb_build_object(
        'actual_total_users', total_users_count,
        'actual_active_users', active_users_count,
        'actual_admin_users', admin_users_count,
        'analytics_total_users', latest_analytics_total,
        'checked_at', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced calculate_daily_analytics function with better logging
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
    -- Calculate all counts separately for debugging
    SELECT COUNT(*) INTO total_count FROM public.profiles;
    SELECT COUNT(*) INTO new_reg_count FROM public.profiles WHERE DATE(created_at) = target_date;
    SELECT COUNT(*) INTO active_count FROM public.profiles WHERE is_active = true AND DATE(last_login_at) = target_date;
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    SELECT COUNT(*) INTO codes_gen_count FROM public.invite_codes WHERE DATE(created_at) = target_date;
    SELECT COUNT(*) INTO codes_used_count FROM public.invite_codes WHERE DATE(used_at) = target_date AND is_used = true;
    SELECT COUNT(*) INTO failed_login_count FROM public.security_logs WHERE DATE(created_at) = target_date AND event_type = 'failed_login';
    SELECT COUNT(*) INTO security_incident_count FROM public.security_logs WHERE DATE(created_at) = target_date AND severity IN ('high', 'critical');

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

    -- Return the calculated values for verification
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

-- Function to recalculate analytics for the last 30 days
CREATE OR REPLACE FUNCTION public.recalculate_recent_analytics()
RETURNS JSONB AS $$
DECLARE
    start_date DATE;
    current_date_iter DATE;
    days_calculated INTEGER := 0;
    result JSONB;
BEGIN
    start_date := CURRENT_DATE - INTERVAL '30 days';
    current_date_iter := start_date;

    WHILE current_date_iter <= CURRENT_DATE LOOP
        PERFORM public.calculate_daily_analytics(current_date_iter);
        days_calculated := days_calculated + 1;
        current_date_iter := current_date_iter + INTERVAL '1 day';
    END LOOP;

    result := jsonb_build_object(
        'days_recalculated', days_calculated,
        'start_date', start_date,
        'end_date', CURRENT_DATE,
        'completed_at', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.debug_user_counts TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_recent_analytics TO authenticated;

-- Update the existing function signature in database types
-- The function now returns JSONB instead of VOID for better debugging

-- Recalculate today's analytics to fix the current issue
SELECT public.calculate_daily_analytics(CURRENT_DATE);

-- Debug current counts (uncomment to run manually)
-- SELECT public.debug_user_counts();

COMMENT ON FUNCTION public.debug_user_counts IS 'Debug function to compare actual user counts vs analytics';
COMMENT ON FUNCTION public.recalculate_recent_analytics IS 'Recalculates analytics for the last 30 days';