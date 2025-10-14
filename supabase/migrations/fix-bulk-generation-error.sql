-- ================================================================
-- Fix Bulk Generation Error - Column Reference "id" is Ambiguous
-- Explicitly specify which table's id column we want
-- ================================================================

-- Drop and recreate the generate_bulk_invite_codes function with explicit table reference
CREATE OR REPLACE FUNCTION public.generate_bulk_invite_codes(
  p_count INTEGER,
  p_created_by UUID,
  p_expires_days INTEGER DEFAULT 30,
  p_max_uses INTEGER DEFAULT 1,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(code TEXT, id UUID) AS $$
DECLARE
  i INTEGER;
  new_code TEXT;
  code_id UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Security check - limit bulk generation
  IF p_count > 1000 THEN
    RAISE EXCEPTION 'Cannot generate more than 1000 codes at once';
  END IF;

  IF p_count < 1 THEN
    RAISE EXCEPTION 'Must generate at least 1 code';
  END IF;

  expires_at := NOW() + (p_expires_days || ' days')::INTERVAL;

  FOR i IN 1..p_count LOOP
    -- Generate unique code
    LOOP
      new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
      EXIT WHEN NOT EXISTS(SELECT 1 FROM public.invite_codes WHERE invite_codes.code = new_code);
    END LOOP;

    -- Insert new invite code with explicit table qualification in RETURNING clause
    INSERT INTO public.invite_codes (
      code, created_by, is_used, expires_at, max_uses, current_uses, notes, email_status
    ) VALUES (
      new_code, p_created_by, false, expires_at, p_max_uses, 0, p_notes, 'not_sent'
    ) RETURNING invite_codes.id INTO code_id;

    RETURN QUERY SELECT new_code, code_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION public.generate_bulk_invite_codes IS 'Securely generates multiple invite codes with limits and proper email status initialization';

-- Test the function (optional - remove these lines if you don't want to test)
-- SELECT * FROM public.generate_bulk_invite_codes(1, '78805394-3060-4447-b5e2-10b3d00cd636', 30, 1, 'Test batch');