-- ================================================================
-- Clear Sample Data - Remove Mock Opportunities
-- Removes any sample opportunities that were created for testing
-- ================================================================

-- Function to clear sample opportunities for a user
CREATE OR REPLACE FUNCTION public.clear_sample_opportunities(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete sample opportunities (those created by create_sample_opportunities function)
    -- These typically have generic titles and companies
    DELETE FROM public.opportunities
    WHERE user_id = p_user_id
      AND (
        title LIKE '%Commercial Voice-Over%' OR
        title LIKE '%Audiobook Narration%' OR
        title LIKE '%E-Learning Module%' OR
        title LIKE '%Podcast Intro%' OR
        company_name IN ('TechFlow Inc.', 'Indie Publishers', 'Learning Corp', 'Digital Media Co.')
      );

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'message', format('Cleared %s sample opportunities', deleted_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear all sample opportunities from all users
CREATE OR REPLACE FUNCTION public.clear_all_sample_opportunities()
RETURNS JSONB AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete all sample opportunities
    DELETE FROM public.opportunities
    WHERE title LIKE '%Commercial Voice-Over%' OR
          title LIKE '%Audiobook Narration%' OR
          title LIKE '%E-Learning Module%' OR
          title LIKE '%Podcast Intro%' OR
          company_name IN ('TechFlow Inc.', 'Indie Publishers', 'Learning Corp', 'Digital Media Co.');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'message', format('Cleared %s sample opportunities from all users', deleted_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get opportunities count by user
CREATE OR REPLACE FUNCTION public.debug_opportunities_count(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_count INTEGER;
    new_count INTEGER;
    sample_count INTEGER;
BEGIN
    -- Get total opportunities
    SELECT COUNT(*) INTO total_count
    FROM public.opportunities
    WHERE user_id = p_user_id;

    -- Get new opportunities
    SELECT COUNT(*) INTO new_count
    FROM public.opportunities
    WHERE user_id = p_user_id AND status = 'new';

    -- Get likely sample opportunities
    SELECT COUNT(*) INTO sample_count
    FROM public.opportunities
    WHERE user_id = p_user_id
      AND (
        title LIKE '%Commercial Voice-Over%' OR
        title LIKE '%Audiobook Narration%' OR
        title LIKE '%E-Learning Module%' OR
        title LIKE '%Podcast Intro%' OR
        company_name IN ('TechFlow Inc.', 'Indie Publishers', 'Learning Corp', 'Digital Media Co.')
      );

    RETURN jsonb_build_object(
        'user_id', p_user_id,
        'total_opportunities', total_count,
        'new_opportunities', new_count,
        'likely_sample_count', sample_count,
        'checked_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.clear_sample_opportunities TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_sample_opportunities TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_opportunities_count TO authenticated;

-- Clear all sample opportunities immediately
SELECT public.clear_all_sample_opportunities();

COMMENT ON FUNCTION public.clear_sample_opportunities IS 'Removes sample opportunities for a specific user';
COMMENT ON FUNCTION public.clear_all_sample_opportunities IS 'Removes all sample opportunities from the system';
COMMENT ON FUNCTION public.debug_opportunities_count IS 'Debug function to check opportunities count for a user';