// supabase-schema.ts
export interface AnalysisResultsRow {
  id: string; // uuid (primary key)
  repo_owner: string; // text
  repo_name: string; // text
  repo_url: string; // text
  suspicion_score: number; // int4
  total_stars: number; // int4
  analyzed_sample: number; // int4
  analysis_type: "basic" | "advanced"; // text (enum-like)
  suspicion_indicators: string[]; // text[] (Postgres array)
  repository_data: Repository; // jsonb
  analysis_data: BasicAnalysis | AdvancedAnalysis; // jsonb
  created_at: string; // timestamptz (ISO string)
  expires_at: string; // timestamptz (ISO string)
}

/* ---------- JSON sub-objects ---------- */
export interface Repository {
  id: number;
  full_name: string;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  language: string | null;
  description: string | null;
  open_issues_count?: number;
  watchers_count?: number;
}

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
  timeline: Array<{
    date: string;
    user: string;
    isFake: boolean;
    accountAge: number;
    followers: number;
    repos: number;
  }>;
}
