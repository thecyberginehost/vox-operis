import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, Users, UserPlus, Shield, Key, AlertTriangle, Download, RefreshCw, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { UserAnalytics } from "@/types/database";

interface AnalyticsMetric {
  title: string;
  value: number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
}

const AnalyticsDashboard = ({ onBack }: { onBack: () => void }) => {
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>("30");
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [recalculating, setRecalculating] = useState(false);

  const { toast } = useToast();

  const debugUserCounts = async () => {
    try {
      const { data, error } = await supabase.rpc('debug_user_counts');

      if (error) {
        toast({
          variant: "destructive",
          title: "Debug Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Debug User Counts",
          description: `Actual: ${data.actual_total_users}, Analytics: ${data.analytics_total_users}`,
        });
        console.log('Debug user counts:', data);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Debug Error",
        description: "Failed to run debug function. Make sure the SQL fix was applied.",
      });
    }
  };

  const recalculateAnalytics = async () => {
    setRecalculating(true);
    try {
      // First recalculate today's analytics
      const { data: todayData, error: todayError } = await supabase.rpc('calculate_daily_analytics');

      if (todayError) {
        throw todayError;
      }

      // Then recalculate recent analytics
      const { data: recentData, error: recentError } = await supabase.rpc('recalculate_recent_analytics');

      if (recentError) {
        throw recentError;
      }

      toast({
        title: "Analytics Recalculated",
        description: `Successfully recalculated analytics for ${recentData?.days_recalculated || 30} days.`,
      });

      // Reload the analytics after recalculation
      await loadAnalytics();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Recalculation Failed",
        description: error.message || "Failed to recalculate analytics.",
      });
    } finally {
      setRecalculating(false);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const daysBack = parseInt(timeRange);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .gte('date', fromDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(daysBack);

      if (error) {
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: error.message,
        });
      } else {
        setAnalytics(data || []);
        calculateMetrics(data || []);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while loading analytics.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (data: UserAnalytics[]) => {
    if (data.length === 0) {
      setMetrics([]);
      return;
    }

    const latest = data[0];
    const previous = data[1];

    const calculateChange = (current: number, prev: number) => {
      if (!prev) return 0;
      return ((current - prev) / prev) * 100;
    };

    const newMetrics: AnalyticsMetric[] = [
      {
        title: "Total Users",
        value: latest.total_users,
        change: previous ? calculateChange(latest.total_users, previous.total_users) : 0,
        icon: Users,
        trend: previous ? (latest.total_users > previous.total_users ? 'up' : latest.total_users < previous.total_users ? 'down' : 'neutral') : 'neutral'
      },
      {
        title: "New Registrations",
        value: data.reduce((sum, item) => sum + item.new_registrations, 0),
        change: previous ? calculateChange(latest.new_registrations, previous.new_registrations) : 0,
        icon: UserPlus,
        trend: previous ? (latest.new_registrations > previous.new_registrations ? 'up' : latest.new_registrations < previous.new_registrations ? 'down' : 'neutral') : 'neutral'
      },
      {
        title: "Active Users",
        value: latest.active_users,
        change: previous ? calculateChange(latest.active_users, previous.active_users) : 0,
        icon: TrendingUp,
        trend: previous ? (latest.active_users > previous.active_users ? 'up' : latest.active_users < previous.active_users ? 'down' : 'neutral') : 'neutral'
      },
      {
        title: "Admin Users",
        value: latest.admin_users,
        change: previous ? calculateChange(latest.admin_users, previous.admin_users) : 0,
        icon: Shield,
        trend: previous ? (latest.admin_users > previous.admin_users ? 'up' : latest.admin_users < previous.admin_users ? 'down' : 'neutral') : 'neutral'
      },
      {
        title: "Invite Codes Generated",
        value: data.reduce((sum, item) => sum + item.invite_codes_generated, 0),
        icon: Key,
        trend: 'neutral'
      },
      {
        title: "Security Incidents",
        value: data.reduce((sum, item) => sum + item.security_incidents, 0),
        icon: AlertTriangle,
        trend: 'neutral'
      }
    ];

    setMetrics(newMetrics);
  };

  const triggerAnalyticsCalculation = async () => {
    try {
      const { error } = await supabase.rpc('calculate_daily_analytics');

      if (error) {
        toast({
          variant: "destructive",
          title: "Calculation Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Analytics Updated",
          description: "Daily analytics have been recalculated.",
        });
        await loadAnalytics();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to trigger analytics calculation.",
      });
    }
  };

  const exportAnalytics = () => {
    const csvContent = [
      ["Date", "Total Users", "New Registrations", "Active Users", "Admin Users", "Invite Codes Generated", "Invite Codes Used", "Failed Logins", "Security Incidents"],
      ...analytics.map(item => [
        item.date,
        item.total_users,
        item.new_registrations,
        item.active_users,
        item.admin_users,
        item.invite_codes_generated,
        item.invite_codes_used,
        item.failed_login_attempts,
        item.security_incidents
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${timeRange}days-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

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
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">System metrics and user analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportAnalytics} disabled={analytics.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={triggerAnalyticsCalculation}>
            <Calendar className="h-4 w-4 mr-2" />
            Update Today
          </Button>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={recalculateAnalytics}
            disabled={recalculating}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {recalculating ? 'Recalculating...' : 'Fix User Count'}
          </Button>
          <Button variant="outline" onClick={debugUserCounts}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Debug Counts
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
              {metric.change !== undefined && (
                <p className={`text-xs ${getTrendColor(metric.trend!)}`}>
                  {getTrendIcon(metric.trend!)} {Math.abs(metric.change).toFixed(1)}% from previous period
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Analytics</CardTitle>
          <CardDescription>
            Detailed breakdown of daily metrics over the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : analytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No analytics data available for the selected period.
              <div className="mt-2">
                <Button onClick={triggerAnalyticsCalculation}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Today's Analytics
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Users</TableHead>
                    <TableHead>New Registrations</TableHead>
                    <TableHead>Active Users</TableHead>
                    <TableHead>Admins</TableHead>
                    <TableHead>Codes Generated</TableHead>
                    <TableHead>Codes Used</TableHead>
                    <TableHead>Failed Logins</TableHead>
                    <TableHead>Security Incidents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell>{item.total_users}</TableCell>
                      <TableCell>
                        {item.new_registrations > 0 ? (
                          <Badge variant="default">{item.new_registrations}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>{item.active_users}</TableCell>
                      <TableCell>{item.admin_users}</TableCell>
                      <TableCell>
                        {item.invite_codes_generated > 0 ? (
                          <Badge variant="outline">{item.invite_codes_generated}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.invite_codes_used > 0 ? (
                          <Badge variant="secondary">{item.invite_codes_used}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.failed_login_attempts > 0 ? (
                          <Badge variant="destructive">{item.failed_login_attempts}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.security_incidents > 0 ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            {item.security_incidents}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;