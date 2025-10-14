import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Download, Plus, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";

interface BulkGenerateResult {
  code: string;
  id: string;
}

const BulkInviteGenerator = ({ onComplete }: { onComplete: () => void }) => {
  const [count, setCount] = useState(10);
  const [expiryDays, setExpiryDays] = useState(30);
  const [maxUses, setMaxUses] = useState(1);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<BulkGenerateResult[]>([]);
  const { profile } = useProfile();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!profile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No profile found. Please refresh and try again.",
      });
      return;
    }

    if (count < 1 || count > 1000) {
      toast({
        variant: "destructive",
        title: "Invalid Count",
        description: "Count must be between 1 and 1000.",
      });
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.rpc('generate_bulk_invite_codes', {
        p_count: count,
        p_created_by: profile.id,
        p_expires_days: expiryDays,
        p_max_uses: maxUses,
        p_notes: notes.trim() || null
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: error.message,
        });
      } else {
        setGeneratedCodes(data || []);
        toast({
          title: "Bulk Generation Complete",
          description: `Successfully generated ${data?.length || 0} invite codes.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyAll = async () => {
    const codesList = generatedCodes.map(item => item.code).join('\n');
    try {
      await navigator.clipboard.writeText(codesList);
      toast({
        title: "Copied",
        description: "All codes copied to clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy codes to clipboard.",
      });
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Code", "ID", "Generated At"],
      ...generatedCodes.map(item => [item.code, item.id, new Date().toISOString()])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-invite-codes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied",
        description: `Code ${code} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy code to clipboard.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Invite Code Generator</h2>
          <p className="text-muted-foreground">Generate multiple invite codes at once</p>
        </div>
        <Button variant="outline" onClick={onComplete}>
          Back to Admin Panel
        </Button>
      </div>

      {generatedCodes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Generation Settings</CardTitle>
            <CardDescription>
              Configure your bulk invite code generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="count">Number of Codes</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={1000}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum 1,000 codes per batch
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry (Days)</Label>
                <Select value={expiryDays.toString()} onValueChange={(value) => setExpiryDays(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Maximum Uses</Label>
                <Select value={maxUses.toString()} onValueChange={(value) => setMaxUses(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Single use</SelectItem>
                    <SelectItem value="5">5 uses</SelectItem>
                    <SelectItem value="10">10 uses</SelectItem>
                    <SelectItem value="25">25 uses</SelectItem>
                    <SelectItem value="50">50 uses</SelectItem>
                    <SelectItem value="100">100 uses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="e.g., Beta testers, Q1 2025 batch"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Generation Summary:</p>
                <p>
                  {count} codes, each valid for {expiryDays} days with maximum {maxUses} use{maxUses === 1 ? '' : 's'} each
                  {notes && ` • Notes: "${notes}"`}
                </p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" className="w-full" disabled={generating}>
                  <Plus className="h-4 w-4 mr-2" />
                  {generating ? "Generating..." : `Generate ${count} Invite Codes`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Bulk Generation</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to generate <strong>{count} invite codes</strong>.
                    Each code will be valid for <strong>{expiryDays} days</strong> and can be used <strong>{maxUses} time{maxUses === 1 ? '' : 's'}</strong>.
                    <br /><br />
                    This action cannot be undone. Are you sure you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleGenerate}>
                    Generate Codes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    ✓ Generated
                  </Badge>
                  {generatedCodes.length} Invite Codes
                </CardTitle>
                <CardDescription>
                  Each code expires in {expiryDays} days and can be used {maxUses} time{maxUses === 1 ? '' : 's'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyAll}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setGeneratedCodes([]);
                    onComplete();
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedCodes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-bold text-lg">
                        {item.code}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyCode(item.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkInviteGenerator;