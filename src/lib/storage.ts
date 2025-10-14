import { supabase } from './supabase';
import type { VoiceRecording } from '@/hooks/useVoiceRecorder';
import type { VideoRecording } from '@/hooks/useVideoRecorder';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload a voice recording to Supabase Storage
 */
export const uploadVoiceRecording = async (
  recording: VoiceRecording,
  userId: string,
  fileName?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Generate filename if not provided
    const timestamp = Date.now();
    const finalFileName = fileName || `voice-recording-${timestamp}.webm`;
    const filePath = `voices/${userId}/${finalFileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, recording.blob, {
        contentType: recording.blob.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };

  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Upload a video recording to Supabase Storage
 */
export const uploadVideoRecording = async (
  recording: VideoRecording,
  userId: string,
  fileName?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Generate filename if not provided
    const timestamp = Date.now();
    const finalFileName = fileName || `video-recording-${timestamp}.webm`;
    const filePath = `videos/${userId}/${finalFileName}`;

    // Upload video file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, recording.blob, {
        contentType: recording.blob.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Video upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Upload thumbnail if available
    let thumbnailPath: string | undefined;
    if (recording.thumbnailUrl) {
      try {
        // Fetch thumbnail blob
        const thumbnailResponse = await fetch(recording.thumbnailUrl);
        const thumbnailBlob = await thumbnailResponse.blob();

        const thumbnailFileName = `thumb-${finalFileName.replace('.webm', '.jpg')}`;
        thumbnailPath = `thumbnails/${userId}/${thumbnailFileName}`;

        const { error: thumbError } = await supabase.storage
          .from('media')
          .upload(thumbnailPath, thumbnailBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (thumbError) {
          console.warn('Thumbnail upload failed:', thumbError);
          // Don't fail the entire upload for thumbnail issues
          thumbnailPath = undefined;
        }
      } catch (thumbError) {
        console.warn('Thumbnail processing failed:', thumbError);
        thumbnailPath = undefined;
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    const result: UploadResult = {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };

    // Add thumbnail URL if available
    if (thumbnailPath) {
      const { data: thumbnailUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(thumbnailPath);

      (result as any).thumbnailUrl = thumbnailUrlData.publicUrl;
      (result as any).thumbnailPath = thumbnailPath;
    }

    return result;

  } catch (error) {
    console.error('Video upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Upload any media file to Supabase Storage
 */
export const uploadMediaFile = async (
  file: File,
  userId: string,
  type: 'voice' | 'video' | 'image',
  fileName?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Generate filename if not provided
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'bin';
    const finalFileName = fileName || `${type}-${timestamp}.${extension}`;
    const folderMap = {
      voice: 'voices',
      video: 'videos',
      image: 'images'
    };
    const filePath = `${folderMap[type]}/${userId}/${finalFileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Media upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };

  } catch (error) {
    console.error('Media upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Delete a media file from Supabase Storage
 */
export const deleteMediaFile = async (filePath: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from('media')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Delete failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
};

/**
 * Get a signed URL for a media file (for private access)
 */
export const getSignedUrl = async (filePath: string, expiresIn: number = 3600): Promise<UploadResult> => {
  try {
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      url: data.signedUrl,
      path: filePath
    };

  } catch (error) {
    console.error('Signed URL failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get signed URL'
    };
  }
};

/**
 * Check if a file exists in storage
 */
export const checkFileExists = async (filePath: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage
      .from('media')
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop()
      });

    return !error && data && data.length > 0;
  } catch (error) {
    console.error('File check failed:', error);
    return false;
  }
};

/**
 * Get storage bucket info and limits
 */
export const getStorageInfo = async () => {
  try {
    // This would require admin access to get bucket info
    // For now, return default limits based on typical Supabase free tier
    return {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      totalStorage: 1024 * 1024 * 1024, // 1GB
      allowedTypes: {
        voice: ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a'],
        video: ['video/webm', 'video/mp4', 'video/mov'],
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      }
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return null;
  }
};