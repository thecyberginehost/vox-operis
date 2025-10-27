-- Create table for VO enhancement results
CREATE TABLE IF NOT EXISTS public.vo_enhancements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vo_profile_id UUID NOT NULL REFERENCES public.vo_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transcription TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS vo_enhancements_vo_profile_id_idx ON public.vo_enhancements(vo_profile_id);
CREATE INDEX IF NOT EXISTS vo_enhancements_user_id_idx ON public.vo_enhancements(user_id);
CREATE INDEX IF NOT EXISTS vo_enhancements_created_at_idx ON public.vo_enhancements(created_at DESC);

-- Enable RLS
ALTER TABLE public.vo_enhancements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own enhancements"
  ON public.vo_enhancements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enhancements"
  ON public.vo_enhancements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage enhancements"
  ON public.vo_enhancements
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE public.vo_enhancements IS 'Stores AI-powered enhancement analysis results for VO profiles';
