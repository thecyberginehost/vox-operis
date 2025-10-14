import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, MapPin, DollarSign, Clock, Eye, Heart, Star,
  Globe, Phone, Mail, User, Calendar, Briefcase, Video, Mic, Play
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PublicProfileData {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  phone: string | null;
  specialties: string[];
  hourly_rate: number | null;
  experience_years: number | null;
  is_available: boolean;
  created_at: string;
  total_views: number;
  total_likes: number;
  avg_rating: number;
  show_contact_info: boolean;
  show_rates: boolean;
  last_active_at: string | null;
  vo_profiles_count: number;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [voProfiles, setVoProfiles] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voLoading, setVoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadPublicProfile();
      loadPublicVOProfiles();
      trackProfileView();
    }
  }, [userId]);

  const loadPublicProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_public_profile', {
        p_user_id: userId
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        setError('Profile not found or not public');
        return;
      }

      setProfile(data[0]);
    } catch (err) {
      console.error('Error loading public profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPublicVOProfiles = async () => {
    try {
      setVoLoading(true);
      const { data, error } = await supabase.rpc('get_public_vo_profiles', {
        p_user_id: userId
      });

      if (!error && data) {
        setVoProfiles(data);
      }
    } catch (error) {
      console.error('Error loading VO profiles:', error);
    } finally {
      setVoLoading(false);
    }
  };

  const trackProfileView = async () => {
    try {
      await supabase.rpc('track_profile_view_enhanced', {
        p_viewed_user_id: userId,
        p_viewer_ip: null, // Would be set by server in production
        p_user_agent: navigator.userAgent,
        p_referrer: document.referrer,
        p_session_id: null
      });
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  const handleContactClick = () => {
    if (profile?.show_contact_info && profile.email) {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-200 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md mx-auto text-center">
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Profile not found or not available publicly.'}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/talent')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  const displayName = profile.full_name || profile.email?.split('@')[0] || 'Voice Artist';
  const memberSince = new Date(profile.created_at).getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="max-w-6xl mx-auto p-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/talent')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url || "/placeholder-avatar.jpg"} />
              <AvatarFallback className="text-2xl">
                {profile.full_name
                  ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : profile.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{displayName}</h1>
                {profile.is_available && (
                  <Badge variant="default" className="bg-green-500">
                    Available
                  </Badge>
                )}
              </div>

              {profile.location && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-6 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{profile.total_views}</span>
                  <span className="text-muted-foreground">views</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{profile.total_likes}</span>
                  <span className="text-muted-foreground">likes</span>
                </div>
                {profile.avg_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(profile.avg_rating)}</div>
                    <span className="font-medium">{profile.avg_rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">{profile.vo_profiles_count}</span>
                  <span className="text-muted-foreground">projects</span>
                </div>
              </div>

              {/* Contact Button */}
              <div className="flex gap-3">
                <Button onClick={handleContactClick} disabled={!profile.show_contact_info}>
                  <Mail className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                {profile.show_contact_info && profile.website && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(profile.website!, '_blank')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Specialties */}
            {profile.specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VO Profiles Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Voice-Over Showcase
                </CardTitle>
                <CardDescription>
                  {displayName}'s voice-over portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {voLoading ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">Loading VO profiles...</div>
                  </div>
                ) : voProfiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No public VO profiles available yet.
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

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {vo.view_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {vo.like_count}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Professional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.experience_years && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{profile.experience_years} years</div>
                      <div className="text-sm text-muted-foreground">Experience</div>
                    </div>
                  </div>
                )}

                {profile.show_rates && profile.hourly_rate && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">${profile.hourly_rate}/hour</div>
                      <div className="text-sm text-muted-foreground">Hourly Rate</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Member since {memberSince}</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.last_active_at && (
                        <>Active {new Date(profile.last_active_at).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {profile.show_contact_info && (
                  <>
                    {profile.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{profile.phone}</div>
                          <div className="text-sm text-muted-foreground">Phone</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{profile.email}</div>
                        <div className="text-sm text-muted-foreground">Email</div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Availability Status */}
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-2 ${profile.is_available ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-3 h-3 rounded-full ${profile.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium">
                    {profile.is_available ? 'Available for new projects' : 'Not available'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {profile.is_available
                    ? 'Currently accepting new voice-over projects and collaborations.'
                    : 'Not currently taking on new projects. Check back later!'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;