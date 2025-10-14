import { useState, useRef, useCallback, useEffect } from 'react';

export interface VoiceRecording {
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
}

export interface UseVoiceRecorderOptions {
  maxDuration?: number; // in seconds
  audioBitsPerSecond?: number;
  mimeType?: string;
}

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  isSupported: boolean;
  duration: number;
  currentRecording: VoiceRecording | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  resetError: () => void;
}

export const useVoiceRecorder = (options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn => {
  const {
    maxDuration = 120, // 2 minutes default
    audioBitsPerSecond = 128000,
    mimeType = 'audio/webm;codecs=opus'
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<VoiceRecording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if MediaRecorder API is supported
  const isSupported = typeof MediaRecorder !== 'undefined' && navigator.mediaDevices?.getUserMedia;

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

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Voice recording is not supported in your browser');
      return;
    }

    try {
      setError(null);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm',
        audioBitsPerSecond
      });

      mediaRecorderRef.current = recorder;

      // Handle data available
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      // Handle recording stop
      recorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

        const recording: VoiceRecording = {
          blob: audioBlob,
          url: audioUrl,
          duration: duration,
          timestamp: new Date()
        };

        setCurrentRecording(recording);
        setIsRecording(false);
        setIsPaused(false);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      });

      // Start recording
      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();

      // Start duration timer
      intervalRef.current = setInterval(updateDuration, 100);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [isSupported, mimeType, audioBitsPerSecond, duration, updateDuration]);

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

  // Clear current recording
  const clearRecording = useCallback(() => {
    if (currentRecording?.url) {
      URL.revokeObjectURL(currentRecording.url);
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
    };
  }, [currentRecording]);

  return {
    isRecording,
    isPaused,
    isSupported,
    duration,
    currentRecording,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    resetError
  };
};