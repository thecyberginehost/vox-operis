-- Add cv_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.cv_url IS 'URL to user CV/Resume document (PDF or DOCX)';

-- Create storage bucket for profile documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-documents', 'profile-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile-documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = 'cvs' AND auth.uid()::text = (regexp_match((storage.foldername(name))[2], '^([^-]+)'))[1]);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = 'cvs' AND auth.uid()::text = (regexp_match((storage.foldername(name))[2], '^([^-]+)'))[1]);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = 'cvs' AND auth.uid()::text = (regexp_match((storage.foldername(name))[2], '^([^-]+)'))[1]);

CREATE POLICY "Anyone can view documents" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-documents');
