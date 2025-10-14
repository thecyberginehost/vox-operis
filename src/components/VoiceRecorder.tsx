import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Clock,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { useVoiceRecorder, VoiceRecording } from '@/hooks/useVoiceRecorder';
import { cn } from '@/lib/utils';

export interface VoiceRecorderProps {
  maxDuration?: number;
  onRecordingComplete?: (recording: VoiceRecording) => void;
  onRecordingClear?: () => void;
  className?: string;
  compact?: boolean;
  uploadEnabled?: boolean;
  downloadEnabled?: boolean;
  autoStart?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  maxDuration = 120,
  onRecordingComplete,
  onRecordingClear,
  className,
  compact = false,
  uploadEnabled = true,
  downloadEnabled = true,
  autoStart = false
}) => {
  const {
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
  } = useVoiceRecorder({ maxDuration });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && isSupported && !currentRecording) {
      startRecording();
    }
  }, [autoStart, isSupported, currentRecording, startRecording]);

  // Notify parent when recording is complete
  useEffect(() => {
    if (currentRecording && onRecordingComplete) {
      onRecordingComplete(currentRecording);
    }
  }, [currentRecording, onRecordingComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClearRecording = () => {
    clearRecording();
    resetError();
    onRecordingClear?.();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const recording: VoiceRecording = {
          blob: file,
          url,
          duration: 0, // Will be updated by audio element
          timestamp: new Date()
        };

        // Create audio element to get duration
        const audio = new Audio(url);
        audio.addEventListener('loadedmetadata', () => {
          recording.duration = audio.duration;
          onRecordingComplete?.(recording);
        });
      } else {
        resetError();
        // Set error for invalid file type
      }
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (currentRecording) {
      const link = document.createElement('a');
      link.href = currentRecording.url;
      link.download = `voice-recording-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const progressPercentage = (duration / maxDuration) * 100;

  if (!isSupported) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Voice recording is not supported in your browser. Please try a modern browser like Chrome, Firefox, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!currentRecording ? (
          <>
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!!error}
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-1" />
                  Record
                </>
              )}
            </Button>

            {isRecording && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 recording-indicator" />
                <span className="font-mono">{formatTime(duration)}</span>
              </div>
            )}

            {uploadEnabled && (
              <>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <AudioPlayer recording={currentRecording} compact />
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearRecording}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Recording Status */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {isRecording && (
                <div className="w-3 h-3 recording-indicator mr-2" />
              )}
              <h3 className="text-lg font-semibold">
                {isRecording
                  ? isPaused
                    ? "Recording Paused"
                    : "Recording..."
                  : currentRecording
                    ? "Recording Complete"
                    : "Ready to Record"
                }
              </h3>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono">
                {formatTime(duration)} / {formatTime(maxDuration)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0:00</span>
              <span>{formatTime(maxDuration)}</span>
            </div>
          </div>

          {/* Recording Controls */}
          {!currentRecording && (
            <div className="flex justify-center space-x-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={!!error}
                  className="flex-1"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="flex-1"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={stopRecording}
                    className="flex-1"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Upload Option */}
          {uploadEnabled && !currentRecording && !isRecording && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
              <div className="mt-2">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Audio File
                </Button>
              </div>
            </div>
          )}

          {/* Playback & Controls */}
          {currentRecording && (
            <div className="space-y-3">
              <AudioPlayer recording={currentRecording} />

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleClearRecording}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>

                {downloadEnabled && (
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Audio Player Component
interface AudioPlayerProps {
  recording: VoiceRecording;
  compact?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ recording, compact = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(recording.duration);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlayback}
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
        <div className="flex-1 min-w-0">
          <div className="w-full bg-secondary rounded-full h-1">
            <div
              className="bg-primary h-1 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {formatTime(currentTime)}
        </span>
        <audio ref={audioRef} src={recording.url} />
      </div>
    );
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center space-x-3 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlayback}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Voice Recording</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span className="font-mono">{formatTime(currentTime)}</span>
        <span className="font-mono">{formatTime(duration)}</span>
      </div>

      <audio ref={audioRef} src={recording.url} />
    </div>
  );
};