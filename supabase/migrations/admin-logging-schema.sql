-- ================================================================
-- Admin Logging System Database Schema
-- Run this in your Supabase SQL Editor
-- ================================================================

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  admin_name TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'invite_code_generated',
    'invite_code_deleted',
    'user_role_changed',
    'user_profile_updated',
    'admin_login',
    'admin_logout',
    'bulk_invite_generated',
    'system_settings_changed'
  )),
  action_description TEXT NOT NULL,
  target_resource_type TEXT CHECK (target_resource_type IN (
    'invite_code',
    'user_profile',
    'system_setting',
    'admin_session'
  )),
  target_resource_id TEXT, -- Can be UUID or other identifier
  target_resource_details JSONB, -- Store additional context
  metadata JSONB, -- Store extra action-specific data
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type ON public.admin_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_resource ON public.admin_logs(target_resource_type, target_resource_id);

-- RLS Policies for admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all logs" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON profiles.id = auth.users.id
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow inserts for logging (system will handle this)
CREATE POLICY "Allow log inserts" ON public.admin_logs
  FOR INSERT WITH CHECK (true);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_admin_email TEXT,
  p_admin_name TEXT,
  p_action_type TEXT,
  p_action_description TEXT,
  p_target_resource_type TEXT DEFAULT NULL,
  p_target_resource_id TEXT DEFAULT NULL,
  p_target_resource_details JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.admin_logs (
    admin_id,
    admin_email,
    admin_name,
    action_type,
    action_description,
    target_resource_type,
    target_resource_id,
    target_resource_details,
    metadata,
    ip_address,
    user_agent,
    success,
    error_message
  ) VALUES (
    p_admin_id,
    p_admin_email,
    p_admin_name,
    p_action_type,
    p_action_description,
    p_target_resource_type,
    p_target_resource_id,
    p_target_resource_details,
    p_metadata,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent admin activity summary
CREATE OR REPLACE FUNCTION public.get_admin_activity_summary(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  action_type TEXT,
  action_count BIGINT,
  unique_admins BIGINT,
  latest_action TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.action_type,
    COUNT(*) as action_count,
    COUNT(DISTINCT al.admin_id) as unique_admins,
    MAX(al.created_at) as latest_action
  FROM public.admin_logs al
  WHERE al.created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND al.success = true
  GROUP BY al.action_type
  ORDER BY action_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the logging function
SELECT public.log_admin_action(
  '78805394-3060-4447-b5e2-10b3d00cd636',
  'anthony@vox-operis.com',
  'Anthony',
  'system_settings_changed',
  'Admin logging system initialized',
  'system_setting',
  'logging_system',
  '{"component": "admin_logging", "version": "1.0"}'::jsonb,
  '{"initialization": true, "tables_created": ["admin_logs"], "functions_created": ["log_admin_action", "get_admin_activity_summary"]}'::jsonb
);

-- Show the test log entry
SELECT
  admin_name,
  action_type,
  action_description,
  target_resource_type,
  created_at
FROM public.admin_logs
ORDER BY created_at DESC
LIMIT 5;

COMMENT ON TABLE public.admin_logs IS 'Audit trail for all administrative actions';
COMMENT ON FUNCTION public.log_admin_action IS 'Logs admin actions with full context and metadata';
COMMENT ON FUNCTION public.get_admin_activity_summary IS 'Returns summary statistics of admin activity';