import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User, Users, Building2, MapPin, Clock, Briefcase, Target,
  CheckCircle, ArrowRight, ArrowLeft, Video, Mic, FileText,
  Award, Globe, GraduationCap, Lightbulb, Heart, Zap, AlertCircle, Save, Camera, Upload
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { supabase } from "@/lib/supabase";
import { VideoRecorder } from "@/components/VideoRecorder";
import { VideoRecording } from "@/hooks/useVideoRecorder";

interface NewOnboardingProps {
  onComplete: () => void;
}

interface OnboardingData {
  userType: 'candidate' | 'recruiter' | 'both' | null;

  // Candidate Profile
  full_name: string;
  current_role: string;
  location: string;
  phone: string;
  experience_years: number;
  professional_summary: string;
  industry: string;
  skills: string[];
  soft_skills: string[];
  career_goals: string[];
  education_level: string;
  languages: string[];
  cv_url: string;

  // VO Preferences
  vo_style: 'professional' | 'conversational' | 'creative' | null;
  include_portfolio: boolean;

  // Privacy
  is_profile_public: boolean;
  is_available: boolean;
  show_contact_info: boolean;

  // Recruiter Data
  company_name: string;
  company_size: string;
  recruiting_focus: string[];
  hiring_volume: string;
}

const NewOnboarding = ({ onComplete }: NewOnboardingProps) => {
  const { updateProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    userType: 'candidate', // Default to candidate since we're focused on job seekers
    full_name: '',
    current_role: '',
    location: '',
    phone: '',
    experience_years: 3,
    professional_summary: '',
    industry: '',
    skills: [],
    soft_skills: [],
    career_goals: [],
    education_level: '',
    languages: ['English'],
    cv_url: '',
    vo_style: null,
    include_portfolio: false,
    is_profile_public: true,
    is_available: true,
    show_contact_info: false,
    company_name: '',
    company_size: '',
    recruiting_focus: [],
    hiring_volume: ''
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);

  const [initialVoRecording, setInitialVoRecording] = useState<VideoRecording | null>(null);
  const [showTypeformAlternative, setShowTypeformAlternative] = useState(false);

  const totalSteps = 3; // CV Upload + What makes you recognisable + Create initial VO

  // Auto-save progress to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('onboarding_progress');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData(parsed.data);
        setCurrentStep(parsed.step);
      } catch (e) {
        console.error('Failed to load saved progress');
      }
    }
  }, []);

  // Save progress whenever data changes
  useEffect(() => {
    if (data.userType) {
      const progressData = {
        data,
        step: currentStep,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('onboarding_progress', JSON.stringify(progressData));
      setLastSaved(new Date());
    }
  }, [data, currentStep]);

  // Data arrays
  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales',
    'Consulting', 'Engineering', 'Design', 'Media', 'Legal', 'Operations',
    'Manufacturing', 'Retail', 'Government', 'Non-profit', 'Other'
  ];

  const skillsOptions = [
    'Leadership', 'Project Management', 'Data Analysis', 'Software Development',
    'Digital Marketing', 'Sales', 'Customer Service', 'Strategic Planning',
    'Content Creation', 'Public Speaking', 'Research', 'Writing',
    'Design Thinking', 'Financial Analysis', 'Team Management'
  ];

  const softSkillsOptions = [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Adaptability',
    'Creativity', 'Critical Thinking', 'Time Management', 'Emotional Intelligence',
    'Resilience', 'Initiative', 'Empathy', 'Reliability', 'Innovation'
  ];

  const careerGoalsOptions = [
    'Career Change', 'Promotion', 'Remote Work', 'Leadership Role',
    'Skill Development', 'Industry Switch', 'Work-Life Balance',
    'Higher Salary', 'Startup Environment', 'International Opportunity'
  ];

  const educationLevels = [
    'High School', 'Some College', 'Associate Degree', 'Bachelor\'s Degree',
    'Master\'s Degree', 'PhD', 'Professional Certificate', 'Self-Taught'
  ];

  const companySizes = [
    'Startup (1-10)', 'Small (11-50)', 'Medium (51-200)', 'Large (201-1000)', 'Enterprise (1000+)'
  ];

  const recruitingFocusOptions = [
    'Technology', 'Sales & Marketing', 'Operations', 'Finance', 'Creative',
    'Executive Leadership', 'Entry Level', 'Specialized Skills', 'Remote Talent'
  ];

  const hiringVolumes = [
    '1-5 per month', '6-15 per month', '16-30 per month', '30+ per month'
  ];

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: keyof OnboardingData, item: string) => {
    setData(prev => {
      const currentArray = prev[field] as string[];
      return {
        ...prev,
        [field]: currentArray.includes(item)
          ? currentArray.filter(i => i !== item)
          : [...currentArray, item]
      };
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return true; // Step 1 CV upload is optional, can always proceed
      case 2:
        return data.soft_skills.length > 0 && data.career_goals.length > 0;
      case 3:
        return initialVoRecording !== null; // Step 3 requires initial VO recording
      default:
        return true;
    }
  };

  const canSkip = () => {
    // Step 2 is optional and can be skipped
    return currentStep === 2;
  };

  const handleSkip = () => {
    if (canSkip() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      setUploadingAvatar(true);
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - only PDF and DOCX
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a PDF or DOCX file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('CV must be less than 10MB');
        return;
      }

      setCvFile(file);
      setError(null);
    }
  };

  const uploadCv = async (userId: string): Promise<string | null> => {
    if (!cvFile) return null;

    try {
      setUploadingCv(true);
      const fileExt = cvFile.name.split('.').pop();
      const fileName = `${userId}-cv-${Date.now()}.${fileExt}`;
      const filePath = `cvs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-documents')
        .upload(filePath, cvFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-documents')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading CV:', err);
      return null;
    } finally {
      setUploadingCv(false);
    }
  };

  const uploadInitialVo = async (userId: string): Promise<string | null> => {
    if (!initialVoRecording) return null;

    try {
      const fileName = `${userId}-initial-vo-${Date.now()}.webm`;
      const filePath = `initial-vos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-documents')
        .upload(filePath, initialVoRecording.blob, {
          contentType: 'video/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-documents')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading initial VO:', err);
      return null;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user ID for uploads
      const { data: { user } } = await supabase.auth.getUser();
      let avatarUrl = null;
      let cvUrl = null;
      let initialVoUrl = null;

      // Upload avatar if one was selected
      if (avatarFile && user) {
        avatarUrl = await uploadAvatar(user.id);
      }

      // Upload CV if one was selected
      if (cvFile && user) {
        cvUrl = await uploadCv(user.id);
      }

      // Upload initial VO if one was recorded
      if (initialVoRecording && user) {
        initialVoUrl = await uploadInitialVo(user.id);
      }

      const profileUpdates: any = {
        onboarding_completed: true,
        user_type: data.userType,
        full_name: data.full_name.trim(),
        "current_role": data.current_role.trim(),
        location: data.location.trim(),
        phone: data.phone || null,
        avatar_url: avatarUrl,
        cv_url: cvUrl || data.cv_url || null,
        initial_vo_url: initialVoUrl || null,
        "years_of_experience": data.experience_years,
        "professional_summary": data.professional_summary.trim() || null,
        industry: data.industry,
        "skills": data.skills,
        "soft_skills": data.soft_skills,
        "career_goals": data.career_goals,
        "education": data.education_level || null,
        "languages": data.languages,
        "vo_style": data.vo_style,
        is_profile_public: data.is_profile_public,
        is_available: data.is_available,
        show_contact_info: data.show_contact_info,
        company_name: data.company_name.trim() || null,
        "availability_status": "available",
        "preferred_work_type": "flexible"
      };

      const { error } = await updateProfile(profileUpdates);
      if (error) throw error;

      // Clear saved progress after successful completion
      localStorage.removeItem('onboarding_progress');
      localStorage.setItem('show_welcome_modal', 'true');

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-medium text-white mb-8">
                Welcome to Vox Operis. The voice of your work
              </h2>
            </div>

            {!showTypeformAlternative ? (
              <div className="max-w-xl mx-auto">
                <div className="border-2 border-dashed border-[#2a3142] rounded-lg p-8">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl text-white font-medium">
                      Hi, can we have your CV?
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
                      We will use it to help build your VO script so you have a baseline to work from when recording. We'll make this so simple for you :)
                    </p>

                    <div className="pt-4">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-400">Upload your CV</p>
                        <p className="text-xs text-gray-500">You can add it now, or do it later if you prefer</p>

                        <div className="flex flex-col items-center gap-3 pt-2">
                          <input
                            id="cv-upload-step1"
                            type="file"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleCvChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="cv-upload-step1"
                            className="flex items-center gap-2 px-6 py-2 border border-[#2a3142] rounded-md cursor-pointer hover:bg-[#1a1f2e] transition-colors text-gray-300 hover:text-white"
                          >
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">Choose</span>
                          </label>

                          {cvFile && (
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <FileText className="h-4 w-4 text-[#f59e0b]" />
                              <span>{cvFile.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-lg p-8">
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-16 w-16 rounded-full bg-[#f59e0b]/10 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-[#f59e0b]" />
                      </div>
                    </div>
                    <h3 className="text-2xl text-white font-bold">
                      Let's build your profile together
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      No worries! We'll help you create a professional profile with a quick questionnaire.
                    </p>

                    <div className="bg-[#0a0e1a] border border-[#2a3142] rounded-lg p-12 my-6">
                      <p className="text-gray-500 text-sm italic">
                        [Typeform Embed Placeholder]
                        <br />
                        <span className="text-xs">The Typeform questionnaire will be embedded here</span>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setShowTypeformAlternative(false)}
                      className="border-[#2a3142] text-gray-300 hover:bg-[#1a1f2e] hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to CV upload
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">What makes you recognisable</h2>
              <p className="text-muted-foreground">Soft skills and career aspirations that AI can't replicate</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Soft Skills * (Select your strongest)
                </Label>
                <p className="text-sm text-muted-foreground mb-3">These human qualities set you apart</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {softSkillsOptions.map((skill) => (
                    <Badge
                      key={skill}
                      variant={data.soft_skills.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer transition-all p-3 text-center justify-center hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleArrayToggle('soft_skills', skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                {data.soft_skills.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">Please select at least one soft skill</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Career Goals * (What are you seeking?)
                </Label>
                <p className="text-sm text-muted-foreground mb-3">Help employers understand what motivates you</p>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                  {careerGoalsOptions.map((goal) => (
                    <Badge
                      key={goal}
                      variant={data.career_goals.includes(goal) ? "default" : "outline"}
                      className="cursor-pointer transition-all p-3 text-center justify-center hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleArrayToggle('career_goals', goal)}
                    >
                      {goal}
                    </Badge>
                  ))}
                </div>
                {data.career_goals.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">Please select at least one career goal</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f59e0b]/10 flex items-center justify-center">
                  <Video className="h-6 w-6 text-[#f59e0b]" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white">Create Your Initial VO</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                This is your culture check video - a 1-2 minute introduction that showcases your personality
                and helps employers see if you're the right fit for their team. Be yourself and let your
                authentic character shine through!
              </p>
            </div>

            <Alert className="bg-[#1a1f2e] border-[#2a3142]">
              <AlertCircle className="h-4 w-4 text-[#f59e0b]" />
              <AlertDescription className="text-gray-300">
                <strong className="text-white">What to include:</strong> Briefly introduce yourself, mention what
                makes you unique (your recognisable traits), and why you're passionate about your work.
                Keep it natural and conversational - aim for 60-120 seconds.
              </AlertDescription>
            </Alert>

            <div className="mt-6">
              <VideoRecorder
                maxDuration={120}
                onRecordingComplete={(recording) => {
                  setInitialVoRecording(recording);
                }}
                onRecordingClear={() => {
                  setInitialVoRecording(null);
                }}
                className="w-full"
                uploadEnabled={false}
                downloadEnabled={false}
                backgroundEnabled={true}
              />
            </div>

            {!initialVoRecording && (
              <p className="text-sm text-gray-400 text-center mt-4">
                Record your initial VO to continue
              </p>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Ready to Create Your VO!</h2>
            <p className="text-muted-foreground">
              Your profile foundation is complete. Time to bring it to life with your voice and personality.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-3">
            <span className="text-white font-medium">Step {currentStep} of {totalSteps}</span>
            <div className="flex items-center gap-4">
              {lastSaved && (
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <Save className="h-3 w-3" />
                  Saved {new Date().getTime() - lastSaved.getTime() < 5000 ? 'just now' : 'recently'}
                </span>
              )}
              <span className="text-white font-medium">{Math.round((currentStep / totalSteps) * 100)}% complete</span>
            </div>
          </div>
          <div className="h-2 bg-[#1a1f2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#f59e0b] to-[#d97706] transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Card */}
        <Card className="border-0 shadow-2xl bg-[#0f1419] border-[#1a1f2e]">
          <CardContent className="p-8 md:p-12">
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-900 text-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-12">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-8 bg-transparent border-[#2a3142] text-gray-300 hover:bg-[#1a1f2e] hover:text-white disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="flex gap-3">
                {canSkip() && currentStep < totalSteps && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="px-6 text-gray-400 hover:text-white hover:bg-[#1a1f2e]"
                  >
                    Skip for now
                  </Button>
                )}

                {currentStep === 1 && !showTypeformAlternative && (
                  <Button
                    onClick={() => setShowTypeformAlternative(true)}
                    className="px-6 bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#ea9005] hover:to-[#c56f06] text-white font-medium"
                  >
                    Continue without a CV
                  </Button>
                )}

                {currentStep < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() && !canSkip()}
                    className="px-8 bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#ea9005] hover:to-[#c56f06] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={loading}
                    className="px-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium"
                  >
                    {loading ? 'Setting up...' : 'Complete Profile'}
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewOnboarding;