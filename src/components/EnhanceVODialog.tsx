import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Video, FileText, TrendingUp, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface EnhanceVODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  voProfileId: string;
  jobDescription?: string | null;
  onEnhancementComplete: (results: EnhancementResults) => void;
}

export interface EnhancementResults {
  transcription: string;
  grammarCorrections: Array<{
    original: string;
    corrected: string;
    reason: string;
  }>;
  toneImprovements: Array<{
    timestamp: string;
    issue: string;
    suggestion: string;
  }>;
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  jobMatchAnalysis?: {
    relevantPoints: string[];
    missedOpportunities: string[];
    alignment: number;
  };
}

export function EnhanceVODialog({
  open,
  onOpenChange,
  videoUrl,
  voProfileId,
  jobDescription,
  onEnhancementComplete
}: EnhanceVODialogProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementStep, setEnhancementStep] = useState<string>("");
  const [enhancementProgress, setEnhancementProgress] = useState<number>(0);

  const handleEnhance = async () => {
    setIsEnhancing(true);
    setEnhancementProgress(10);
    setEnhancementStep("Preparing video for analysis...");

    try {
      // Refresh and get current user session to ensure token is valid
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

      if (sessionError) {
        console.error('Session refresh error:', sessionError);
        toast.error("Session expired. Please sign in again.");
        return;
      }

      if (!session) {
        toast.error("Please sign in to enhance your VO");
        return;
      }

      console.log('Using session for user:', session.user.id);
      console.log('Access token present:', !!session.access_token);
      console.log('Token prefix:', session.access_token?.substring(0, 20) + '...');

      // Call the Edge Function for enhancement
      setEnhancementProgress(25);
      setEnhancementStep("Downloading video for transcription...");

      // Simulate progress updates (the actual work happens in the Edge Function)
      const progressInterval = setInterval(() => {
        setEnhancementProgress(prev => {
          if (prev >= 90) return 90; // Cap at 90% until we get the response
          return prev + 5;
        });
      }, 2000); // Update every 2 seconds

      let data, error;
      try {
        const response = await supabase.functions.invoke('enhance-vo', {
          body: {
            videoUrl,
            voProfileId,
            jobDescription: jobDescription || null,
            userId: session.user.id
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        data = response.data;
        error = response.error;
      } catch (invokeError: any) {
        console.error('Invoke error:', invokeError);
        error = invokeError;
      }

      // Clear the progress interval
      clearInterval(progressInterval);

      console.log('Edge Function response:', { data, error });

      if (error) {
        console.error('Edge Function error details:', error);
        // Try to get more details from the error
        if (error.message) {
          console.error('Error message:', error.message);
        }
        // Check if there's a context with the response body
        if (error.context) {
          console.error('Error context:', error.context);

          // Try to read the response body if it's a Response object
          if (error.context instanceof Response) {
            try {
              const errorBody = await error.context.json();
              console.error('Error response body:', errorBody);
              throw new Error(`${errorBody.error || error.message}: ${errorBody.details || 'No details available'}`);
            } catch (parseError) {
              console.error('Could not parse error response:', parseError);
            }
          }
        }

        // If we have data despite the error, it might contain error details
        if (data) {
          console.error('Data from failed request:', data);
          throw new Error(`${data.error || error.message}: ${data.details || ''}\n${data.stack || ''}`);
        }

        throw error;
      }

      // Check if data contains an error from the Edge Function
      if (data?.error) {
        console.error('Edge Function returned error:', data);
        console.error('Error details:', data.details);
        console.error('Error stack:', data.stack);
        throw new Error(`${data.error}: ${data.details || 'No details'}\n${data.stack || ''}`);
      }

      if (!data || !data.results) {
        console.error('Invalid response data:', data);
        throw new Error("No enhancement results returned");
      }

      // Complete the progress
      setEnhancementProgress(100);
      setEnhancementStep("Enhancement complete!");

      // Show success
      toast.success("VO Enhancement Complete!", {
        description: `Overall score: ${data.results.overallScore}/100`
      });

      onEnhancementComplete(data.results);
      onOpenChange(false);

    } catch (error: any) {
      console.error("Enhancement error:", error);
      const errorMessage = error.context?.body ?
        `${error.message}: ${JSON.stringify(error.context.body)}` :
        error.message || "Failed to enhance VO. Please try again.";

      toast.error("Enhancement Failed", {
        description: errorMessage
      });
    } finally {
      setIsEnhancing(false);
      setEnhancementStep("");
      setEnhancementProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogTitle className="text-3xl font-bold m-0">Enhance Your VO</DialogTitle>
          </div>
          <DialogDescription className="text-blue-50 text-lg">
            Unlock professional-grade insights powered by AI
          </DialogDescription>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          {/* Credit Usage Alert */}
          <Alert className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
            <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
              <strong className="text-amber-900 dark:text-amber-100">1 AI Credit Required</strong> – This enhancement uses advanced AI analysis
            </AlertDescription>
          </Alert>

          {/* Features Grid */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              What You'll Get
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">AI Video Transcription</h4>
                    <p className="text-xs text-muted-foreground">
                      Precise transcription of your voice-over with timestamps
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">Grammar & Clarity Corrections</h4>
                    <p className="text-xs text-muted-foreground">
                      Identify and fix grammar issues, filler words, and unclear phrasing
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">Tone & Delivery Improvements</h4>
                    <p className="text-xs text-muted-foreground">
                      Suggestions to enhance confidence, professionalism, and engagement
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                </CardContent>
              </Card>

              {jobDescription && (
                <Card className="border-l-4 border-l-cyan-500 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                      <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">Job Match Analysis</h4>
                      <p className="text-xs text-muted-foreground">
                        Compare your VO against the job description and highlight alignment
                      </p>
                      <Badge variant="secondary" className="mt-2 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50">
                        Job Description Detected
                      </Badge>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Enhancement Progress */}
          {isEnhancing && (
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-sm space-y-3">
                <div>
                  <strong>{enhancementStep}</strong>
                  <p className="text-xs text-muted-foreground mt-1">
                    This may take 30-60 seconds...
                  </p>
                </div>
                <div className="space-y-2">
                  <Progress value={enhancementProgress} className="h-2" />
                  <p className="text-xs text-right text-muted-foreground">
                    {enhancementProgress}% complete
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer with CTA */}
        <DialogFooter className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isEnhancing}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleEnhance}
            disabled={isEnhancing}
            className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Enhance My VO
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
