-- ================================================================
-- Setup First Admin User for Vox Operis
-- Run this after creating the first user account
-- ================================================================

-- Update the specific user to be an admin
-- Replace with the actual user ID after signup
UPDATE public.profiles
SET role = 'admin'
WHERE id = '78805394-3060-4447-b5e2-10b3d00cd636'
  AND email = 'anthony@vox-operis.com';

-- Verify the admin user was set up correctly
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE id = '78805394-3060-4447-b5e2-10b3d00cd636';

-- Generate the first invite code for testing
INSERT INTO public.invite_codes (code, created_by, is_used, expires_at)
VALUES (
  'ADMIN001',
  '78805394-3060-4447-b5e2-10b3d00cd636',
  false,
  NOW() + INTERVAL '90 days'
);

-- Optional: Create a few more test invite codes
INSERT INTO public.invite_codes (code, created_by, is_used, expires_at)
VALUES
  ('BETA001', '78805394-3060-4447-b5e2-10b3d00cd636', false, NOW() + INTERVAL '30 days'),
  ('BETA002', '78805394-3060-4447-b5e2-10b3d00cd636', false, NOW() + INTERVAL '30 days'),
  ('BETA003', '78805394-3060-4447-b5e2-10b3d00cd636', false, NOW() + INTERVAL '30 days');

-- Show all invite codes
SELECT code, is_used, expires_at, created_at
FROM public.invite_codes
ORDER BY created_at DESC;