import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, DollarSign, Clock, Star, Filter, X, User, Mail, Globe, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfessionalProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  professional_summary: string | null;
  current_role: string | null;
  location: string | null;
  website: string | null;
  phone: string | null;
  skills: string[];
  soft_skills: string[];
  specialties: string[];
  hourly_rate: number | null;
  years_of_experience: number | null;
  experience_years: number | null;
  user_type: string | null;
  availability_status: string | null;
  preferred_work_type: string | null;
  is_active: boolean;
  created_at: string;
  // Stats from profile analytics
  total_views?: number;
  total_likes?: number;
  avg_rating?: number;
  is_available?: boolean;
}

interface SearchFilters {
  query: string;
  skill: string;
  location: string;
  userType: string;
  minRate: number;
  maxRate: number;
  minExperience: number;
  maxExperience: number;
  availability: string;
  workType: string;
}

interface TalentDirectoryProps {
  onBack: () => void;
}

const TalentDirectory = ({ onBack }: TalentDirectoryProps) => {
  const [profiles, setProfiles] = useState<ProfessionalProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    skill: "all",
    location: "",
    userType: "all",
    minRate: 0,
    maxRate: 500,
    minExperience: 0,
    maxExperience: 20,
    availability: "all",
    workType: "all"
  });

  const [showFilters, setShowFilters] = useState(false);

  const professionalSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C#', 'PHP', 'Ruby',
    'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript', 'Vue.js', 'Angular',
    'Project Management', 'Data Analysis', 'UI/UX Design', 'Digital Marketing',
    'Sales', 'Customer Service', 'Accounting', 'HR', 'Writing', 'Translation'
  ];

  useEffect(() => {
    loadTalentProfiles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, profiles]);

  const loadTalentProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try the new professional profiles RPC function first, fallback to direct query if it fails
      let { data, error } = await supabase.rpc('search_professional_profiles', {
        p_limit: 100,
        p_offset: 0
      });

      // If RPC fails, try direct query as fallback
      if (error) {
        console.warn('RPC function failed, trying direct query:', error);
        const fallbackQuery = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            avatar_url,
            bio,
            professional_summary,
            current_role,
            location,
            website,
            phone,
            skills,
            soft_skills,
            specialties,
            hourly_rate,
            years_of_experience,
            experience_years,
            user_type,
            availability_status,
            preferred_work_type,
            is_active,
            is_available,
            created_at,
            show_contact_info,
            show_rates
          `)
          .eq('is_profile_public', true)
          .eq('is_active', true)
          .limit(100);

        if (fallbackQuery.error) {
          throw fallbackQuery.error;
        }

        // Transform data to match expected format
        data = fallbackQuery.data?.map(profile => ({
          ...profile,
          total_views: 0,
          total_likes: 0,
          avg_rating: 0
        })) || [];
      }

      setProfiles(data || []);
    } catch (err) {
      console.error('Error loading talent profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load talent profiles');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...profiles];

    // Text search
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(profile =>
        profile.full_name?.toLowerCase().includes(query) ||
        profile.bio?.toLowerCase().includes(query) ||
        profile.professional_summary?.toLowerCase().includes(query) ||
        profile.current_role?.toLowerCase().includes(query) ||
        profile.location?.toLowerCase().includes(query) ||
        profile.skills?.some(s => s.toLowerCase().includes(query)) ||
        profile.specialties?.some(s => s.toLowerCase().includes(query))
      );
    }

    // Skill filter
    if (filters.skill && filters.skill !== 'all') {
      filtered = filtered.filter(profile =>
        profile.skills?.includes(filters.skill) ||
        profile.specialties?.includes(filters.skill)
      );
    }

    // User type filter
    if (filters.userType && filters.userType !== 'all') {
      filtered = filtered.filter(profile =>
        profile.user_type === filters.userType
      );
    }

    // Work type filter
    if (filters.workType && filters.workType !== 'all') {
      filtered = filtered.filter(profile =>
        profile.preferred_work_type === filters.workType
      );
    }

    // Location filter
    if (filters.location.trim()) {
      const location = filters.location.toLowerCase();
      filtered = filtered.filter(profile =>
        profile.location?.toLowerCase().includes(location)
      );
    }

    // Rate filter
    filtered = filtered.filter(profile => {
      if (!profile.hourly_rate) return true;
      return profile.hourly_rate >= filters.minRate && profile.hourly_rate <= filters.maxRate;
    });

    // Experience filter
    filtered = filtered.filter(profile => {
      const experience = profile.years_of_experience || profile.experience_years;
      if (!experience) return true;
      return experience >= filters.minExperience && experience <= filters.maxExperience;
    });

    // Availability filter
    if (filters.availability === 'available') {
      filtered = filtered.filter(profile =>
        profile.is_available !== false &&
        profile.availability_status === 'available'
      );
    }

    setFilteredProfiles(filtered);
  }, [filters, profiles]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      skill: "all",
      location: "",
      userType: "all",
      minRate: 0,
      maxRate: 500,
      minExperience: 0,
      maxExperience: 20,
      availability: "all",
      workType: "all"
    });
  };

  const viewProfile = (profileId: string) => {
    navigate(`/talent/${profileId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading talent directory...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="outline" onClick={onBack} className="mb-4">
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Professional Directory</h1>
            <p className="text-muted-foreground">Discover talented professionals and candidates</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className={`w-80 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Search & Filters
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Text Search */}
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, bio, location..."
                      value={filters.query}
                      onChange={(e) => handleFilterChange('query', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Separator />

                {/* Skill Filter */}
                <div>
                  <Label>Skills</Label>
                  <Select value={filters.skill} onValueChange={(value) => handleFilterChange('skill', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Skills</SelectItem>
                      {professionalSkills.map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* User Type Filter */}
                <div>
                  <Label>Professional Type</Label>
                  <Select value={filters.userType} onValueChange={(value) => handleFilterChange('userType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="candidate">Candidates</SelectItem>
                      <SelectItem value="recruiter">Recruiters</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="City, state, country..."
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Rate Filter */}
                <div>
                  <Label>Hourly Rate ($)</Label>
                  <div className="px-2 py-4">
                    <Slider
                      value={[filters.minRate, filters.maxRate]}
                      onValueChange={([min, max]) => {
                        handleFilterChange('minRate', min);
                        handleFilterChange('maxRate', max);
                      }}
                      max={500}
                      step={25}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>${filters.minRate}</span>
                      <span>${filters.maxRate}</span>
                    </div>
                  </div>
                </div>

                {/* Experience Filter */}
                <div>
                  <Label>Years of Experience</Label>
                  <div className="px-2 py-4">
                    <Slider
                      value={[filters.minExperience, filters.maxExperience]}
                      onValueChange={([min, max]) => {
                        handleFilterChange('minExperience', min);
                        handleFilterChange('maxExperience', max);
                      }}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>{filters.minExperience} years</span>
                      <span>{filters.maxExperience}+ years</span>
                    </div>
                  </div>
                </div>

                {/* Work Type Filter */}
                <div>
                  <Label>Work Preference</Label>
                  <Select value={filters.workType} onValueChange={(value) => handleFilterChange('workType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability Filter */}
                <div>
                  <Label>Availability</Label>
                  <Select value={filters.availability} onValueChange={(value) => handleFilterChange('availability', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="available">Available Now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  {filteredProfiles.length} Professionals Found
                </h2>
                <p className="text-sm text-muted-foreground">
                  Showing results {filteredProfiles.length > 0 ? '1' : '0'}-{filteredProfiles.length} of {filteredProfiles.length}
                </p>
              </div>
            </div>

            {/* Profile Grid */}
            {filteredProfiles.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Professionals Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search filters or search terms.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {filteredProfiles.map((profile) => (
                  <Card key={profile.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => viewProfile(profile.id)}>
                    <CardContent className="p-6">
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={profile.avatar_url || "/placeholder-avatar.jpg"} />
                          <AvatarFallback>
                            {profile.full_name
                              ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                              : profile.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {profile.full_name || profile.email?.split('@')[0] || 'Professional'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {profile.current_role || 'Professional'}
                          </p>
                          {profile.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {profile.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bio/Summary */}
                      {(profile.professional_summary || profile.bio) && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {profile.professional_summary || profile.bio}
                        </p>
                      )}

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(profile.skills || profile.specialties || []).slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {(profile.skills || profile.specialties || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(profile.skills || profile.specialties || []).length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                        {(profile.years_of_experience || profile.experience_years) && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.years_of_experience || profile.experience_years} years experience</span>
                          </div>
                        )}
                        {profile.hourly_rate && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>${profile.hourly_rate}/hour</span>
                          </div>
                        )}
                        {profile.total_views && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.total_views} profile views</span>
                          </div>
                        )}
                      </div>

                      {/* Contact Options */}
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" className="flex-1">
                          View Profile
                        </Button>
                        <Button variant="outline" size="sm">
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentDirectory;