-- Create storage bucket for VO recordings if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('vo-recordings', 'vo-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policy for VO recordings
CREATE POLICY "Users can upload their own VO recordings" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'vo-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "VO recordings are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'vo-recordings');