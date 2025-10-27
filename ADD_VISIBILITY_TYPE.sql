-- Add visibility_type column to vo_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vo_profiles'
        AND column_name = 'visibility_type'
    ) THEN
        ALTER TABLE public.vo_profiles
        ADD COLUMN visibility_type TEXT DEFAULT 'public' CHECK (visibility_type IN ('public', 'job-specific'));

        COMMENT ON COLUMN public.vo_profiles.visibility_type IS 'Determines if VO is publicly searchable or job-specific';
    END IF;
END $$;
