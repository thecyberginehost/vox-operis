import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Camera,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Eye,
  Settings,
  Sparkles,
  FileText,
  X
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

interface VOBuilderProps {
  onBack: () => void;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordedChunks: Blob[];
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  recordingTime: number;
}

interface VOProfile {
  title: string;
  description: string;
  tags: string[];
  style: 'professional' | 'conversational' | 'creative';
  recordingType: 'video' | 'audio';
}

const VOBuilder = ({ onBack }: VOBuilderProps) => {
  const { profile } = useProfile();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [voProfile, setVOProfile] = useState<VOProfile>({
    title: '',
    description: '',
    tags: [],
    style: 'professional',
    recordingType: 'video'
  });

  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    recordedChunks: [],
    mediaRecorder: null,
    stream: null,
    recordingTime: 0
  });

  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Script template state
  const [availableScripts, setAvailableScripts] = useState<any[]>([]);
  const [selectedScript, setSelectedScript] = useState<any | null>(null);
  const [showScriptPanel, setShowScriptPanel] = useState(false);
  const [loadingScripts, setLoadingScripts] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load scripts on mount and check for scriptId in URL
  useEffect(() => {
    loadScripts();
    const params = new URLSearchParams(location.search);
    const scriptId = params.get('scriptId');
    if (scriptId) {
      loadScriptById(scriptId);
    }
  }, [location.search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingState.stream) {
        recordingState.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [recordingState.stream]);

  const loadScripts = async () => {
    try {
      setLoadingScripts(true);
      const { data, error } = await supabase
        .from('script_generations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableScripts(data || []);
    } catch (error) {
      console.error('Error loading scripts:', error);
    } finally {
      setLoadingScripts(false);
    }
  };

  const loadScriptById = async (scriptId: string) => {
    try {
      const { data, error } = await supabase
        .from('script_generations')
        .select('*')
        .eq('id', scriptId)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedScript(data);
        setShowScriptPanel(true);
      }
    } catch (error) {
      console.error('Error loading script:', error);
    }
  };

  const steps = [
    { number: 1, title: "Profile Setup", description: "Configure your VO profile" },
    { number: 2, title: "Recording", description: "Record your video/audio" },
    { number: 3, title: "Review", description: "Review and publish" }
  ];

  const suggestedTags = [
    'Introduction', 'Experience', 'Skills', 'Goals', 'Personality', 'Communication',
    'Leadership', 'Problem Solving', 'Creativity', 'Team Work', 'Adaptability',
    'Customer Service', 'Technical', 'Management', 'Sales', 'Marketing'
  ];

  const addTag = (tag: string) => {
    if (!voProfile.tags.includes(tag) && voProfile.tags.length < 10) {
      setVOProfile(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setVOProfile(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const startRecording = async () => {
    try {
      setError(null);
      const constraints = voProfile.recordingType === 'video'
        ? { video: true, audio: true }
        : { video: false, audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current && voProfile.recordingType === 'video') {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: voProfile.recordingType === 'video' ? 'video/webm' : 'audio/webm'
        });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);

        if (playbackRef.current) {
          playbackRef.current.src = url;
        }
      };

      mediaRecorder.start();

      setRecordingState({
        isRecording: true,
        isPaused: false,
        recordedChunks: chunks,
        mediaRecorder,
        stream,
        recordingTime: 0
      });

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1
        }));
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const pauseRecording = () => {
    if (recordingState.mediaRecorder && recordingState.isRecording) {
      recordingState.mediaRecorder.pause();
      setRecordingState(prev => ({ ...prev, isPaused: true }));
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (recordingState.mediaRecorder && recordingState.isPaused) {
      recordingState.mediaRecorder.resume();
      setRecordingState(prev => ({ ...prev, isPaused: false }));

      // Restart timer
      timerRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1
        }));
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (recordingState.mediaRecorder && recordingState.isRecording) {
      recordingState.mediaRecorder.stop();
      recordingState.stream?.getTracks().forEach(track => track.stop());

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        mediaRecorder: null,
        stream: null
      }));

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const resetRecording = () => {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }

    setRecordingState(prev => ({
      ...prev,
      recordedChunks: [],
      recordingTime: 0
    }));

    if (playbackRef.current) {
      playbackRef.current.src = '';
    }
  };

  const uploadAndSave = async () => {
    if (!recordingUrl || !profile?.id) {
      setError('No recording available or user not authenticated');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Convert blob URL to blob
      const response = await fetch(recordingUrl);
      const blob = await response.blob();

      const fileExtension = voProfile.recordingType === 'video' ? 'webm' : 'webm';
      const fileName = `vo-${profile.id}-${Date.now()}.${fileExtension}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('vo-recordings')
        .upload(filePath, blob, {
          contentType: voProfile.recordingType === 'video' ? 'video/webm' : 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(50);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vo-recordings')
        .getPublicUrl(filePath);

      setUploadProgress(75);

      // Save VO profile to database with all metadata
      const { error: dbError } = await supabase
        .from('vo_profiles')
        .insert({
          user_id: profile.id,
          title: voProfile.title,
          description: voProfile.description || null,
          // Save to appropriate field based on recording type
          video_url: voProfile.recordingType === 'video' ? publicUrl : null,
          audio_file_url: voProfile.recordingType === 'audio' ? publicUrl : null,
          thumbnail_url: null, // TODO: Generate thumbnail for videos
          tags: voProfile.tags,
          recording_type: voProfile.recordingType,
          recording_style: voProfile.style,
          duration_seconds: recordingState.recordingTime,
          file_size_bytes: blob.size,
          is_active: true,
          is_featured: false,
          view_count: 0,
          like_count: 0,
          share_count: 0
        });

      if (dbError) {
        throw dbError;
      }

      setUploadProgress(100);

      // Success - go to next step or redirect
      setTimeout(() => {
        onBack();
      }, 1000);

    } catch (err) {
      console.error('Error uploading VO:', err);
      setError(err instanceof Error ? err.message : 'Failed to save VO profile');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Profile Setup
              </CardTitle>
              <CardDescription>
                Configure your VO profile details before recording
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Profile Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Software Engineer Introduction, Marketing Professional Showcase"
                  value={voProfile.title}
                  onChange={(e) => setVOProfile(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this VO profile is about, what skills or experience you'll highlight..."
                  value={voProfile.description}
                  onChange={(e) => setVOProfile(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Recording Type</Label>
                <Select value={voProfile.recordingType} onValueChange={(value: 'video' | 'audio') =>
                  setVOProfile(prev => ({ ...prev, recordingType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video + Audio (Recommended)</SelectItem>
                    <SelectItem value="audio">Audio Only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Video recordings showcase personality and communication skills better
                </p>
              </div>

              <div className="space-y-2">
                <Label>Presentation Style</Label>
                <Select value={voProfile.style} onValueChange={(value: 'professional' | 'conversational' | 'creative') =>
                  setVOProfile(prev => ({ ...prev, style: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional & Formal</SelectItem>
                    <SelectItem value="conversational">Conversational & Friendly</SelectItem>
                    <SelectItem value="creative">Creative & Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Script Template (Optional)</Label>

                {availableScripts.length === 0 && !loadingScripts ? (
                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium text-blue-800 dark:text-blue-400 mb-2">No scripts found</p>
                      <p className="text-sm text-blue-600 dark:text-blue-500 mb-3">
                        Would you like to create a script first? Scripts help you stay organized and confident during recording.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open('/dashboard/copilot', '_blank')}
                          className="border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate Script
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Just continue without script
                            setSelectedScript(null);
                            setShowScriptPanel(false);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        >
                          Skip - Record Freely
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Select
                      value={selectedScript?.id || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setSelectedScript(null);
                          setShowScriptPanel(false);
                        } else if (value === 'create') {
                          window.open('/dashboard/copilot', '_blank');
                        } else {
                          const script = availableScripts.find(s => s.id === value);
                          setSelectedScript(script);
                          setShowScriptPanel(true);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a script or skip" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center">
                            <span>No script - Record freely</span>
                          </div>
                        </SelectItem>
                        {loadingScripts ? (
                          <SelectItem value="loading" disabled>Loading scripts...</SelectItem>
                        ) : (
                          <>
                            {availableScripts.map(script => (
                              <SelectItem key={script.id} value={script.id}>
                                {script.metadata?.title || 'Untitled Script'}
                              </SelectItem>
                            ))}
                            <Separator className="my-2" />
                            <SelectItem value="create">
                              <div className="flex items-center text-primary">
                                <Sparkles className="h-3 w-3 mr-2" />
                                <span>Create New Script...</span>
                              </div>
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>

                    {!selectedScript && availableScripts.length > 0 && (
                      <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm text-amber-600 dark:text-amber-500">
                          <p className="font-medium mb-1">Recording without a script?</p>
                          <p>You can select a saved script above to guide your recording, or continue freely without one.</p>
                        </AlertDescription>
                      </Alert>
                    )}

                    {selectedScript && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Script selected: {selectedScript.metadata?.title || 'Untitled'}</span>
                      </div>
                    )}
                  </>
                )}

                <p className="text-sm text-muted-foreground">
                  Scripts provide structure and help you deliver confident, well-organized recordings
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tags (Optional)</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {voProfile.tags.map(tag => (
                    <Badge key={tag} variant="default" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.filter(tag => !voProfile.tags.includes(tag)).map(tag => (
                    <Badge key={tag} variant="outline" className="cursor-pointer" onClick={() => addTag(tag)}>
                      + {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Click tags to add them (max 10). These help others find your VO profile.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {voProfile.recordingType === 'video' ? <Camera className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  Recording Studio
                </CardTitle>
                <CardDescription>
                  Record your VO profile. Tip: Keep it under 2 minutes for best engagement!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Recording Preview */}
              {voProfile.recordingType === 'video' && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className={`w-full max-w-md mx-auto rounded-lg border ${
                      recordingState.isRecording ? 'ring-2 ring-red-500' : ''
                    }`}
                    style={{ display: recordingState.isRecording ? 'block' : 'none' }}
                  />
                  {recordingState.isRecording && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                      REC {formatTime(recordingState.recordingTime)}
                    </div>
                  )}
                </div>
              )}

              {voProfile.recordingType === 'audio' && recordingState.isRecording && (
                <div className="text-center p-8 border rounded-lg">
                  <Mic className={`h-16 w-16 mx-auto mb-4 ${recordingState.isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
                  <p className="text-lg font-medium">Recording Audio...</p>
                  <p className="text-2xl font-mono mt-2">{formatTime(recordingState.recordingTime)}</p>
                </div>
              )}

              {/* Recording Controls */}
              <div className="flex justify-center gap-4">
                {!recordingState.isRecording && !recordingUrl && (
                  <Button onClick={startRecording} size="lg" className="gap-2">
                    {voProfile.recordingType === 'video' ? <Camera className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    Start Recording
                  </Button>
                )}

                {recordingState.isRecording && (
                  <>
                    {recordingState.isPaused ? (
                      <Button onClick={resumeRecording} size="lg" variant="default" className="gap-2">
                        <Play className="h-4 w-4" />
                        Resume
                      </Button>
                    ) : (
                      <Button onClick={pauseRecording} size="lg" variant="outline" className="gap-2">
                        <Pause className="h-4 w-4" />
                        Pause
                      </Button>
                    )}
                    <Button onClick={stopRecording} size="lg" variant="destructive" className="gap-2">
                      <Square className="h-4 w-4" />
                      Stop
                    </Button>
                  </>
                )}

                {recordingUrl && (
                  <Button onClick={resetRecording} size="lg" variant="outline" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Record Again
                  </Button>
                )}
              </div>

              {/* Playback */}
              {recordingUrl && (
                <div className="space-y-4">
                  <Separator />
                  <div className="text-center">
                    <h3 className="font-semibold mb-4">Preview Your Recording</h3>
                    <video
                      ref={playbackRef}
                      controls
                      className="w-full max-w-md mx-auto rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Script Panel */}
          {selectedScript && (
            <Card className="lg:sticky lg:top-6 h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Script Guide
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedScript(null);
                      setShowScriptPanel(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {selectedScript.metadata?.title || 'Your Script'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    <div className="text-xs text-muted-foreground flex items-center gap-4">
                      <span>{selectedScript.word_count || selectedScript.generated_script.split(/\s+/).length} words</span>
                      <span>~{Math.ceil((selectedScript.word_count || selectedScript.generated_script.split(/\s+/).length) / 150)} min</span>
                    </div>
                    <Separator />
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                        {selectedScript.generated_script}
                      </pre>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Review & Publish
              </CardTitle>
              <CardDescription>
                Review your VO profile before publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>Uploading your VO profile...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm text-muted-foreground">{voProfile.title}</p>
                </div>

                {voProfile.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{voProfile.description}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {voProfile.recordingType} Recording - {voProfile.style} Style
                  </p>
                </div>

                {voProfile.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {voProfile.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {recordingUrl && (
                  <div>
                    <Label className="text-sm font-medium">Recording Preview</Label>
                    <video
                      controls
                      src={recordingUrl}
                      className="w-full max-w-sm rounded-lg border mt-2"
                    />
                  </div>
                )}
              </div>

              {recordingUrl && !uploading && (
                <Button onClick={uploadAndSave} size="lg" className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Publish VO Profile
                </Button>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={onBack} className="mb-4">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold">VO Profile Builder</h1>
          <p className="text-muted-foreground">
            Create your video/voice profile to replace traditional CVs
          </p>
        </div>

        {/* Steps Progress */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium ${
                currentStep >= step.number
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-muted-foreground text-muted-foreground'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 w-12 mx-4 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <Button
            onClick={() => {
              if (currentStep === 1 && !voProfile.title.trim()) {
                setError('Please enter a title for your VO profile');
                return;
              }
              if (currentStep === 2 && !recordingUrl) {
                setError('Please record your VO profile first');
                return;
              }
              setError(null);
              setCurrentStep(Math.min(3, currentStep + 1));
            }}
            disabled={currentStep === 3 || uploading}
          >
            {currentStep === 3 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VOBuilder;