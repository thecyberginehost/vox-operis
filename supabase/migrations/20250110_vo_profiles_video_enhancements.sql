-- ================================================================
-- Migration: VO Profiles Video Storage Enhancements
-- Date: 2025-01-10
-- Adds video-specific fields to vo_profiles table
-- ================================================================

-- Add new columns to vo_profiles table
ALTER TABLE public.vo_profiles
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS recording_type TEXT DEFAULT 'video' CHECK (recording_type IN ('video', 'audio')),
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS recording_style TEXT CHECK (recording_style IN ('professional', 'conversational', 'creative'));

-- Update existing records to have recording_type based on existing audio_file_url
UPDATE public.vo_profiles
SET recording_type = CASE
    WHEN audio_file_url IS NOT NULL THEN 'audio'
    ELSE 'video'
END
WHERE recording_type IS NULL;

-- Migrate existing audio_file_url to video_url for backwards compatibility
-- (assuming most existing "audio" files might actually be videos)
UPDATE public.vo_profiles
SET video_url = audio_file_url
WHERE video_url IS NULL AND audio_file_url IS NOT NULL;

-- Create index for faster queries by recording type
CREATE INDEX IF NOT EXISTS idx_vo_profiles_recording_type ON public.vo_profiles(recording_type);
CREATE INDEX IF NOT EXISTS idx_vo_profiles_video_url ON public.vo_profiles(video_url) WHERE video_url IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.vo_profiles.video_url IS 'URL to the video recording file in storage';
COMMENT ON COLUMN public.vo_profiles.thumbnail_url IS 'URL to the video thumbnail image';
COMMENT ON COLUMN public.vo_profiles.recording_type IS 'Type of recording: video (video+audio) or audio (audio only)';
COMMENT ON COLUMN public.vo_profiles.duration_seconds IS 'Duration of the recording in seconds';
COMMENT ON COLUMN public.vo_profiles.file_size_bytes IS 'File size in bytes for storage tracking';
COMMENT ON COLUMN public.vo_profiles.recording_style IS 'Presentation style: professional, conversational, or creative';

-- Update the get_user_vo_profiles function to include new fields
CREATE OR REPLACE FUNCTION public.get_user_vo_profiles(p_user_id UUID)
RETURNS SETOF public.vo_profiles AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.vo_profiles
    WHERE user_id = p_user_id
    ORDER BY updated_at DESC, created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON public.vo_profiles TO authenticated;
GRANT INSERT ON public.vo_profiles TO authenticated;
GRANT UPDATE ON public.vo_profiles TO authenticated;
GRANT DELETE ON public.vo_profiles TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'VO Profiles table successfully enhanced with video-specific fields';
END $$;
