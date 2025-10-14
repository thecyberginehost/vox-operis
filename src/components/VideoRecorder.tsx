import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Video,
  VideoOff,
  Square,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Clock,
  Camera,
  AlertCircle,
  RotateCcw,
  Image as ImageIcon,
  Settings,
  X,
  Maximize,
  Minimize
} from 'lucide-react';
import { useVideoRecorder, VideoRecording } from '@/hooks/useVideoRecorder';
import { useBackgroundReplacement, BackgroundOptions } from '@/hooks/useBackgroundReplacement';
import { BackgroundSelector } from '@/components/BackgroundSelector';
import { cn } from '@/lib/utils';

export interface VideoRecorderProps {
  maxDuration?: number;
  onRecordingComplete?: (recording: VideoRecording) => void;
  onRecordingClear?: () => void;
  className?: string;
  compact?: boolean;
  uploadEnabled?: boolean;
  downloadEnabled?: boolean;
  width?: number;
  height?: number;
  backgroundEnabled?: boolean;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  maxDuration = 120,
  onRecordingComplete,
  onRecordingClear,
  className,
  compact = false,
  uploadEnabled = true,
  downloadEnabled = true,
  width = 640,
  height = 480,
  backgroundEnabled = true
}) => {
  const {
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
  } = useVideoRecorder({ maxDuration, width, height });

  // Background replacement hook
  const {
    processedStream,
    isProcessing: isBackgroundProcessing,
    currentBackground,
    setBackground,
    startProcessing: startBackgroundProcessing,
    stopProcessing: stopBackgroundProcessing,
    isSupported: isBackgroundSupported
  } = useBackgroundReplacement({ width, height });

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentBackgroundTypeRef = useRef<string>('none');

  // Set up preview video stream (use processed stream if available, but avoid constant switching)
  useEffect(() => {
    if (previewVideoRef.current) {
      const currentSrc = previewVideoRef.current.srcObject;
      const streamToUse = processedStream || previewStream;

      // Only update if we have a new stream and it's different from current
      if (streamToUse && streamToUse !== currentSrc) {
        console.log('Switching video stream:', {
          hasProcessed: !!processedStream,
          hasPreview: !!previewStream,
          currentSrc: !!currentSrc
        });

        // Add a small delay to prevent rapid switching
        const timeoutId = setTimeout(() => {
          if (previewVideoRef.current) {
            previewVideoRef.current.srcObject = streamToUse;
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [previewStream, processedStream]);

  // Start background processing only when user changes background (not automatically)
  useEffect(() => {
    const newBackgroundType = currentBackground.type;

    // Only act if background type actually changed
    if (newBackgroundType !== currentBackgroundTypeRef.current) {
      console.log('Background type changed from', currentBackgroundTypeRef.current, 'to', newBackgroundType);
      currentBackgroundTypeRef.current = newBackgroundType;

      if (newBackgroundType === 'none') {
        // Stop background processing
        if (isBackgroundProcessing) {
          console.log('Stopping background processing - background set to none');
          stopBackgroundProcessing();
        }
      } else if (backgroundEnabled && isBackgroundSupported && previewStream && !isBackgroundProcessing) {
        // Start background processing
        console.log('Starting background processing for background type:', newBackgroundType);
        startBackgroundProcessing(previewStream);
      }
    }
  }, [backgroundEnabled, isBackgroundSupported, previewStream, currentBackground.type, isBackgroundProcessing, startBackgroundProcessing, stopBackgroundProcessing]);

  // Fullscreen handlers (moved up before useEffect that uses them)
  const enterFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) return;

    try {
      if (videoContainerRef.current.requestFullscreen) {
        await videoContainerRef.current.requestFullscreen();
      } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
        await (videoContainerRef.current as any).webkitRequestFullscreen();
      } else if ((videoContainerRef.current as any).msRequestFullscreen) {
        await (videoContainerRef.current as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  // Handle escape key to close background selector or exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showBackgroundSelector) {
          setShowBackgroundSelector(false);
        } else if (isFullscreen) {
          exitFullscreen();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showBackgroundSelector, isFullscreen, exitFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

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

  // Override the start recording to use processed stream if available
  const handleStartRecording = async () => {
    const streamToRecord = processedStream || previewStream;
    try {
      if (streamToRecord) {
        console.log('Recording with processed stream:', streamToRecord);
        await startRecording(streamToRecord);
      } else {
        console.log('Recording with default stream');
        await startRecording();
      }
    } catch (error) {
      console.error('Recording failed:', error);
      resetError();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        const recording: VideoRecording = {
          blob: file,
          url,
          duration: 0, // Will be updated by video element
          timestamp: new Date()
        };

        // Create video element to get duration
        const video = document.createElement('video');
        video.addEventListener('loadedmetadata', () => {
          recording.duration = video.duration;
          onRecordingComplete?.(recording);
        });
        video.src = url;
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
      link.download = `video-recording-${Date.now()}.webm`;
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
          Video recording is not supported in your browser. Please try a modern browser like Chrome, Firefox, or Safari.
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
            {!isCameraReady ? (
              <Button
                variant="outline"
                size="sm"
                onClick={initializeCamera}
                disabled={!!error}
              >
                <Camera className="h-4 w-4 mr-1" />
                Setup Camera
              </Button>
            ) : (
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                onClick={isRecording ? stopRecording : handleStartRecording}
                disabled={!!error}
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-1" />
                    Record
                  </>
                )}
              </Button>
            )}

            {isRecording && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="font-mono">{formatTime(duration)}</span>
              </div>
            )}

            {uploadEnabled && (
              <>
                <input
                  type="file"
                  accept="video/*"
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
            <VideoPlayer recording={currentRecording} compact />
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
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
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
                    : isCameraReady
                      ? "Ready to Record"
                      : "Camera Setup Required"
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

          {/* Camera Preview / Video Playback */}
          <div
            ref={videoContainerRef}
            className={cn(
              "relative bg-black rounded-lg overflow-hidden",
              isFullscreen && "fixed inset-0 z-50 rounded-none flex items-center justify-center"
            )}
          >
            {!currentRecording ? (
              <>
                {/* Camera Preview */}
                <video
                  ref={previewVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={cn(
                    "w-full object-cover",
                    isFullscreen ? "h-screen" : "h-80"
                  )}
                  style={{ display: isCameraReady ? 'block' : 'none' }}
                />

                {/* Camera Setup Placeholder */}
                {!isCameraReady && (
                  <div className={cn(
                    "w-full flex items-center justify-center bg-muted",
                    isFullscreen ? "h-screen" : "h-80"
                  )}>
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Camera not initialized</p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={initializeCamera}
                        disabled={!!error}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Setup Camera
                      </Button>
                    </div>
                  </div>
                )}

                {/* Recording Overlay */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm font-mono font-semibold">{formatTime(duration)}</span>
                    <span className="text-xs text-red-400">REC</span>
                  </div>
                )}

                {/* Video Controls */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  {/* Fullscreen Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                    className="bg-black/60 hover:bg-black/80 border-white/30 text-white font-medium shadow-lg"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize className="h-4 w-4 mr-2" />
                        Exit Fullscreen
                      </>
                    ) : (
                      <>
                        <Maximize className="h-4 w-4 mr-2" />
                        Fullscreen
                      </>
                    )}
                  </Button>

                  {/* Background Controls */}
                  {backgroundEnabled && isCameraReady && !isRecording && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
                      className="bg-black/60 hover:bg-black/80 border-white/30 text-white font-medium shadow-lg"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Background
                    </Button>
                  )}
                </div>

                {/* Background Selector Overlay */}
                {showBackgroundSelector && backgroundEnabled && (
                  <div className="absolute inset-0 bg-black/90 rounded-lg flex flex-col">
                    {/* Header with close button */}
                    <div className="flex items-center justify-between p-4 border-b border-white/20">
                      <h3 className="text-white text-lg font-semibold flex items-center">
                        <ImageIcon className="h-5 w-5 mr-2" />
                        Choose Background
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBackgroundSelector(false)}
                        className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Close
                      </Button>
                    </div>

                    {/* Background selector content */}
                    <div className="flex-1 p-4 overflow-y-auto">
                      <BackgroundSelector
                        currentBackground={currentBackground}
                        onBackgroundChange={(bg) => {
                          setBackground(bg);
                          // Auto-close after selection for better UX
                          setTimeout(() => setShowBackgroundSelector(false), 500);
                        }}
                        className="max-w-lg w-full mx-auto"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Video Playback */
              <VideoPlayer recording={currentRecording} isFullscreen={isFullscreen} />
            )}
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
              {!isCameraReady ? (
                <Button
                  onClick={initializeCamera}
                  disabled={!!error}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Initialize Camera
                </Button>
              ) : !isRecording ? (
                <>
                  <Button
                    onClick={handleStartRecording}
                    disabled={!!error}
                    className="flex-1"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stopCamera}
                  >
                    <VideoOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                </>
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
                    Stop Recording
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
                  accept="video/*"
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
                  Upload Video File
                </Button>
              </div>
            </div>
          )}

          {/* Playback & Controls */}
          {currentRecording && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleClearRecording}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear & Record Again
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Video Player Component
interface VideoPlayerProps {
  recording: VideoRecording;
  compact?: boolean;
  isFullscreen?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ recording, compact = false, isFullscreen = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(recording.duration);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
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
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={recording.url}
        className={cn(
          "w-full object-cover rounded-lg",
          isFullscreen ? "h-screen rounded-none" : "h-80"
        )}
        controls={false}
        onClick={togglePlayback}
      />

      {/* Video Controls Overlay */}
      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={togglePlayback}
            className="bg-black/50 hover:bg-black/70 border-white/20"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 text-white" />
            ) : (
              <Play className="h-6 w-6 text-white" />
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center space-x-2 text-white text-sm">
            <span className="font-mono">{formatTime(currentTime)}</span>
            <div className="flex-1 bg-white/20 rounded-full h-1">
              <div
                className="bg-white h-1 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="font-mono">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};