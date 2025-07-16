"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Github,
  Star,
  TrendingUp,
  Users,
  Calendar,
  GitFork,
  Code,
  AlertTriangle,
  RefreshCw,
  Eye,
  Mail,
  FileText,
  Globe,
  Activity,
  Clock,
  Search,
  LoaderIcon,
  Share,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatNumber,
  calculateDaysOld,
  calculateStarsPerDay,
  getSuspicionLevel,
  getSuspiciousCreationsCount,
  isAdvancedPatterns,
  formatProcessingTime,
} from "@/lib/utils";
import type { AnalysisResult } from "@/lib/types";

const loadingMessages = [
  "Fetching data...",
  "It may take a few minutes...",
  "Please don't refresh the page...",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function analyzeRepository(
  repoUrl: string,
  deepAnalysis = false,
  maxStars = 500,
  maxUsers = 1000
): Promise<AnalysisResult> {
  const requestBody = deepAnalysis
    ? { repoUrl, deepAnalysis: true, maxStars, maxUsers }
    : { repoUrl, deepAnalysis: false, maxUsers };
  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze repository");
  }
  return await response.json();
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setCurrentMessageIndex((prev) =>
          prev < loadingMessages.length - 1 ? prev + 1 : prev
        );
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const url = searchParams.get("url") || "";
    const advanced = searchParams.get("advanced") === "1";
    const maxStars = Number(searchParams.get("maxStars")) || 500;
    const maxUsers = Number(searchParams.get("maxUsers")) || 1000;
    if (!url) {
      setError("Missing repository URL");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setCurrentMessageIndex(0);
    analyzeRepository(url, advanced, maxStars, maxUsers)
      .then((analysisResult) => {
        setResult(analysisResult);
        setLoading(false);
        setTimeout(() => setShowResults(true), 500);
      })
      .catch((err) => {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        if (errorMessage.includes("400") || errorMessage.includes("Invalid")) {
          setError(
            "Invalid GitHub repository URL. Please check the URL and try again."
          );
        } else if (
          errorMessage.includes("404") ||
          errorMessage.includes("not found")
        ) {
          setError(
            "Repository not found. Please verify the repository exists and is public."
          );
        } else if (
          errorMessage.includes("500") ||
          errorMessage.includes("Internal")
        ) {
          setError("Server error occurred. Please try again in a few moments.");
        } else if (
          errorMessage.includes("Network") ||
          errorMessage.includes("fetch")
        ) {
          setError(
            "Network connection error. Please check your internet connection and try again."
          );
        } else {
          setError(errorMessage);
        }
        setLoading(false);
      });
  }, [searchParams]);

  const handleRetry = () => {
    setError("");
    setShowResults(false);
    setLoading(true);
    setCurrentMessageIndex(0);
    // Re-trigger useEffect by pushing same params
    router.replace(window.location.pathname + "?" + searchParams.toString());
  };

  const handleReset = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 text-lg text-muted-foreground">
          <div className="animate-spin">
            <LoaderIcon className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <p>{loadingMessages[currentMessageIndex]}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Card className="max-w-xl w-full">
          <CardHeader className="text-center">
            <CardTitle>Error</CardTitle>
            <CardDescription>Analysis could not be completed</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-2 h-6 px-2 bg-transparent"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
            <div className="text-center pt-4">
              <Button onClick={handleReset} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Analyze Another Repository
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result || !showResults) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="transition-all duration-700 animate-in slide-in-from-bottom-4 fade-in">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Github className="h-6 w-6" />
              <h1 className="text-2xl font-bold">StarBuster Analysis Report</h1>
              <Badge variant="outline" className="ml-2">
                {result.metadata.analysisType}
              </Badge>
            </div>
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share Results - {result.shareUrl}
            </Button>
          </div>
          <div className="space-y-6">
            {/* Repository Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  <CardTitle>{result.repository.fullName}</CardTitle>
                </div>
                <CardDescription>
                  {result.repository.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">
                        Stars
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumber(result.repository.stars)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <GitFork className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Forks
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatNumber(result.repository.forks)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Stars/Day
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {calculateStarsPerDay(
                        result.repository.stars,
                        calculateDaysOld(result.repository.createdAt)
                      ).toFixed(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Days Old
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {calculateDaysOld(result.repository.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Open Issues
                      </span>
                    </div>
                    <div className="text-xl font-bold">
                      {formatNumber(result.repository.openIssues)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Watchers
                      </span>
                    </div>
                    <div className="text-xl font-bold">
                      {formatNumber(result.repository.watchers)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Code className="h-3 w-3" />
                    {result.repository.language}
                  </Badge>
                  <span>
                    Created{" "}
                    {new Date(result.repository.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
            {/* Suspicion Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Suspicion Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold mb-4">
                    {result.analysis.suspicionScore}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <Progress
                    value={result.analysis.suspicionScore}
                    className="mb-4"
                  />
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      getSuspicionLevel(result.analysis.suspicionScore).color
                    } ${
                      getSuspicionLevel(result.analysis.suspicionScore).bgColor
                    }`}
                  >
                    <span>
                      {getSuspicionLevel(result.analysis.suspicionScore).emoji}
                    </span>
                    {getSuspicionLevel(result.analysis.suspicionScore).level}{" "}
                    suspicion of artificial stars
                  </div>
                </div>
                {result.analysis.realStars !== undefined && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">
                        {result.analysis.realStars}
                      </div>
                      <div className="text-sm text-green-600">Real Stars</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-700">
                        {result.analysis.fakeStars}
                      </div>
                      <div className="text-sm text-red-600">Fake Stars</div>
                    </div>
                  </div>
                )}
                {result.analysis.suspicionIndicators.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">Key Indicators:</div>
                      <ul className="space-y-1">
                        {result.analysis.suspicionIndicators.map(
                          (indicator, index) => (
                            <li key={index} className="text-sm">
                              • {indicator}
                            </li>
                          )
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            {/* Pattern Analysis */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Patterns
                  </CardTitle>
                  <CardDescription>
                    Analysis of {formatNumber(result.analysis.analyzedSample)}{" "}
                    star accounts
                    {result.analysis.detailedSample &&
                      result.analysis.detailedSample > 0 &&
                      ` (${formatNumber(
                        result.analysis.detailedSample
                      )} detailed)`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Generic Usernames</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {result.analysis.patterns.genericUsernames}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(
                          (result.analysis.patterns.genericUsernames /
                            result.analysis.analyzedSample) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Bot-like Names</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {result.analysis.patterns.botLikeNames}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(
                          (result.analysis.patterns.botLikeNames /
                            result.analysis.analyzedSample) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Suspicious Creation Dates</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {getSuspiciousCreationsCount(
                          result.analysis.patterns.suspiciousCreationDates
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(
                          (getSuspiciousCreationsCount(
                            result.analysis.patterns.suspiciousCreationDates
                          ) /
                            result.analysis.analyzedSample) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                  {isAdvancedPatterns(result.analysis.patterns) && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          No Email
                        </span>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis.patterns.noEmail}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis.patterns.noEmail /
                                result.analysis.analyzedSample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          No Bio
                        </span>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis.patterns.noBio}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis.patterns.noBio /
                                result.analysis.analyzedSample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          No Blog
                        </span>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis.patterns.noBlog}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis.patterns.noBlog /
                                result.analysis.analyzedSample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Low Engagement
                        </span>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis.patterns.lowEngagement}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis.patterns.lowEngagement /
                                result.analysis.analyzedSample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span>Coordinated</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis.patterns.coordinated}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis.patterns.coordinated /
                                result.analysis.analyzedSample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span>New Accounts</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis.patterns.newAccounts}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis.patterns.newAccounts /
                                result.analysis.analyzedSample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span>No Repositories</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis.patterns.noRepos}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis.patterns.noRepos /
                                result.analysis.analyzedSample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Engagement Metrics
                  </CardTitle>
                  <CardDescription>
                    Repository engagement analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Fork-to-Star Ratio</span>
                    <div className="text-right">
                      <div className="font-medium">
                        1:
                        {Math.round(
                          result.repository.stars / result.repository.forks
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(
                          (result.repository.forks / result.repository.stars) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Sample Size</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatNumber(result.metadata.sampleSize)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        accounts analyzed
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Processing Time
                    </span>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatProcessingTime(result.metadata.processingTime)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        analysis duration
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Analysis Date</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {new Date(
                          result.metadata.analyzedAt
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(
                          result.metadata.analyzedAt
                        ).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Suspicious Time Windows (Advanced only) */}
            {result.analysis.suspiciousTimeWindows &&
              result.analysis.suspiciousTimeWindows.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Suspicious Time Windows
                    </CardTitle>
                    <CardDescription>
                      Detected coordinated starring activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.analysis.suspiciousTimeWindows.map(
                        (window, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded"
                          >
                            <span className="text-sm">
                              {new Date(window.time).toLocaleString()}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-orange-700"
                            >
                              {window.count} stars
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            {/* Disclaimer */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Disclaimer:</strong> This analysis is based on publicly
                available data and statistical patterns. Results should be
                interpreted as indicators rather than definitive proof of
                artificial starring. Multiple factors can influence star
                patterns, including viral growth, marketing campaigns, and
                genuine popularity spikes.
              </AlertDescription>
            </Alert>
            {/* Reset Button */}
            <div className="text-center pt-4">
              <Button onClick={handleReset} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Analyze Another Repository
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
