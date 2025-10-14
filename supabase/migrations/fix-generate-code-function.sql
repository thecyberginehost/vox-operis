-- ================================================================
-- Fix the generate_invite_code function naming conflict
-- Run this in Supabase SQL Editor
-- ================================================================

-- Drop and recreate the function with fixed variable names
DROP FUNCTION IF EXISTS public.generate_invite_code();

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    new_code := upper(substring(md5(random()::text) from 1 for 8));

    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.invite_codes
      WHERE invite_codes.code = new_code
    ) INTO code_exists;

    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT public.generate_invite_code() as generated_code;