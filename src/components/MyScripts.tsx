import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Search,
  Edit3,
  Trash2,
  Download,
  Copy,
  Clock,
  Type,
  Calendar,
  AlertCircle,
  Loader2,
  Plus,
  Check,
  Mic,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import ScriptEditor from "./ScriptEditor";
import { formatDistanceToNow } from "date-fns";

interface SavedScript {
  id: string;
  script_type: string;
  target_audience: string;
  script_length: string;
  word_count: number;
  generated_script: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

const MyScripts = () => {
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<SavedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScript, setSelectedScript] = useState<SavedScript | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchScripts();
  }, []);

  useEffect(() => {
    // Filter scripts based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = scripts.filter(script => {
        const title = script.metadata?.title?.toLowerCase() || '';
        const content = script.generated_script.toLowerCase();
        return title.includes(query) || content.includes(query);
      });
      setFilteredScripts(filtered);
    } else {
      setFilteredScripts(scripts);
    }
  }, [searchQuery, scripts]);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('script_generations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setScripts(data || []);
      setFilteredScripts(data || []);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your scripts"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scriptId: string) => {
    try {
      const { error } = await supabase
        .from('script_generations')
        .delete()
        .eq('id', scriptId);

      if (error) throw error;

      toast({
        title: "Script Deleted",
        description: "Your script has been deleted successfully"
      });

      // Remove from local state
      setScripts(scripts.filter(s => s.id !== scriptId));
    } catch (error) {
      console.error('Error deleting script:', error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete script"
      });
    }
  };

  const handleCopy = async (script: SavedScript) => {
    try {
      await navigator.clipboard.writeText(script.generated_script);
      setCopiedId(script.id);
      toast({
        title: "Copied",
        description: "Script copied to clipboard"
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy script"
      });
    }
  };

  const handleDownload = (script: SavedScript) => {
    const title = script.metadata?.title || 'script';
    const blob = new Blob([script.generated_script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Script downloaded successfully"
    });
  };

  const handleEdit = (script: SavedScript) => {
    setSelectedScript(script);
    setShowEditor(true);
  };

  const handleCreateVO = (script: SavedScript) => {
    // Navigate to VO creation with script ID in URL params
    window.location.href = `/dashboard/create?scriptId=${script.id}`;
  };

  const handleSaveEdit = async (editedScript: string) => {
    if (!selectedScript) return;

    // Update local state
    const updatedScripts = scripts.map(s =>
      s.id === selectedScript.id
        ? { ...s, generated_script: editedScript, updated_at: new Date().toISOString() }
        : s
    );
    setScripts(updatedScripts);
    setShowEditor(false);
    setSelectedScript(null);

    // Refetch to get latest data
    await fetchScripts();
  };

  if (showEditor && selectedScript) {
    return (
      <ScriptEditor
        initialScript={selectedScript.generated_script}
        scriptId={selectedScript.id}
        onSave={handleSaveEdit}
        onClose={() => {
          setShowEditor(false);
          setSelectedScript(null);
        }}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold mb-2 text-gradient">My Scripts</h1>
            <p className="text-muted-foreground">
              Manage your saved voice-over scripts
            </p>
          </div>
          <Button onClick={() => window.location.href = '/dashboard/copilot'} className="modern-button">
            <Plus className="h-4 w-4 mr-2" />
            Generate New Script
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scripts by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredScripts.length === 0 && !searchQuery && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No scripts yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Generate your first voice-over script using the Script Copilot
            </p>
            <Button onClick={() => window.location.href = '/dashboard/copilot'}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Script
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Search Results */}
      {!loading && filteredScripts.length === 0 && searchQuery && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No scripts found matching "{searchQuery}"
          </AlertDescription>
        </Alert>
      )}

      {/* Scripts Grid */}
      {!loading && filteredScripts.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScripts.map((script) => {
            const title = script.metadata?.title || 'Untitled Script';
            const isEdited = script.metadata?.isEdited || false;
            const wordCount = script.word_count || script.generated_script.split(/\s+/).length;
            const estimatedMinutes = Math.ceil(wordCount / 150);

            return (
              <Card key={script.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2 truncate">
                        {title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {script.script_type}
                        </Badge>
                        {isEdited && (
                          <Badge variant="secondary" className="text-xs">
                            Edited
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview */}
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {script.generated_script}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Type className="h-3 w-3 mr-1" />
                      {wordCount} words
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      ~{estimatedMinutes} min
                    </div>
                    <div className="flex items-center col-span-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(script.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleCreateVO(script)}
                    >
                      <Mic className="h-3 w-3 mr-1" />
                      Create VO from Script
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(script)}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(script)}
                      >
                        {copiedId === script.id ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(script)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Script</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(script.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyScripts;
