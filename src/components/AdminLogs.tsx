import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Download, Filter, Search, Calendar } from "lucide-react";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import type { AdminLog } from "@/types/database";

const AdminLogs = () => {
  const { logs, loading, activitySummary, loadLogs, loadActivitySummary, formatActionType, getActionIcon } = useAdminLogs();

  const [filteredLogs, setFilteredLogs] = useState<AdminLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("7"); // days
  const [adminFilter, setAdminFilter] = useState<string>("all");

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, actionTypeFilter, dateFilter, adminFilter]);

  const applyFilters = () => {
    let filtered = [...logs];

    // Date filter
    if (dateFilter !== "all") {
      const daysBack = parseInt(dateFilter);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      filtered = filtered.filter(log =>
        new Date(log.created_at) >= cutoffDate
      );
    }

    // Action type filter
    if (actionTypeFilter !== "all") {
      filtered = filtered.filter(log => log.action_type === actionTypeFilter);
    }

    // Admin filter
    if (adminFilter !== "all") {
      filtered = filtered.filter(log => log.admin_email === adminFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.admin_name && log.admin_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredLogs(filtered);
  };

  const handleRefresh = async () => {
    await loadLogs();
    await loadActivitySummary();
  };

  const handleExport = () => {
    const csvContent = [
      ["Timestamp", "Admin", "Action Type", "Description", "Target", "Success", "IP Address"],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        `${log.admin_name || log.admin_email} (${log.admin_email})`,
        formatActionType(log.action_type),
        log.action_description,
        log.target_resource_type || "N/A",
        log.success ? "Yes" : "No",
        log.ip_address || "N/A"
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSuccessBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Success" : "Failed"}
      </Badge>
    );
  };

  const getUniqueActionTypes = () => {
    return Array.from(new Set(logs.map(log => log.action_type)));
  };

  const getUniqueAdmins = () => {
    return Array.from(new Set(logs.map(log => log.admin_email)));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
        Loading admin logs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Actions (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activitySummary.reduce((sum, item) => sum + item.action_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activitySummary.reduce((sum, item) => Math.max(sum, item.unique_admins), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Most Common Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {activitySummary.length > 0
                ? `${getActionIcon(activitySummary[0].action_type)} ${formatActionType(activitySummary[0].action_type)}`
                : "No recent activity"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Activity Logs</CardTitle>
              <CardDescription>
                Detailed audit trail of all administrative actions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExport} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {getUniqueActionTypes().map(type => (
                    <SelectItem key={type} value={type}>
                      {getActionIcon(type)} {formatActionType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Admin User</Label>
              <Select value={adminFilter} onValueChange={setAdminFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  {getUniqueAdmins().map(email => (
                    <SelectItem key={email} value={email}>
                      {email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setActionTypeFilter("all");
                  setDateFilter("7");
                  setAdminFilter("all");
                }}
                variant="outline"
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} log entries
          </div>

          {/* Logs Table */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No logs found matching the current filters.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.admin_name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{log.admin_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {getActionIcon(log.action_type)} {formatActionType(log.action_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={log.action_description}>
                          {log.action_description}
                        </div>
                        {log.error_message && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {log.error_message}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.target_resource_type && (
                          <div className="text-sm">
                            <div className="font-medium capitalize">
                              {log.target_resource_type.replace('_', ' ')}
                            </div>
                            {log.target_resource_id && (
                              <div className="text-muted-foreground font-mono text-xs">
                                {log.target_resource_id.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getSuccessBadge(log.success)}
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

export default AdminLogs;