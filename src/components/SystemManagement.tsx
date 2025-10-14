import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, Shield, Database, Users, Key, AlertTriangle, Save, RefreshCw, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { SystemSetting } from "@/types/database";

interface SystemConfig {
  app_name: string;
  max_invite_codes_per_batch: number;
  invite_code_default_expiry_days: number;
  failed_login_threshold: number;
  lockout_duration_minutes: number;
  enable_security_monitoring: boolean;
}

const SystemManagement = ({ onBack }: { onBack: () => void }) => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [config, setConfig] = useState<SystemConfig>({
    app_name: "Vox Operis",
    max_invite_codes_per_batch: 100,
    invite_code_default_expiry_days: 30,
    failed_login_threshold: 5,
    lockout_duration_minutes: 30,
    enable_security_monitoring: true
  });
  const [showSensitive, setShowSensitive] = useState<{ [key: string]: boolean }>({});

  const { toast } = useToast();

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) {
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: error.message,
        });
      } else {
        setSettings(data || []);

        // Parse settings into config object
        const configObj = { ...config };
        data?.forEach(setting => {
          if (setting.setting_key in configObj) {
            const value = setting.setting_value;
            if (setting.setting_type === 'number') {
              (configObj as any)[setting.setting_key] = typeof value === 'string' ? parseInt(value) : value;
            } else if (setting.setting_type === 'boolean') {
              (configObj as any)[setting.setting_key] = typeof value === 'string' ? value === 'true' : value;
            } else {
              (configObj as any)[setting.setting_key] = typeof value === 'string' ? value : JSON.stringify(value);
            }
          }
        });
        setConfig(configObj);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while loading settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any, type: string) => {
    setSaving(key);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let processedValue = value;
      if (type === 'string' && typeof value !== 'string') {
        processedValue = JSON.stringify(value);
      }

      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: processedValue,
          updated_by: user?.id
        })
        .eq('setting_key', key);

      if (error) {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Setting Updated",
          description: `${key.replace(/_/g, ' ')} has been updated successfully.`,
        });
        await loadSettings();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while updating the setting.",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveAllSettings = async () => {
    setSaving('all');
    try {
      const updates = Object.entries(config).map(([key, value]) => {
        const setting = settings.find(s => s.setting_key === key);
        if (setting) {
          return updateSetting(key, value, setting.setting_type);
        }
        return Promise.resolve();
      });

      await Promise.all(updates);

      toast({
        title: "All Settings Saved",
        description: "All system settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Some settings may not have been saved properly.",
      });
    } finally {
      setSaving(null);
    }
  };

  const resetToDefaults = async () => {
    const defaults: SystemConfig = {
      app_name: "Vox Operis",
      max_invite_codes_per_batch: 100,
      invite_code_default_expiry_days: 30,
      failed_login_threshold: 5,
      lockout_duration_minutes: 30,
      enable_security_monitoring: true
    };

    setConfig(defaults);
    toast({
      title: "Reset to Defaults",
      description: "Configuration has been reset. Click 'Save All Settings' to apply.",
    });
  };

  const toggleSensitiveView = (settingKey: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey]
    }));
  };

  const renderSettingValue = (setting: SystemSetting) => {
    if (setting.is_sensitive && !showSensitive[setting.setting_key]) {
      return "••••••••";
    }

    if (setting.setting_type === 'boolean') {
      return setting.setting_value ? 'Enabled' : 'Disabled';
    }

    if (setting.setting_type === 'json' || setting.setting_type === 'array') {
      return JSON.stringify(setting.setting_value);
    }

    return String(setting.setting_value);
  };

  const getSettingIcon = (key: string) => {
    if (key.includes('security') || key.includes('failed') || key.includes('lockout')) {
      return Shield;
    } else if (key.includes('user') || key.includes('invite')) {
      return Users;
    } else if (key.includes('key') || key.includes('token')) {
      return Key;
    }
    return Settings;
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Panel
          </Button>
          <div>
            <h1 className="text-3xl font-bold">System Management</h1>
            <p className="text-muted-foreground">Configure system settings and security policies</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Reset Defaults</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to Default Settings</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all configuration values to their defaults. You'll need to save the settings to apply the changes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetToDefaults}>
                  Reset to Defaults
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={loadSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveAllSettings} disabled={saving === 'all'}>
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>

      {/* Configuration Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Application Settings
            </CardTitle>
            <CardDescription>
              Basic application configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app_name">Application Name</Label>
              <Input
                id="app_name"
                value={config.app_name}
                onChange={(e) => handleConfigChange('app_name', e.target.value)}
                placeholder="Application name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_invite_codes">Max Invite Codes Per Batch</Label>
              <Input
                id="max_invite_codes"
                type="number"
                min="1"
                max="1000"
                value={config.max_invite_codes_per_batch}
                onChange={(e) => handleConfigChange('max_invite_codes_per_batch', parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of invite codes that can be generated in a single batch
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_expiry">Default Invite Code Expiry (Days)</Label>
              <Input
                id="default_expiry"
                type="number"
                min="1"
                max="365"
                value={config.invite_code_default_expiry_days}
                onChange={(e) => handleConfigChange('invite_code_default_expiry_days', parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Default expiration period for new invite codes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Security policies and monitoring configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="failed_login_threshold">Failed Login Threshold</Label>
              <Input
                id="failed_login_threshold"
                type="number"
                min="3"
                max="20"
                value={config.failed_login_threshold}
                onChange={(e) => handleConfigChange('failed_login_threshold', parseInt(e.target.value) || 3)}
              />
              <p className="text-xs text-muted-foreground">
                Number of failed login attempts before account lockout
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockout_duration">Account Lockout Duration (Minutes)</Label>
              <Input
                id="lockout_duration"
                type="number"
                min="5"
                max="1440"
                value={config.lockout_duration_minutes}
                onChange={(e) => handleConfigChange('lockout_duration_minutes', parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-muted-foreground">
                How long accounts remain locked after exceeding failed login threshold
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="security_monitoring">Security Monitoring</Label>
                <p className="text-xs text-muted-foreground">
                  Enable automatic security event logging and monitoring
                </p>
              </div>
              <Switch
                id="security_monitoring"
                checked={config.enable_security_monitoring}
                onCheckedChange={(checked) => handleConfigChange('enable_security_monitoring', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            All System Settings
          </CardTitle>
          <CardDescription>
            Complete list of all system configuration settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading system settings...</div>
          ) : settings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No system settings found.
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setting Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting) => {
                    const Icon = getSettingIcon(setting.setting_key);
                    return (
                      <TableRow key={setting.id}>
                        <TableCell className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {setting.setting_key}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-mono text-sm">
                              {renderSettingValue(setting)}
                            </span>
                            {setting.is_sensitive && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSensitiveView(setting.setting_key)}
                              >
                                {showSensitive[setting.setting_key] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {setting.setting_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <span className="text-sm text-muted-foreground">
                            {setting.description || 'No description'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {setting.is_public && (
                              <Badge variant="secondary" className="text-xs">
                                Public
                              </Badge>
                            )}
                            {setting.is_sensitive && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Sensitive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving === setting.setting_key}
                            onClick={() => {
                              const currentValue = (config as any)[setting.setting_key];
                              if (currentValue !== undefined) {
                                updateSetting(setting.setting_key, currentValue, setting.setting_type);
                              }
                            }}
                          >
                            {saving === setting.setting_key ? 'Saving...' : 'Update'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemManagement;