"use client";

import { useEffect, useState } from "react";
import {
  Github,
  Search,
  Settings,
  LoaderIcon,
  Star,
  Users,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { validateGitHubUrl } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AnalysisResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const loadingMessages = [
  "Analyzing repository...",
  "This may take a few minutes...",
  "Please don't refresh the page...",
];

export default function StarBusterLanding() {
  const [url, setUrl] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [maxStars, setMaxStars] = useState(500);
  const [maxUsers, setMaxUsers] = useState(1000);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentMessageIndex((prev) =>
          prev < loadingMessages.length - 1 ? prev + 1 : prev
        );
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

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

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl: url,
          deepAnalysis: advancedMode,
          maxStars,
          maxUsers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze repository");
      }

      const analysisResult: AnalysisResponse = await response.json();
      router.push(`/results/${analysisResult.id}`);
    } catch (err) {
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="transition-all duration-500">
          <div className="min-h-[60vh] flex flex-col justify-center">
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
                    disabled={isLoading}
                    className="text-center"
                    onKeyDown={(e) =>
                      e.key === "Enter" && !isLoading && handleAnalyze()
                    }
                  />
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="flex items-center justify-center space-x-2 py-2">
                  <Label htmlFor="advanced-mode" className="text-sm">
                    Basic
                  </Label>
                  <Switch
                    id="advanced-mode"
                    checked={advancedMode}
                    onCheckedChange={setAdvancedMode}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="advanced-mode"
                    className="text-sm font-medium"
                  >
                    Advanced
                  </Label>
                </div>
                {advancedMode && (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="max-users"
                        className="text-sm flex items-center gap-1"
                      >
                        <Users className="h-3 w-3" />
                        Max Users to Analyze
                      </Label>
                      <Input
                        id="max-users"
                        type="number"
                        min="100"
                        max="10000"
                        value={maxUsers}
                        onChange={(e) =>
                          setMaxUsers(Number.parseInt(e.target.value) || 1000)
                        }
                        disabled={isLoading}
                        className="text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="max-stars"
                        className="text-sm flex items-center gap-1"
                      >
                        <Star className="h-3 w-3" />
                        Max Stars to Analyze
                      </Label>
                      <Input
                        id="max-stars"
                        type="number"
                        min="100"
                        max="10000"
                        value={maxStars}
                        onChange={(e) =>
                          setMaxStars(Number.parseInt(e.target.value) || 500)
                        }
                        disabled={isLoading}
                        className="text-center"
                      />
                    </div>
                  </>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  {advancedMode
                    ? "Deep analysis with detailed user profiling (60-120 seconds)"
                    : "Quick analysis with basic pattern detection (30-60 seconds)"}
                  <br />
                  {advancedMode && (
                    <span className="text-xs text-muted-foreground">
                      Higher values provide more accuracy but take longer
                    </span>
                  )}
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="w-full relative"
                >
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                        <span>{loadingMessages[currentMessageIndex]}</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        {advancedMode
                          ? `Advanced Analysis (${maxStars} stars)`
                          : "Basic Analysis"}
                      </>
                    )}
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
