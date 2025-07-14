"use client";

import { useState, useEffect } from "react";
import {
  Github,
  Search,
  Star,
  TrendingUp,
  Users,
  Calendar,
  GitFork,
  Code,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Repository {
  fullName: string;
  stars: number;
  forks: number;
  createdAt: string;
  language: string;
  description: string;
}

interface Analysis {
  totalStars: number;
  analyzedSample: number;
  patterns: {
    genericUsernames: number;
    noAvatar: number;
    newAccounts: number;
    noRepos: number;
    sameDayCreations: Record<string, number>;
  };
  suspicionIndicators: string[];
  suspicionScore: number;
}

interface Metadata {
  analyzedAt: string;
  apiLimitsUsed: boolean;
  sampleSize: number;
}

interface AnalysisResult {
  repository: Repository;
  analysis: Analysis;
  metadata: Metadata;
}

const loadingMessages = [
  "Connecting to GitHub API...",
  "Fetching repository information...",
  "Collecting stargazer data...",
  "Processing user profiles...",
  "Detecting suspicious patterns...",
  "Calculating engagement metrics...",
  "Generating suspicion score...",
  "Finalizing analysis report...",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function analyzeRepository(repoUrl: string): Promise<AnalysisResult> {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repoUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to analyze repository");
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Network error occurred"
    );
  }
}

export default function StarBuster() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const validateGitHubUrl = (url: string): boolean => {
    const githubUrlPattern =
      /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
    return githubUrlPattern.test(url);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000); // Change message every 3 seconds
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    if (!validateGitHubUrl(url)) {
      setError(
        "Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)"
      );
      return;
    }

    setLoading(true);
    setError("");
    setCurrentMessageIndex(0);

    try {
      const analysisResult = await analyzeRepository(url);
      setResult(analysisResult);
      setLoading(false);

      // Smooth transition to results after loading completes
      setTimeout(() => {
        setShowResults(true);
      }, 500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";

      // Handle specific error types with user-friendly messages
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
    }
  };

  const handleRetry = () => {
    setError("");
    handleAnalyze();
  };

  const handleReset = () => {
    setShowResults(false);
    setTimeout(() => {
      setResult(null);
      setUrl("");
      setError("");
      setCurrentMessageIndex(0);
    }, 300);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const calculateDaysOld = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const calculateStarsPerDay = (stars: number, daysOld: number): number => {
    return daysOld > 0 ? stars / daysOld : 0;
  };

  const getSuspicionLevel = (
    score: number
  ): {
    level: string;
    color: string;
    bgColor: string;
    icon: LucideIcon;
    emoji: string;
  } => {
    if (score < 30) {
      return {
        level: "LOW",
        color: "text-green-700",
        bgColor: "bg-green-50",
        icon: CheckCircle,
        emoji: "✅",
      };
    } else if (score < 60) {
      return {
        level: "MEDIUM",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        icon: AlertTriangle,
        emoji: "⚠️",
      };
    } else {
      return {
        level: "HIGH",
        color: "text-red-700",
        bgColor: "bg-red-50",
        icon: AlertCircle,
        emoji: "🚨",
      };
    }
  };

  const getSameDayCreationsCount = (
    sameDayCreations: Record<string, number>
  ): number => {
    return Object.values(sameDayCreations).reduce(
      (sum, count) => sum + count,
      0
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Initial Screen */}
        {!showResults && (
          <div className="transition-all duration-500">
            <div className="min-h-[60vh] flex flex-col justify-center">
              {/* Header Section - Centered */}
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Github className="h-10 w-10" />
                  <h1 className="text-4xl font-bold">StarBuster</h1>
                </div>
                <p className="text-xl text-muted-foreground mb-4">
                  Detect suspicious star patterns in GitHub repositories
                </p>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  Analyze GitHub repositories to identify potential artificial
                  starring patterns and suspicious engagement metrics using
                  advanced pattern recognition.
                </p>
              </div>

              {/* Input Section - Centered */}
              <Card className="max-w-xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle>Analyze Repository</CardTitle>
                  <CardDescription>
                    Enter a GitHub repository URL to begin analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://github.com/owner/repository"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={loading}
                      className="text-center"
                      onKeyDown={(e) =>
                        e.key === "Enter" && !loading && handleAnalyze()
                      }
                    />
                    {error && (
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
                    )}
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Analyze Repository
                    </div>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Analysis typically takes 30-60 seconds to complete
                  </p>
                </CardContent>
              </Card>

              {/* Simple Loading Indicator */}
              {loading && (
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>{loadingMessages[currentMessageIndex]}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {result && showResults && (
          <div className="transition-all duration-700 animate-in slide-in-from-bottom-4 fade-in">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Github className="h-6 w-6" />
                <h1 className="text-2xl font-bold">
                  StarBuster Analysis Report
                </h1>
              </div>
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
                      {new Date(
                        result.repository.createdAt
                      ).toLocaleDateString()}
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
                      <span className="text-lg text-muted-foreground">
                        /100
                      </span>
                    </div>
                    <Progress
                      value={result.analysis.suspicionScore}
                      className="mb-4"
                    />
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        getSuspicionLevel(result.analysis.suspicionScore).color
                      } ${
                        getSuspicionLevel(result.analysis.suspicionScore)
                          .bgColor
                      }`}
                    >
                      <span>
                        {
                          getSuspicionLevel(result.analysis.suspicionScore)
                            .emoji
                        }
                      </span>
                      {getSuspicionLevel(result.analysis.suspicionScore).level}{" "}
                      suspicion of artificial stars
                    </div>
                  </div>
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
                      <span>No Avatar</span>
                      <div className="text-right">
                        <div className="font-medium">
                          {result.analysis.patterns.noAvatar}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(
                            (result.analysis.patterns.noAvatar /
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
                    <div className="flex justify-between items-center py-2 border-b">
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
                    <div className="flex justify-between items-center py-2">
                      <span>Same Day Creations</span>
                      <div className="text-right">
                        <div className="font-medium">
                          {getSameDayCreationsCount(
                            result.analysis.patterns.sameDayCreations
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(
                            (getSameDayCreationsCount(
                              result.analysis.patterns.sameDayCreations
                            ) /
                              result.analysis.analyzedSample) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>
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
                            (result.repository.forks /
                              result.repository.stars) *
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
                      <span>API Limits Used</span>
                      <div className="text-right">
                        <div className="font-medium">
                          {result.metadata.apiLimitsUsed ? "Yes" : "No"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          rate limiting
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

              {/* Disclaimer */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Disclaimer:</strong> This analysis is based on
                  publicly available data and statistical patterns. Results
                  should be interpreted as indicators rather than definitive
                  proof of artificial starring. Multiple factors can influence
                  star patterns, including viral growth, marketing campaigns,
                  and genuine popularity spikes.
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
        )}
      </div>
    </div>
  );
}
