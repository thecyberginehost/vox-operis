# Supabase GPT-5 Integration Setup Guide

This guide will help you set up the GPT-5 powered VO Transcript Copilot feature using Supabase Edge Functions.

## Prerequisites

1. **Supabase CLI**: Install from https://supabase.com/docs/guides/cli
2. **Your GPT-5 API Key**: Get this from OpenAI
3. **Supabase Project**: You should already have this configured

## Setup Steps

### 1. Install Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to your existing project

```bash
supabase link --project-ref vqwroeglrokmqvixiudb
```

### 4. Set up the database schema

Run the following SQL in your Supabase dashboard or via CLI:

```bash
supabase db reset --local
psql -h localhost -p 54322 -d postgres -U postgres -f script-generations-schema.sql
```

Or manually run the SQL from `script-generations-schema.sql` in your Supabase SQL editor.

### 5. Configure Environment Variables

In your Supabase project dashboard:

1. Go to **Settings → API → Environment Variables**
2. Add the following environment variable:

```
OPENAI_API_KEY=your_actual_gpt5_api_key_here
```

**Important**: Replace `your_actual_gpt5_api_key_here` with your real GPT-5 API key.

### 6. Deploy the Edge Function

```bash
# Deploy the generate-vo-script function
supabase functions deploy generate-vo-script
```

### 7. Update your local .env file

Replace the placeholder in your `.env` file:

```env
# Replace this line:
OPENAI_API_KEY=your_gpt5_api_key_here

# With your actual API key:
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Testing the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the Script Copilot**:
   - Go to `http://localhost:8090/dashboard/copilot`
   - Upload a resume or paste resume text
   - Choose your preferences
   - Click "Generate My Script with AI"

3. **Check the browser console** for debugging information during generation

## Troubleshooting

### Common Issues:

1. **"OpenAI API key not configured"**:
   - Ensure you've set the `OPENAI_API_KEY` in your Supabase project environment variables
   - Redeploy the edge function after setting the environment variable

2. **"User must be authenticated"**:
   - Make sure you're logged in to the app
   - Check that your Supabase session is valid

3. **"Failed to generate script"**:
   - Check the Supabase function logs: `supabase functions logs generate-vo-script`
   - Verify your OpenAI API key is valid and has credits
   - Check if you're hitting rate limits

4. **CORS errors**:
   - The edge function includes CORS headers, but if you encounter issues, check your Supabase project settings

### Debug Commands:

```bash
# View function logs
supabase functions logs generate-vo-script

# Test the function locally
supabase start
supabase functions serve generate-vo-script

# Check function status
supabase functions list
```

## API Usage Monitoring

The integration includes usage tracking in the `script_generations` table. You can monitor:

- Number of scripts generated
- Popular script types and lengths
- User engagement with the feature

Query example:
```sql
SELECT
  script_type,
  COUNT(*) as total_generated,
  AVG(word_count) as avg_words
FROM script_generations
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY script_type;
```

## Cost Considerations

- Each script generation makes 2 OpenAI API calls (one for resume extraction, one for script generation)
- Approximate cost: $0.01-0.05 per script depending on resume length and script complexity
- Consider implementing usage limits for free tier users

## Security Notes

- API keys are stored securely in Supabase environment variables
- All functions use Row Level Security (RLS)
- Users can only access their own generated scripts
- Resume text is stored but can be purged based on your data retention policy

## Next Steps

1. **Monitor usage**: Check the `script_generation_stats` view for analytics
2. **Set up alerts**: Configure Supabase to alert on high usage
3. **Consider caching**: For frequently used resume patterns, consider caching extracted info
4. **A/B test**: Try different prompts for different user segments

## Support

If you encounter issues:
1. Check the Supabase function logs
2. Verify your OpenAI API key and credits
3. Test with a simple resume first
4. Check the browser network tab for API call details