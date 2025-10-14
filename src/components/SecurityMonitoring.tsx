import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, AlertTriangle, Eye, Filter, Download, RefreshCw, ArrowLeft, Clock, MapPin, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { SecurityLog } from "@/types/database";

const SecurityMonitoring = ({ onBack }: { onBack: () => void }) => {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEventType, setFilterEventType] = useState<string>("all");
  const [filterSeverity, setSeverity] = useState<string>("all");
  const [searchIP, setSearchIP] = useState("");
  const [timeRange, setTimeRange] = useState<string>("24");
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    blocked: 0
  });

  const { toast } = useToast();

  const loadSecurityLogs = async () => {
    setLoading(true);
    try {
      const hoursBack = parseInt(timeRange);
      const fromTime = new Date();
      fromTime.setHours(fromTime.getHours() - hoursBack);

      let query = supabase
        .from('security_logs')
        .select('*')
        .gte('created_at', fromTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      // Apply filters
      if (filterEventType !== "all") {
        query = query.eq('event_type', filterEventType);
      }

      if (filterSeverity !== "all") {
        query = query.eq('severity', filterSeverity);
      }

      if (searchIP.trim()) {
        query = query.ilike('ip_address', `%${searchIP.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: error.message,
        });
      } else {
        const logs = data || [];
        setSecurityLogs(logs);

        // Calculate stats
        setStats({
          total: logs.length,
          critical: logs.filter(log => log.severity === 'critical').length,
          high: logs.filter(log => log.severity === 'high').length,
          blocked: logs.filter(log => log.blocked).length
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while loading security logs.",
      });
    } finally {
      setLoading(false);
    }
  };

  const logSecurityEvent = async (eventType: string, severity: string, description: string) => {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_user_id: null,
        p_event_type: eventType,
        p_severity: severity,
        p_description: description,
        p_ip_address: '127.0.0.1',
        p_user_agent: navigator.userAgent,
        p_request_path: '/admin/security',
        p_request_method: 'POST',
        p_blocked: severity === 'critical'
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Log Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Event Logged",
          description: "Security event has been logged successfully.",
        });
        loadSecurityLogs();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log security event.",
      });
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "Event Type", "Severity", "Description", "IP Address", "User Agent", "Blocked"],
      ...securityLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.event_type,
        log.severity,
        log.description,
        log.ip_address || 'N/A',
        log.user_agent || 'N/A',
        log.blocked ? 'Yes' : 'No'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return AlertTriangle;
      default:
        return Eye;
    }
  };

  useEffect(() => {
    loadSecurityLogs();
  }, [filterEventType, filterSeverity, searchIP, timeRange]);

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
            <h1 className="text-3xl font-bold">Security Monitoring</h1>
            <p className="text-muted-foreground">Monitor and analyze security events</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs} disabled={securityLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={loadSecurityLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <p className="text-xs text-muted-foreground">
              Need investigation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Events</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.blocked}</div>
            <p className="text-xs text-muted-foreground">
              Automatically blocked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last Hour</SelectItem>
                  <SelectItem value="24">Last 24 Hours</SelectItem>
                  <SelectItem value="168">Last Week</SelectItem>
                  <SelectItem value="720">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={filterEventType} onValueChange={setFilterEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="failed_login">Failed Login</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                  <SelectItem value="rate_limit_exceeded">Rate Limit Exceeded</SelectItem>
                  <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                  <SelectItem value="sql_injection_attempt">SQL Injection</SelectItem>
                  <SelectItem value="xss_attempt">XSS Attempt</SelectItem>
                  <SelectItem value="brute_force_attempt">Brute Force</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={filterSeverity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>IP Address</Label>
              <Input
                placeholder="Filter by IP..."
                value={searchIP}
                onChange={(e) => setSearchIP(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Events */}
      <Card>
        <CardHeader>
          <CardTitle>Test Security Events</CardTitle>
          <CardDescription>
            Generate test security events for monitoring validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => logSecurityEvent('failed_login', 'medium', 'Test failed login attempt from admin interface')}
            >
              Test Failed Login
            </Button>
            <Button
              variant="outline"
              onClick={() => logSecurityEvent('suspicious_activity', 'high', 'Test suspicious activity detection')}
            >
              Test Suspicious Activity
            </Button>
            <Button
              variant="outline"
              onClick={() => logSecurityEvent('unauthorized_access', 'critical', 'Test unauthorized access attempt')}
            >
              Test Critical Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events ({securityLogs.length})</CardTitle>
          <CardDescription>
            Recent security events and potential threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading security logs...</div>
          ) : securityLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No security events found for the selected criteria.
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityLogs.map((log) => {
                    const SeverityIcon = getSeverityIcon(log.severity);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.event_type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(log.severity)} className="flex items-center gap-1 w-fit">
                            <SeverityIcon className="h-3 w-3" />
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.description}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {log.ip_address || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {log.blocked ? (
                            <Badge variant="destructive">Blocked</Badge>
                          ) : (
                            <Badge variant="secondary">Logged</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => setSelectedLog(log)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <SeverityIcon className="h-4 w-4" />
                                  Security Event Details
                                </AlertDialogTitle>
                              </AlertDialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong>Event Type:</strong> {log.event_type.replace(/_/g, ' ')}
                                  </div>
                                  <div>
                                    <strong>Severity:</strong> {log.severity}
                                  </div>
                                  <div>
                                    <strong>Time:</strong> {new Date(log.created_at).toLocaleString()}
                                  </div>
                                  <div>
                                    <strong>Blocked:</strong> {log.blocked ? 'Yes' : 'No'}
                                  </div>
                                  <div>
                                    <strong>IP Address:</strong> {log.ip_address || 'Unknown'}
                                  </div>
                                  <div>
                                    <strong>Request Path:</strong> {log.request_path || 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <strong>Description:</strong>
                                  <p className="mt-1 text-sm bg-muted p-2 rounded">{log.description}</p>
                                </div>
                                {log.user_agent && (
                                  <div>
                                    <strong>User Agent:</strong>
                                    <p className="mt-1 text-xs bg-muted p-2 rounded font-mono break-all">
                                      {log.user_agent}
                                    </p>
                                  </div>
                                )}
                                {log.request_payload && (
                                  <div>
                                    <strong>Request Payload:</strong>
                                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                                      {JSON.stringify(log.request_payload, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Close</AlertDialogCancel>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

export default SecurityMonitoring;