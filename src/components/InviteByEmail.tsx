import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Mail, Send, ArrowLeft, User, Building, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import type { InviteCode } from "@/types/database";

interface InviteByEmailProps {
  selectedCode?: InviteCode;
  onBack: () => void;
  onSuccess: () => void;
}

interface EmailInviteForm {
  recipientName: string;
  recipientEmail: string;
  recipientCompany: string;
  customMessage: string;
}

const InviteByEmail = ({ selectedCode, onBack, onSuccess }: InviteByEmailProps) => {
  const [formData, setFormData] = useState<EmailInviteForm>({
    recipientName: '',
    recipientEmail: '',
    recipientCompany: '',
    customMessage: ''
  });
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(selectedCode || null);
  const [sending, setSending] = useState(false);
  const [availableCodes, setAvailableCodes] = useState<InviteCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  const { profile } = useProfile();
  const { toast } = useToast();

  // N8N webhook URL - replace with your actual webhook URL
  const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/vox-operis-invite';

  useEffect(() => {
    if (!selectedCode) {
      loadAvailableCodes();
    }
  }, [selectedCode]);

  const loadAvailableCodes = async () => {
    setLoadingCodes(true);
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('is_used', false)
        .eq('email_status', 'not_sent')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: error.message,
        });
      } else {
        setAvailableCodes(data || []);
        // Auto-select first available code if none selected
        if ((data?.length || 0) > 0 && !inviteCode) {
          setInviteCode(data[0]);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load available invite codes.",
      });
    } finally {
      setLoadingCodes(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.recipientName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Recipient name is required.",
      });
      return false;
    }

    if (!formData.recipientEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Recipient email is required.",
      });
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipientEmail)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid email address.",
      });
      return false;
    }

    if (!inviteCode) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "No invite code selected. Please select or generate a code first.",
      });
      return false;
    }

    return true;
  };

  const handleSendInvite = async () => {
    if (!validateForm() || !profile || !inviteCode) return;

    setSending(true);
    try {
      // Step 1: Update database with recipient info and mark as pending
      const { data: dbResult, error: dbError } = await supabase.rpc('send_invite_email', {
        p_invite_code_id: inviteCode.id,
        p_recipient_name: formData.recipientName.trim(),
        p_recipient_email: formData.recipientEmail.toLowerCase().trim(),
        p_sent_by: profile.id,
        p_recipient_company: formData.recipientCompany.trim() || null,
        p_custom_message: formData.customMessage.trim() || null
      });

      if (dbError || !dbResult.success) {
        toast({
          variant: "destructive",
          title: "Database Error",
          description: dbResult?.message || dbError?.message || "Failed to prepare invitation.",
        });
        return;
      }

      // Step 2: Send to n8n webhook for email delivery
      const webhookPayload = {
        email: formData.recipientEmail.toLowerCase().trim(),
        invite_code: inviteCode.code,
        expiry_days: Math.ceil((new Date(inviteCode.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        admin_name: profile.full_name || profile.email,
        recipient_name: formData.recipientName.trim(),
        recipient_company: formData.recipientCompany.trim() || null,
        message: formData.customMessage.trim() || null
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // If n8n fails, update database to reflect failure
        await supabase.rpc('update_email_status', {
          p_invite_code: inviteCode.code,
          p_email_status: 'failed',
          p_error_message: result.error || 'Webhook delivery failed'
        });

        toast({
          variant: "destructive",
          title: "Email Send Failed",
          description: result.message || "Failed to send invitation email.",
        });
        return;
      }

      toast({
        title: "Invitation Sent!",
        description: `Invitation email sent successfully to ${formData.recipientName} (${formData.recipientEmail})`,
      });

      // Reset form
      setFormData({
        recipientName: '',
        recipientEmail: '',
        recipientCompany: '',
        customMessage: ''
      });

      onSuccess();

    } catch (error) {
      // Update database to reflect network failure
      if (inviteCode) {
        await supabase.rpc('update_email_status', {
          p_invite_code: inviteCode.code,
          p_email_status: 'failed',
          p_error_message: 'Network error during email sending'
        });
      }

      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Failed to send invitation. Please check your connection and try again.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (field: keyof EmailInviteForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectCode = (code: InviteCode) => {
    setInviteCode(code);
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
            <h1 className="text-3xl font-bold">Send Invitation by Email</h1>
            <p className="text-muted-foreground">Send a personalized invitation email to a new user</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invite Code Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Select Invite Code
            </CardTitle>
            <CardDescription>
              Choose an available invite code to send via email
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCode ? (
              <div className="p-4 border rounded-lg bg-muted/30 dark:bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-lg font-bold text-primary">
                      {selectedCode.code}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Pre-selected code • Expires {formatDate(selectedCode.expires_at)}
                    </div>
                  </div>
                </div>
              </div>
            ) : loadingCodes ? (
              <div className="text-center py-8">Loading available codes...</div>
            ) : availableCodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No available invite codes. Please generate some codes first.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableCodes.map((code) => (
                  <div
                    key={code.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      inviteCode?.id === code.id
                        ? 'border-primary bg-muted/50 dark:bg-muted/30'
                        : 'hover:bg-muted/20 dark:hover:bg-muted/10'
                    }`}
                    onClick={() => selectCode(code)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono font-medium">{code.code}</div>
                      <div className="text-xs text-muted-foreground">
                        Expires {formatDate(code.expires_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Recipient Information
            </CardTitle>
            <CardDescription>
              Enter the details for the person receiving the invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="recipientName"
                placeholder="John Doe"
                value={formData.recipientName}
                onChange={(e) => handleInputChange('recipientName', e.target.value)}
                disabled={sending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="john@example.com"
                value={formData.recipientEmail}
                onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                disabled={sending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientCompany" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company (Optional)
              </Label>
              <Input
                id="recipientCompany"
                placeholder="Acme Corporation"
                value={formData.recipientCompany}
                onChange={(e) => handleInputChange('recipientCompany', e.target.value)}
                disabled={sending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customMessage" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Custom Message (Optional)
              </Label>
              <Textarea
                id="customMessage"
                placeholder="Add a personal message that will be included in the invitation email..."
                value={formData.customMessage}
                onChange={(e) => handleInputChange('customMessage', e.target.value)}
                disabled={sending}
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground">
                {formData.customMessage.length}/500 characters
              </div>
            </div>

            {inviteCode && (
              <div className="p-3 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/40 dark:bg-muted/20">
                <Label className="text-sm font-medium text-muted-foreground">
                  Invite Code (Auto-populated - Read Only)
                </Label>
                <Input
                  value={inviteCode.code}
                  disabled
                  className="mt-1 font-mono bg-muted/60 dark:bg-muted/40 border-muted-foreground/20 text-foreground cursor-not-allowed"
                />
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!inviteCode || sending || !formData.recipientName || !formData.recipientEmail}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Sending Invitation..." : "Send Invitation Email"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send Invitation Email</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to send an invitation email to{" "}
                    <strong>{formData.recipientName}</strong> ({formData.recipientEmail})?
                    <br /><br />
                    This will use invite code: <strong>{inviteCode?.code}</strong>
                    <br />
                    The invitation will expire on: <strong>{inviteCode ? formatDate(inviteCode.expires_at) : 'N/A'}</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSendInvite}>
                    Send Email
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InviteByEmail;