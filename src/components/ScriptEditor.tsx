import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  X,
  Edit3,
  FileText,
  Clock,
  Type,
  Download,
  Copy,
  Check,
  Sparkles
} from "lucide-react";
import { parseScriptSections, saveEditedScript, type ScriptSection } from "@/lib/scriptGeneration";

interface ScriptEditorProps {
  initialScript: string;
  onSave?: (editedScript: string) => void;
  onClose?: () => void;
  scriptId?: string | null;
}

const ScriptEditor = ({ initialScript, onSave, onClose, scriptId = null }: ScriptEditorProps) => {
  const [editedScript, setEditedScript] = useState(initialScript);
  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Parse script into sections on mount
  useEffect(() => {
    const parsed = parseScriptSections(initialScript);
    setSections(parsed);
  }, [initialScript]);

  // Calculate metadata
  const wordCount = editedScript.trim().split(/\s+/).length;
  const estimatedMinutes = Math.ceil(wordCount / 150); // Average speaking rate
  const charCount = editedScript.length;

  const handleSectionEdit = (index: number, newContent: string) => {
    const updatedSections = [...sections];
    updatedSections[index].content = newContent;
    setSections(updatedSections);

    // Rebuild full script
    const fullScript = updatedSections
      .map(section => `## ${section.title}\n\n${section.content}`)
      .join('\n\n');
    setEditedScript(fullScript);
  };

  const handleFullScriptEdit = (newScript: string) => {
    setEditedScript(newScript);
    // Re-parse sections
    const parsed = parseScriptSections(newScript);
    setSections(parsed);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Title Required",
        description: "Please enter a title for your script"
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveEditedScript(scriptId, title, editedScript, {
        wordCount,
        estimatedDuration: `${estimatedMinutes} min`,
        sections: sections.length
      });

      toast({
        title: "Script Saved",
        description: "Your edited script has been saved successfully"
      });

      setShowSaveDialog(false);
      if (onSave) {
        onSave(editedScript);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save script"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedScript);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Script copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy script"
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'script'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Script downloaded successfully"
    });
  };

  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Edit3 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Script Editor</h1>
                <p className="text-sm text-muted-foreground">Edit and format your voice-over script</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                Save to Scripts
              </Button>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Full Script
                      </CardTitle>
                      <CardDescription>Edit your entire script in one place</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editedScript}
                    onChange={(e) => handleFullScriptEdit(e.target.value)}
                    className="min-h-[500px] font-mono text-sm leading-relaxed"
                    placeholder="Your script content will appear here..."
                  />
                </CardContent>
              </Card>

              {/* Section Editor */}
              {sections.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit by Section</CardTitle>
                    <CardDescription>Edit individual sections of your script</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sections.map((section, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">{section.title}</Label>
                          <Badge variant="outline" className="text-xs">
                            {section.content.trim().split(/\s+/).length} words
                          </Badge>
                        </div>
                        <Textarea
                          value={section.content}
                          onChange={(e) => handleSectionEdit(index, e.target.value)}
                          className="min-h-[120px] font-mono text-sm"
                          placeholder={`Content for ${section.title}...`}
                        />
                        {index < sections.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Metadata & Tips */}
            <div className="space-y-6">
              {/* Metadata Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Script Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Type className="h-4 w-4 mr-2 text-muted-foreground" />
                      Word Count
                    </div>
                    <span className="font-semibold">{wordCount}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      Est. Duration
                    </div>
                    <span className="font-semibold">{estimatedMinutes} min</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      Characters
                    </div>
                    <span className="font-semibold">{charCount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Edit3 className="h-4 w-4 mr-2 text-muted-foreground" />
                      Sections
                    </div>
                    <span className="font-semibold">{sections.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-base text-blue-800 dark:text-blue-400">
                    Recording Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-600 dark:text-blue-500 space-y-2">
                  <p>• Speak at a natural, conversational pace</p>
                  <p>• Pause between sections for easy editing</p>
                  <p>• Mark difficult words with phonetic notes</p>
                  <p>• Keep takes under 5 minutes each</p>
                  <p>• Record in a quiet environment</p>
                </CardContent>
              </Card>

              {/* Formatting Guide */}
              <Card className="bg-accent/20 border-accent/30">
                <CardHeader>
                  <CardTitle className="text-base">Formatting Guide</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><code className="bg-muted px-1 rounded">## Section</code> - Creates a new section</p>
                  <p><code className="bg-muted px-1 rounded">[PAUSE]</code> - Recording pause point</p>
                  <p><code className="bg-muted px-1 rounded">*emphasis*</code> - Emphasis marker</p>
                  <p><code className="bg-muted px-1 rounded">(note)</code> - Personal notes</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Script</DialogTitle>
            <DialogDescription>
              Give your script a title so you can easily find it later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="script-title">Script Title</Label>
              <Input
                id="script-title"
                placeholder="e.g., Senior Developer Introduction"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Word Count</p>
                <p className="font-semibold">{wordCount}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">Duration</p>
                <p className="font-semibold">{estimatedMinutes} min</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
              {isSaving ? 'Saving...' : 'Save Script'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScriptEditor;
