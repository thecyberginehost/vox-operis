-- ================================================================
-- Admin Delete Policies for User Management
-- Allows admins to delete users from profiles table
-- ================================================================

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create delete policy for admins
-- This allows users with admin role to delete any profile
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Also add a policy to allow service role (Supabase dashboard) to delete
-- This is needed when deleting directly from Supabase dashboard
CREATE POLICY "Service role can delete profiles" ON public.profiles
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ================================================================
-- Cascade Delete Setup
-- Ensure related data is properly cleaned up when a profile is deleted
-- ================================================================

-- Drop existing foreign key constraints if they exist and recreate with CASCADE
-- This ensures that when a profile is deleted, all related data is also deleted

-- VO Profiles
ALTER TABLE IF EXISTS public.vo_profiles
  DROP CONSTRAINT IF EXISTS vo_profiles_user_id_fkey;

ALTER TABLE public.vo_profiles
  ADD CONSTRAINT vo_profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Candidate Details
ALTER TABLE IF EXISTS public.candidate_details
  DROP CONSTRAINT IF EXISTS candidate_details_user_id_fkey;

ALTER TABLE public.candidate_details
  ADD CONSTRAINT candidate_details_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Admin Logs (deactivated_by reference should set to NULL, not cascade)
ALTER TABLE IF EXISTS public.admin_logs
  DROP CONSTRAINT IF EXISTS admin_logs_admin_user_id_fkey;

ALTER TABLE public.admin_logs
  ADD CONSTRAINT admin_logs_admin_user_id_fkey
  FOREIGN KEY (admin_user_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- Email Invitations (invited_by should set to NULL)
ALTER TABLE IF EXISTS public.email_invitations
  DROP CONSTRAINT IF EXISTS email_invitations_invited_by_fkey;

ALTER TABLE public.email_invitations
  ADD CONSTRAINT email_invitations_invited_by_fkey
  FOREIGN KEY (invited_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- Script Generations
ALTER TABLE IF EXISTS public.script_generations
  DROP CONSTRAINT IF EXISTS script_generations_user_id_fkey;

ALTER TABLE public.script_generations
  ADD CONSTRAINT script_generations_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- User Subscriptions
ALTER TABLE IF EXISTS public.user_subscriptions
  DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;

ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Profile deactivated_by should set to NULL (admin who deactivated may be deleted)
ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_deactivated_by_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_deactivated_by_fkey
  FOREIGN KEY (deactivated_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- ================================================================
-- Create helper function to delete user completely
-- Deletes from auth.users table as well
-- ================================================================

CREATE OR REPLACE FUNCTION delete_user_completely(user_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requesting_user_id UUID;
  is_admin BOOLEAN;
BEGIN
  -- Get the current user ID
  requesting_user_id := auth.uid();

  -- Check if requesting user is an admin
  SELECT role = 'admin' INTO is_admin
  FROM public.profiles
  WHERE id = requesting_user_id;

  -- Only admins can delete users
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;

  -- Prevent admins from deleting themselves
  IF user_id_to_delete = requesting_user_id THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  -- Delete from profiles table first (this will cascade to related tables)
  DELETE FROM public.profiles WHERE id = user_id_to_delete;

  -- Delete from auth.users table (requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = user_id_to_delete;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_user_completely IS 'Completely deletes a user from both profiles and auth.users tables. Only admins can execute. Prevents self-deletion.';
