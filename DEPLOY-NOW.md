# 🚀 DEPLOY GPT-5 EDGE FUNCTION - QUICK START

## ⚡ Fast Track Deployment (5 minutes)

### 1. Login to Supabase
```bash
npm run supabase:login
```
This opens your browser for authentication.

### 2. Link Your Project
```bash
npm run supabase:link
```

### 3. Set Your GPT-5 API Key in Supabase Dashboard

**IMPORTANT:** Go to your Supabase dashboard now:

1. Open: https://supabase.com/dashboard/project/vqwroeglrokmqvixiudb
2. Navigate to: **Settings** → **Edge Functions** → **Environment Variables**
3. Click **"Add new variable"**
4. Set:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-your-actual-gpt5-api-key-here`
5. Click **Save**

### 4. Deploy the Database Schema

Go to **SQL Editor** in your Supabase dashboard and run:
```sql
-- Copy and paste the entire contents of script-generations-schema.sql
```

OR if you have access to psql:
```bash
# This might work if you have postgres tools
psql -h db.vqwroeglrokmqvixiudb.supabase.co -p 5432 -d postgres -U postgres -f script-generations-schema.sql
```

### 5. Deploy the Edge Function
```bash
npm run supabase:deploy
```

### 6. Test It!

1. Go to: `http://localhost:8090/dashboard/copilot`
2. Paste this test resume:
   ```
   John Smith
   Senior Software Engineer
   5+ years experience in React, Node.js, TypeScript
   Led development team at Google for 3 years
   Built scalable e-commerce platforms serving 1M+ users
   Masters in Computer Science from Stanford
   ```
3. Choose: Professional tone, Business audience, 2min length
4. Click "Generate My Script with AI"
5. Should get a personalized script in ~30-60 seconds!

## 🔍 Verify Success

✅ **Function Deployed**: Check your Supabase dashboard → Edge Functions
✅ **Environment Variable Set**: `OPENAI_API_KEY` shows in settings
✅ **Database Schema**: `script_generations` table exists
✅ **Script Generated**: Real GPT-5 output in your app

## 🐛 If Something Goes Wrong

```bash
# Check function logs
npm run supabase:logs

# Check deployment status
npm run supabase:status
```

**Common fixes:**
- **"Function not found"**: Re-run `npm run supabase:deploy`
- **"API key not configured"**: Double-check the environment variable in Supabase dashboard
- **"User not authenticated"**: Make sure you're logged into your app

## 💰 Cost Estimate

- Each script generation: ~$0.01-0.05
- Test generation: ~$0.02
- 100 scripts/day: ~$2-5/month

## 🎉 You're Done!

Once deployed, your users get:
- ✅ Real GPT-5 powered script generation
- ✅ Personalized professional VO scripts
- ✅ Resume analysis and content extraction
- ✅ Multiple tones and audience targeting
- ✅ Professional recording guidance

**Ready to generate professional VO scripts with GPT-5!** 🎬