-- Add ai_credits column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'ai_credits'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN ai_credits INTEGER DEFAULT 10;

        COMMENT ON COLUMN public.profiles.ai_credits IS 'Number of AI credits available for enhancements';

        -- Give existing users 10 free credits
        UPDATE public.profiles SET ai_credits = 10 WHERE ai_credits IS NULL;
    END IF;
END $$;
