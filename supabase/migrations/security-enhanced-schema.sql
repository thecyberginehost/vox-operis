-- ================================================================
-- Security-Enhanced Database Schema for Vox Operis
-- Implements cybersecurity best practices with comprehensive protections
-- ================================================================

-- Create security_logs table for monitoring
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'failed_login',
    'suspicious_activity',
    'rate_limit_exceeded',
    'invalid_token',
    'unauthorized_access',
    'sql_injection_attempt',
    'xss_attempt',
    'idor_attempt',
    'brute_force_attempt',
    'privilege_escalation_attempt'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  request_method TEXT,
  request_payload JSONB,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_settings table for configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'array')),
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- Only public settings can be read by non-admins
  is_sensitive BOOLEAN DEFAULT FALSE, -- Sensitive settings are never returned in full
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_admin_session BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics tables
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  total_users INTEGER DEFAULT 0,
  new_registrations INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  admin_users INTEGER DEFAULT 0,
  invite_codes_generated INTEGER DEFAULT 0,
  invite_codes_used INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  security_incidents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Enhanced invite_codes table with security features
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1;
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS created_by_ip INET;
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS used_by_ip INET;
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS notes TEXT;

-- Enhanced profiles table with security tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_ip INET;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Create indexes for performance and security monitoring
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON public.security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON public.user_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_failed_logins ON public.profiles(failed_login_count) WHERE failed_login_count > 0;

-- RLS Policies for new tables
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Security logs - only admins can view
CREATE POLICY "Admins can view security logs" ON public.security_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "System can insert security logs" ON public.security_logs
  FOR INSERT WITH CHECK (true);

-- System settings - admins can manage, users can read public ones
CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Users can read public settings" ON public.system_settings
  FOR SELECT USING (is_public = true);

-- User sessions - users can view own sessions, admins can view all
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "System can manage sessions" ON public.user_sessions
  FOR ALL WITH CHECK (true);

-- Analytics - only admins can view
CREATE POLICY "Admins can view analytics" ON public.user_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Security functions
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_request_path TEXT DEFAULT NULL,
  p_request_method TEXT DEFAULT NULL,
  p_request_payload JSONB DEFAULT NULL,
  p_blocked BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_logs (
    user_id, event_type, severity, description, ip_address,
    user_agent, request_path, request_method, request_payload, blocked
  ) VALUES (
    p_user_id, p_event_type, p_severity, p_description, p_ip_address,
    p_user_agent, p_request_path, p_request_method, p_request_payload, p_blocked
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Input sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove potential XSS and SQL injection patterns
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;

  -- Basic sanitization - remove script tags, SQL keywords, etc.
  input_text := regexp_replace(input_text, '<script[^>]*>.*?</script>', '', 'gi');
  input_text := regexp_replace(input_text, '<[^>]*>', '', 'g');
  input_text := regexp_replace(input_text, '(union|select|insert|update|delete|drop|create|alter|exec|execute)\s', '', 'gi');
  input_text := trim(input_text);

  -- Length limit
  IF length(input_text) > 1000 THEN
    input_text := substring(input_text FROM 1 FOR 1000);
  END IF;

  RETURN input_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk invite code generation function
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

    INSERT INTO public.invite_codes (
      code, created_by, is_used, expires_at, max_uses, current_uses, notes
    ) VALUES (
      new_code, p_created_by, false, expires_at, p_max_uses, 0, p_notes
    ) RETURNING id INTO code_id;

    RETURN QUERY SELECT new_code, code_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User search function with security
CREATE OR REPLACE FUNCTION public.search_users_secure(
  p_search_term TEXT DEFAULT NULL,
  p_role_filter TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Sanitize input
  p_search_term := public.sanitize_input(p_search_term);

  -- Limit results for performance
  IF p_limit > 100 THEN
    p_limit := 100;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.is_active,
    p.last_login_at,
    p.created_at
  FROM public.profiles p
  WHERE
    (p_search_term IS NULL OR
     p.email ILIKE '%' || p_search_term || '%' OR
     p.full_name ILIKE '%' || p_search_term || '%')
    AND (p_role_filter IS NULL OR p.role = p_role_filter)
    AND (p_status_filter = 'all' OR
         (p_status_filter = 'active' AND p.is_active = true) OR
         (p_status_filter = 'inactive' AND p.is_active = false))
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Analytics aggregation function
CREATE OR REPLACE FUNCTION public.calculate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
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
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.profiles WHERE DATE(created_at) = target_date),
    (SELECT COUNT(*) FROM public.profiles WHERE DATE(last_login_at) = target_date),
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin'),
    (SELECT COUNT(*) FROM public.invite_codes WHERE DATE(created_at) = target_date),
    (SELECT COUNT(*) FROM public.invite_codes WHERE DATE(used_at) = target_date AND is_used = true),
    (SELECT COUNT(*) FROM public.security_logs WHERE DATE(created_at) = target_date AND event_type = 'failed_login'),
    (SELECT COUNT(*) FROM public.security_logs WHERE DATE(created_at) = target_date AND severity IN ('high', 'critical'))
  )
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_registrations = EXCLUDED.new_registrations,
    active_users = EXCLUDED.active_users,
    admin_users = EXCLUDED.admin_users,
    invite_codes_generated = EXCLUDED.invite_codes_generated,
    invite_codes_used = EXCLUDED.invite_codes_used,
    failed_login_attempts = EXCLUDED.failed_login_attempts,
    security_incidents = EXCLUDED.security_incidents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize some default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('app_name', '"Vox Operis"', 'string', 'Application name', true),
('max_invite_codes_per_batch', '100', 'number', 'Maximum invite codes that can be generated at once', false),
('invite_code_default_expiry_days', '30', 'number', 'Default expiry days for new invite codes', false),
('failed_login_threshold', '5', 'number', 'Number of failed logins before account lockout', false),
('lockout_duration_minutes', '30', 'number', 'Account lockout duration in minutes', false),
('enable_security_monitoring', 'true', 'boolean', 'Enable security event monitoring', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Create initial analytics entry
SELECT public.calculate_daily_analytics(CURRENT_DATE);

COMMENT ON TABLE public.security_logs IS 'Security event monitoring and threat detection';
COMMENT ON TABLE public.system_settings IS 'System configuration with role-based access';
COMMENT ON TABLE public.user_sessions IS 'Active user session tracking';
COMMENT ON TABLE public.user_analytics IS 'Daily analytics and reporting data';
COMMENT ON FUNCTION public.log_security_event IS 'Logs security events for monitoring and analysis';
COMMENT ON FUNCTION public.sanitize_input IS 'Sanitizes user input to prevent XSS and SQL injection';
COMMENT ON FUNCTION public.generate_bulk_invite_codes IS 'Securely generates multiple invite codes with limits';
COMMENT ON FUNCTION public.search_users_secure IS 'Secure user search with input sanitization and limits';