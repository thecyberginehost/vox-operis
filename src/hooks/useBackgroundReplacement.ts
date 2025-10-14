import { useRef, useCallback, useState, useEffect } from 'react';

export interface BackgroundOptions {
  type: 'none' | 'blur' | 'image' | 'color';
  value?: string; // Image URL, color hex, or blur intensity
  name?: string; // Display name for the background
}

export interface UseBackgroundReplacementOptions {
  width?: number;
  height?: number;
  segmentationModel?: 'mediapipe' | 'bodypix'; // Future: ML model options
}

export interface UseBackgroundReplacementReturn {
  processedStream: MediaStream | null;
  isProcessing: boolean;
  error: string | null;
  currentBackground: BackgroundOptions;
  setBackground: (background: BackgroundOptions) => void;
  startProcessing: (inputStream: MediaStream) => void;
  stopProcessing: () => void;
  isSupported: boolean;
}

export const useBackgroundReplacement = (
  options: UseBackgroundReplacementOptions = {}
): UseBackgroundReplacementReturn => {
  const { width = 640, height = 480 } = options;

  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBackground, setCurrentBackground] = useState<BackgroundOptions>({
    type: 'none'
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const inputVideoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  // Check if browser supports necessary APIs
  const isSupported = typeof HTMLCanvasElement !== 'undefined' &&
                     typeof MediaStream !== 'undefined' &&
                     HTMLCanvasElement.prototype.captureStream;

  // Initialize canvas and context
  const initializeCanvas = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvasRef.current = canvas;
    contextRef.current = canvas.getContext('2d');
    return canvas;
  }, [width, height]);

  // Load background image
  const loadBackgroundImage = useCallback((imageUrl: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load background image'));
      img.src = imageUrl;
    });
  }, []);

  // Simple background processing (without ML segmentation for now)
  const processFrame = useCallback(() => {
    if (!inputVideoRef.current || !canvasRef.current || !contextRef.current || !isProcessing) {
      return;
    }

    const video = inputVideoRef.current;
    const canvas = canvasRef.current;
    const ctx = contextRef.current;

    // Check if video is ready
    if (video.readyState < 2) {
      // Video not ready, skip this frame
      if (isProcessing) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentBackground.type === 'none') {
        // No background processing, just draw the video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else if (currentBackground.type === 'blur') {
        // Apply blur to entire background
        const blurAmount = parseInt(currentBackground.value || '10');
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
      } else if (currentBackground.type === 'color') {
        // Solid color background
        ctx.fillStyle = currentBackground.value || '#00ff00';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // For now, just overlay the video (in future, would use segmentation)
        ctx.globalAlpha = 0.8;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
      } else if (currentBackground.type === 'image' && backgroundImageRef.current) {
        // Draw background image
        ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);

        // Overlay video (in future, would use segmentation to only show person)
        ctx.globalAlpha = 0.8;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
      }
    } catch (drawError) {
      // Silently handle drawing errors to prevent crashes
      console.warn('Canvas drawing error:', drawError);
    }

    // Continue processing
    if (isProcessing) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [currentBackground, isProcessing]);

  // Start background processing
  const startProcessing = useCallback(async (inputStream: MediaStream) => {
    if (!isSupported) {
      setError('Background replacement not supported in this browser');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);

      // Initialize canvas if not done
      const canvas = canvasRef.current || initializeCanvas();

      // Create video element for input stream
      const video = document.createElement('video');
      video.srcObject = inputStream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      inputVideoRef.current = video;

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          video.width = width;
          video.height = height;
          resolve();
        });
      });

      // Create output stream from canvas
      const outputStream = canvas.captureStream(30); // 30 FPS

      // Add audio from original stream if available
      try {
        const audioTracks = inputStream.getAudioTracks();
        audioTracks.forEach(track => {
          // Clone the audio track to avoid issues
          const clonedTrack = track.clone();
          outputStream.addTrack(clonedTrack);
        });
        // console.log('Added audio tracks to processed stream:', audioTracks.length);
      } catch (audioError) {
        console.warn('Failed to add audio tracks:', audioError);
        // Continue without audio if there's an issue
      }

      setProcessedStream(outputStream);

      // Start processing frames
      processFrame();

    } catch (err) {
      console.error('Failed to start background processing:', err);
      setError(err instanceof Error ? err.message : 'Failed to start background processing');
      setIsProcessing(false);
    }
  }, [isSupported, initializeCanvas, width, height, processFrame]);

  // Stop background processing
  const stopProcessing = useCallback(() => {
    setIsProcessing(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (processedStream) {
      processedStream.getTracks().forEach(track => track.stop());
      setProcessedStream(null);
    }

    if (inputVideoRef.current) {
      inputVideoRef.current.srcObject = null;
      inputVideoRef.current = null;
    }
  }, [processedStream]);

  // Set background
  const setBackground = useCallback(async (background: BackgroundOptions) => {
    setCurrentBackground(background);

    // Load background image if needed
    if (background.type === 'image' && background.value) {
      try {
        const img = await loadBackgroundImage(background.value);
        backgroundImageRef.current = img;
      } catch (err) {
        console.error('Failed to load background image:', err);
        setError('Failed to load background image');
      }
    }
  }, [loadBackgroundImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProcessing();
    };
  }, [stopProcessing]);

  return {
    processedStream,
    isProcessing,
    error,
    currentBackground,
    setBackground,
    startProcessing,
    stopProcessing,
    isSupported
  };
};