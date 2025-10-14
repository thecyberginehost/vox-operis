-- ================================================================
-- Fix Existing User Profile (run this before setup-first-admin.sql)
-- ================================================================

-- Manually create the profile for the existing user
-- This is needed because the user was created before the trigger existed
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '78805394-3060-4447-b5e2-10b3d00cd636',
  'anthony@vox-operis.com',
  'Anthony', -- Update this with the actual name if different
  'user' -- Will be changed to admin in the next step
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Verify the profile was created
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE id = '78805394-3060-4447-b5e2-10b3d00cd636';