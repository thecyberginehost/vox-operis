import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileText,
  Sparkles,
  Target,
  ThumbsUp,
  Lightbulb
} from "lucide-react";
import { EnhancementResults as EnhancementResultsType } from "./EnhanceVODialog";

interface EnhancementResultsProps {
  results: EnhancementResultsType;
}

export function EnhancementResults({ results }: EnhancementResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (score >= 60) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className={`${getScoreBgColor(results.overallScore)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Overall Score
              </CardTitle>
              <CardDescription>AI-powered comprehensive analysis</CardDescription>
            </div>
            <div className={`text-5xl font-bold ${getScoreColor(results.overallScore)}`}>
              {results.overallScore}
              <span className="text-2xl">/100</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={results.overallScore} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            Based on clarity (25%), professionalism (25%), content quality (25%), and delivery (25%)
          </p>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <ThumbsUp className="h-5 w-5" />
            Strengths
          </CardTitle>
          <CardDescription>What you're doing well</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {results.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-200">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Lightbulb className="h-5 w-5" />
            Areas for Improvement
          </CardTitle>
          <CardDescription>Opportunities to enhance your VO</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {results.areasForImprovement.map((area, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-200">{area}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Grammar Corrections */}
      {results.grammarCorrections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Grammar & Clarity Corrections
              <Badge variant="secondary">{results.grammarCorrections.length}</Badge>
            </CardTitle>
            <CardDescription>Identified issues and suggested fixes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {results.grammarCorrections.map((correction, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="destructive" className="mt-0.5">Original</Badge>
                      <p className="text-sm text-red-700 dark:text-red-300 flex-1">
                        {correction.original}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5 bg-green-600">Corrected</Badge>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 flex-1">
                        {correction.corrected}
                      </p>
                    </div>
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <AlertDescription className="text-xs text-blue-900 dark:text-blue-100">
                        <strong className="text-blue-900 dark:text-blue-100">Why:</strong> {correction.reason}
                      </AlertDescription>
                    </Alert>
                    {idx < results.grammarCorrections.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Tone Improvements */}
      {results.toneImprovements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tone & Delivery Improvements
              <Badge variant="secondary">{results.toneImprovements.length}</Badge>
            </CardTitle>
            <CardDescription>Enhance your delivery and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {results.toneImprovements.map((improvement, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{improvement.timestamp}</Badge>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{improvement.issue}</p>
                    </div>
                    <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                      <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <AlertDescription className="text-sm text-purple-800 dark:text-purple-200">
                        <strong className="text-purple-900 dark:text-purple-100">Suggestion:</strong> {improvement.suggestion}
                      </AlertDescription>
                    </Alert>
                    {idx < results.toneImprovements.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Job Match Analysis */}
      {results.jobMatchAnalysis && (
        <Card className="border-cyan-200 dark:border-cyan-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                  <Target className="h-5 w-5" />
                  Job Match Analysis
                </CardTitle>
                <CardDescription>How well your VO aligns with the job description</CardDescription>
              </div>
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                {results.jobMatchAnalysis.alignment}%
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={results.jobMatchAnalysis.alignment} className="h-2" />

            {/* Relevant Points */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                Relevant Points Highlighted
              </h4>
              <ul className="space-y-1 ml-6">
                {results.jobMatchAnalysis.relevantPoints.map((point, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">• {point}</li>
                ))}
              </ul>
            </div>

            {/* Missed Opportunities */}
            {results.jobMatchAnalysis.missedOpportunities.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Missed Opportunities
                </h4>
                <ul className="space-y-1 ml-6">
                  {results.jobMatchAnalysis.missedOpportunities.map((opportunity, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">• {opportunity}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transcription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Full Transcription
          </CardTitle>
          <CardDescription>AI-generated transcript of your voice-over</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] pr-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-200">
              {results.transcription}
            </p>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
