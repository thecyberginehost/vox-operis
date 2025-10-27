/**
 * Video compression utility for reducing file sizes before upload
 * Targets 25 MB maximum for Whisper API compatibility
 */

const MAX_FILE_SIZE_MB = 25;
const TARGET_BITRATE = 500000; // 500 kbps - good quality while keeping size down

/**
 * Compresses a video blob if it exceeds the maximum file size
 * @param videoBlob The original video blob
 * @param onProgress Optional callback for compression progress (0-100)
 * @returns Compressed video blob or original if under size limit
 */
export async function compressVideoIfNeeded(
  videoBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

  // If video is already under the limit, return as-is
  if (videoBlob.size <= maxSizeBytes) {
    console.log('Video size OK:', (videoBlob.size / (1024 * 1024)).toFixed(2), 'MB');
    return videoBlob;
  }

  console.log('Video too large:', (videoBlob.size / (1024 * 1024)).toFixed(2), 'MB - compressing...');
  onProgress?.(10);

  try {
    // Create video element to load the source
    const videoElement = document.createElement('video');
    videoElement.src = URL.createObjectURL(videoBlob);
    videoElement.muted = true;

    await new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = resolve;
      videoElement.onerror = reject;
    });

    onProgress?.(30);

    // Create canvas for frame extraction
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(videoElement.videoWidth, 1280); // Max 720p width
    canvas.height = (canvas.width / videoElement.videoWidth) * videoElement.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    onProgress?.(50);

    // Use MediaRecorder with compressed settings
    const stream = canvas.captureStream(30); // 30 fps

    // Add audio from original video
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(videoElement);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    source.connect(audioContext.destination); // Also play it

    // Combine video and audio streams
    const audioTrack = destination.stream.getAudioTracks()[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: TARGET_BITRATE,
      audioBitsPerSecond: 64000 // 64 kbps audio
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    // Start recording and play video
    mediaRecorder.start(100); // Capture every 100ms
    videoElement.play();

    // Draw frames to canvas
    const drawFrame = () => {
      if (videoElement.paused || videoElement.ended) {
        return;
      }
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawFrame);
    };
    drawFrame();

    onProgress?.(70);

    // Wait for video to finish
    await new Promise<void>((resolve) => {
      videoElement.onended = () => {
        mediaRecorder.stop();
        resolve();
      };
    });

    onProgress?.(90);

    // Wait for final data
    const compressedBlob = await new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };
    });

    // Clean up
    URL.revokeObjectURL(videoElement.src);
    audioContext.close();

    onProgress?.(100);

    const compressedSizeMB = (compressedBlob.size / (1024 * 1024)).toFixed(2);
    const originalSizeMB = (videoBlob.size / (1024 * 1024)).toFixed(2);
    console.log(`Video compressed: ${originalSizeMB} MB -> ${compressedSizeMB} MB`);

    // If still too large, return error
    if (compressedBlob.size > maxSizeBytes) {
      throw new Error(`Video is still too large after compression (${compressedSizeMB} MB). Please record a shorter video.`);
    }

    return compressedBlob;

  } catch (error) {
    console.error('Compression error:', error);
    // If compression fails, throw an error explaining the issue
    throw new Error('Could not compress video. Please record a shorter video (under 25 MB).');
  }
}

/**
 * Simpler compression approach using HTMLCanvasElement and reduced resolution
 * More reliable but may result in lower quality
 */
export async function compressVideoSimple(
  videoBlob: Blob,
  targetSizeMB: number = MAX_FILE_SIZE_MB
): Promise<Blob> {
  // This is a placeholder for a simpler compression method
  // In practice, client-side video re-encoding is complex and may not always work
  // The best approach is often to record at lower quality from the start

  return videoBlob; // For now, return original
}
