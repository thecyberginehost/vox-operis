import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Mic, Play, Plus, ArrowLeft, ArrowRight, Save, X } from "lucide-react";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { VideoRecorder } from "@/components/VideoRecorder";
import { VoiceRecording } from "@/hooks/useVoiceRecorder";
import { VideoRecording } from "@/hooks/useVideoRecorder";

interface VOCreationFlowProps {
  onComplete: () => void;
}

const VOCreationFlow = ({ onComplete }: VOCreationFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    headline: "",
    introVideo: null,
    journey: {
      focus: "",
      focusAudio: null,
      approach: "",
      approachAudio: null,
      uniqueValue: "",
      uniqueValueAudio: null,
    },
    careerPhases: [
      { title: "", startDate: "", endDate: "", audio: null }
    ],
    thoughtCards: [
      { thought: "", audio: null, tags: [] }
    ]
  });

  const steps = [
    { number: 1, title: "Headline & Intro Video", description: "Upload or record a short video" },
    { number: 2, title: "My Journey", description: "Share your professional focus" },
    { number: 3, title: "Career Overview", description: "Build your career timeline" },
    { number: 4, title: "How I Think", description: "Express your values and beliefs" }
  ];

  const progressPercentage = (currentStep / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onComplete}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <img src="https://ai-stream-solutions.s3.us-east-1.amazonaws.com/VO.png" alt="Vox-Operis" className="h-6 w-auto object-contain" />
              <span className="text-lg font-semibold">Create New VO</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>
            <div className="w-32">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Input Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {steps[currentStep - 1].title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {steps[currentStep - 1].description}
              </p>
            </div>

            {currentStep === 1 && <Step1Content formData={formData} setFormData={setFormData} />}
            {currentStep === 2 && <Step2Content formData={formData} setFormData={setFormData} />}
            {currentStep === 3 && <Step3Content formData={formData} setFormData={setFormData} />}
            {currentStep === 4 && <Step4Content formData={formData} setFormData={setFormData} />}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onComplete}>
                  <Save className="h-4 w-4 mr-2" />
                  Save & Exit
                </Button>
                <Button variant="ghost">Skip for now</Button>
              </div>
              
              <div className="flex space-x-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button variant="hero" onClick={nextStep}>
                  {currentStep === steps.length ? "Finish & Preview" : "Continue"}
                  {currentStep < steps.length && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <Card className="elevated-card">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>See how your profile will look</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.headline && (
                    <div>
                      <h3 className="font-semibold text-lg">{formData.headline}</h3>
                    </div>
                  )}
                  
                  {formData.introVideo && (
                    <div className="bg-muted rounded-lg h-32 flex items-center justify-center">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {currentStep >= 2 && (
                    <div className="space-y-2">
                      {formData.journey.focus && (
                        <div className="p-3 bg-muted/50 rounded">
                          <p className="text-sm">{formData.journey.focus}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 1: Headline & Intro Video
const Step1Content = ({ formData, setFormData }: any) => (
  <div className="space-y-6">
    <Card className="elevated-card">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="headline">Your Headline (150 characters max)</Label>
            <Input
              id="headline"
              placeholder="e.g., UX Designer & Creative Problem Solver"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              maxLength={150}
            />
            <div className="text-sm text-muted-foreground mt-1">
              {formData.headline.length}/150 characters
            </div>
          </div>

          <div>
            <Label>Intro Video/Audio (max 2 mins for free plan)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Upload video (MP4, MOV, WebM) or record audio - max 2 mins, 100MB
              </p>
              <div className="flex justify-center space-x-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Button variant="outline" size="sm">
                  <Mic className="h-4 w-4 mr-2" />
                  Record Video
                </Button>
              </div>
            </div>

            {/* Voice Recording Option */}
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or record with camera</span>
                </div>
              </div>
              <div className="mt-4">
                <VideoRecorder
                  maxDuration={120}
                  onRecordingComplete={(recording) => {
                    setFormData({ ...formData, introVideo: recording });
                  }}
                  compact={false}
                  backgroundEnabled={true}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <ExampleCard 
      title="Why create an intro video?"
      content="Your intro video is the first impression viewers get of your voice and personality. It should be warm, professional, and showcase your unique speaking style."
      examples={[
        "Introduce yourself and your expertise",
        "Share what you love about voice work",
        "Highlight your unique approach"
      ]}
    />
  </div>
);

// Step 2: My Journey
const Step2Content = ({ formData, setFormData }: any) => (
  <div className="space-y-6">
    <Card className="elevated-card">
      <CardContent className="p-6 space-y-6">
        {/* Focus */}
        <div>
          <Label>Focus (150 characters max)</Label>
          <Textarea
            placeholder="e.g., I'm a UX designer specializing in creating intuitive interfaces"
            value={formData.journey.focus}
            onChange={(e) => setFormData({
              ...formData,
              journey: { ...formData.journey, focus: e.target.value }
            })}
            maxLength={150}
          />
          <AudioUpload label="Record your focus" />
        </div>

        {/* Approach */}
        <div>
          <Label>Approach (150 characters max)</Label>
          <Textarea
            placeholder="e.g., I combine data-driven insights with creative problem-solving"
            value={formData.journey.approach}
            onChange={(e) => setFormData({
              ...formData,
              journey: { ...formData.journey, approach: e.target.value }
            })}
            maxLength={150}
          />
          <AudioUpload label="Record your approach" />
        </div>

        {/* Unique Value */}
        <div>
          <Label>Unique Value (150 characters max)</Label>
          <Textarea
            placeholder="e.g., My background in psychology gives me a unique lens"
            value={formData.journey.uniqueValue}
            onChange={(e) => setFormData({
              ...formData,
              journey: { ...formData.journey, uniqueValue: e.target.value }
            })}
            maxLength={150}
          />
          <AudioUpload label="Record your unique value" />
        </div>
      </CardContent>
    </Card>

    <ExampleCard 
      title="Example for Inspiration"
      content="Think about what makes your professional journey unique and how you approach challenges."
    />
  </div>
);

// Step 3: Career Overview
const Step3Content = ({ formData, setFormData }: any) => (
  <div className="space-y-6">
    <Card className="elevated-card">
      <CardContent className="p-6">
        <div className="space-y-6">
          {formData.careerPhases.map((phase: any, index: number) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="space-y-4">
                <Input
                  placeholder="Phase title (e.g., The Beginning)"
                  value={phase.title}
                  onChange={(e) => {
                    const newPhases = [...formData.careerPhases];
                    newPhases[index].title = e.target.value;
                    setFormData({ ...formData, careerPhases: newPhases });
                  }}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={phase.startDate} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={phase.endDate} />
                  </div>
                </div>
                
                <AudioUpload label="Record this career phase" />
              </div>
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={() => setFormData({
              ...formData,
              careerPhases: [...formData.careerPhases, { title: "", startDate: "", endDate: "", audio: null }]
            })}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Career Phase
          </Button>
        </div>
      </CardContent>
    </Card>

    <ExampleCard 
      title="Example Prompts"
      examples={[
        "The Foundation - Where it all began",
        "The Challenge - Overcoming obstacles",
        "The Breakthrough - Key achievements"
      ]}
    />
  </div>
);

// Step 4: How I Think
const Step4Content = ({ formData, setFormData }: any) => (
  <div className="space-y-6">
    <Card className="elevated-card">
      <CardContent className="p-6">
        <div className="space-y-6">
          {formData.thoughtCards.map((card: any, index: number) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="e.g., Complexity is the enemy of execution"
                  value={card.thought}
                  onChange={(e) => {
                    const newCards = [...formData.thoughtCards];
                    newCards[index].thought = e.target.value;
                    setFormData({ ...formData, thoughtCards: newCards });
                  }}
                  maxLength={150}
                />
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Collaboration</Badge>
                  <Badge variant="outline">Make It Easy</Badge>
                  <Badge variant="outline">Outside the Box</Badge>
                </div>
                
                <AudioUpload label="Record this thought" />
              </div>
            </div>
          ))}
          
          {formData.thoughtCards.length < 3 && (
            <Button
              variant="outline"
              onClick={() => setFormData({
                ...formData,
                thoughtCards: [...formData.thoughtCards, { thought: "", audio: null, tags: [] }]
              })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Thought Card
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    <ExampleCard 
      title="Example for Inspiration"
      content="Share the principles and beliefs that guide your work and decision-making."
    />
  </div>
);

// Reusable Components
const AudioUpload = ({
  label,
  onRecordingComplete,
  includeVideo = false
}: {
  label: string;
  onRecordingComplete?: (recording: VoiceRecording | VideoRecording) => void;
  includeVideo?: boolean;
}) => (
  <div className="mt-3">
    <p className="text-sm text-muted-foreground mb-2">{label}</p>
    <div className="space-y-3">
      <VoiceRecorder
        maxDuration={120}
        onRecordingComplete={onRecordingComplete}
        compact={true}
        className="justify-start"
      />
      {includeVideo && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or with video</span>
            </div>
          </div>
          <VideoRecorder
            maxDuration={120}
            onRecordingComplete={onRecordingComplete}
            compact={true}
            className="justify-start"
          />
        </>
      )}
    </div>
  </div>
);

const ExampleCard = ({ title, content, examples }: { title: string; content?: string; examples?: string[] }) => (
  <Card className="bg-accent/20 border-accent/30">
    <CardContent className="p-6">
      <h3 className="font-semibold mb-3">{title}</h3>
      {content && <p className="text-muted-foreground mb-3">{content}</p>}
      {examples && (
        <ul className="space-y-1">
          {examples.map((example, index) => (
            <li key={index} className="text-sm text-muted-foreground">• {example}</li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

export default VOCreationFlow;