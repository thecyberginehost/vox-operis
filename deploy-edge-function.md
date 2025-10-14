# 🚀 Deploy GPT-5 Edge Function to Supabase

## Prerequisites

✅ Supabase CLI is installed (done)
✅ Edge function files are created (done)
✅ Database schema is ready (done)

## Step 1: Login to Supabase

Open your terminal in this project directory and run:

```bash
npx supabase login
```

This will open your browser for authentication.

## Step 2: Link to Your Project

```bash
npx supabase link --project-ref vqwroeglrokmqvixiudb
```

## Step 3: Deploy Database Schema

```bash
# Apply the database schema
npx supabase db push
```

Or run the SQL manually in your Supabase dashboard by copying the contents of `script-generations-schema.sql`

## Step 4: Set Your GPT-5 API Key in Supabase Secrets

### Option A: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Click on **Environment Variables**
4. Add a new secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your actual GPT-5 API key (starts with `sk-`)

### Option B: Via CLI
```bash
npx supabase secrets set OPENAI_API_KEY=sk-your-actual-gpt5-api-key-here
```

## Step 5: Deploy the Edge Function

```bash
npx supabase functions deploy generate-vo-script
```

## Step 6: Verify Deployment

```bash
# List all functions to confirm deployment
npx supabase functions list

# Check function logs
npx supabase functions logs generate-vo-script
```

## Step 7: Test the Function

After deployment, test the function by:

1. **Navigate to your app**: `http://localhost:8090/dashboard/copilot`
2. **Upload a resume or paste text**
3. **Choose preferences and generate script**
4. **Check browser console for any errors**

## Troubleshooting

### If deployment fails:

1. **Check your project reference**:
   ```bash
   npx supabase status
   ```

2. **Verify your API key format**:
   - Should start with `sk-`
   - Should be the actual key, not a placeholder

3. **Check function logs for errors**:
   ```bash
   npx supabase functions logs generate-vo-script --follow
   ```

4. **Test locally first** (optional):
   ```bash
   npx supabase start
   npx supabase functions serve generate-vo-script
   ```

### Common Issues:

- **"Invalid project ref"**: Double-check the project ID in the link command
- **"OpenAI API key not configured"**: Verify the secret is set correctly
- **"Function not found"**: Make sure the deploy command completed successfully

## Expected Success Output

After successful deployment, you should see:
```
✅ Functions deployed successfully
   - generate-vo-script: [deployed]
```

And in your Supabase dashboard:
- The function appears in **Edge Functions** section
- Environment variable `OPENAI_API_KEY` is set
- Database has the `script_generations` table

## Testing the Live Function

1. Go to `/dashboard/copilot` in your app
2. Upload any resume or paste text like:
   ```
   John Smith
   Software Engineer with 5 years experience
   Worked at Google, specialized in React and Node.js
   Led team of 4 developers on e-commerce platform
   ```
3. Choose "Professional" tone, "Business" audience, "2min" length
4. Click "Generate My Script with AI"
5. Should see GPT-5 generated script in ~30-60 seconds

## What Happens Next

Once deployed:
- ✅ Real GPT-5 powers script generation
- ✅ All scripts are stored in your Supabase database
- ✅ Usage is tracked for analytics
- ✅ Users get personalized, professional VO scripts

## Cost Monitoring

Each script generation costs ~$0.01-0.05 in OpenAI API calls. Monitor usage in:
- OpenAI dashboard for API usage
- Supabase dashboard for function invocations
- Your database `script_generations` table for user activity

---

🎯 **Run these commands in your terminal, then test the live feature!**