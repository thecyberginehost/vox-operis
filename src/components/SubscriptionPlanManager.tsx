import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Crown, Users, Search, Calendar, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import type { Profile, SubscriptionPlan } from "@/types/database";

interface SubscriptionPlanManagerProps {
  onBack: () => void;
}

interface UserWithPlan extends Profile {
  plan?: SubscriptionPlan;
}

const SubscriptionPlanManager = ({ onBack }: SubscriptionPlanManagerProps) => {
  const [users, setUsers] = useState<UserWithPlan[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithPlan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<string>("monthly");
  const [changeReason, setChangeReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const { profile } = useProfile();
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionPlans();
    loadUsers();
  }, []);

  const loadSubscriptionPlans = async () => {
    setLoadingPlans(true);
    try {
      const { data, error } = await supabase.rpc('get_subscription_plans');

      if (error) {
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: error.message,
        });
      } else {
        setSubscriptionPlans(data || []);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load subscription plans.",
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // Get all users with their subscription details
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          subscription_plans!profiles_subscription_plan_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (profileError) {
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: profileError.message,
        });
      } else {
        // Transform the data to include plan info
        const usersWithPlans = profiles?.map(profile => ({
          ...profile,
          plan: Array.isArray(profile.subscription_plans)
            ? profile.subscription_plans[0]
            : profile.subscription_plans
        })) || [];

        setUsers(usersWithPlans);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users.",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedUser || !selectedPlan || !profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_change_user_plan', {
        p_user_id: selectedUser.id,
        p_new_plan_id: selectedPlan,
        p_admin_id: profile.id,
        p_change_reason: changeReason.trim() || 'Admin plan change for testing',
        p_billing_cycle: billingCycle
      });

      if (error || !data?.success) {
        toast({
          variant: "destructive",
          title: "Change Failed",
          description: data?.message || error?.message || "Failed to change subscription plan.",
        });
      } else {
        toast({
          title: "Plan Changed Successfully!",
          description: data.message,
        });

        // Reset form and reload users
        setSelectedUser(null);
        setSelectedPlan("");
        setBillingCycle("monthly");
        setChangeReason("");
        loadUsers();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Failed to change subscription plan. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'expired': return 'destructive';
      case 'cancelled': return 'outline';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
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
            <h1 className="text-3xl font-bold">Subscription Plan Manager</h1>
            <p className="text-muted-foreground">Manage user subscription plans for testing purposes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Available Plans
            </CardTitle>
            <CardDescription>
              Current subscription plans in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <div className="text-center py-4">Loading plans...</div>
            ) : (
              <div className="space-y-3">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3 border rounded-lg bg-muted/20 dark:bg-muted/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{plan.plan_display_name}</div>
                      {plan.is_free && <Badge variant="secondary">Free</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {plan.description}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>{formatCurrency(plan.price_monthly)}/mo</span>
                      <span>{plan.max_vos} VOs • {plan.max_storage_gb}GB</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
            <CardDescription>
              Select a user to change their subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loadingUsers ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? 'border-primary bg-muted/50 dark:bg-muted/30'
                          : 'hover:bg-muted/20 dark:hover:bg-muted/10'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{user.full_name || 'No name'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={getStatusBadgeVariant(user.subscription_status)}>
                              {user.subscription_status}
                            </Badge>
                            <Badge variant="outline">
                              {user.plan?.plan_display_name || 'No plan'}
                            </Badge>
                            <Badge variant="secondary">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                        {selectedUser?.id === user.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Change Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Change Subscription Plan
            </CardTitle>
            <CardDescription>
              Modify the selected user's subscription for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-4">
                {/* Current User Info */}
                <div className="p-3 border rounded-lg bg-muted/30 dark:bg-muted/20">
                  <Label className="text-sm font-medium">Selected User</Label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedUser.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        Current: {selectedUser.plan?.plan_display_name || 'No plan'}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(selectedUser.subscription_status)}>
                        {selectedUser.subscription_status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* New Plan Selection */}
                <div className="space-y-2">
                  <Label htmlFor="newPlan">New Subscription Plan *</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{plan.plan_display_name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatCurrency(plan.price_monthly)}/mo
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Billing Cycle */}
                <div className="space-y-2">
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select value={billingCycle} onValueChange={setBillingCycle} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Change Reason */}
                <div className="space-y-2">
                  <Label htmlFor="changeReason">Change Reason (Optional)</Label>
                  <Textarea
                    id="changeReason"
                    placeholder="Reason for changing the subscription plan..."
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    disabled={loading}
                    rows={3}
                  />
                </div>

                {/* Action Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={!selectedPlan || loading}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {loading ? "Changing Plan..." : "Change Subscription Plan"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Change Subscription Plan</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to change <strong>{selectedUser.full_name || selectedUser.email}</strong>'s
                        subscription plan?
                        <br /><br />
                        <strong>Current Plan:</strong> {selectedUser.plan?.plan_display_name || 'No plan'}
                        <br />
                        <strong>New Plan:</strong> {subscriptionPlans.find(p => p.id === selectedPlan)?.plan_display_name}
                        <br />
                        <strong>Billing Cycle:</strong> {billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}
                        <br /><br />
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          This action will be logged for audit purposes.
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleChangePlan}>
                        Change Plan
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a user from the list to change their subscription plan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPlanManager;