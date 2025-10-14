-- Fix RLS policies for avatar uploads
-- The issue is that the policy expects a folder structure like: userId/filename
-- But the code might be uploading directly to the bucket root

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar files are publicly accessible" ON storage.objects;

-- Create new policies that work with both folder structure and direct uploads
-- Policy 1: Allow INSERT if filename starts with user's ID OR if in user's folder
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND (
    -- Check if file is in user's folder (e.g., userId/filename.jpg)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Check if filename starts with user's ID (e.g., userId-timestamp.jpg)
    name LIKE (auth.uid()::text || '-%')
    OR
    -- Allow direct upload with just user ID as filename
    name = auth.uid()::text || '.jpg'
    OR
    name = auth.uid()::text || '.png'
    OR
    name = auth.uid()::text || '.jpeg'
    OR
    name = auth.uid()::text || '.webp'
  )
);

-- Policy 2: Allow UPDATE for user's own files
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    name LIKE (auth.uid()::text || '-%')
    OR
    name LIKE (auth.uid()::text || '.%')
  )
);

-- Policy 3: Allow DELETE for user's own files
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    name LIKE (auth.uid()::text || '-%')
    OR
    name LIKE (auth.uid()::text || '.%')
  )
);

-- Policy 4: Allow public read access to all avatar files
CREATE POLICY "Avatar files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Ensure the avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
