import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Filter, UserCheck, UserX, Shield, ShieldCheck, ArrowLeft, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

interface UserSearchResult {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

const UserManagement = ({ onBack }: { onBack: () => void }) => {
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { toast } = useToast();
  const { logUserRoleChanged } = useAdminLogs();

  const USERS_PER_PAGE = 25;

  const searchUsers = async (page: number = 1) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_users_secure', {
        p_search_term: searchTerm || null,
        p_role_filter: roleFilter === 'all' ? null : roleFilter,
        p_status_filter: statusFilter,
        p_limit: USERS_PER_PAGE,
        p_offset: (page - 1) * USERS_PER_PAGE
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Search Failed",
          description: error.message,
        });
      } else {
        setUsers(data || []);
        setTotalPages(Math.ceil((data?.length || 0) / USERS_PER_PAGE));
        setCurrentPage(page);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while searching users.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchUsers(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // Load users on initial mount
  useEffect(() => {
    searchUsers(1);
  }, []);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: !currentStatus,
          deactivated_at: !currentStatus ? null : new Date().toISOString(),
          deactivated_by: !currentStatus ? null : profile?.id,
          deactivation_reason: !currentStatus ? null : 'Deactivated by admin'
        })
        .eq('id', userId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Action Failed",
          description: "Failed to update user status.",
        });
      } else {
        await searchUsers(currentPage);
        toast({
          title: "User Status Updated",
          description: `User has been ${!currentStatus ? 'activated' : 'deactivated'}.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const userToUpdate = users.find(user => user.id === userId);

    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Role Update Failed",
          description: "Failed to update user role.",
        });
      } else {
        if (userToUpdate) {
          await logUserRoleChanged(userId, userToUpdate.email, currentRole, newRole);
        }

        await searchUsers(currentPage);
        toast({
          title: "Role Updated",
          description: `User role changed to ${newRole}.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ["Email", "Full Name", "Role", "Status", "Last Login", "Created"],
      ...users.map(user => [
        user.email,
        user.full_name || 'N/A',
        user.role,
        user.is_active ? 'Active' : 'Inactive',
        user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never',
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Search, filter, and manage user accounts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportUsers} disabled={users.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => searchUsers(currentPage)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Users
          </CardTitle>
          <CardDescription>
            Find and manage users with advanced search and filtering options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Email or full name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => searchUsers(1)} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length} found)</CardTitle>
          <CardDescription>
            Page {currentPage} of {Math.max(1, totalPages)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                          {user.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "destructive"} className="flex items-center gap-1 w-fit">
                          {user.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(user.last_login_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionLoading === user.id}
                              >
                                {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Change User Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to change {user.full_name || user.email}'s role to {user.role === 'admin' ? 'user' : 'admin'}?
                                  {user.role !== 'admin' && " This will give them full administrative privileges."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => toggleUserRole(user.id, user.role)}>
                                  Change Role
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant={user.is_active ? "destructive" : "default"}
                                disabled={actionLoading === user.id}
                              >
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {user.is_active ? 'Deactivate' : 'Activate'} User Account
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {user.is_active ? 'deactivate' : 'activate'} {user.full_name || user.email}'s account?
                                  {user.is_active && " This will prevent them from logging in."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => toggleUserStatus(user.id, user.is_active)}>
                                  {user.is_active ? 'Deactivate' : 'Activate'}
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => searchUsers(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => searchUsers(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;