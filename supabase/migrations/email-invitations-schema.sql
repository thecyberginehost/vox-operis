-- ================================================================
-- Email Invitations Schema Enhancement
-- Adds email functionality and status tracking to invite codes
-- ================================================================

-- Add new columns to invite_codes table for email functionality
ALTER TABLE public.invite_codes
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_company TEXT,
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'not_sent' CHECK (email_status IN ('not_sent', 'pending', 'delivered', 'failed', 'used', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for email status and recipient email for performance
CREATE INDEX IF NOT EXISTS idx_invite_codes_email_status ON public.invite_codes(email_status);
CREATE INDEX IF NOT EXISTS idx_invite_codes_recipient_email ON public.invite_codes(recipient_email);
CREATE INDEX IF NOT EXISTS idx_invite_codes_email_sent_at ON public.invite_codes(email_sent_at DESC);

-- Function to auto-expire old invite codes
CREATE OR REPLACE FUNCTION public.auto_expire_invite_codes()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired codes
    UPDATE public.invite_codes
    SET email_status = 'expired'
    WHERE expires_at < NOW()
      AND email_status NOT IN ('used', 'cancelled', 'expired')
      AND is_used = false;

    GET DIAGNOSTICS expired_count = ROW_COUNT;

    -- Log the expiry action
    INSERT INTO public.admin_logs (
        admin_id,
        admin_email,
        admin_name,
        action_type,
        action_description,
        target_resource_type,
        success
    ) VALUES (
        NULL,
        'system@vox-operis.com',
        'System',
        'system_maintenance',
        format('Auto-expired %s invite codes', expired_count),
        'invite_code',
        true
    );

    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send invite email (updates database record)
CREATE OR REPLACE FUNCTION public.send_invite_email(
    p_invite_code_id UUID,
    p_recipient_name TEXT,
    p_recipient_email TEXT,
    p_sent_by UUID,
    p_recipient_company TEXT DEFAULT NULL,
    p_custom_message TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    existing_email TEXT;
    invite_record RECORD;
    result JSONB;
BEGIN
    -- Check if email already exists for active invite codes
    SELECT recipient_email INTO existing_email
    FROM public.invite_codes
    WHERE recipient_email = p_recipient_email
      AND email_status IN ('pending', 'delivered')
      AND is_used = false
      AND expires_at > NOW()
    LIMIT 1;

    IF existing_email IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'duplicate_email',
            'message', format('Email %s already has a pending invitation', p_recipient_email)
        );
    END IF;

    -- Get invite code details
    SELECT * INTO invite_record
    FROM public.invite_codes
    WHERE id = p_invite_code_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'code_not_found',
            'message', 'Invite code not found'
        );
    END IF;

    -- Check if code is still valid
    IF invite_record.is_used OR invite_record.expires_at <= NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_code',
            'message', 'Invite code is no longer valid'
        );
    END IF;

    -- Update the invite code with recipient info and email status
    UPDATE public.invite_codes
    SET
        recipient_name = p_recipient_name,
        recipient_email = p_recipient_email,
        recipient_company = p_recipient_company,
        email_status = 'pending',
        email_sent_at = NOW(),
        email_sent_by = p_sent_by,
        notes = CASE
            WHEN notes IS NULL THEN p_custom_message
            WHEN p_custom_message IS NULL THEN notes
            ELSE notes || ' | ' || p_custom_message
        END
    WHERE id = p_invite_code_id;

    -- Return success with invite details
    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'invite_code', invite_record.code,
            'recipient_name', p_recipient_name,
            'recipient_email', p_recipient_email,
            'recipient_company', p_recipient_company,
            'expires_at', invite_record.expires_at,
            'sent_at', NOW(),
            'custom_message', p_custom_message
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update email delivery status (called by n8n webhook)
CREATE OR REPLACE FUNCTION public.update_email_status(
    p_invite_code TEXT,
    p_email_status TEXT,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    -- Validate status
    IF p_email_status NOT IN ('delivered', 'failed') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_status',
            'message', 'Status must be delivered or failed'
        );
    END IF;

    -- Update the invite code status
    UPDATE public.invite_codes
    SET
        email_status = p_email_status,
        notes = CASE
            WHEN p_error_message IS NOT NULL
            THEN COALESCE(notes, '') || ' | Email Error: ' || p_error_message
            ELSE notes
        END
    WHERE code = p_invite_code
      AND email_status = 'pending';

    GET DIAGNOSTICS updated_rows = ROW_COUNT;

    IF updated_rows = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'code_not_found',
            'message', 'Invite code not found or not in pending status'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Email status updated to %s', p_email_status)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get email invitation statistics
CREATE OR REPLACE FUNCTION public.get_email_invite_stats()
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'total_codes', COUNT(*),
            'not_sent', COUNT(*) FILTER (WHERE email_status = 'not_sent'),
            'pending', COUNT(*) FILTER (WHERE email_status = 'pending'),
            'delivered', COUNT(*) FILTER (WHERE email_status = 'delivered'),
            'failed', COUNT(*) FILTER (WHERE email_status = 'failed'),
            'used', COUNT(*) FILTER (WHERE email_status = 'used'),
            'expired', COUNT(*) FILTER (WHERE email_status = 'expired'),
            'cancelled', COUNT(*) FILTER (WHERE email_status = 'cancelled')
        )
        FROM public.invite_codes
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to automatically mark codes as used when someone registers
CREATE OR REPLACE FUNCTION public.auto_mark_code_used()
RETURNS TRIGGER AS $$
BEGIN
    -- When invite code is marked as used, update email status
    IF NEW.is_used = true AND OLD.is_used = false THEN
        NEW.email_status = 'used';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-marking codes as used
DROP TRIGGER IF EXISTS trigger_auto_mark_code_used ON public.invite_codes;
CREATE TRIGGER trigger_auto_mark_code_used
    BEFORE UPDATE ON public.invite_codes
    FOR EACH ROW
    EXECUTE FUNCTION auto_mark_code_used();

-- Create a scheduled job to auto-expire codes (requires pg_cron extension)
-- Note: This would need to be set up by database admin
-- SELECT cron.schedule('auto-expire-invite-codes', '0 * * * *', 'SELECT public.auto_expire_invite_codes();');

-- Update existing RLS policies to include new columns
DROP POLICY IF EXISTS "Admins can view all invite codes" ON public.invite_codes;
CREATE POLICY "Admins can view all invite codes" ON public.invite_codes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can manage invite codes" ON public.invite_codes;
CREATE POLICY "Admins can manage invite codes" ON public.invite_codes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Grant execute permissions on new functions to authenticated users
GRANT EXECUTE ON FUNCTION public.send_invite_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_email_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_invite_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_expire_invite_codes TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN public.invite_codes.recipient_name IS 'Full name of the person receiving the invitation';
COMMENT ON COLUMN public.invite_codes.recipient_email IS 'Email address where invitation was sent';
COMMENT ON COLUMN public.invite_codes.recipient_company IS 'Optional company name for the recipient';
COMMENT ON COLUMN public.invite_codes.email_status IS 'Current status of the email invitation';
COMMENT ON COLUMN public.invite_codes.email_sent_at IS 'Timestamp when email was sent';
COMMENT ON COLUMN public.invite_codes.email_sent_by IS 'Admin who sent the email invitation';

COMMENT ON FUNCTION public.send_invite_email IS 'Prepares invite code for email sending and prevents duplicate emails';
COMMENT ON FUNCTION public.update_email_status IS 'Updates email delivery status from external webhook (n8n)';
COMMENT ON FUNCTION public.auto_expire_invite_codes IS 'Automatically marks expired invite codes';
COMMENT ON FUNCTION public.get_email_invite_stats IS 'Returns email invitation statistics for dashboard';

-- Create sample query for testing
-- SELECT public.auto_expire_invite_codes();
-- SELECT * FROM public.get_email_invite_stats();