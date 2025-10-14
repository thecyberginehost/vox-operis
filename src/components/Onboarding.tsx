import { useState } from "react";
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
  User, Users, Mic, Building2, MapPin, Clock, DollarSign,
  Eye, Phone, Globe, CheckCircle, ArrowRight, ArrowLeft,
  Upload, Play, Pause, Volume2
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

interface OnboardingProps {
  onComplete: () => void;
}

interface OnboardingData {
  userType: 'candidate' | 'recruiter' | 'both' | null;

  // Candidate data
  full_name: string;
  current_role: string;
  location: string;
  experience_years: number;
  professional_summary: string;
  industry: string;
  skills: string[];
  career_goals: string[];
  soft_skills: string[];
  achievements: string[];
  education_level: string;
  languages: string[];

  // VO Profile preferences
  vo_style: 'professional' | 'conversational' | 'creative' | null;
  include_portfolio: boolean;
  portfolio_type: string[];

  // Privacy settings
  is_profile_public: boolean;
  is_available: boolean;
  show_contact_info: boolean;
  show_salary_expectations: boolean;

  // Recruiter data
  company_name: string;
  company_size: string;
  recruiting_focus: string[];
  typical_roles: string[];
  hiring_volume: string;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { updateProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    userType: null,
    full_name: '',
    current_role: '',
    location: '',
    experience_years: 2,
    professional_summary: '',
    industry: '',
    skills: [],
    career_goals: [],
    soft_skills: [],
    achievements: [],
    education_level: '',
    languages: ['English'],
    vo_style: null,
    include_portfolio: false,
    portfolio_type: [],
    is_profile_public: true,
    is_available: true,
    show_contact_info: false,
    show_salary_expectations: true,
    company_name: '',
    company_size: '',
    recruiting_focus: [],
    typical_roles: [],
    hiring_volume: ''
  });

  const totalSteps = data.userType === 'candidate' ? 5 :
                   data.userType === 'recruiter' ? 3 :
                   data.userType === 'both' ? 6 : 2;

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales',
    'Consulting', 'Engineering', 'Design', 'Media', 'Legal', 'HR',
    'Operations', 'Manufacturing', 'Retail', 'Government', 'Non-profit', 'Other'
  ];

  const skillCategories = [
    'Leadership', 'Project Management', 'Data Analysis', 'Software Development',
    'Design', 'Marketing', 'Sales', 'Communication', 'Problem Solving',
    'Strategic Planning', 'Team Building', 'Customer Service', 'Research',
    'Writing', 'Public Speaking', 'Negotiation', 'Innovation'
  ];

  const softSkills = [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Adaptability',
    'Creativity', 'Critical Thinking', 'Time Management', 'Emotional Intelligence',
    'Resilience', 'Collaboration', 'Initiative', 'Empathy', 'Reliability'
  ];

  const careerGoals = [
    'Career Change', 'Promotion', 'Remote Work', 'Startup Environment',
    'Leadership Role', 'Skill Development', 'Industry Switch',
    'Work-Life Balance', 'Higher Salary', 'International Opportunity'
  ];

  const educationLevels = [
    'High School', 'Some College', 'Associate Degree', 'Bachelor\'s Degree',
    'Master\'s Degree', 'PhD', 'Professional Certificate', 'Self-Taught'
  ];

  const portfolioTypes = [
    'Work Samples', 'Case Studies', 'GitHub Projects', 'Design Portfolio',
    'Writing Samples', 'Presentations', 'Certifications', 'Awards'
  ];

  const companySizes = [
    'Startup (1-10)', 'Small (11-50)', 'Medium (51-200)', 'Large (201-1000)', 'Enterprise (1000+)'
  ];

  const hiringVolumes = [
    '1-5 per month', '6-15 per month', '16-30 per month', '30+ per month'
  ];

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSoftSkillToggle = (skill: string) => {
    setData(prev => ({
      ...prev,
      soft_skills: prev.soft_skills.includes(skill)
        ? prev.soft_skills.filter(s => s !== skill)
        : [...prev.soft_skills, skill]
    }));
  };

  const handleCareerGoalToggle = (goal: string) => {
    setData(prev => ({
      ...prev,
      career_goals: prev.career_goals.includes(goal)
        ? prev.career_goals.filter(g => g !== goal)
        : [...prev.career_goals, goal]
    }));
  };

  const handlePortfolioTypeToggle = (type: string) => {
    setData(prev => ({
      ...prev,
      portfolio_type: prev.portfolio_type.includes(type)
        ? prev.portfolio_type.filter(t => t !== type)
        : [...prev.portfolio_type, type]
    }));
  };

  const handleRecruitingFocusToggle = (focus: string) => {
    setData(prev => ({
      ...prev,
      recruiting_focus: prev.recruiting_focus.includes(focus)
        ? prev.recruiting_focus.filter(f => f !== focus)
        : [...prev.recruiting_focus, focus]
    }));
  };

  const handleTypicalRoleToggle = (role: string) => {
    setData(prev => ({
      ...prev,
      typical_roles: prev.typical_roles.includes(role)
        ? prev.typical_roles.filter(r => r !== role)
        : [...prev.typical_roles, role]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.userType !== null;
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
          return data.skills.length > 0 && data.industry;
        }
        return true;
      case 4:
        if (data.userType === 'candidate' || data.userType === 'both') {
          return data.soft_skills.length > 0 && data.career_goals.length > 0;
        }
        return true;
      default: return true;
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

      // Prepare profile updates based on user type
      const profileUpdates: any = {
        onboarding_completed: true,
        user_type: data.userType
      };

      // Add candidate-specific data
      if (data.userType === 'candidate' || data.userType === 'both') {
        profileUpdates.full_name = data.full_name.trim();
        profileUpdates.current_role = data.current_role.trim();
        profileUpdates.location = data.location.trim();
        profileUpdates.professional_summary = data.professional_summary.trim() || null;
        profileUpdates.industry = data.industry;
        profileUpdates.experience_years = data.experience_years;
        profileUpdates.skills = data.skills;
        profileUpdates.soft_skills = data.soft_skills;
        profileUpdates.career_goals = data.career_goals;
        profileUpdates.achievements = data.achievements;
        profileUpdates.education_level = data.education_level || null;
        profileUpdates.languages = data.languages;
        profileUpdates.vo_style = data.vo_style;
        profileUpdates.include_portfolio = data.include_portfolio;
        profileUpdates.portfolio_type = data.portfolio_type;
        profileUpdates.is_profile_public = data.is_profile_public;
        profileUpdates.is_available = data.is_available;
        profileUpdates.show_contact_info = data.show_contact_info;
        profileUpdates.show_salary_expectations = data.show_salary_expectations;
      }

      // Add recruiter-specific data
      if (data.userType === 'recruiter' || data.userType === 'both') {
        profileUpdates.company_name = data.company_name.trim() || null;
        profileUpdates.company_size = data.company_size || null;
        profileUpdates.recruiting_focus = data.recruiting_focus;
        profileUpdates.typical_roles = data.typical_roles;
        profileUpdates.hiring_volume = data.hiring_volume || null;
      }

      const { error } = await updateProfile(profileUpdates);
      if (error) throw error;

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
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to Vox-Operis!</h2>
              <p className="text-muted-foreground">The future of professional profiles. What brings you here?</p>
            </div>

            <div className="grid gap-4">
              <Card
                className={`cursor-pointer transition-all ${data.userType === 'candidate' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => handleInputChange('userType', 'candidate')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <User className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">I'm Looking for Work</h3>
                      <p className="text-sm text-muted-foreground">Create a dynamic VO profile that shows who I am, not just where I've worked</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${data.userType === 'recruiter' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => handleInputChange('userType', 'recruiter')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">I'm Hiring Talent</h3>
                      <p className="text-sm text-muted-foreground">Discover candidates beyond their CV - see their personality and potential</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${data.userType === 'both' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => handleInputChange('userType', 'both')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">Both</h3>
                      <p className="text-sm text-muted-foreground">I'm building my career AND looking to hire great people</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        if (data.userType === 'artist' || data.userType === 'both') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
                <p className="text-muted-foreground">Tell us about yourself</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={data.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Your professional name"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={data.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City, State/Country"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Years of Experience: {data.experience_years} years</Label>
                  <div className="px-2 py-4">
                    <Slider
                      value={[data.experience_years]}
                      onValueChange={([value]) => handleInputChange('experience_years', value)}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>0 years</span>
                      <span>20+ years</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio (optional)</Label>
                  <Textarea
                    id="bio"
                    value={data.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="What makes you unique as a voice artist?"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          );
        }

        if (data.userType === 'client') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Company Information</h2>
                <p className="text-muted-foreground">Help us understand your business</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={data.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Your company or organization"
                  />
                </div>

                <div>
                  <Label>Industry</Label>
                  <Select value={data.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
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
                  <Label>Typical Project Budget Range</Label>
                  <Select value={data.budget_range} onValueChange={(value) => handleInputChange('budget_range', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRanges.map((range) => (
                        <SelectItem key={range} value={range}>
                          {range}
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
        if (data.userType === 'artist' || data.userType === 'both') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Your Specialties</h2>
                <p className="text-muted-foreground">What types of voice work do you do? (Select all that apply)</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {voiceSpecialties.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant={data.specialties.includes(specialty) ? "default" : "outline"}
                    className="cursor-pointer transition-colors p-3 text-center hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleSpecialtyToggle(specialty)}
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>

              {data.specialties.length === 0 && (
                <Alert>
                  <AlertDescription>
                    Please select at least one specialty to continue.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          );
        }

        if (data.userType === 'client') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Project Types</h2>
                <p className="text-muted-foreground">What types of voice work do you typically need?</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {projectTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={data.project_types.includes(type) ? "default" : "outline"}
                    className="cursor-pointer transition-colors p-3 text-center hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleProjectTypeToggle(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          );
        }
        return null;

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Professional Details</h2>
              <p className="text-muted-foreground">Help clients understand your setup and rates</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Hourly Rate: ${data.hourly_rate}</Label>
                <div className="px-2 py-4">
                  <Slider
                    value={[data.hourly_rate]}
                    onValueChange={([value]) => handleInputChange('hourly_rate', value)}
                    min={25}
                    max={500}
                    step={25}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>$25/hour</span>
                    <span>$500+/hour</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-4">Home Studio Setup</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Badge
                    variant={data.has_home_studio === true ? "default" : "outline"}
                    className="cursor-pointer transition-colors p-4 text-center"
                    onClick={() => handleInputChange('has_home_studio', true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Yes, I have one
                  </Badge>
                  <Badge
                    variant={data.has_home_studio === false ? "default" : "outline"}
                    className="cursor-pointer transition-colors p-4 text-center"
                    onClick={() => handleInputChange('has_home_studio', false)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Planning to get one
                  </Badge>
                  <Badge
                    variant={data.has_home_studio === null ? "default" : "outline"}
                    className="cursor-pointer transition-colors p-4 text-center"
                    onClick={() => handleInputChange('has_home_studio', null)}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Studio access only
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Privacy & Discovery</h2>
              <p className="text-muted-foreground">Control how your profile appears to others</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow your profile to appear in the talent directory
                  </p>
                </div>
                <Switch
                  checked={data.is_profile_public}
                  onCheckedChange={(checked) => handleInputChange('is_profile_public', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Available for Work</Label>
                  <p className="text-sm text-muted-foreground">
                    Show that you're currently accepting new projects
                  </p>
                </div>
                <Switch
                  checked={data.is_available}
                  onCheckedChange={(checked) => handleInputChange('is_available', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Show Contact Information</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your contact details publicly
                  </p>
                </div>
                <Switch
                  checked={data.show_contact_info}
                  onCheckedChange={(checked) => handleInputChange('show_contact_info', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Show Rates</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your hourly rate in search results
                  </p>
                </div>
                <Switch
                  checked={data.show_rates}
                  onCheckedChange={(checked) => handleInputChange('show_rates', checked)}
                />
              </div>

              {!data.is_profile_public && (
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    Your profile will be private and won't appear in talent searches. You can change this later in your profile settings.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {/* Content Card */}
        <Card>
          <CardContent className="p-8">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                >
                  {loading ? 'Completing...' : 'Complete Setup'}
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;