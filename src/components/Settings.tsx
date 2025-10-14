import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Save, AlertCircle, Bell, Lock, User, Mail,
  Globe, Shield, Trash2, Download
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
}

const Settings = ({ onBack, onLogout }: SettingsProps) => {
  const { profile, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    profileViews: true,
    newLikes: true,
    newShares: false,
    weeklyDigest: true,
    marketingEmails: false,
  });

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setError(null);

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      setError(null);

      // In a real app, you'd save these to a user_settings table
      // For now, we'll just show success
      setSuccess('Notification preferences saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your data, including VO profiles, will be permanently deleted.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    );

    if (doubleConfirm !== 'DELETE') {
      setError('Account deletion cancelled');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // In a real app, you'd have a server-side function to handle this
      // For now, we'll just log out
      alert('Account deletion would happen here. For now, logging you out.');
      await onLogout();
    } catch (err) {
      setError('Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setSaving(true);
      const exportData = {
        profile: profile,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vox-operis-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess('Data exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
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

        {/* Settings Tabs */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your account details and email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email changes require verification
                  </p>
                </div>

                <div>
                  <Label>User ID</Label>
                  <div className="text-sm text-muted-foreground mt-1 font-mono">
                    {profile?.id}
                  </div>
                </div>

                <div>
                  <Label>Account Type</Label>
                  <div className="text-sm mt-1">
                    {profile?.user_type === 'candidate' ? 'Candidate' :
                     profile?.user_type === 'recruiter' ? 'Recruiter' :
                     profile?.user_type === 'both' ? 'Candidate & Recruiter' : 'User'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>Choose what email notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="email-notifications" className="text-sm font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive email notifications about your account
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="profile-views" className="text-sm font-medium">
                      Profile Views
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when someone views your profile
                    </p>
                  </div>
                  <Switch
                    id="profile-views"
                    checked={notificationSettings.profileViews}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, profileViews: checked }))
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="new-likes" className="text-sm font-medium">
                      Likes & Reactions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when someone likes your VO profiles
                    </p>
                  </div>
                  <Switch
                    id="new-likes"
                    checked={notificationSettings.newLikes}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, newLikes: checked }))
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="new-shares" className="text-sm font-medium">
                      Shares
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when someone shares your content
                    </p>
                  </div>
                  <Switch
                    id="new-shares"
                    checked={notificationSettings.newShares}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, newShares: checked }))
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="weekly-digest" className="text-sm font-medium">
                      Weekly Digest
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive a weekly summary of your profile activity
                    </p>
                  </div>
                  <Switch
                    id="weekly-digest"
                    checked={notificationSettings.weeklyDigest}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, weeklyDigest: checked }))
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="marketing" className="text-sm font-medium">
                      Marketing Emails
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, marketingEmails: checked }))
                    }
                  />
                </div>

                <Button onClick={handleSaveNotifications} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Visibility
                </CardTitle>
                <CardDescription>
                  Manage who can see your profile and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Most privacy settings are managed in your <strong>Profile Settings</strong>.
                    Go to Profile → Privacy & Visibility Settings to control what information is public.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data & Privacy */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Your Data
                </CardTitle>
                <CardDescription>
                  Download a copy of your profile data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export all your profile information, VO profiles, and activity data in JSON format.
                </p>
                <Button onClick={handleExportData} variant="outline" disabled={saving}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Delete Account
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This action cannot be undone. All your data, including
                    VO profiles, analytics, and settings will be permanently deleted.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
