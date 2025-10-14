import { supabase } from './supabase';

export interface ScriptGenerationRequest {
  resumeText: string;
  scriptType: 'professional' | 'conversational' | 'enthusiastic' | 'storytelling';
  targetAudience: 'business' | 'creative' | 'tech' | 'general';
  scriptLength: '1min' | '2min' | '3min' | '5min';
}

export interface ExtractedInfo {
  name: string;
  title: string;
  experience: string;
  industry: string;
  primarySkills: string[];
  keyAchievements: string[];
  companies: string[];
  education: string;
}

export interface ScriptGenerationResponse {
  success: boolean;
  script: string;
  extractedInfo: ExtractedInfo;
  metadata: {
    wordCount: number;
    estimatedDuration: string;
    generatedAt: string;
  };
  error?: string;
}

export async function generateVOScript(request: ScriptGenerationRequest): Promise<ScriptGenerationResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User must be authenticated to generate scripts');
    }

    console.log('Calling Supabase Edge Function for script generation...');
    console.log('Request data:', {
      resumeText: request.resumeText.substring(0, 100) + '...',
      scriptType: request.scriptType,
      targetAudience: request.targetAudience,
      scriptLength: request.scriptLength,
      userId: session.user.id
    });

    const { data, error } = await supabase.functions.invoke('generate-vo-script', {
      body: {
        resumeText: request.resumeText,
        scriptType: request.scriptType,
        targetAudience: request.targetAudience,
        scriptLength: request.scriptLength,
        userId: session.user.id
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`API Error: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate script');
    }

    console.log('Script generated successfully');
    return data as ScriptGenerationResponse;

  } catch (error) {
    console.error('Script generation error:', error);

    if (error instanceof Error) {
      throw new Error(`Script generation failed: ${error.message}`);
    }

    throw new Error('An unexpected error occurred during script generation');
  }
}

export async function getScriptGenerationHistory(limit = 10) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User must be authenticated');
    }

    const { data, error } = await supabase
      .from('script_generations')
      .select(`
        id,
        script_type,
        target_audience,
        script_length,
        word_count,
        created_at,
        metadata
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Error fetching script history:', error);
    throw error;
  }
}

export async function saveGeneratedScript(
  request: ScriptGenerationRequest,
  response: ScriptGenerationResponse
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User must be authenticated');
    }

    const { error } = await supabase
      .from('script_generations')
      .insert({
        user_id: session.user.id,
        script_type: request.scriptType,
        target_audience: request.targetAudience,
        script_length: request.scriptLength,
        word_count: response.metadata.wordCount,
        resume_text: request.resumeText,
        generated_script: response.script,
        extracted_info: response.extractedInfo,
        metadata: response.metadata
      });

    if (error) {
      console.error('Error saving script:', error);
      // Don't throw error here as the script was still generated successfully
    }

  } catch (error) {
    console.error('Error saving script to database:', error);
    // Don't throw error here as the script was still generated successfully
  }
}