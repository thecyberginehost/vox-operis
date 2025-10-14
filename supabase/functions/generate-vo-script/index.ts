import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScriptRequest {
  resumeText: string;
  scriptType: 'professional' | 'conversational' | 'enthusiastic' | 'storytelling';
  targetAudience: 'business' | 'creative' | 'tech' | 'general';
  scriptLength: '1min' | '2min' | '3min' | '5min';
  userId?: string;
}

interface ExtractedInfo {
  name: string;
  title: string;
  experience: string;
  industry: string;
  primarySkills: string[];
  keyAchievements: string[];
  companies: string[];
  education: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body with error handling
    let requestData: ScriptRequest
    try {
      console.log('Request method:', req.method)
      console.log('Request headers:', Object.fromEntries(req.headers.entries()))

      const rawBody = await req.text()
      console.log('Raw request body:', rawBody)
      console.log('Raw body length:', rawBody?.length || 0)

      if (!rawBody || rawBody.trim() === '') {
        console.error('Request body is empty or undefined')
        return new Response(
          JSON.stringify({
            error: 'Empty request body',
            details: 'The request body is empty. Make sure you are sending JSON data.',
            receivedHeaders: Object.fromEntries(req.headers.entries())
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      requestData = JSON.parse(rawBody) as ScriptRequest
      console.log('Parsed request data:', requestData)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { resumeText, scriptType, targetAudience, scriptLength, userId } = requestData

    if (!resumeText?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Resume text is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract information from resume using GPT-5
    console.log('Extracting resume information...')
    const extractedInfo = await extractResumeInformation(resumeText)

    // Generate the script using GPT-5
    console.log('Generating VO script...')
    const generatedScript = await generateVOScript(extractedInfo, scriptType, targetAudience, scriptLength)

    // Log the generation for analytics (optional)
    try {
      await supabaseClient.from('script_generations').insert({
        user_id: user.id,
        script_type: scriptType,
        target_audience: targetAudience,
        script_length: scriptLength,
        word_count: generatedScript.split(' ').length,
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      console.error('Error logging generation:', logError)
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        script: generatedScript,
        extractedInfo: extractedInfo,
        metadata: {
          wordCount: generatedScript.split(' ').length,
          estimatedDuration: scriptLength,
          generatedAt: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating script:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to generate script. Please try again.',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Manual extraction fallback when AI parsing fails
function extractBasicInfo(resumeText: string): ExtractedInfo {
  const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const text = resumeText.toLowerCase()

  // Extract name (usually first line that looks like a person's name)
  let name = 'John Smith'
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]
    // Look for name pattern: 2-4 words, no numbers, no common resume words
    const words = line.split(' ').filter(w => w.length > 1)
    if (words.length >= 2 && words.length <= 4 &&
        !line.match(/\d/) &&
        !text.slice(0, 200).includes('@') &&
        !line.toLowerCase().includes('resume') &&
        !line.toLowerCase().includes('curriculum') &&
        !line.toLowerCase().includes('experience') &&
        !line.toLowerCase().includes('years')) {
      name = line
      break
    }
  }

  // Extract job title - look for lines with job-related keywords
  let title = 'Software Engineer'
  const jobKeywords = ['engineer', 'developer', 'manager', 'director', 'analyst', 'specialist', 'consultant', 'lead', 'senior', 'architect', 'designer']
  for (const line of lines) {
    for (const keyword of jobKeywords) {
      if (line.toLowerCase().includes(keyword) && line.length < 100) {
        title = line
        break
      }
    }
    if (title !== 'Software Engineer') break
  }

  // Extract years of experience
  let experience = '5+'
  const expMatches = [
    resumeText.match(/(\d+)\+?\s*years?\s*(of\s*)?experience/i),
    resumeText.match(/(\d+)\+?\s*years?\s*in/i),
    resumeText.match(/(\d+)\+?\s*years?/i)
  ]
  for (const match of expMatches) {
    if (match) {
      experience = match[1] + '+'
      break
    }
  }

  // Extract skills - look for technical skills
  const skillKeywords = ['react', 'javascript', 'typescript', 'node.js', 'python', 'java', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'git', 'agile', 'scrum', 'leadership', 'management', 'angular', 'vue', 'golang', 'rust', 'swift', 'kotlin']
  const foundSkills = skillKeywords.filter(skill => text.includes(skill))
  const primarySkills = foundSkills.slice(0, 5).length > 0 ? foundSkills.slice(0, 5) : ['problem-solving', 'leadership', 'communication']

  // Extract companies - look for well-known company names
  const companyKeywords = ['google', 'microsoft', 'apple', 'amazon', 'facebook', 'meta', 'netflix', 'tesla', 'uber', 'airbnb', 'twitter', 'linkedin', 'salesforce', 'oracle', 'ibm', 'intel', 'nvidia', 'adobe', 'spotify', 'slack', 'zoom', 'dropbox', 'github', 'gitlab']
  const foundCompanies = companyKeywords.filter(company => text.includes(company))
  const companies = foundCompanies.length > 0 ? foundCompanies.slice(0, 3).map(c => c.charAt(0).toUpperCase() + c.slice(1)) : ['Previous Company']

  // Extract education
  let education = "Bachelor's Degree"
  if (text.includes('masters') || text.includes('mba') || text.includes('m.s.') || text.includes('master of')) education = "Master's Degree"
  if (text.includes('phd') || text.includes('ph.d') || text.includes('doctorate')) education = "PhD"
  if (text.includes('stanford') || text.includes('mit') || text.includes('harvard') || text.includes('berkeley')) {
    const schoolMatch = resumeText.match(/(stanford|mit|harvard|berkeley|carnegie|caltech|princeton|yale|columbia)/i)
    if (schoolMatch) education = `${education} from ${schoolMatch[1].charAt(0).toUpperCase() + schoolMatch[1].slice(1)}`
  }

  // Extract achievements - look for accomplishment words
  const achievementWords = ['led', 'managed', 'built', 'created', 'developed', 'increased', 'improved', 'reduced', 'launched', 'delivered']
  const achievements = []
  for (const line of lines) {
    for (const word of achievementWords) {
      if (line.toLowerCase().includes(word) && line.length < 150) {
        achievements.push(line)
        break
      }
    }
    if (achievements.length >= 2) break
  }
  const keyAchievements = achievements.length > 0 ? achievements : ['project delivery', 'team management']

  // Determine industry
  let industry = 'Technology'
  if (text.includes('healthcare') || text.includes('medical') || text.includes('hospital')) industry = 'Healthcare'
  else if (text.includes('finance') || text.includes('banking') || text.includes('fintech')) industry = 'Finance'
  else if (text.includes('education') || text.includes('teaching') || text.includes('university')) industry = 'Education'
  else if (text.includes('retail') || text.includes('ecommerce') || text.includes('e-commerce')) industry = 'Retail/E-commerce'

  console.log('Manual extraction used with real parsing:', { name, title, experience, industry, primarySkills })

  return {
    name,
    title,
    experience,
    industry,
    primarySkills,
    keyAchievements,
    companies,
    education
  }
}

async function extractResumeInformation(resumeText: string): Promise<ExtractedInfo> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    console.error('OpenAI API key not found in environment variables')
    console.log('Available env vars:', Object.keys(Deno.env.toObject()))
    throw new Error('OpenAI API key not configured')
  }

  console.log('OpenAI API key found, length:', openaiApiKey.length)

  const prompt = `Extract key information from this resume and return ONLY valid JSON:

RESUME:
${resumeText}

Return JSON with these exact fields:
{
  "name": "full name from resume",
  "title": "job title/position",
  "experience": "years of experience (e.g. '5+')",
  "industry": "primary field/industry",
  "primarySkills": ["skill1", "skill2", "skill3"],
  "keyAchievements": ["achievement1", "achievement2"],
  "companies": ["company1", "company2"],
  "education": "highest education"
}

IMPORTANT: Return ONLY the JSON object, no explanation, no markdown, no code blocks.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use GPT-4o for better structured output
        messages: [
          {
            role: 'system',
            content: 'You are a resume parser. Return ONLY valid JSON, no text before or after, no markdown, no code blocks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error response:', errorText)
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const responseText = await response.text()
    console.log('OpenAI API raw response:', responseText)

    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from OpenAI API')
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      console.error('Failed to parse OpenAI response:', jsonError)
      throw new Error('Invalid JSON response from OpenAI API')
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', data)
      throw new Error('Unexpected response structure from OpenAI API')
    }

    const extractedText = data.choices[0].message.content?.trim()

    if (!extractedText) {
      console.error('No content in OpenAI response')
      throw new Error('No content returned from OpenAI')
    }

    console.log('Raw extracted text from OpenAI:', extractedText)

    // Parse the JSON response - handle markdown code blocks and other formatting
    try {
      let jsonText = extractedText

      // Remove various markdown formatting
      if (jsonText.includes('```json')) {
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
        if (match && match[1]) {
          jsonText = match[1]
        } else {
          jsonText = jsonText.replace(/```json\s*/, '').replace(/\s*```$/, '')
        }
      } else if (jsonText.includes('```')) {
        const match = jsonText.match(/```\s*([\s\S]*?)\s*```/)
        if (match && match[1]) {
          jsonText = match[1]
        } else {
          jsonText = jsonText.replace(/```\s*/, '').replace(/\s*```$/, '')
        }
      }

      // Clean up any extra text before/after JSON
      if (jsonText.includes('{')) {
        const startIndex = jsonText.indexOf('{')
        const endIndex = jsonText.lastIndexOf('}')
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          jsonText = jsonText.substring(startIndex, endIndex + 1)
        }
      }

      // Trim any remaining whitespace
      jsonText = jsonText.trim()

      console.log('Cleaned JSON text for parsing:', jsonText)

      if (!jsonText || !jsonText.startsWith('{')) {
        throw new Error('No valid JSON found in response')
      }

      const extracted = JSON.parse(jsonText)

      // Validate required fields
      if (!extracted.name || !extracted.title) {
        console.error('Parsed JSON missing required fields:', extracted)
        throw new Error('Incomplete data extracted')
      }

      console.log('Successfully parsed resume info:', extracted)
      return extracted as ExtractedInfo
    } catch (parseError) {
      console.error('Failed to parse extracted info. Raw text:', extractedText)
      console.error('Parse error:', parseError)

      // Instead of generic fallback, extract basic info manually
      return extractBasicInfo(resumeText)
    }
  } catch (error) {
    console.error('Error extracting resume info:', error)
    // Fallback to default values
    return {
      name: '[Your Name]',
      title: 'Professional',
      experience: '5+',
      industry: 'Technology',
      primarySkills: ['problem-solving', 'leadership', 'communication'],
      keyAchievements: ['project delivery', 'team management'],
      companies: ['Previous Company'],
      education: 'Bachelor\'s Degree'
    }
  }
}

async function generateVOScript(
  info: ExtractedInfo,
  scriptType: string,
  targetAudience: string,
  scriptLength: string
): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    console.error('OpenAI API key not found in environment variables for script generation')
    throw new Error('OpenAI API key not configured')
  }

  const wordCount = scriptLength === '1min' ? 150 :
                   scriptLength === '2min' ? 300 :
                   scriptLength === '3min' ? 450 : 750

  const prompt = `
Create a professional voice-over script for ${info.name}, a ${info.title} with ${info.experience} years of experience in ${info.industry}.

SCRIPT REQUIREMENTS:
- Tone: ${scriptType}
- Target Audience: ${targetAudience}
- Length: ${scriptLength} (approximately ${wordCount} words)
- Professional but humanized language
- Natural speech patterns suitable for voice recording

KEY INFORMATION TO INCORPORATE:
- Name: ${info.name}
- Title: ${info.title}
- Experience: ${info.experience} years
- Industry: ${info.industry}
- Primary Skills: ${info.primarySkills.join(', ')}
- Key Achievements: ${info.keyAchievements.join(', ')}
- Companies: ${info.companies.join(', ')}
- Education: ${info.education}

SCRIPT STRUCTURE:
1. Engaging opening (introduce name and role)
2. Professional background and experience
3. Key skills and achievements
4. Unique value proposition
5. Strong closing with call to action

FORMATTING REQUIREMENTS:
- Include [PAUSE - X seconds] markers for natural pacing
- Use **bold** for words to emphasize
- Add pronunciation guides for technical terms if needed
- Include section headers for easy navigation
- End with a recording guide section

TONE GUIDELINES:
- ${scriptType === 'professional' ? 'Authoritative, confident, but warm' :
     scriptType === 'conversational' ? 'Friendly, approachable, like talking to a colleague' :
     scriptType === 'enthusiastic' ? 'Energetic, passionate, but still professional' :
     'Personal narrative style, engaging storytelling approach'}

Create a script that sounds natural when spoken aloud and showcases ${info.name} as the ideal candidate for ${targetAudience} roles in ${info.industry}.
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use GPT-4o for best quality
        messages: [
          {
            role: 'system',
            content: 'You are an expert scriptwriter specializing in professional voice-over scripts for career presentations. Create natural, engaging scripts that sound great when spoken aloud.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error response:', errorText)
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const responseText = await response.text()
    console.log('OpenAI script generation raw response:', responseText)

    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from OpenAI API')
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      console.error('Failed to parse OpenAI response:', jsonError)
      throw new Error('Invalid JSON response from OpenAI API')
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', data)
      throw new Error('Unexpected response structure from OpenAI API')
    }

    return data.choices[0].message.content?.trim() || ''
  } catch (error) {
    console.error('Error generating script:', error)
    throw new Error('Failed to generate script')
  }
}