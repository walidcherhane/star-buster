// frontend-types.ts
// All types the React / Next.js frontend needs to consume the API

// ---------- SHARED PRIMITIVE TYPES ----------
export type SuspicionLevel = "Low Risk" | "Medium Risk" | "High Risk";

// ---------- REPOSITORY ----------
export interface Repository {
  fullName: string;
  stars: number;
  forks: number;
  createdAt: string;
  language: string | null;
  description: string | null;
  openIssues: number;
  watchers: number;
}

// ---------- ANALYSIS PATTERNS ----------
export interface BasicPatterns {
  genericUsernames: number;
  botLikeNames: number;
  suspiciousCreationDates: Record<string, number>;
}

export interface AdvancedPatterns extends BasicPatterns {
  newAccounts: number;
  noRepos: number;
  noEmail: number;
  noBio: number;
  noBlog: number;
  lowEngagement: number;
  sameDayPattern: number;
  coordinated: number;
  starVelocitySpikes: string[];
  realStars: number;
  fakeStars: number;
  suspiciousTimeWindows: Array<{ time: string; count: number }>;
}

// ---------- TIMELINE ----------
export interface TimelineEntry {
  date: string;
  user: string;
  isFake: boolean;
  accountAge: number;
  followers: number;
  repos: number;
}

// ---------- ANALYSIS RESULT ----------
export interface BaseAnalysis {
  totalStars: number;
  analyzedSample: number;
  suspicionIndicators: string[];
  suspicionScore: number;
}

export interface BasicAnalysis extends BaseAnalysis {
  patterns: BasicPatterns;
}

export interface AdvancedAnalysis extends BaseAnalysis {
  detailedSample: number;
  patterns: AdvancedPatterns;
  timeline: TimelineEntry[];
}

// ---------- API REQUEST ----------
export interface AnalyzeRequest {
  repoUrl?: string;
  owner?: string;
  repo?: string;
  deepAnalysis?: boolean;
  maxStars?: number;
  maxUsers?: number;
}

// ---------- API RESPONSE ----------
export interface AnalysisResponse {
  id: string;
  repository: Repository;
  analysis: BasicAnalysis | AdvancedAnalysis;
  shareUrl: string;
  metadata: {
    analyzedAt: string;
    analysisType: "basic" | "advanced";
    sampleSize: number;
    detailedSample: number;
    processingTime: number;
  };
}

// ---------- SHAREABLE RESULT ----------
export interface ShareableResult {
  id: string;
  repository: Repository;
  analysis: BasicAnalysis | AdvancedAnalysis;
  createdAt: string;
  shareUrl: string;
}

// ---------- UI STATE ----------
export interface AnalysisState {
  loading: boolean;
  error: string | null;
  result: AnalysisResponse | null;
}

// ---------- FORM STATE ----------
export interface AnalyzeFormState {
  repoUrl: string;
  deepAnalysis: boolean;
}

// ---------- CHART DATA ----------
export interface SuspicionChartData {
  label: string;
  value: number;
  color: string;
}

export interface TimelineChartData {
  date: string;
  stars: number;
  fakes: number;
}

// ---------- OG IMAGE ----------
export interface OgImageProps {
  suspicionScore: number;
  suspicionLevel: SuspicionLevel;
  repository: Repository;
  analysisType: "basic" | "advanced";
}
