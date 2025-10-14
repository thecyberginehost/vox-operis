import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Camera, Save, User, Mail, Calendar, Shield, Crown, Mic, Eye, Heart, Share2, Lock, Play, Trash2, Edit2, Video } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/useProfile";
import { useVOProfiles } from "@/hooks/useVOProfiles";
import { supabase } from "@/lib/supabase";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface ProfileProps {
  onBack: () => void;
}

const Profile = ({ onBack }: ProfileProps) => {
  const { profile, updateProfile, loading } = useProfile();
  const { profiles: voProfiles, loading: voLoading, deleteProfile: deleteVOProfile } = useVOProfiles();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileStats, setProfileStats] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    specialties: [] as string[],
    hourly_rate: "",
    experience_years: "",
    is_profile_public: true,
    is_available: true,
    show_contact_info: false,
    show_rates: true,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        phone: profile.phone || "",
        specialties: profile.specialties || [],
        hourly_rate: profile.hourly_rate?.toString() || "",
        experience_years: profile.experience_years?.toString() || "",
        is_profile_public: profile.is_profile_public ?? true,
        is_available: profile.is_available ?? true,
        show_contact_info: profile.show_contact_info ?? false,
        show_rates: profile.show_rates ?? true,
      });
      loadProfileStats();
    }
  }, [profile]);

  const loadProfileStats = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_profile_stats', {
        p_user_id: profile.id
      });

      if (!error) {
        setProfileStats(data);
      }
    } catch (error) {
      console.error('Error loading profile stats:', error);
    }
  };

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    try {
      setSaving(true);
      setError(null);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: urlData.publicUrl
      });

      if (updateError) throw updateError;

      setSuccess('Avatar updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      const updates = {
        full_name: formData.full_name.trim() || null,
        bio: formData.bio.trim() || null,
        location: formData.location.trim() || null,
        website: formData.website.trim() || null,
        phone: formData.phone.trim() || null,
        specialties: formData.specialties,
        hourly_rate: formData.hourly_rate ? parseInt(formData.hourly_rate) : null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        is_profile_public: formData.is_profile_public,
        is_available: formData.is_available,
        show_contact_info: formData.show_contact_info,
        show_rates: formData.show_rates,
      };

      const { error } = await updateProfile(updates);
      if (error) throw error;

      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleShareProfile = async () => {
    if (!profile) return;

    try {
      // Generate the shareable URL
      const shareUrl = `${window.location.origin}/talent/${profile.id}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      // Track the share
      try {
        await supabase.rpc('track_profile_share', {
          p_shared_user_id: profile.id,
          p_share_platform: 'direct_link'
        });
      } catch (error) {
        console.error('Error tracking share:', error);
      }

      setSuccess('Profile link copied to clipboard!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to copy link to clipboard');
      setTimeout(() => setError(null), 3000);
    }
  };

  const voiceSpecialties = [
    'Commercial', 'Narration', 'Character Voice', 'Audiobook', 'Podcast',
    'E-Learning', 'Corporate', 'Documentary', 'Animation', 'Video Game',
    'IVR/Phone System', 'Radio', 'TV/Film', 'Explainer Video'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Profile not found</div>
          <Button onClick={onBack} className="mt-4">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="outline" onClick={onBack} className="mb-4">
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your personal information and voice-over preferences</p>
          </div>
          {!isEditing && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleShareProfile}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Profile
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Profile Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar
                    className="h-24 w-24 cursor-pointer ring-2 ring-border hover:ring-primary transition-colors"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={profile.avatar_url || "/placeholder-avatar.jpg"} />
                    <AvatarFallback className="text-lg">
                      {profile.full_name
                        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                        : profile.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                    <Camera className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Basic Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold">
                      {profile.full_name || profile.email?.split('@')[0] || 'User'}
                    </h2>
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role === 'admin' ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Administrator
                        </>
                      ) : (
                        <>
                          <Mic className="h-3 w-3 mr-1" />
                          Voice Artist
                        </>
                      )}
                    </Badge>
                    {profile.subscription_status !== 'trial' && profile.billing_cycle !== 'free' && (
                      <Badge variant="outline" className="text-yellow-600">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Stats */}
                  {profileStats && (
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{profileStats.total_views || 0}</span>
                        <span className="text-muted-foreground">Profile Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{profileStats.total_likes || 0}</span>
                        <span className="text-muted-foreground">Likes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{profileStats.total_shares || 0}</span>
                        <span className="text-muted-foreground">Shares</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <PhoneInput
                    id="phone"
                    value={formData.phone}
                    onChange={(value) => handleInputChange('phone', value || '')}
                    disabled={!isEditing}
                    defaultCountry="GB"
                    international
                    countryCallingCodeEditable={false}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Select your country code from the dropdown</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    placeholder="City, State/Country"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself and your voice-over experience..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>
                Your voice-over expertise and professional details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => handleInputChange('experience_years', e.target.value)}
                    disabled={!isEditing}
                    placeholder="5"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                    disabled={!isEditing}
                    placeholder="150"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label>Voice-Over Specialties</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select the types of voice-over work you specialize in
                </p>
                <div className="flex flex-wrap gap-2">
                  {voiceSpecialties.map((specialty) => (
                    <Badge
                      key={specialty}
                      variant={formData.specialties.includes(specialty) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        isEditing ? 'hover:bg-primary hover:text-primary-foreground' : 'cursor-default'
                      }`}
                      onClick={() => isEditing && handleSpecialtyToggle(specialty)}
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VO Videos Gallery */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    My VO Profiles
                  </CardTitle>
                  <CardDescription>
                    Your video and audio profiles saved to your account
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/create'}>
                  <Mic className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {voLoading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading your VO profiles...</div>
                </div>
              ) : voProfiles.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No VO Profiles Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first voice-over profile to showcase your talent
                  </p>
                  <Button onClick={() => window.location.href = '/dashboard/create'}>
                    <Mic className="h-4 w-4 mr-2" />
                    Create Your First VO Profile
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {voProfiles.map((vo) => (
                    <Card key={vo.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        {/* Video/Audio Preview */}
                        <div className="relative aspect-video bg-muted flex items-center justify-center">
                          {vo.thumbnail_url ? (
                            <img
                              src={vo.thumbnail_url}
                              alt={vo.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/10 to-primary/5">
                              {vo.recording_type === 'video' ? (
                                <Video className="h-12 w-12 text-primary opacity-50" />
                              ) : (
                                <Mic className="h-12 w-12 text-primary opacity-50" />
                              )}
                            </div>
                          )}
                          {/* Play Button Overlay */}
                          <button
                            onClick={() => setSelectedVideo(vo.video_url || vo.audio_file_url || null)}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <div className="bg-white rounded-full p-4">
                              <Play className="h-6 w-6 text-primary fill-current" />
                            </div>
                          </button>
                          {/* Duration Badge */}
                          {vo.duration_seconds && (
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {Math.floor(vo.duration_seconds / 60)}:{(vo.duration_seconds % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                        </div>

                        {/* VO Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{vo.title}</h3>
                            <Badge variant={vo.is_active ? 'default' : 'secondary'} className="text-xs">
                              {vo.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          {vo.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {vo.description}
                            </p>
                          )}

                          {/* Tags */}
                          {vo.tags && vo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {vo.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {vo.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{vo.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Stats & Actions */}
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {vo.view_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {vo.like_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Share2 className="h-3 w-3" />
                                {vo.share_count}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  /* TODO: Implement edit */
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this VO profile?')) {
                                    await deleteVOProfile(vo.id)
                                    setSuccess('VO profile deleted successfully')
                                    setTimeout(() => setSuccess(null), 3000)
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Player Modal */}
          {selectedVideo && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => setSelectedVideo(null)}
            >
              <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                <div className="bg-background rounded-lg overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">VO Profile Preview</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedVideo(null)}>
                      ✕
                    </Button>
                  </div>
                  <video
                    src={selectedVideo}
                    controls
                    autoPlay
                    className="w-full aspect-video bg-black"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy & Visibility Settings
              </CardTitle>
              <CardDescription>
                Control how your profile appears in the talent directory and what information is visible to others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is_profile_public" className="text-sm font-medium">
                    Public Profile
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show your profile in the public talent directory
                  </p>
                </div>
                <Switch
                  id="is_profile_public"
                  checked={formData.is_profile_public}
                  onCheckedChange={(checked) => handleInputChange('is_profile_public', checked)}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is_available" className="text-sm font-medium">
                    Available for Work
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show that you're currently accepting new projects
                  </p>
                </div>
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => handleInputChange('is_available', checked)}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show_contact_info" className="text-sm font-medium">
                    Show Contact Information
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display your website and phone number publicly
                  </p>
                </div>
                <Switch
                  id="show_contact_info"
                  checked={formData.show_contact_info}
                  onCheckedChange={(checked) => handleInputChange('show_contact_info', checked)}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show_rates" className="text-sm font-medium">
                    Show Hourly Rate
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display your hourly rate in search results
                  </p>
                </div>
                <Switch
                  id="show_rates"
                  checked={formData.show_rates}
                  onCheckedChange={(checked) => handleInputChange('show_rates', checked)}
                  disabled={!isEditing}
                />
              </div>

              {formData.is_profile_public && (
                <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                  <Share2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="mb-2">
                      Your public profile is shareable! Click "Share Profile" above to copy your link.
                    </div>
                    <div className="text-xs font-mono bg-white/50 p-2 rounded border border-blue-200">
                      {window.location.origin}/talent/{profile.id}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!formData.is_profile_public && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your profile is currently private and won't appear in talent directory searches.
                    Enable "Public Profile" to be discovered by potential clients.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                  // Reset form data
                  if (profile) {
                    setFormData({
                      full_name: profile.full_name || "",
                      bio: profile.bio || "",
                      location: profile.location || "",
                      website: profile.website || "",
                      phone: profile.phone || "",
                      specialties: profile.specialties || [],
                      hourly_rate: profile.hourly_rate?.toString() || "",
                      experience_years: profile.experience_years?.toString() || "",
                      is_profile_public: profile.is_profile_public ?? true,
                      is_available: profile.is_available ?? true,
                      show_contact_info: profile.show_contact_info ?? false,
                      show_rates: profile.show_rates ?? true,
                    });
                  }
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;