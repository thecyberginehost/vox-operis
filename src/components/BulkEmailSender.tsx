import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Mail, Send, ArrowLeft, Download, RefreshCw, Filter, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import type { InviteCode } from "@/types/database";

interface BulkEmailSenderProps {
  onBack: () => void;
}

interface BulkEmailPayload {
  selectedCodes: InviteCode[];
  adminName: string;
  adminId: string;
}

const BulkEmailSender = ({ onBack }: BulkEmailSenderProps) => {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("not_sent");

  const { profile } = useProfile();
  const { toast } = useToast();

  // N8N webhook URL for bulk emails - replace with your actual webhook URL
  const N8N_BULK_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/vox-operis-bulk-invite';

  useEffect(() => {
    loadInviteCodes();
  }, [statusFilter]);

  const loadInviteCodes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('invite_codes')
        .select('*')
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('email_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: error.message,
        });
      } else {
        setInviteCodes(data || []);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invite codes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCodes = inviteCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code.recipient_email && code.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (code.recipient_name && code.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectCode = (codeId: string, checked: boolean) => {
    const newSelected = new Set(selectedCodes);
    if (checked) {
      newSelected.add(codeId);
    } else {
      newSelected.delete(codeId);
    }
    setSelectedCodes(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCodes(new Set(filteredCodes.map(code => code.id)));
    } else {
      setSelectedCodes(new Set());
    }
  };

  const getSelectedCodesData = (): InviteCode[] => {
    return inviteCodes.filter(code => selectedCodes.has(code.id));
  };

  const handleBulkSend = async () => {
    if (!profile || selectedCodes.size === 0) return;

    setSending(true);
    try {
      const selectedCodesData = getSelectedCodesData();

      // Prepare bulk payload for n8n
      const bulkPayload: BulkEmailPayload = {
        selectedCodes: selectedCodesData.map(code => ({
          ...code,
          // Ensure we have basic recipient info for codes that don't have email addresses yet
          recipient_email: code.recipient_email || `invite-${code.code}@pending.vox-operis.com`,
          recipient_name: code.recipient_name || 'Pending Assignment'
        })),
        adminName: profile.full_name || profile.email,
        adminId: profile.id
      };

      // Send to n8n bulk webhook
      const response = await fetch(N8N_BULK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast({
          variant: "destructive",
          title: "Bulk Send Failed",
          description: result.message || "Failed to send bulk invitations.",
        });
        return;
      }

      // Update all selected codes to pending status
      const codeIds = Array.from(selectedCodes);
      const { error: updateError } = await supabase
        .from('invite_codes')
        .update({
          email_status: 'pending',
          email_sent_at: new Date().toISOString(),
          email_sent_by: profile.id
        })
        .in('id', codeIds);

      if (updateError) {
        console.error('Failed to update code statuses:', updateError);
      }

      toast({
        title: "Bulk Invitations Sent!",
        description: `Successfully queued ${selectedCodes.size} invitation emails for sending.`,
      });

      // Clear selection and reload
      setSelectedCodes(new Set());
      await loadInviteCodes();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Failed to send bulk invitations. Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  const exportSelectedCodes = () => {
    const selectedCodesData = getSelectedCodesData();
    const csvContent = [
      ["Code", "Recipient Name", "Recipient Email", "Company", "Created", "Expires", "Status"],
      ...selectedCodesData.map(code => [
        code.code,
        code.recipient_name || 'N/A',
        code.recipient_email || 'N/A',
        code.recipient_company || 'N/A',
        new Date(code.created_at).toLocaleDateString(),
        new Date(code.expires_at).toLocaleDateString(),
        code.email_status
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selected-invite-codes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'not_sent': { variant: 'secondary', label: 'Not Sent' },
      'pending': { variant: 'default', label: 'Pending' },
      'delivered': { variant: 'default', label: 'Delivered' },
      'failed': { variant: 'destructive', label: 'Failed' },
      'used': { variant: 'default', label: 'Used' },
      'expired': { variant: 'destructive', label: 'Expired' },
      'cancelled': { variant: 'secondary', label: 'Cancelled' }
    };

    const config = statusMap[status as keyof typeof statusMap] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const allSelected = filteredCodes.length > 0 && filteredCodes.every(code => selectedCodes.has(code.id));
  const someSelected = filteredCodes.some(code => selectedCodes.has(code.id));

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
            <h1 className="text-3xl font-bold">Bulk Email Sender</h1>
            <p className="text-muted-foreground">Select existing invite codes to send via email</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportSelectedCodes}
            disabled={selectedCodes.size === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
          <Button variant="outline" onClick={loadInviteCodes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search Codes</Label>
              <Input
                placeholder="Search by code, email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status Filter</Label>
              <select
                className="w-full h-10 px-3 border border-input rounded-md bg-background"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="not_sent">Not Sent</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="all">All Statuses</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {selectedCodes.size > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="text-blue-600 bg-blue-100">
                  {selectedCodes.size} Selected
                </Badge>
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  Ready to send bulk invitations
                </span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={sending}>
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? "Sending..." : `Send ${selectedCodes.size} Emails`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send Bulk Invitations</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to send {selectedCodes.size} invitation emails?
                      <br /><br />
                      This will queue all selected invitations for email delivery via your n8n workflow.
                      The process may take several minutes to complete.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkSend}>
                      Send Bulk Emails
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Invite Codes ({filteredCodes.length} found)
          </CardTitle>
          <CardDescription>
            Select invite codes to send via email
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading invite codes...</div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invite codes found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          className="border-2"
                        />
                      </TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCodes.has(code.id)}
                            onCheckedChange={(checked) => handleSelectCode(code.id, !!checked)}
                            className="border-2"
                          />
                        </TableCell>
                        <TableCell className="font-mono font-bold">
                          {code.code}
                        </TableCell>
                        <TableCell>
                          {code.recipient_email ? (
                            <div>
                              <div className="font-medium">{code.recipient_name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{code.recipient_email}</div>
                              {code.recipient_company && (
                                <div className="text-xs text-muted-foreground">{code.recipient_company}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No recipient assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(code.email_status)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(code.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(code.expires_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkEmailSender;