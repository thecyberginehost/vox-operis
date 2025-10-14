-- ================================================================
-- Fix Admin Logs RLS Policy
-- The current policy has incorrect table references
-- ================================================================

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Admins can view all logs" ON public.admin_logs;

-- Create a simpler policy that just checks the user's profile role
-- This avoids the complex join that was causing the permission error
CREATE POLICY "Admins can view all logs" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Test the policy by trying to select from admin_logs
-- This should work now for admin users
SELECT COUNT(*) as total_logs FROM public.admin_logs;

-- Show recent logs to verify access
SELECT
  admin_name,
  action_type,
  action_description,
  created_at
FROM public.admin_logs
ORDER BY created_at DESC
LIMIT 5;