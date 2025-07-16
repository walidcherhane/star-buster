"use client";

import { useState } from "react";
import { Github, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { validateGitHubUrl } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function StarBusterLanding() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [maxStars, setMaxStars] = useState(500);
  const [maxUsers, setMaxUsers] = useState(1000);
  const router = useRouter();

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
    if (advancedMode && (maxStars < 100 || maxStars > 10000)) {
      setError("Max stars must be between 100 and 10,000");
      return;
    }
    setLoading(true);
    setError("");
    // Pass params to /results page
    const params = new URLSearchParams({
      url,
      advanced: advancedMode ? "1" : "0",
      maxStars: String(maxStars),
      maxUsers: String(maxUsers),
    });
    router.push(`/results?${params.toString()}`);
  };

  const handleRetry = () => {
    setError("");
    handleAnalyze();
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
                    disabled={loading}
                    className="text-center "
                    onKeyDown={(e) =>
                      e.key === "Enter" && !loading && handleAnalyze()
                    }
                  />
                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
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
                    disabled={loading}
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
                        <Settings className="h-3 w-3" />
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
                        disabled={loading}
                        className="text-center"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Higher values provide more accuracy but take longer
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="max-stars"
                        className="text-sm flex items-center gap-1"
                      >
                        <Settings className="h-3 w-3" />
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
                        disabled={loading}
                        className="text-center"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Higher values provide more accuracy but take longer
                        (100-10,000)
                      </p>
                    </div>
                  </>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  {advancedMode
                    ? "Deep analysis with detailed user profiling (60-120 seconds)"
                    : "Quick analysis with basic pattern detection (30-60 seconds)"}
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    {advancedMode
                      ? `Advanced Analysis (${maxStars} stars)`
                      : "Basic Analysis"}
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
