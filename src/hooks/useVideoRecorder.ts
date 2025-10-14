import { useState, useRef, useCallback, useEffect } from 'react';

export interface VideoRecording {
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
  thumbnailUrl?: string;
}

export interface UseVideoRecorderOptions {
  maxDuration?: number; // in seconds
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface UseVideoRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  isSupported: boolean;
  isCameraReady: boolean;
  duration: number;
  currentRecording: VideoRecording | null;
  error: string | null;
  previewStream: MediaStream | null;
  startRecording: (customStream?: MediaStream) => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  resetError: () => void;
  initializeCamera: () => Promise<void>;
  stopCamera: () => void;
}

export const useVideoRecorder = (options: UseVideoRecorderOptions = {}): UseVideoRecorderReturn => {
  const {
    maxDuration = 120, // 2 minutes default
    videoBitsPerSecond = 2500000, // 2.5 Mbps
    audioBitsPerSecond = 128000,
    mimeType = 'video/webm;codecs=vp8,opus',
    width = 640,
    height = 480
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<VideoRecording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if MediaRecorder and getUserMedia are supported
  const isSupported = typeof MediaRecorder !== 'undefined' &&
                     navigator.mediaDevices?.getUserMedia &&
                     typeof navigator.mediaDevices.getUserMedia === 'function';

  // Generate thumbnail from video blob
  const generateThumbnail = useCallback((videoBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.addEventListener('loadedmetadata', () => {
        canvas.width = width;
        canvas.height = height;
        video.currentTime = Math.min(1, video.duration / 2); // Capture frame at 1s or middle
      });

      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve(thumbnailUrl);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);

        // Clean up
        URL.revokeObjectURL(video.src);
      });

      video.src = URL.createObjectURL(videoBlob);
    });
  }, [width, height]);

  // Update duration timer
  const updateDuration = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setDuration(elapsed);

      // Auto-stop at max duration
      if (elapsed >= maxDuration) {
        stopRecording();
      }
    }
  }, [maxDuration]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!isSupported) {
      setError('Video recording is not supported in your browser');
      return;
    }

    try {
      setError(null);

      const constraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: 30, max: 30 },
          facingMode: 'user' // Front camera preferred
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPreviewStream(stream);
      setIsCameraReady(true);

    } catch (err) {
      console.error('Error accessing camera:', err);
      let errorMessage = 'Failed to access camera';

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsCameraReady(false);
    }
  }, [isSupported, width, height]);

  // Start recording
  const startRecording = useCallback(async (customStream?: MediaStream) => {
    // Use custom stream if provided, otherwise use the camera stream
    const streamToUse = customStream || streamRef.current;

    if (!streamToUse) {
      await initializeCamera();
      if (!streamRef.current) return;
    }

    try {
      setError(null);
      videoChunksRef.current = [];

      // Determine the best supported mime type
      let finalMimeType = mimeType;
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        const fallbacks = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4'
        ];

        finalMimeType = fallbacks.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
      }

      // Create MediaRecorder with the stream to use
      const finalStream = streamToUse || streamRef.current;
      if (!finalStream) {
        throw new Error('No stream available for recording');
      }

      const recorderOptions: MediaRecorderOptions = {
        mimeType: finalMimeType
      };

      // Only add bitrate options if they're supported
      if (videoBitsPerSecond && videoBitsPerSecond > 0) {
        recorderOptions.videoBitsPerSecond = videoBitsPerSecond;
      }
      if (audioBitsPerSecond && audioBitsPerSecond > 0) {
        recorderOptions.audioBitsPerSecond = audioBitsPerSecond;
      }

      const recorder = new MediaRecorder(finalStream, recorderOptions);

      mediaRecorderRef.current = recorder;

      // Handle data available
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      });

      // Handle recording stop
      recorder.addEventListener('stop', async () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: recorder.mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);

        try {
          // Generate thumbnail
          const thumbnailUrl = await generateThumbnail(videoBlob);

          const recording: VideoRecording = {
            blob: videoBlob,
            url: videoUrl,
            duration: duration,
            timestamp: new Date(),
            thumbnailUrl
          };

          setCurrentRecording(recording);
        } catch (thumbnailError) {
          console.warn('Failed to generate thumbnail:', thumbnailError);

          const recording: VideoRecording = {
            blob: videoBlob,
            url: videoUrl,
            duration: duration,
            timestamp: new Date()
          };

          setCurrentRecording(recording);
        }

        setIsRecording(false);
        setIsPaused(false);
      });

      // Add error event listener before starting
      recorder.addEventListener('error', (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        setIsRecording(false);
        setIsPaused(false);
      });

      // Start recording with error handling
      try {
        recorder.start(100); // Record in 100ms chunks for better performance
        console.log('MediaRecorder started successfully');
        setIsRecording(true);
        setIsPaused(false);
        startTimeRef.current = Date.now();

        // Start duration timer
        intervalRef.current = setInterval(updateDuration, 100);
      } catch (startError) {
        console.error('Failed to start MediaRecorder:', startError);
        throw startError;
      }

    } catch (err) {
      console.error('Error starting video recording:', err);
      let errorMessage = 'Failed to start recording';

      if (err instanceof Error) {
        if (err.name === 'NotSupportedError') {
          errorMessage = 'Recording format not supported by your browser';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Recording blocked by browser security settings';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    }
  }, [initializeCamera, mimeType, videoBitsPerSecond, audioBitsPerSecond, duration, updateDuration, generateThumbnail]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRecording]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer
      intervalRef.current = setInterval(updateDuration, 100);
    }
  }, [isRecording, isPaused, updateDuration]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setPreviewStream(null);
      setIsCameraReady(false);
    }
  }, []);

  // Clear current recording
  const clearRecording = useCallback(() => {
    if (currentRecording?.url) {
      URL.revokeObjectURL(currentRecording.url);
    }
    if (currentRecording?.thumbnailUrl) {
      URL.revokeObjectURL(currentRecording.thumbnailUrl);
    }
    setCurrentRecording(null);
    setDuration(0);
  }, [currentRecording]);

  // Reset error
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (currentRecording?.url) {
        URL.revokeObjectURL(currentRecording.url);
      }
      if (currentRecording?.thumbnailUrl) {
        URL.revokeObjectURL(currentRecording.thumbnailUrl);
      }
    };
  }, [currentRecording]);

  return {
    isRecording,
    isPaused,
    isSupported,
    isCameraReady,
    duration,
    currentRecording,
    error,
    previewStream,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    resetError,
    initializeCamera,
    stopCamera
  };
};