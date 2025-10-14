import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Trash2, Plus, Users, ShieldCheck, ArrowLeft } from "lucide-react";
import { useInviteCodes } from "@/hooks/useInviteCodes";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";
import AdminLogs from "./AdminLogs";
import BulkInviteGenerator from "./BulkInviteGenerator";
import UserManagement from "./UserManagement";
import AnalyticsDashboard from "./AnalyticsDashboard";
import SecurityMonitoring from "./SecurityMonitoring";
import SystemManagement from "./SystemManagement";
import InviteByEmail from "./InviteByEmail";
import BulkEmailSender from "./BulkEmailSender";
import SubscriptionPlanManager from "./SubscriptionPlanManager";

const AdminPanel = () => {
  const { isAdmin } = useProfile();
  const { logInviteCodeGenerated, logInviteCodeDeleted, logUserRoleChanged } = useAdminLogs();
  const { inviteCodes, loading, generateInviteCode, deleteInviteCode, loadInviteCodes } = useInviteCodes({
    logInviteCodeGenerated,
    logInviteCodeDeleted
  });
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSecurityMonitoring, setShowSecurityMonitoring] = useState(false);
  const [showSystemManagement, setShowSystemManagement] = useState(false);
  const [showInviteByEmail, setShowInviteByEmail] = useState(false);
  const [showBulkEmailSender, setShowBulkEmailSender] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [selectedInviteCode, setSelectedInviteCode] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users.",
        });
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleGenerateCode = async () => {
    const { error } = await generateInviteCode();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate invite code.",
      });
    } else {
      toast({
        title: "Invite Code Generated",
        description: "New invite code has been created successfully.",
      });
    }
  };

  const handleDeleteCode = async (id: string) => {
    const { error } = await deleteInviteCode(id);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invite code.",
      });
    } else {
      toast({
        title: "Invite Code Deleted",
        description: "The invite code has been deleted successfully.",
      });
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied",
        description: "Invite code copied to clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy invite code.",
      });
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    // Get user details for logging
    const userToUpdate = users.find(user => user.id === userId);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update user role.",
        });
      } else {
        // Log the role change
        if (userToUpdate) {
          await logUserRoleChanged(userId, userToUpdate.email, currentRole, newRole);
        }

        await loadUsers();
        toast({
          title: "Role Updated",
          description: `User role changed to ${newRole}.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You need administrator privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (showBulkGenerator) {
    return (
      <BulkInviteGenerator onComplete={() => {
        setShowBulkGenerator(false);
        loadInviteCodes(); // Refresh invite codes after bulk generation
      }} />
    );
  }

  if (showUserManagement) {
    return (
      <UserManagement onBack={() => setShowUserManagement(false)} />
    );
  }

  if (showAnalytics) {
    return (
      <AnalyticsDashboard onBack={() => setShowAnalytics(false)} />
    );
  }

  if (showSecurityMonitoring) {
    return (
      <SecurityMonitoring onBack={() => setShowSecurityMonitoring(false)} />
    );
  }

  if (showSystemManagement) {
    return (
      <SystemManagement onBack={() => setShowSystemManagement(false)} />
    );
  }

  if (showInviteByEmail) {
    return (
      <InviteByEmail
        selectedCode={selectedInviteCode}
        onBack={() => {
          setShowInviteByEmail(false);
          setSelectedInviteCode(null);
        }}
        onSuccess={() => {
          loadInviteCodes(); // Refresh invite codes after email sent
        }}
      />
    );
  }

  if (showBulkEmailSender) {
    return (
      <BulkEmailSender
        onBack={() => {
          setShowBulkEmailSender(false);
          loadInviteCodes(); // Refresh invite codes after bulk email sent
        }}
      />
    );
  }

  if (showSubscriptionManager) {
    return (
      <SubscriptionPlanManager
        onBack={() => setShowSubscriptionManager(false)}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users and invite codes</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Administrator
        </Badge>
      </div>

      <Tabs defaultValue="invites" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Invite Codes Management
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkEmailSender(true)}
                    disabled={loading}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Bulk Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteByEmail(true)}
                    disabled={loading}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Send by Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkGenerator(true)}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Bulk Generate
                  </Button>
                  <Button onClick={handleGenerateCode} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Single Code
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Create and manage invitation codes for new user registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading invite codes...</div>
              ) : inviteCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invite codes found. Generate your first code to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inviteCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono">{code.code}</TableCell>
                        <TableCell>
                          <Badge variant={code.is_used ? "secondary" : "default"}>
                            {code.is_used ? "Used" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(code.created_at)}</TableCell>
                        <TableCell>
                          {new Date(code.expires_at) < new Date() ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            formatDate(code.expires_at)
                          )}
                        </TableCell>
                        <TableCell>
                          {code.used_by ? (
                            <Badge variant="outline">Used</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyCode(code.code)}
                              title="Copy Code"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {!code.is_used && code.email_status === 'not_sent' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedInviteCode(code);
                                  setShowInviteByEmail(true);
                                }}
                                title="Send by Email"
                              >
                                📧
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Invite Code</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete invite code "{code.code}"?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCode(code.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowUserManagement(true)}
                >
                  Advanced Search
                </Button>
              </CardTitle>
              <CardDescription>
                View and manage all registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserRole(user.id, user.role)}
                          >
                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                System Analytics
                <Button
                  variant="outline"
                  onClick={() => setShowAnalytics(true)}
                >
                  View Full Dashboard
                </Button>
              </CardTitle>
              <CardDescription>
                System metrics and user analytics overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {users.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.role === 'admin').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Admin Users</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {inviteCodes.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Invite Codes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Security Monitoring
                <Button
                  variant="outline"
                  onClick={() => setShowSecurityMonitoring(true)}
                >
                  View Security Dashboard
                </Button>
              </CardTitle>
              <CardDescription>
                Monitor security events and potential threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="text-2xl font-bold text-green-600">Active</div>
                  <div className="text-sm text-muted-foreground">Security Monitoring</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-muted-foreground">Recent Incidents</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Subscription Plan Management
                <Button
                  variant="outline"
                  onClick={() => setShowSubscriptionManager(true)}
                >
                  Manage Subscriptions
                </Button>
              </CardTitle>
              <CardDescription>
                Change user subscription plans for testing and administrative purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg bg-muted/30 dark:bg-muted/20">
                  <div className="text-2xl font-bold text-primary">4</div>
                  <div className="text-sm text-muted-foreground">Available Plans</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{users.filter(u => u.subscription_status === 'active').length}</div>
                  <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.billing_cycle === 'free').length}</div>
                  <div className="text-sm text-muted-foreground">Free Plan Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                System Configuration
                <Button
                  variant="outline"
                  onClick={() => setShowSystemManagement(true)}
                >
                  Manage Settings
                </Button>
              </CardTitle>
              <CardDescription>
                Configure system settings and security policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">Vox Operis</div>
                  <div className="text-sm text-muted-foreground">Application Name</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">30</div>
                  <div className="text-sm text-muted-foreground">Default Expiry (Days)</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">5</div>
                  <div className="text-sm text-muted-foreground">Failed Login Threshold</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <AdminLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;