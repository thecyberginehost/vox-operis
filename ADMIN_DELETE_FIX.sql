-- ================================================================
-- ADMIN DELETE POLICIES FIX
-- Run this in Supabase SQL Editor to enable user deletion
-- ================================================================

-- STEP 1: Add delete policies for profiles table
-- ================================================================

-- Drop existing delete policies if they exist
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can delete profiles" ON public.profiles;

-- Allow service role (Supabase dashboard) to delete profiles
-- This fixes the "not valid JSON" error you're getting
CREATE POLICY "Service role can delete profiles" ON public.profiles
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Also allow admin users to delete profiles from the app
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- STEP 2: Set up cascade deletion for related tables
-- ================================================================
-- This ensures when you delete a profile, all related data is cleaned up

-- VO Profiles - cascade delete
DO $$
BEGIN
  ALTER TABLE IF EXISTS public.vo_profiles
    DROP CONSTRAINT IF EXISTS vo_profiles_user_id_fkey;

  ALTER TABLE public.vo_profiles
    ADD CONSTRAINT vo_profiles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Candidate Details - cascade delete
DO $$
BEGIN
  ALTER TABLE IF EXISTS public.candidate_details
    DROP CONSTRAINT IF EXISTS candidate_details_user_id_fkey;

  ALTER TABLE public.candidate_details
    ADD CONSTRAINT candidate_details_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Script Generations - cascade delete
DO $$
BEGIN
  ALTER TABLE IF EXISTS public.script_generations
    DROP CONSTRAINT IF EXISTS script_generations_user_id_fkey;

  ALTER TABLE public.script_generations
    ADD CONSTRAINT script_generations_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- User Subscriptions - cascade delete
DO $$
BEGIN
  ALTER TABLE IF EXISTS public.user_subscriptions
    DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;

  ALTER TABLE public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Admin Logs - set admin_id to NULL when admin is deleted
DO $$
BEGIN
  ALTER TABLE IF EXISTS public.admin_logs
    DROP CONSTRAINT IF EXISTS admin_logs_admin_id_fkey;

  ALTER TABLE public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey
    FOREIGN KEY (admin_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Email Invitations - set invited_by to NULL when inviter is deleted
DO $$
BEGIN
  ALTER TABLE IF EXISTS public.email_invitations
    DROP CONSTRAINT IF EXISTS email_invitations_invited_by_fkey;

  ALTER TABLE public.email_invitations
    ADD CONSTRAINT email_invitations_invited_by_fkey
    FOREIGN KEY (invited_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Profile deactivated_by - set to NULL when deactivating admin is deleted
DO $$
BEGIN
  ALTER TABLE IF EXISTS public.profiles
    DROP CONSTRAINT IF EXISTS profiles_deactivated_by_fkey;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_deactivated_by_fkey
    FOREIGN KEY (deactivated_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
END $$;

-- ================================================================
-- STEP 3: Create helper function for complete user deletion
-- ================================================================
-- This function deletes from both profiles AND auth.users tables

CREATE OR REPLACE FUNCTION delete_user_completely(user_id_to_delete UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requesting_user_id UUID;
  is_admin BOOLEAN;
  result json;
BEGIN
  -- Get the current user ID
  requesting_user_id := auth.uid();

  -- Check if requesting user is an admin
  SELECT (role = 'admin') INTO is_admin
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

  -- Return success message
  result := json_build_object(
    'success', true,
    'message', 'User deleted successfully',
    'deleted_user_id', user_id_to_delete
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error message
    result := json_build_object(
      'success', false,
      'message', SQLERRM
    );
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_user_completely IS 'Completely deletes a user from both profiles and auth.users tables. Only admins can execute. Prevents self-deletion.';

-- ================================================================
-- DONE!
-- ================================================================
-- After running this script:
-- 1. You can now delete users directly from the Supabase dashboard
-- 2. All related data will be automatically cleaned up
-- 3. You can also use the delete_user_completely() function from your app
-- ================================================================
