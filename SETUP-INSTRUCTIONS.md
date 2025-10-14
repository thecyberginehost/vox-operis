# Vox Operis - Supabase Setup Instructions

## 1. Database Schema Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and run the entire `supabase-schema.sql` file to create all tables, functions, and policies

## 2. First Admin User Setup

### Option A: If you haven't created the admin user yet
1. First, sign up with email `anthony@vox-operis.com` using any temporary password through the app
2. After signup, go to **Authentication** > **Users** in Supabase dashboard
3. Find the user and copy their UUID
4. Update the `setup-first-admin.sql` file with the correct UUID if different
5. Run the `setup-first-admin.sql` in the SQL Editor

### Option B: If the user already exists with the specified UUID
1. Simply run the `setup-first-admin.sql` file in the SQL Editor
2. This will:
   - Set the user as admin
   - Create initial invite codes for testing

## 3. Test the System

### Testing Registration Flow
1. Go to your app at `http://localhost:3001`
2. Click "Get Started" → "Sign Up"
3. Use one of the test invite codes:
   - `ADMIN001` (expires in 90 days)
   - `BETA001`, `BETA002`, `BETA003` (expire in 30 days)
4. Complete registration with a test email

### Testing Admin Functions
1. Sign in with `anthony@vox-operis.com`
2. You should see "Administrator" in the top-right profile area
3. Navigate to **Admin Panel** in the sidebar
4. Test generating new invite codes
5. Test managing users and roles

## 4. Production Considerations

### Security
- Remove the test invite codes before production
- Set up email confirmation requirements in Supabase Auth settings
- Configure proper email templates
- Set up custom domain for auth redirects

### OAuth Setup (Optional)
1. Go to **Authentication** > **Settings** > **Auth Providers**
2. Enable Google and/or LinkedIn OAuth
3. Add your OAuth app credentials
4. Configure redirect URLs

### Row Level Security
- All RLS policies are already set up
- Users can only see their own data
- Admins can manage all users and invite codes

## File Structure Created

```
src/
├── components/
│   ├── Auth.tsx (updated with invite code validation)
│   ├── Dashboard.tsx (updated with admin panel)
│   └── AdminPanel.tsx (new admin interface)
├── hooks/
│   ├── useAuth.ts (updated with metadata support)
│   ├── useProfile.ts (new profile management)
│   └── useInviteCodes.ts (new invite code management)
├── lib/
│   └── supabase.ts (updated with typed database)
└── types/
    └── database.ts (new TypeScript types)
```

## Troubleshooting

### If you see "Missing Supabase environment variables"
- Check that your `.env` file has the correct values
- Make sure the server restarted after updating `.env`

### If admin panel doesn't appear
- Verify the user has `role = 'admin'` in the profiles table
- Check browser console for any errors

### If invite codes don't work
- Verify the invite_codes table was created
- Check that RLS policies allow public read for unused codes
- Ensure the validation function was created correctly

### If profile data doesn't show
- Check that the profiles trigger is working
- Verify the user has a record in the profiles table
- Check the handle_new_user() function was created