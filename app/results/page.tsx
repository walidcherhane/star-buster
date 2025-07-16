"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RefreshCw, Search, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnalysisResponse } from "@/types";

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
): Promise<AnalysisResponse> {
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
  const [error, setError] = useState("");

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
        router.push(`/results/${analysisResult.id}`);
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
    setLoading(true);
    setCurrentMessageIndex(0);
    // Re-trigger useEffect by pushing same params
    router.replace(window.location.pathname + "?" + searchParams.toString());
  };

  const handleReset = () => {
    router.push("/");
  };

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
