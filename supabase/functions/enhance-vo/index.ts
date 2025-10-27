import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnhanceRequest {
  videoUrl: string
  voProfileId: string
  jobDescription?: string | null
  userId: string
}

interface EnhancementResults {
  transcription: string
  grammarCorrections: Array<{
    original: string
    corrected: string
    reason: string
  }>
  toneImprovements: Array<{
    timestamp: string
    issue: string
    suggestion: string
  }>
  overallScore: number
  strengths: string[]
  areasForImprovement: string[]
  jobMatchAnalysis?: {
    relevantPoints: string[]
    missedOpportunities: string[]
    alignment: number
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const requestData: EnhanceRequest = await req.json()
    const { videoUrl, voProfileId, jobDescription, userId: requestUserId } = requestData

    console.log('Enhance VO request received:', {
      voProfileId,
      hasJobDescription: !!jobDescription,
      videoUrl: videoUrl?.substring(0, 100) + '...',
      requestUserId
    })

    // Verify auth
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    console.log('Auth header prefix:', authHeader?.substring(0, 20) + '...')

    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    console.log('Supabase URL configured:', !!supabaseUrl)
    console.log('Supabase Service Key configured:', !!supabaseServiceKey)
    console.log('Supabase Anon Key configured:', !!supabaseAnonKey)

    // Create Supabase client with service role key (bypasses RLS for storage access)
    // Don't pass auth header when using service role key - they conflict
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseServiceKey ?? supabaseAnonKey ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Decode JWT to get user ID (bypass Supabase auth.getUser() which has session issues)
    console.log('Decoding JWT token...')
    let userId: string
    try {
      // Extract JWT token (remove "Bearer " prefix if present)
      const token = authHeader.replace(/^Bearer\s+/i, '')

      // Decode JWT payload (base64)
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format - expected 3 parts')
      }

      // Decode the payload (second part)
      const base64Url = parts[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const payload = JSON.parse(jsonPayload)

      console.log('JWT payload decoded:', {
        sub: payload.sub,
        exp: payload.exp,
        role: payload.role,
        aud: payload.aud
      })

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired')
      }

      // Extract user ID
      if (!payload.sub) {
        throw new Error('No user ID (sub) in JWT payload')
      }

      userId = payload.sub
      console.log('Authenticated user ID:', userId)

    } catch (jwtError: any) {
      console.error('JWT decode error:', jwtError)
      throw new Error(`Auth failed: ${jwtError.message || 'Could not validate token'}`)
    }

    // Check AI credits (optional - if column doesn't exist, allow the request)
    let hasCredits = true
    let userCredits = 0
    try {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('ai_credits')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.warn('Could not fetch ai_credits (column may not exist):', profileError)
        // Allow the request to continue - credits system may not be set up yet
        hasCredits = true
      } else if (profile && typeof profile.ai_credits === 'number') {
        userCredits = profile.ai_credits
        if (profile.ai_credits < 1) {
          return new Response(
            JSON.stringify({
              error: 'Insufficient AI credits',
              details: 'You need at least 1 AI credit to enhance a VO'
            }),
            {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      }
    } catch (creditCheckError) {
      console.warn('Error checking credits, allowing request:', creditCheckError)
      hasCredits = true
    }

    // Step 1: Download video from Supabase Storage
    console.log('Downloading video from storage...', { videoUrl })

    // Parse the video path - extract just the file path after vo-recordings/
    let videoPath: string
    if (videoUrl.includes('/storage/v1/object/public/vo-recordings/')) {
      // Full URL format: https://xxx.supabase.co/storage/v1/object/public/vo-recordings/path/to/file.mp4
      videoPath = videoUrl.split('/storage/v1/object/public/vo-recordings/')[1]
    } else if (videoUrl.includes('vo-recordings/')) {
      // Partial URL format: vo-recordings/path/to/file.mp4
      videoPath = videoUrl.split('vo-recordings/')[1]
    } else {
      throw new Error('Invalid video URL format: ' + videoUrl)
    }

    console.log('Parsed video path:', videoPath)
    console.log('Attempting to download from bucket: vo-recordings, path:', videoPath)

    const { data: videoBlob, error: downloadError } = await supabaseClient
      .storage
      .from('vo-recordings')
      .download(videoPath)

    console.log('Download result:', {
      success: !downloadError,
      hasBlob: !!videoBlob,
      blobSize: videoBlob?.size
    })

    if (downloadError) {
      console.error('Download error:', JSON.stringify(downloadError, null, 2))
      throw new Error(`Failed to download video: ${JSON.stringify(downloadError)}`)
    }

    if (!videoBlob) {
      throw new Error('Video blob is empty')
    }

    console.log('Video downloaded successfully, size:', videoBlob.size, 'bytes')

    // Step 2: Transcribe video using AssemblyAI (supports large files up to 5GB)
    console.log('Transcribing video with AssemblyAI...')
    const transcription = await transcribeVideoWithAssemblyAI(videoBlob, videoUrl)
    console.log('Transcription complete:', transcription.substring(0, 100) + '...')

    // Step 3: Analyze transcription with GPT-5
    console.log('Analyzing transcription with GPT-5 (gpt-5-2025-08-07)...')
    const enhancementResults = await analyzeTranscription(
      transcription,
      jobDescription || undefined
    )

    // Step 4: Deduct AI credit (if credits system is enabled)
    if (userCredits > 0) {
      const { error: creditError } = await supabaseClient
        .from('profiles')
        .update({ ai_credits: userCredits - 1 })
        .eq('id', userId)

      if (creditError) {
        console.error('Failed to deduct AI credit:', creditError)
        // Don't throw - enhancement already happened
      }
    }

    // Step 5: Save enhancement results to database
    const { error: saveError } = await supabaseClient
      .from('vo_enhancements')
      .insert({
        vo_profile_id: voProfileId,
        user_id: userId,
        transcription,
        results: enhancementResults,
        created_at: new Date().toISOString()
      })

    if (saveError) {
      console.error('Failed to save enhancement results:', saveError)
      // Don't throw - return results anyway
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: enhancementResults,
        creditsRemaining: Math.max(0, userCredits - 1)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Enhancement error:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({
        error: 'Enhancement failed',
        details: error.message || String(error),
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Transcribe video using AssemblyAI (supports files up to 5GB)
 * Uses the public video URL directly - no need to upload the blob
 */
async function transcribeVideoWithAssemblyAI(videoBlob: Blob, videoUrl: string): Promise<string> {
  const assemblyAIKey = Deno.env.get('ASSEMBLYAI_API_KEY')
  if (!assemblyAIKey) {
    console.warn('AssemblyAI API key not configured, falling back to Whisper')
    return transcribeVideo(videoBlob)
  }

  console.log('Using AssemblyAI for transcription (supports large files)')

  try {
    // AssemblyAI can transcribe directly from URL if the file is publicly accessible
    // Otherwise, we need to upload it first
    console.log('Submitting transcription job to AssemblyAI...')

    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': assemblyAIKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: videoUrl,
        language_code: 'en'
      })
    })

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error('AssemblyAI submission error:', errorText)
      throw new Error(`AssemblyAI error: ${transcriptResponse.status}`)
    }

    const transcript = await transcriptResponse.json()
    const transcriptId = transcript.id

    console.log('Transcription job submitted, ID:', transcriptId)
    console.log('Polling for completion...')

    // Poll for completion
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max (5 second intervals)

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': assemblyAIKey
        }
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to check transcription status: ${statusResponse.status}`)
      }

      const status = await statusResponse.json()
      console.log('Transcription status:', status.status)

      if (status.status === 'completed') {
        console.log('Transcription completed successfully')
        return status.text || ''
      }

      if (status.status === 'error') {
        throw new Error(`Transcription failed: ${status.error}`)
      }

      attempts++
    }

    throw new Error('Transcription timed out after 5 minutes')

  } catch (error: any) {
    console.error('AssemblyAI transcription error:', error)
    // Fall back to Whisper if AssemblyAI fails
    console.log('Falling back to Whisper API...')
    return transcribeVideo(videoBlob)
  }
}

/**
 * Original Whisper transcription (25 MB limit)
 */
async function transcribeVideo(videoBlob: Blob): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Create form data for Whisper API
  const formData = new FormData()
  formData.append('file', videoBlob, 'video.webm')
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')
  formData.append('response_format', 'verbose_json') // Get timestamps

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Whisper API error:', { status: response.status, body: errorText })

    if (response.status === 413) {
      throw new Error('Video file is too large for transcription. The maximum file size is 25 MB. Please record a shorter video.')
    }

    throw new Error(`Whisper API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.text || ''
}

async function analyzeTranscription(
  transcription: string,
  jobDescription?: string
): Promise<EnhancementResults> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const jobMatchSection = jobDescription ? `

JOB DESCRIPTION FOR COMPARISON:
${jobDescription}

ADDITIONAL ANALYSIS REQUIRED:
- Compare the VO content against the job description
- Identify which job requirements the candidate addressed
- Identify missed opportunities where the candidate could have highlighted relevant experience
- Provide an alignment score (0-100) showing how well the VO matches the job requirements
- List specific points from the VO that align with the job description
` : ''

  const prompt = `
You are an expert career coach and voice-over analyst. Analyze the following voice-over transcription and provide comprehensive feedback.

TRANSCRIPTION:
${transcription}
${jobMatchSection}

Provide your analysis in the following JSON format (valid JSON only, no markdown):

{
  "transcription": "${transcription}",
  "grammarCorrections": [
    {
      "original": "exact phrase with grammar issue",
      "corrected": "corrected version",
      "reason": "brief explanation of the issue"
    }
  ],
  "toneImprovements": [
    {
      "timestamp": "approximate time in transcript",
      "issue": "what could be improved",
      "suggestion": "specific actionable suggestion"
    }
  ],
  "overallScore": 85,
  "strengths": [
    "specific strength 1",
    "specific strength 2"
  ],
  "areasForImprovement": [
    "specific area 1",
    "specific area 2"
  ]${jobDescription ? `,
  "jobMatchAnalysis": {
    "relevantPoints": [
      "specific point from VO that matches job requirements"
    ],
    "missedOpportunities": [
      "opportunity to highlight relevant experience not mentioned"
    ],
    "alignment": 75
  }` : ''}
}

ANALYSIS GUIDELINES:
- Be specific and actionable in all feedback
- Focus on professional voice-over delivery
- Grammar corrections should identify filler words (um, uh, like), repetition, unclear phrasing
- Tone improvements should address: confidence, pacing, enthusiasm, professionalism, clarity
- Overall score should reflect: clarity (25%), professionalism (25%), content quality (25%), delivery (25%)
- Strengths should highlight what the candidate did well
- Areas for improvement should be constructive and specific
${jobDescription ? '- Job match analysis should be honest and specific, comparing actual VO content to job requirements' : ''}

Return ONLY valid JSON with no additional text, markdown formatting, or code blocks.
`

  // Try GPT-5 models in order of preference
  const modelsToTry = ['gpt-5-2025-08-07', 'gpt-5', 'gpt-4o']
  let response: Response | null = null
  let lastError: string = ''
  let modelUsed: string = ''

  for (const model of modelsToTry) {
    try {
      console.log(`Attempting to use model: ${model}`)
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert career coach analyzing voice-over recordings. Return only valid JSON with no markdown formatting or code blocks.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      })

      if (response.ok) {
        modelUsed = model
        console.log(`Successfully using model: ${model}`)
        break
      } else {
        const errorText = await response.text()
        lastError = `${model}: ${errorText}`
        console.warn(`Model ${model} failed:`, errorText)
      }
    } catch (error) {
      lastError = `${model}: ${error}`
      console.warn(`Model ${model} error:`, error)
    }
  }

  if (!response || !response.ok) {
    console.error('All models failed. Last error:', lastError)
    throw new Error(`OpenAI API error - all models failed. Last: ${lastError}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content?.trim() || ''

  // Remove markdown code blocks if present
  let jsonContent = content
  if (content.startsWith('```')) {
    jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  }

  try {
    const results = JSON.parse(jsonContent)
    return results
  } catch (parseError) {
    console.error('Failed to parse GPT-5 response:', jsonContent)
    throw new Error('Failed to parse enhancement results')
  }
}
