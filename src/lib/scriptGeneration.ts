import { supabase } from './supabase';

export interface ScriptGenerationRequest {
  resumeText: string;
  jobDescription?: string;
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

export interface ScriptSection {
  title: string;
  content: string;
  timestamp?: string;
  duration?: string;
}

export interface ScriptGenerationResponse {
  success: boolean;
  script: string;
  sections?: ScriptSection[];
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
        jobDescription: request.jobDescription || null,
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

export async function saveEditedScript(
  scriptId: string | null,
  title: string,
  content: string,
  metadata?: any
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User must be authenticated');
    }

    if (scriptId) {
      // Update existing script
      const { error } = await supabase
        .from('script_generations')
        .update({
          generated_script: content,
          metadata: { ...metadata, title, lastEdited: new Date().toISOString() }
        })
        .eq('id', scriptId);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
    } else {
      // Create new saved script - use valid enum values
      const { error } = await supabase
        .from('script_generations')
        .insert({
          user_id: session.user.id,
          script_type: 'professional', // Use valid enum value
          target_audience: 'general',
          script_length: '2min',
          word_count: content.split(/\s+/).length,
          generated_script: content,
          metadata: {
            title,
            isEdited: true,
            savedAt: new Date().toISOString(),
            ...metadata
          }
        });

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Error saving edited script:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to save script: ${error.message}`);
    }
    throw error;
  }
}

export function parseScriptSections(script: string): ScriptSection[] {
  const sections: ScriptSection[] = [];

  // Try to parse sections marked by headers (e.g., "## Introduction" or "[INTRODUCTION]")
  const lines = script.split('\n');
  let currentSection: ScriptSection | null = null;

  for (const line of lines) {
    // Check for section headers
    const headerMatch = line.match(/^(?:##|\[)?\s*([A-Z][A-Za-z\s]+?)(?:\]|:)?\s*$/);

    if (headerMatch && line.trim().length < 50) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        title: headerMatch[1].trim(),
        content: ''
      };
    } else if (currentSection) {
      // Add content to current section
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    } else {
      // No section header yet, create default section
      if (!currentSection) {
        currentSection = {
          title: 'Introduction',
          content: line
        };
      }
    }
  }

  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }

  // If no sections were found, create one with all content
  if (sections.length === 0) {
    sections.push({
      title: 'Script',
      content: script
    });
  }

  return sections;
}