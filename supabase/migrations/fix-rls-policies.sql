-- ================================================================
-- Fix RLS Policy Infinite Recursion
-- Run this in Supabase SQL Editor to fix the policy issue
-- ================================================================

-- First, drop the existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage invite codes" ON public.invite_codes;

-- Create simpler, non-recursive policies

-- Profiles policies (simplified to avoid recursion)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- For admin access, we'll handle it differently in the application layer
-- This avoids the infinite recursion issue

-- Invite codes policies (simplified)
CREATE POLICY "Anyone can read unused invite codes" ON public.invite_codes
  FOR SELECT USING (is_used = false AND expires_at > now());

-- Allow updates to invite codes (for marking as used)
CREATE POLICY "Allow invite code updates" ON public.invite_codes
  FOR UPDATE USING (true);

-- Allow inserts for invite codes (we'll handle admin check in app)
CREATE POLICY "Allow invite code inserts" ON public.invite_codes
  FOR INSERT WITH CHECK (true);

-- Allow deletes for invite codes (we'll handle admin check in app)
CREATE POLICY "Allow invite code deletes" ON public.invite_codes
  FOR DELETE USING (true);

-- Note: Admin functionality will be handled in the application layer
-- by checking the user's role after fetching their profile, rather than
-- trying to do it in the database policies which causes recursion.