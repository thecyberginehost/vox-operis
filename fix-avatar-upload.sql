-- Quick fix for avatar RLS policy
-- Run this directly in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar files are publicly accessible" ON storage.objects;

-- Create new policies that work with both folder structure and direct uploads
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    name LIKE (auth.uid()::text || '-%')
    OR
    name ~ ('^' || auth.uid()::text || '\.')
  )
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    name LIKE (auth.uid()::text || '-%')
    OR
    name ~ ('^' || auth.uid()::text || '\.')
  )
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    name LIKE (auth.uid()::text || '-%')
    OR
    name ~ ('^' || auth.uid()::text || '\.')
  )
);

CREATE POLICY "Avatar files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Ensure the avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
