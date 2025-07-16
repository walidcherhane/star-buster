export interface Repository {
  fullName: string;
  stars: number;
  forks: number;
  createdAt: string;
  language: string;
  description: string;
  openIssues: number;
  watchers: number;
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
}

export interface TimelineEntry {
  date: string;
  user: string;
  isFake: number;
  accountAge: number;
  followers: number;
  repos: number;
}

export interface SuspiciousTimeWindow {
  time: string;
  count: number;
}

export interface Analysis {
  totalStars: number;
  analyzedSample: number;
  detailedSample?: number;
  patterns: BasicPatterns | AdvancedPatterns;
  suspicionIndicators: string[];
  suspicionScore: number;
  starVelocitySpikes?: unknown[];
  realStars?: number;
  fakeStars?: number;
  suspiciousTimeWindows?: SuspiciousTimeWindow[];
}

export interface Metadata {
  analyzedAt: string;
  analysisType: string;
  sampleSize: number;
  detailedSample: number;
  processingTime: number;
}

export interface AnalysisResult {
  repository: Repository;
  analysis: Analysis;
  timeline?: TimelineEntry[];
  metadata: Metadata;
  shareUrl: string;
}
