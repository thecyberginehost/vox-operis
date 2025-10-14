-- Create script_generations table for tracking AI-generated VO scripts
CREATE TABLE IF NOT EXISTS script_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    script_type TEXT NOT NULL CHECK (script_type IN ('professional', 'conversational', 'enthusiastic', 'storytelling')),
    target_audience TEXT NOT NULL CHECK (target_audience IN ('business', 'creative', 'tech', 'general')),
    script_length TEXT NOT NULL CHECK (script_length IN ('1min', '2min', '3min', '5min')),
    word_count INTEGER,
    resume_text TEXT,
    generated_script TEXT,
    extracted_info JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_script_generations_user_id ON script_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_script_generations_created_at ON script_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_script_generations_script_type ON script_generations(script_type);

-- Enable Row Level Security
ALTER TABLE script_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own script generations"
    ON script_generations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own script generations"
    ON script_generations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own script generations"
    ON script_generations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own script generations"
    ON script_generations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_script_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_script_generations_updated_at
    BEFORE UPDATE ON script_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_script_generations_updated_at();

-- Grant necessary permissions
GRANT ALL ON script_generations TO authenticated;
GRANT ALL ON script_generations TO service_role;

-- Create a view for script generation analytics (optional)
CREATE OR REPLACE VIEW script_generation_stats AS
SELECT
    script_type,
    target_audience,
    script_length,
    COUNT(*) as generation_count,
    AVG(word_count) as avg_word_count,
    DATE_TRUNC('day', created_at) as generation_date
FROM script_generations
GROUP BY script_type, target_audience, script_length, DATE_TRUNC('day', created_at)
ORDER BY generation_date DESC;

-- Grant access to the view
GRANT SELECT ON script_generation_stats TO authenticated;
GRANT SELECT ON script_generation_stats TO service_role;