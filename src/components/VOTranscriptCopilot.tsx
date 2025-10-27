import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload,
  FileText,
  Wand2,
  Download,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  Brain,
  Mic,
  Clock,
  Loader2,
  Edit3,
  Save
} from "lucide-react";
import { generateVOScript, type ScriptGenerationRequest } from "@/lib/scriptGeneration";
import ScriptEditor from "./ScriptEditor";

interface VOTranscriptCopilotProps {
  onBack?: () => void;
}

const VOTranscriptCopilot = ({ onBack }: VOTranscriptCopilotProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [scriptType, setScriptType] = useState("professional");
  const [targetAudience, setTargetAudience] = useState("business");
  const [scriptLength, setScriptLength] = useState("2min");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const steps = [
    { number: 1, title: "Upload Resume", description: "Upload your CV/Resume" },
    { number: 2, title: "Customize Script", description: "Choose your preferences" },
    { number: 3, title: "Generate Script", description: "AI creates your script" },
    { number: 4, title: "Review & Export", description: "Download your VO script" }
  ];

  const progressPercentage = (currentStep / steps.length) * 100;

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, only support plain text files for reliable parsing
      // PDF, DOC, DOCX require additional libraries
      const allowedTypes = ['text/plain', 'text/csv', 'application/json'];

      // Also accept files without proper MIME type if they have .txt extension
      const isTextFile = file.name.toLowerCase().endsWith('.txt') ||
                        file.name.toLowerCase().endsWith('.md') ||
                        file.type.startsWith('text/') ||
                        allowedTypes.includes(file.type);

      if (!isTextFile) {
        setError('Please upload a TXT file or copy-paste your resume text directly into the text area below for best results');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setUploadedFile(file);
      setError(null);

      console.log('Processing uploaded file:', file.name, 'Type:', file.type);

      // Extract text from file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        console.log('Extracted text from file:', text.substring(0, 200) + '...');
        setResumeText(text);
      };
      reader.onerror = (e) => {
        console.error('Error reading file:', e);
        setError('Error reading file. Please try copying and pasting the text instead.');
      };
      reader.readAsText(file);
    }
  }, []);

  // Generate AI script using real GPT-5 API
  const generateScript = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!resumeText?.trim()) {
        throw new Error('Please upload a resume or enter resume text first');
      }

      console.log('Generating script with real AI...', {
        scriptType,
        targetAudience,
        scriptLength,
        resumeLength: resumeText.length,
        hasJobDescription: !!jobDescription.trim()
      });

      const request: ScriptGenerationRequest = {
        resumeText: resumeText.trim(),
        jobDescription: jobDescription.trim() || undefined,
        scriptType: scriptType as ScriptGenerationRequest['scriptType'],
        targetAudience: targetAudience as ScriptGenerationRequest['targetAudience'],
        scriptLength: scriptLength as ScriptGenerationRequest['scriptLength']
      };

      const response = await generateVOScript(request);

      if (response.success && response.script) {
        setGeneratedScript(response.script);
        setCurrentStep(4);
        console.log('Script generated successfully:', {
          wordCount: response.metadata.wordCount,
          extractedName: response.extractedInfo.name
        });
      } else {
        throw new Error(response.error || 'Failed to generate script');
      }
    } catch (err) {
      console.error('Script generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate script. Please try again.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [resumeText, scriptType, targetAudience, scriptLength]);

  // Copy script to clipboard
  const copyScript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy script to clipboard');
    }
  }, [generatedScript]);

  // Download script as text file
  const downloadScript = useCallback(() => {
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vo-script.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedScript]);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Show editor if requested
  if (showEditor && generatedScript) {
    return (
      <ScriptEditor
        initialScript={generatedScript}
        onSave={(editedScript) => {
          setGeneratedScript(editedScript);
          setShowEditor(false);
        }}
        onClose={() => setShowEditor(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                ←
              </Button>
            )}
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">VO Transcript Copilot</span>
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
          {/* Left Panel - Main Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {steps[currentStep - 1].title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {steps[currentStep - 1].description}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentStep === 1 && <Step1Content uploadedFile={uploadedFile} onFileUpload={handleFileUpload} resumeText={resumeText} setResumeText={setResumeText} jobDescription={jobDescription} setJobDescription={setJobDescription} />}
            {currentStep === 2 && <Step2Content scriptType={scriptType} setScriptType={setScriptType} targetAudience={targetAudience} setTargetAudience={setTargetAudience} scriptLength={scriptLength} setScriptLength={setScriptLength} />}
            {currentStep === 3 && <Step3Content isProcessing={isProcessing} onGenerate={generateScript} />}
            {currentStep === 4 && <Step4Content generatedScript={generatedScript} onCopy={copyScript} onDownload={downloadScript} copied={copied} onEdit={() => setShowEditor(true)} />}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <div className="flex space-x-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    ← Back
                  </Button>
                )}
              </div>

              <div className="flex space-x-2">
                {currentStep < 3 && (
                  <Button
                    variant="hero"
                    onClick={nextStep}
                    disabled={currentStep === 1 && !uploadedFile && !resumeText.trim()}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {currentStep === 3 && (
                  <Button
                    variant="hero"
                    onClick={generateScript}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Generating...' : 'Generate Script'}
                    <Wand2 className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <Card className="elevated-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Preview
                </CardTitle>
                <CardDescription>See your script as it's built</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadedFile && (
                    <div className="p-3 bg-muted/50 rounded">
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  )}

                  {currentStep >= 2 && (
                    <div className="space-y-2">
                      <Badge variant="outline">{scriptType} tone</Badge>
                      <Badge variant="outline">{targetAudience} audience</Badge>
                      <Badge variant="outline">{scriptLength} length</Badge>
                    </div>
                  )}

                  {generatedScript && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm">{generatedScript.substring(0, 200)}...</p>
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

// Step 1: Upload Resume
const Step1Content = ({ uploadedFile, onFileUpload, resumeText, setResumeText, jobDescription, setJobDescription }: any) => (
  <div className="space-y-6">
    <Tabs defaultValue="paste" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="paste">📋 Paste Text (Recommended)</TabsTrigger>
        <TabsTrigger value="upload">📁 Upload File</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="space-y-4">
        <Card className="elevated-card">
          <CardContent className="p-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Upload your resume</p>
              <p className="text-muted-foreground mb-4">
                Currently supports TXT files only (max 5MB)
                <br />
                <span className="text-sm">For PDF/DOC files, please copy-paste text in the "Paste Text" tab</span>
              </p>
              <div className="flex justify-center">
                <Button variant="outline" asChild>
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose TXT File
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".txt,.md"
                      onChange={onFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>

            {uploadedFile && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-400">File uploaded successfully!</p>
                    <p className="text-sm text-green-600 dark:text-green-500">{uploadedFile.name}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="paste" className="space-y-4">
        <Card className="elevated-card border-primary/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  ✨ Best Results
                </Badge>
              </div>
              <Label htmlFor="resume-text" className="text-base font-medium">
                Paste your resume content
              </Label>
              <p className="text-sm text-muted-foreground">
                Copy and paste your resume text from any PDF, DOC, or online source for the most accurate AI analysis.
              </p>
              <Textarea
                id="resume-text"
                placeholder="Example:

John Smith
Senior Software Engineer
5+ years experience in React, Node.js, TypeScript
Led development team at Google for 3 years
Built scalable e-commerce platforms serving 1M+ users
Masters in Computer Science from Stanford"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[250px] font-mono text-sm"
              />
              {resumeText.trim() && (
                <div className="text-sm text-muted-foreground">
                  ✅ {resumeText.trim().split(' ').length} words ready for analysis
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    {/* Job Description Section */}
    <Card className="elevated-card border-blue-200 dark:border-blue-800">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              🎯 Optional - Enhanced Matching
            </Badge>
          </div>
          <Label htmlFor="job-description" className="text-base font-medium">
            Job Description (Optional)
          </Label>
          <p className="text-sm text-muted-foreground">
            Paste the job description to create a script that highlights your relevant experience and transferable skills.
            The AI will match your actual experience to job requirements and suggest how similar tools/skills can transfer.
          </p>
          <Textarea
            id="job-description"
            placeholder="Example:

We're seeking a Senior Full Stack Developer with 5+ years of experience in React and Node.js.

Requirements:
- Expert in React, Redux, TypeScript
- Backend experience with Node.js, Express
- Database design (PostgreSQL preferred)
- Experience with AWS cloud services
- Strong communication and teamwork skills

Paste the full job description here for best results..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          {jobDescription.trim() && (
            <div className="text-sm text-green-600 dark:text-green-500 flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Job description will be analyzed for skill matching</span>
            </div>
          )}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm text-blue-600 dark:text-blue-500">
              <strong>Candor is paramount:</strong> The script will only reference your actual experience.
              If you have similar but not exact skills (e.g., used MySQL instead of PostgreSQL),
              the script will highlight the transferable knowledge and your ability to adapt.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Step 2: Customize Script
const Step2Content = ({ scriptType, setScriptType, targetAudience, setTargetAudience, scriptLength, setScriptLength }: any) => (
  <div className="space-y-6">
    <Card className="elevated-card">
      <CardContent className="p-6 space-y-6">
        <div>
          <Label>Script Tone & Style</Label>
          <Select value={scriptType} onValueChange={setScriptType}>
            <SelectTrigger>
              <SelectValue placeholder="Choose script tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional & Authoritative</SelectItem>
              <SelectItem value="conversational">Conversational & Friendly</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic & Dynamic</SelectItem>
              <SelectItem value="storytelling">Storytelling & Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Target Audience</Label>
          <Select value={targetAudience} onValueChange={setTargetAudience}>
            <SelectTrigger>
              <SelectValue placeholder="Choose target audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Business & Corporate</SelectItem>
              <SelectItem value="creative">Creative & Agency</SelectItem>
              <SelectItem value="tech">Technology & Startups</SelectItem>
              <SelectItem value="general">General Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Script Length</Label>
          <Select value={scriptLength} onValueChange={setScriptLength}>
            <SelectTrigger>
              <SelectValue placeholder="Choose script length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1min">1 minute (~150 words)</SelectItem>
              <SelectItem value="2min">2 minutes (~300 words)</SelectItem>
              <SelectItem value="3min">3 minutes (~450 words)</SelectItem>
              <SelectItem value="5min">5 minutes (~750 words)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-accent/20 border-accent/30">
      <CardContent className="p-6">
        <h3 className="font-semibold mb-3 flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          AI Script Features
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Natural speech patterns and pacing</li>
          <li>• Professional terminology adapted for voice</li>
          <li>• Clear section breaks for easy recording</li>
          <li>• Pronunciation guides for technical terms</li>
          <li>• Engaging opening and compelling conclusion</li>
        </ul>
      </CardContent>
    </Card>
  </div>
);

// Step 3: Generate Script
const Step3Content = ({ isProcessing, onGenerate }: any) => (
  <div className="space-y-6">
    <Card className="elevated-card">
      <CardContent className="p-8 text-center">
        <div className="space-y-6">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            {isProcessing ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <Wand2 className="h-8 w-8 text-primary" />
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">
              {isProcessing ? "Generating your script..." : "Ready to generate your script!"}
            </h3>
            <p className="text-muted-foreground">
              {isProcessing
                ? "Our GPT-5 AI is analyzing your resume and creating a personalized voice-over script. This may take 30-60 seconds."
                : "Our GPT-5 AI will analyze your resume and create a professional voice-over script tailored to your preferences."
              }
            </p>
          </div>

          {isProcessing && (
            <div className="space-y-4">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-2 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>🧠 Extracting key information from resume...</p>
                <p>✍️ Crafting personalized script content...</p>
                <p>🎭 Optimizing for natural speech patterns...</p>
              </div>
            </div>
          )}

          {!isProcessing && (
            <Button size="lg" onClick={onGenerate} className="px-8">
              <Wand2 className="h-5 w-5 mr-2" />
              Generate My Script with AI
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    {!isProcessing && (
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3 flex items-center text-blue-800 dark:text-blue-400">
            <Brain className="h-5 w-5 mr-2" />
            Powered by GPT-5 AI
          </h3>
          <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-500">
            <li>• Advanced resume analysis and information extraction</li>
            <li>• Human-like script writing optimized for voice delivery</li>
            <li>• Personalized content based on your unique experience</li>
            <li>• Professional formatting with recording guidance</li>
            <li>• Multiple tone and audience adaptations</li>
          </ul>
        </CardContent>
      </Card>
    )}
  </div>
);

// Step 4: Review & Export
const Step4Content = ({ generatedScript, onCopy, onDownload, copied, onEdit }: any) => (
  <div className="space-y-6">
    <Card className="elevated-card border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Check className="h-5 w-5 mr-2 text-green-600" />
          Your Script is Ready!
        </CardTitle>
        <CardDescription>
          Review, edit, or save your professional voice-over script
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-border rounded-lg p-6 bg-muted/30 max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{generatedScript}</pre>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onEdit} className="w-full">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Script
          </Button>
          <Button variant="outline" onClick={onCopy} className="w-full">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <Mic className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-400 mb-1">Ready to record?</p>
              <p className="text-sm text-blue-600 dark:text-blue-500">
                Click "Edit Script" to refine your content, add personal touches, and format it for recording. You can save multiple versions to your script library.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-accent/20 border-accent/30">
      <CardContent className="p-6">
        <h3 className="font-semibold mb-3 flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          Next Steps
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span><strong>Edit & Personalize:</strong> Click "Edit Script" to customize the content and add your personal voice</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span><strong>Save to Library:</strong> Save your script to access it anytime from your dashboard</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span><strong>Practice & Record:</strong> Rehearse your script, then record your professional VO</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span><strong>Share Your Profile:</strong> Add the recording to your VO profile and share with recruiters</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
);

export default VOTranscriptCopilot;