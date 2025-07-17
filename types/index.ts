import { AdvancedAnalysis, BasicAnalysis, Repository } from "./supabase-schema";

// ---------- API REQUEST ----------
export interface AnalyzeRequest {
  repoUrl?: string;
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
