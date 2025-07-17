import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  AlertTriangle,
  Calendar,
  Code,
  Eye,
  GitFork,
  Github,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  calculateDaysOld,
  calculateStarsPerDay,
  cn,
  formatNumber,
  getSuspiciousCreationsCount,
} from "@/lib/utils";
import { AnalysisResultsRow } from "@/types/supabase-schema";

async function getAnalysisResult(
  id: string
): Promise<AnalysisResultsRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("id", id)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getAnalysisResult(id);

  if (!result) {
    return {
      title: "Analysis Not Found - StarBuster",
    };
  }

  const getSuspicionLevel = (score: number) => {
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Medium Risk";
    return "Low Risk";
  };

  const suspicionLevel = getSuspicionLevel(result.suspicion_score);

  return {
    metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`),
    title: `${result.repo_name} - StarBuster Analysis`,
    description: `Suspicion Score: ${result.suspicion_score}/100 | ${suspicionLevel}`,
  };
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAnalysisResult(id);

  if (!result) {
    notFound();
  }

  const getSuspicionLevel = (score: number) => {
    if (score >= 70)
      return { level: "High Risk", color: "text-red-600", emoji: "🚨" };
    if (score >= 40)
      return { level: "Medium Risk", color: "text-yellow-600", emoji: "⚠️" };
    return { level: "Low Risk", color: "text-green-600", emoji: "✅" };
  };

  const suspicion = getSuspicionLevel(result.suspicion_score);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="transition-all duration-700 animate-in slide-in-from-bottom-4 fade-in">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Github className="h-6 w-6" />
              <h1 className="text-2xl font-bold">StarBuster Analysis Report</h1>
            </div>
            <Badge variant="outline" className="ml-2">
              {result.analysis_type === "basic" ? "Basic" : "Advanced"} Mode
            </Badge>
          </div>
          <div className="space-y-6">
            {/* Repository Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  <CardTitle>{result.repo_name}</CardTitle>
                </div>
                <CardDescription>{result.repo_url}</CardDescription>
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
                      {formatNumber(result.total_stars)}
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
                      {formatNumber(result.repository_data.forks_count)}
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
                        result.total_stars,
                        calculateDaysOld(result.created_at)
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
                      {calculateDaysOld(result.created_at)}
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
                      {formatNumber(
                        result.repository_data?.open_issues_count ?? 0
                      )}
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
                      {formatNumber(
                        result.repository_data?.watchers_count ?? 0
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Code className="h-3 w-3" />
                    {result.repository_data?.language}
                  </Badge>
                  <span>
                    Created {new Date(result.created_at).toLocaleDateString()}
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
                  <div
                    className={cn(
                      "text-5xl font-bold mb-4",
                      result.suspicion_score >= 70
                        ? "text-red-600"
                        : result.suspicion_score >= 40
                        ? "text-yellow-400"
                        : "text-green-600"
                    )}
                  >
                    {result.suspicion_score}{" "}
                    <span
                      className={cn(
                        "text-lg",
                        result.suspicion_score >= 70
                          ? "text-red-600"
                          : result.suspicion_score >= 40
                          ? "text-yellow-400"
                          : "text-green-600"
                      )}
                    >
                      /100
                    </span>
                  </div>
                  <Progress value={result.suspicion_score} className="mb-4" />
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${suspicion.color} ${suspicion.color}`}
                  >
                    <span>{suspicion.emoji}</span>
                    {getSuspicionLevel(result.suspicion_score).level} suspicion
                    of artificial stars
                  </div>
                </div>
                {result.suspicion_indicators?.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">Key Indicators:</div>
                      <ul className="space-y-1">
                        {result.suspicion_indicators?.map(
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
                    Analysis of {formatNumber(result.analyzed_sample)} star
                    accounts
                    {"timeline" in result.analysis_data &&
                      ` (${formatNumber(
                        result.analysis_data?.detailedSample
                      )} detailed)`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>
                      Generic Usernames
                      <br />
                      <span className="text-xs text-muted-foreground max-w-xs">
                        {result.analysis_data?.patterns?.genericUsernamesList?.join(
                          ", "
                        )}
                      </span>
                    </span>
                    <div className="text-right">
                      <div className="font-medium">
                        {result.analysis_data?.patterns.genericUsernames}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(
                          (result.analysis_data?.patterns.genericUsernames /
                            result.analyzed_sample) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>
                      Bot-like Names
                      <br />
                      <span className="text-xs text-muted-foreground max-w-xs">
                        {result.analysis_data?.patterns?.botLikeNamesList?.join(
                          ", "
                        )}
                      </span>
                    </span>
                    <div className="text-right">
                      <div className="font-medium">
                        {result.analysis_data?.patterns.botLikeNames}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(
                          (result.analysis_data?.patterns.botLikeNames /
                            result.analyzed_sample) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex flex-col">
                      <span>Suspicious Creation Dates</span>
                      <p className="text-xs text-muted-foreground">
                        {getSuspiciousCreationsCount(
                          result.analysis_data?.patterns.suspiciousCreationDates
                        ).summary ||
                          "If many accounts were created on the same day, it's considered suspicious"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {
                          getSuspiciousCreationsCount(
                            result.analysis_data?.patterns
                              .suspiciousCreationDates
                          ).statistics.totalSuspiciousDays
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(
                          (getSuspiciousCreationsCount(
                            result.analysis_data?.patterns
                              .suspiciousCreationDates
                          ).statistics.totalSuspiciousDays /
                            result.analyzed_sample) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                  {"timeline" in result.analysis_data && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="flex items-center gap-1">
                          No Email
                        </span>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis_data?.patterns.noEmail}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis_data?.patterns.noEmail /
                                result.analyzed_sample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="flex items-center gap-1">No Bio</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis_data?.patterns.noBio}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis_data?.patterns.noBio /
                                result.analyzed_sample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1">
                            Low Engagement
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Less than 2 followers AND less than 2 following
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis_data?.patterns.lowEngagement}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis_data?.patterns.lowEngagement /
                                result.analyzed_sample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <div className="flex flex-col">
                          <span>Coordinated</span>
                          <p className="text-xs text-muted-foreground">
                            Multiple accounts starring within same minute
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis_data?.patterns.coordinated}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis_data?.patterns.coordinated /
                                result.analyzed_sample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <div className="flex flex-col">
                          <span>New Accounts</span>
                          <p className="text-xs text-muted-foreground">
                            Accounts created in the last 30 days
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis_data?.patterns.newAccounts}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis_data?.patterns.newAccounts /
                                result.analyzed_sample) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div className="flex flex-col">
                          <span>No Repositories</span>
                          <p className="text-xs text-muted-foreground">
                            Accounts with no public repositories
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {result.analysis_data?.patterns.noRepos}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(
                              (result.analysis_data?.patterns.noRepos /
                                result.analyzed_sample) *
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
                        {result.repository_data?.forks_count
                          ? `${1}:${Math.round(
                              result.total_stars /
                                result.repository_data.forks_count
                            )}`
                          : "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(
                          (result.repository_data?.forks_count ??
                            0 / result.total_stars) * 100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Sample Size</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatNumber(result.analyzed_sample)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        accounts analyzed
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Analysis Date</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {new Date(result.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(result.created_at).toLocaleTimeString()}
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
                <strong>Disclaimer:</strong> This analysis is based on publicly
                available data and statistical patterns. Results should be
                interpreted as indicators rather than definitive proof of
                artificial starring. Multiple factors can influence star
                patterns, including viral growth, marketing campaigns, and
                genuine popularity spikes.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
