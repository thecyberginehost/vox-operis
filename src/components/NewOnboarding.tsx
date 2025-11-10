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

  const totalSteps = data.userType === 'candidate' ? 5 : data.userType === 'recruiter' ? 3 : data.userType === 'both' ? 6 : 2;

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
        if (data.userType === 'candidate' || data.userType === 'both') {
          return data.full_name.trim() && data.current_role.trim() && data.location.trim();
        }
        if (data.userType === 'recruiter') {
          return data.company_name.trim() && data.company_size;
        }
        return false;
      case 3:
        if (data.userType === 'candidate' || data.userType === 'both') {
          return data.industry && data.skills.length > 0;
        }
        return data.recruiting_focus.length > 0;
      case 4:
        return data.soft_skills.length > 0 && data.career_goals.length > 0;
      default:
        return true;
    }
  };

  const canSkip = () => {
    // Steps 4 and 5 are optional and can be skipped
    return currentStep === 4 || currentStep === 5;
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

      // Upload avatar if one was selected
      if (avatarFile && user) {
        avatarUrl = await uploadAvatar(user.id);
      }

      // Upload CV if one was selected
      if (cvFile && user) {
        cvUrl = await uploadCv(user.id);
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
          </div>
        );

      case 2:
        if (data.userType === 'candidate' || data.userType === 'both') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Let's Build Your Professional Story</h2>
                <p className="text-muted-foreground">Start with the basics - we'll bring it to life with your VO</p>
              </div>

              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center mb-6">
                  <Label className="mb-3">Profile Picture (Optional)</Label>
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarPreview || undefined} />
                      <AvatarFallback className="text-2xl bg-primary/10">
                        {data.full_name ? data.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-12 w-12" />}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Click camera icon to upload (max 5MB)</p>
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={data.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Your professional name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="current_role">Current Role / Career Focus *</Label>
                  <Input
                    id="current_role"
                    value={data.current_role}
                    onChange={(e) => handleInputChange('current_role', e.target.value)}
                    placeholder="e.g., Senior Marketing Manager, Full-Stack Developer, Career Changer"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">This appears as your headline</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={data.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="London, UK"
                        className="pl-10 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="mt-1">
                      <PhoneInput
                        id="phone"
                        value={data.phone}
                        onChange={(value) => handleInputChange('phone', value || '')}
                        defaultCountry="GB"
                        international
                        countryCallingCodeEditable={false}
                        placeholder="Enter phone number"
                        className="phone-input-dark"
                        style={{
                          '--PhoneInput-color': '#e5e7eb',
                          '--PhoneInputInternationalIconPhone-opacity': '0.8',
                          '--PhoneInputInternationalIconGlobe-opacity': '0.65',
                          '--PhoneInputCountrySelect-marginRight': '0.35em',
                          '--PhoneInputCountrySelectArrow-width': '0.3em',
                          '--PhoneInputCountrySelectArrow-marginLeft': 'var(--PhoneInputCountrySelect-marginRight)',
                          '--PhoneInputCountrySelectArrow-borderWidth': '1px',
                          '--PhoneInputCountrySelectArrow-opacity': '0.45',
                          '--PhoneInputCountrySelectArrow-color': 'currentColor',
                          '--PhoneInputCountrySelectArrow-color--focus': 'currentColor',
                          '--PhoneInputCountrySelectArrow-transform': 'rotate(45deg)',
                          '--PhoneInputCountryFlag-aspectRatio': '1.5',
                          '--PhoneInputCountryFlag-height': '1em',
                          '--PhoneInputCountryFlag-borderWidth': '1px',
                          '--PhoneInputCountryFlag-borderColor': 'rgba(0,0,0,0.5)',
                          '--PhoneInputCountryFlag-borderColor--focus': 'currentColor',
                          '--PhoneInputCountryFlag-backgroundColor--loading': 'rgba(0,0,0,0.1)'
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Years of Experience: {data.experience_years}</Label>
                  <div className="px-2 py-4">
                    <Slider
                      value={[data.experience_years]}
                      onValueChange={([value]) => handleInputChange('experience_years', value)}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 years</span>
                      <span>20+ years</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="professional_summary">What drives you? (Optional)</Label>
                  <Textarea
                    id="professional_summary"
                    value={data.professional_summary}
                    onChange={(e) => handleInputChange('professional_summary', e.target.value)}
                    placeholder="Tell us what motivates you, what you're passionate about, or what makes you unique..."
                    rows={3}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">This will help personalize your VO script</p>
                </div>

                {/* CV Upload */}
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <Label htmlFor="cv-upload" className="block mb-2">Upload CV/Resume (Optional)</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    PDF or DOCX format, max 10MB. This will be viewable on your profile.
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      id="cv-upload"
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleCvChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="cv-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Choose File</span>
                    </label>
                    {cvFile && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm">{cvFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    )}
                    {uploadingCv && (
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (data.userType === 'recruiter') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">About Your Organization</h2>
                <p className="text-muted-foreground">Help us understand your hiring needs</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={data.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Your organization"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Company Size *</Label>
                  <Select value={data.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Typical Hiring Volume</Label>
                  <Select value={data.hiring_volume} onValueChange={(value) => handleInputChange('hiring_volume', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="How many people do you typically hire?" />
                    </SelectTrigger>
                    <SelectContent>
                      {hiringVolumes.map((volume) => (
                        <SelectItem key={volume} value={volume}>
                          {volume}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        }
        return null;

      case 3:
        if (data.userType === 'candidate' || data.userType === 'both') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Your Professional Expertise</h2>
                <p className="text-muted-foreground">Help employers understand your skills and industry focus</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label>Industry *</Label>
                  <Select value={data.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your primary industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Key Skills * (Select all that apply)</Label>
                  <p className="text-sm text-muted-foreground mb-3">Choose your strongest professional skills</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {skillsOptions.map((skill) => (
                      <Badge
                        key={skill}
                        variant={data.skills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer transition-all p-3 text-center justify-center hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleArrayToggle('skills', skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  {data.skills.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">Please select at least one skill</p>
                  )}
                </div>

                <div>
                  <Label>Education Level</Label>
                  <Select value={data.education_level} onValueChange={(value) => handleInputChange('education_level', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Highest education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        }

        if (data.userType === 'recruiter') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Your Recruiting Focus</h2>
                <p className="text-muted-foreground">What types of talent do you typically look for?</p>
              </div>

              <div>
                <Label>Areas of Focus * (Select all that apply)</Label>
                <p className="text-sm text-muted-foreground mb-3">What kinds of roles do you typically hire for?</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {recruitingFocusOptions.map((focus) => (
                    <Badge
                      key={focus}
                      variant={data.recruiting_focus.includes(focus) ? "default" : "outline"}
                      className="cursor-pointer transition-all p-3 text-center justify-center hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleArrayToggle('recruiting_focus', focus)}
                    >
                      {focus}
                    </Badge>
                  ))}
                </div>
                {data.recruiting_focus.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">Please select at least one area</p>
                )}
              </div>
            </div>
          );
        }
        return null;

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">What Makes You Special</h2>
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

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Your VO Profile Style</h2>
              <p className="text-muted-foreground">How do you want to present yourself to employers?</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label>VO Style Preference</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <Card
                    className={`cursor-pointer transition-all ${data.vo_style === 'professional' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                    onClick={() => handleInputChange('vo_style', 'professional')}
                  >
                    <CardContent className="p-4 text-center">
                      <Briefcase className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-semibold">Professional</h4>
                      <p className="text-xs text-muted-foreground mt-1">Polished, executive-ready</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all ${data.vo_style === 'conversational' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                    onClick={() => handleInputChange('vo_style', 'conversational')}
                  >
                    <CardContent className="p-4 text-center">
                      <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <h4 className="font-semibold">Conversational</h4>
                      <p className="text-xs text-muted-foreground mt-1">Approachable, authentic</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all ${data.vo_style === 'creative' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                    onClick={() => handleInputChange('vo_style', 'creative')}
                  >
                    <CardContent className="p-4 text-center">
                      <Lightbulb className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <h4 className="font-semibold">Creative</h4>
                      <p className="text-xs text-muted-foreground mt-1">Dynamic, innovative</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Include Portfolio</Label>
                  <p className="text-sm text-muted-foreground">
                    Show work samples alongside your VO
                  </p>
                </div>
                <Switch
                  checked={data.include_portfolio}
                  onCheckedChange={(checked) => handleInputChange('include_portfolio', checked)}
                />
              </div>

              <Alert>
                <Video className="h-4 w-4" />
                <AlertDescription>
                  <strong>Next:</strong> You'll create your VO (Video + Voice profile) that replaces traditional CVs.
                  This dynamic profile will showcase your personality, communication skills, and professional story.
                </AlertDescription>
              </Alert>
            </div>
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