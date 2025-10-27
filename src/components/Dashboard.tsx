import { useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Mic, Plus, Settings as SettingsIcon, HelpCircle, Crown, Clock, Shield, LogOut, User, FileText, Users, Briefcase, Search, Eye, UserCheck, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import VOCreationFlow from "./VOCreationFlow";
import AdminPanel from "./AdminPanel";
import VOTranscriptCopilot from "./VOTranscriptCopilot";
import Profile from "./Profile";
import TalentDirectory from "./TalentDirectory";
import NewOnboarding from "./NewOnboarding";
import VOBuilder from "./VOBuilder";
import VOEdit from "./VOEdit";
import VOAnalytics from "./VOAnalytics";
import Settings from "./Settings";
import WelcomeModal from "./WelcomeModal";
import MyScripts from "./MyScripts";
import { EnhanceVODialog, EnhancementResults as EnhancementResultsType } from "./EnhanceVODialog";
import { EnhancementResults } from "./EnhancementResults";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [showCreationFlow, setShowCreationFlow] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [currentView, setCurrentView] = useState<'candidate' | 'recruiter'>('candidate');
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { profile, isAdmin, loading } = useProfile();
  const { signOut } = useAuth();

  // Set initial view based on user type
  useEffect(() => {
    if (profile?.user_type) {
      if (profile.user_type === 'recruiter') {
        setCurrentView('recruiter');
      } else if (profile.user_type === 'candidate' || profile.user_type === 'both') {
        setCurrentView('candidate');
      }
    }
  }, [profile?.user_type]);

  // Check for welcome modal
  useEffect(() => {
    const shouldShow = localStorage.getItem('show_welcome_modal');
    if (shouldShow === 'true' && currentPath === '/dashboard') {
      setShowWelcomeModal(true);
    }
  }, [currentPath]);

  const isActive = (path: string) => {
    // Exact match for home route
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    // For other routes, check if current path starts with the route
    return currentPath === path;
  };

  // Load subscription data when profile is available
  useEffect(() => {
    if (profile?.id) {
      loadSubscriptionData();
    }
  }, [profile?.id]);

  const loadSubscriptionData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_subscription_details', {
        p_user_id: profile.id
      });

      if (!error && data) {
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getNavigationSections = () => {
    const sections = [
      {
        id: 'main',
        title: null,
        items: [{ title: "Home", url: "/dashboard", icon: Home }]
      }
    ];

    if (currentView === 'candidate') {
      sections.push(
        {
          id: 'mywork',
          title: 'My Work',
          items: [
            { title: "VO Profiles", url: "/dashboard/vos", icon: Mic },
            { title: "Script Copilot", url: "/dashboard/copilot", icon: FileText },
            { title: "My Scripts", url: "/dashboard/scripts", icon: FileText },
          ]
        },
        {
          id: 'discover',
          title: 'Discover',
          items: [
            { title: "Browse Profiles", url: "/dashboard/talent", icon: Users },
          ]
        }
      );
    } else {
      sections.push(
        {
          id: 'hiring',
          title: 'Hiring Tools',
          items: [
            { title: "Browse Talent", url: "/dashboard/talent", icon: Users },
            { title: "Post Job", url: "/dashboard/post-job", icon: Plus },
            { title: "My Job Posts", url: "/dashboard/my-jobs", icon: Briefcase },
            { title: "Saved Candidates", url: "/dashboard/saved", icon: Eye },
          ]
        }
      );
    }

    sections.push({
      id: 'account',
      title: 'Account',
      items: [
        { title: "Profile", url: "/dashboard/profile", icon: User },
        { title: "Settings", url: "/dashboard/settings", icon: SettingsIcon },
        { title: "Support", url: "/dashboard/support", icon: HelpCircle },
        ...(isAdmin ? [{ title: "Admin Panel", url: "/dashboard/admin", icon: Shield }] : []),
      ]
    });

    return sections;
  };

  const navigationSections = getNavigationSections();

  const handleCreateNew = () => {
    navigate('/dashboard/create');
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  if (showCreationFlow) {
    return <VOCreationFlow onComplete={() => setShowCreationFlow(false)} />;
  }

  // Show VO Transcript Copilot if accessing copilot route
  if (currentPath === '/dashboard/copilot') {
    return <VOTranscriptCopilot onBack={() => navigate('/dashboard')} />;
  }

  // Show My Scripts if accessing scripts route
  if (currentPath === '/dashboard/scripts') {
    return <MyScripts />;
  }

  // Show profile page if accessing profile route
  if (currentPath === '/dashboard/profile') {
    return <Profile onBack={() => navigate('/dashboard')} />;
  }

  // Show talent directory if accessing talent route
  if (currentPath === '/dashboard/talent') {
    return <TalentDirectory onBack={() => navigate('/dashboard')} />;
  }

  // Show VO Builder if accessing create route
  if (currentPath === '/dashboard/create') {
    return <VOBuilder onBack={() => navigate('/dashboard')} />;
  }

  // Show VO Edit if accessing edit route
  if (currentPath.startsWith('/dashboard/edit-vo/')) {
    return <VOEdit onBack={() => navigate('/dashboard/vos')} />;
  }

  // Show VO Analytics if accessing analytics route
  if (currentPath.startsWith('/dashboard/vo-analytics/')) {
    return <VOAnalytics onBack={() => navigate('/dashboard/vos')} />;
  }

  // Show Settings if accessing settings route
  if (currentPath === '/dashboard/settings') {
    return <Settings onBack={() => navigate('/dashboard')} onLogout={onLogout} />;
  }

  // Show admin panel if accessing admin route
  if (currentPath === '/dashboard/admin' && isAdmin) {
    return <AdminPanel />;
  }

  // Loading state while profile is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // Show onboarding if user hasn't completed it
  if (profile && !profile.onboarding_completed) {
    return <NewOnboarding onComplete={() => window.location.reload()} />;
  }

  return (
    <>
      {showWelcomeModal && <WelcomeModal onClose={() => setShowWelcomeModal(false)} />}

      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="w-64 border-r border-border [&_[data-sidebar=menu-item]]:text-white">
          <SidebarContent>
            <div className="p-6 border-b border-border">
              <div className="flex items-center space-x-3 mb-4">
                <img src="https://ai-stream-solutions.s3.us-east-1.amazonaws.com/VO.png" alt="Vox-Operis" className="h-8 w-auto object-contain" />
                <span className="text-xl font-bold">Vox-Operis</span>
              </div>
            </div>

            {navigationSections.map((section) => (
              <SidebarGroup key={section.id}>
                {section.title && (
                  <Collapsible
                    open={expandedSections.includes(section.id)}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel className="hover:bg-muted/10 cursor-pointer flex items-center justify-between py-2 px-2 rounded">
                        {section.title}
                        {expandedSections.includes(section.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {section.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                              {item.title === "Create Profile" || item.title === "Post Job" ? (
                                <button
                                  onClick={handleCreateNew}
                                  className="flex w-full items-center gap-2 rounded-md p-2 text-sm transition-colors !text-white hover:bg-muted/60 hover:!text-white ml-2"
                                >
                                  <item.icon className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{item.title}</span>
                                </button>
                              ) : (
                                <NavLink
                                  to={item.url}
                                  end={item.url === "/dashboard"}
                                  className={({ isActive }) =>
                                    `flex w-full items-center gap-2 rounded-md p-2 text-sm transition-colors ml-2 !important ${
                                      isActive
                                        ? "bg-primary/10 !text-primary border-r-2 border-primary font-medium"
                                        : "!text-white hover:bg-muted/60 hover:!text-white"
                                    }`
                                  }
                                >
                                  <item.icon className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{item.title}</span>
                                </NavLink>
                              )}
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                {!section.title && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <NavLink
                            to={item.url}
                            end={item.url === "/dashboard"}
                            className={({ isActive }) =>
                              `flex w-full items-center gap-2 rounded-md p-2 text-sm transition-colors !important ${
                                isActive
                                  ? "bg-primary/10 !text-primary border-r-2 border-primary font-medium"
                                  : "!text-white hover:bg-muted/60 hover:!text-white"
                              }`
                            }
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.title}</span>
                          </NavLink>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
            </div>

            <div className="flex items-center space-x-6">
              {/* Timer */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Est. 15 min remaining</span>
              </div>

              {/* Plan Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {subscriptionData?.plan?.display_name || 'Free Plan'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {profile?.vo_count || 0}/{subscriptionData?.plan?.max_vos || 1} VO used
                    </span>
                  </div>
                </div>
                {!subscriptionData?.plan?.is_free && (
                  <Button variant="outline" size="sm" className="gap-2">
                    <Crown className="h-4 w-4" />
                    Upgrade
                  </Button>
                )}
              </div>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2 hover:bg-accent">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {profile?.full_name || profile?.email || 'User'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {profile?.role === 'admin' ? 'Administrator' :
                         profile?.user_type === 'recruiter' ? 'Recruiter' :
                         profile?.user_type === 'candidate' ? 'Candidate' :
                         profile?.user_type === 'both' ? 'Candidate & Recruiter' : 'Professional'}
                      </div>
                    </div>
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url || "/placeholder-avatar.jpg"} />
                      <AvatarFallback>
                        {profile?.full_name
                          ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                          : profile?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard/admin'}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 p-6">
            {currentPath === "/dashboard" && <DashboardHome profile={profile} currentView={currentView} />}
            {currentPath === "/dashboard/vos" && <MyVOs />}
            {currentPath === "/dashboard/support" && <Support />}
          </main>
        </div>
        </div>
      </SidebarProvider>
    </>
  );
};

// Dashboard Home Component
const DashboardHome = ({ profile, currentView }: { profile: any; currentView: 'candidate' | 'recruiter' }) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadDashboardStats();
    }
  }, [profile?.id]);

  const loadDashboardStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_dashboard_stats', {
        p_user_id: profile.id
      });

      if (!error && data) {
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (profile?.full_name) {
      // Extract first name from full name
      return profile.full_name.split(' ')[0];
    }
    if (profile?.email) {
      // Extract name from email (part before @)
      return profile.email.split('@')[0];
    }
    return 'User';
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-gradient">Welcome back, {getDisplayName()}!</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="modern-card p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getViewTitle = () => {
    if (currentView === 'candidate') {
      return `Welcome back, ${getDisplayName()}!`;
    } else {
      return `Recruiter Dashboard - Welcome, ${getDisplayName()}!`;
    }
  };

  const getViewCards = () => {
    if (currentView === 'candidate') {
      return (
        <>
          <div className="modern-card card-hover-lift p-6">
            <h3 className="text-lg font-semibold mb-2">Your VO Profiles</h3>
            <div className="text-3xl font-bold text-primary">
              {dashboardStats?.vo_count || 0}
            </div>
            <p className="text-sm text-muted-foreground">Active profiles</p>
          </div>

          <div className="modern-card card-hover-lift p-6">
            <h3 className="text-lg font-semibold mb-2">Profile Views</h3>
            <div className="text-3xl font-bold text-primary">
              {dashboardStats?.total_profile_views || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              {dashboardStats?.monthly_profile_views || 0} this month
            </p>
          </div>

          <div className="modern-card card-hover-lift p-6">
            <h3 className="text-lg font-semibold mb-2">New Opportunities</h3>
            <div className="text-3xl font-bold text-primary">
              {dashboardStats?.new_opportunities || 0}
            </div>
            <p className="text-sm text-muted-foreground">Available jobs</p>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="modern-card card-hover-lift p-6">
            <h3 className="text-lg font-semibold mb-2">Active Job Posts</h3>
            <div className="text-3xl font-bold text-primary">
              {dashboardStats?.active_jobs || 0}
            </div>
            <p className="text-sm text-muted-foreground">Currently hiring</p>
          </div>

          <div className="modern-card card-hover-lift p-6">
            <h3 className="text-lg font-semibold mb-2">Total Applications</h3>
            <div className="text-3xl font-bold text-primary">
              {dashboardStats?.total_applications || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              {dashboardStats?.new_applications || 0} new this week
            </p>
          </div>

          <div className="modern-card card-hover-lift p-6">
            <h3 className="text-lg font-semibold mb-2">Talent Pool</h3>
            <div className="text-3xl font-bold text-primary">
              {dashboardStats?.available_candidates || 0}
            </div>
            <p className="text-sm text-muted-foreground">Available professionals</p>
          </div>
        </>
      );
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gradient">{getViewTitle()}</h1>

      {/* View Mode Indicator */}
      <div className="mb-6">
        <Badge variant={currentView === 'candidate' ? 'default' : 'secondary'} className="text-sm">
          {currentView === 'candidate' ? '👤 Candidate Mode' : '💼 Recruiter Mode'}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getViewCards()}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 section-header">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentView === 'candidate' ? (
            <>
              <Button
                variant="outline"
                className="modern-button h-auto p-4 flex flex-col gap-2"
                onClick={() => window.location.href = '/dashboard/create'}
              >
                <Plus className="h-5 w-5" />
                <span>Create VO Profile</span>
              </Button>
              <Button
                variant="outline"
                className="modern-button h-auto p-4 flex flex-col gap-2"
                onClick={() => window.location.href = '/dashboard/talent'}
              >
                <Users className="h-5 w-5" />
                <span>Browse Profiles</span>
              </Button>
              <Button
                variant="outline"
                className="modern-button h-auto p-4 flex flex-col gap-2"
                onClick={() => window.location.href = '/dashboard/copilot'}
              >
                <FileText className="h-5 w-5" />
                <span>Script Copilot</span>
              </Button>
              <Button
                variant="outline"
                className="modern-button h-auto p-4 flex flex-col gap-2"
                onClick={() => window.location.href = '/dashboard/vos'}
              >
                <Mic className="h-5 w-5" />
                <span>My VO Profiles</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="modern-button h-auto p-4 flex flex-col gap-2"
                onClick={() => window.location.href = '/dashboard/post-job'}
              >
                <Plus className="h-5 w-5" />
                <span>Post Job</span>
              </Button>
              <Button
                variant="outline"
                className="modern-button h-auto p-4 flex flex-col gap-2"
                onClick={() => window.location.href = '/dashboard/talent'}
              >
                <Users className="h-5 w-5" />
                <span>Browse Talent</span>
              </Button>
              <Button
                variant="outline"
                className="modern-button h-auto p-4 flex flex-col gap-2"
                onClick={() => window.location.href = '/dashboard/saved'}
              >
                <Eye className="h-5 w-5" />
                <span>Saved Candidates</span>
              </Button>
              <Button
                variant="outline"
                className="modern-button h-auto p-4 flex flex-col gap-2"
                onClick={() => window.location.href = '/dashboard/my-jobs'}
              >
                <Briefcase className="h-5 w-5" />
                <span>Manage Jobs</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// My VOs Component
const MyVOs = () => {
  const [voProfiles, setVoProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);
  const [selectedVOForEnhancement, setSelectedVOForEnhancement] = useState<any | null>(null);
  const [enhancementResults, setEnhancementResults] = useState<{[key: string]: EnhancementResultsType}>({});
  const [activeTab, setActiveTab] = useState<'public' | 'job-specific'>('public');
  const { profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.id) {
      loadVOProfiles();
    }
  }, [profile?.id]);

  const loadVOProfiles = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_vo_profiles', {
        p_user_id: profile.id
      });

      if (!error) {
        setVoProfiles(data || []);
      }
    } catch (error) {
      console.error('Error loading VO profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (voId: string) => {
    try {
      // Generate the shareable URL for the specific VO profile
      const shareUrl = `${window.location.origin}/vo/${voId}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      // Track the share
      try {
        await supabase.rpc('track_vo_share', {
          p_vo_profile_id: voId,
          p_share_platform: 'direct_link'
        });
      } catch (error) {
        console.error('Error tracking share:', error);
      }

      setSuccessMessage('VO profile link copied to clipboard!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link to clipboard');
    }
  };

  const handleEdit = (voId: string) => {
    // Navigate to edit page or open edit modal
    navigate(`/dashboard/edit-vo/${voId}`);
  };

  const handleAnalytics = (voId: string) => {
    // Navigate to analytics page or open analytics modal
    navigate(`/dashboard/vo-analytics/${voId}`);
  };

  const handleEnhance = (vo: any) => {
    setSelectedVOForEnhancement(vo);
    setShowEnhanceDialog(true);
  };

  const handleEnhancementComplete = (voId: string, results: EnhancementResultsType) => {
    setEnhancementResults(prev => ({
      ...prev,
      [voId]: results
    }));
  };

  const handleToggleVisibility = async (voId: string, newVisibility: 'public' | 'job-specific') => {
    try {
      const { error } = await supabase
        .from('vo_profiles')
        .update({ visibility_type: newVisibility })
        .eq('id', voId);

      if (error) throw error;

      // Reload VOs to reflect changes
      await loadVOProfiles();

      setSuccessMessage(`VO visibility changed to ${newVisibility === 'public' ? 'Public' : 'Job-Specific'}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Failed to update visibility');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-gradient">My Voice-Over Profiles</h1>
        <div className="modern-card p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded mb-4"></div>
            <div className="flex space-x-2">
              <div className="h-8 w-16 bg-muted rounded"></div>
              <div className="h-8 w-16 bg-muted rounded"></div>
              <div className="h-8 w-20 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (voProfiles.length === 0) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-gradient">My Voice-Over Profiles</h1>
        <div className="modern-card p-8 text-center">
          <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Voice-Over Profiles Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first voice-over profile to start showcasing your talent to potential clients.
          </p>
          <Button onClick={() => navigate('/dashboard/create')} className="modern-button">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First VO Profile
          </Button>
        </div>
      </div>
    );
  }

  // Filter VOs by type
  const publicVOs = voProfiles.filter((vo: any) => vo.visibility_type === 'public' || !vo.visibility_type);
  const jobSpecificVOs = voProfiles.filter((vo: any) => vo.visibility_type === 'job-specific');

  const renderVOList = (vos: any[]) => {
    if (vos.length === 0) {
      return (
        <div className="modern-card p-8 text-center">
          <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No VOs in this category yet</h3>
          <p className="text-muted-foreground mb-4">
            Create a {activeTab === 'public' ? 'public' : 'job-specific'} voice-over profile.
          </p>
          <Button onClick={() => navigate('/dashboard/create')} className="modern-button">
            <Plus className="h-4 w-4 mr-2" />
            Create VO Profile
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {vos.map((vo) => (
          <div key={vo.id} className="space-y-4">
            <div className="modern-card card-hover-lift p-6 smooth-transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{vo.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={vo.is_active ? "default" : "secondary"}>
                    {vo.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {vo.is_featured && (
                    <Badge variant="outline" className="text-yellow-600">
                      Featured
                    </Badge>
                  )}
                  {enhancementResults[vo.id] && (
                    <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-purple-300 dark:border-purple-700">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Enhanced
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                {vo.description || 'No description provided.'}
              </p>

              {/* Visibility Toggle */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Visibility:</span>
                {vo.visibility_type === 'job-specific' || activeTab === 'job-specific' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVisibility(vo.id, 'public')}
                    className="modern-button text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Make Public
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVisibility(vo.id, 'job-specific')}
                    className="modern-button text-xs"
                  >
                    <Briefcase className="h-3 w-3 mr-1" />
                    Make Job-Specific
                  </Button>
                )}
                <Badge variant="secondary" className="text-xs">
                  {vo.visibility_type === 'job-specific' ? '🔒 Private' : '🌍 Public'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{vo.view_count} views</span>
                  <span>{vo.like_count} likes</span>
                  <span>{vo.share_count} shares</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="modern-button" onClick={() => handleEdit(vo.id)}>Edit</Button>
                  <Button variant="outline" size="sm" className="modern-button" onClick={() => handleShare(vo.id)}>Share</Button>
                  <Button variant="outline" size="sm" className="modern-button" onClick={() => handleAnalytics(vo.id)}>Analytics</Button>
                  <Button
                    size="sm"
                    onClick={() => handleEnhance(vo)}
                    className="modern-button bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Enhance
                  </Button>
                </div>
              </div>
            </div>

            {/* Show Enhancement Results */}
            {enhancementResults[vo.id] && (
              <div className="modern-card p-6 shadow-modern-lg">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Enhancement Results
                </h4>
                <EnhancementResults results={enhancementResults[vo.id]} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gradient">My Voice-Over Profiles</h1>
        <Button onClick={() => navigate('/dashboard/create')} className="modern-button">
          <Plus className="h-4 w-4 mr-2" />
          Create New VO
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          {successMessage}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'public' | 'job-specific')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Public VOs
            <Badge variant="secondary" className="ml-2">{publicVOs.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="job-specific" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job-Specific VOs
            <Badge variant="secondary" className="ml-2">{jobSpecificVOs.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Public VOs</strong> are searchable and visible in the talent directory. Recruiters can discover you through these profiles.
            </p>
          </div>
          {renderVOList(publicVOs)}
        </TabsContent>

        <TabsContent value="job-specific">
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Job-Specific VOs</strong> are private and tailored for specific job applications. These are not searchable publicly.
            </p>
          </div>
          {renderVOList(jobSpecificVOs)}
        </TabsContent>
      </Tabs>

      {/* Enhancement Dialog */}
      {selectedVOForEnhancement && (
        <EnhanceVODialog
          open={showEnhanceDialog}
          onOpenChange={setShowEnhanceDialog}
          videoUrl={selectedVOForEnhancement.video_url}
          voProfileId={selectedVOForEnhancement.id}
          jobDescription={selectedVOForEnhancement.job_description}
          onEnhancementComplete={(results) => {
            handleEnhancementComplete(selectedVOForEnhancement.id, results);
          }}
        />
      )}
    </div>
  );
};

// Support Component
const Support = () => (
  <div className="max-w-4xl">
    <h1 className="text-3xl font-bold mb-6 text-gradient">Support</h1>
    <div className="modern-card p-6">
      <h3 className="text-lg font-semibold mb-4">How can we help?</h3>
      <p className="text-muted-foreground">
        Contact our support team for assistance with your voice-over profiles.
      </p>
    </div>
  </div>
);

export default Dashboard;