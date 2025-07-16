// app/results/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ShareButton from "@/components/ui/share-button";

interface AnalysisResult {
  id: string;
  repository: {
    full_name: string;
    stargazers_count: number;
    language: string | null;
    forks_count: number;
    created_at: string;
  };
  analysis: {
    suspicionScore: number;
    analyzedSample: number;
    suspicionIndicators?: string[];
  };
  createdAt: string;
}

async function getAnalysisResult(id: string): Promise<AnalysisResult | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("id", id)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    repository: data.repository_data,
    analysis: data.analysis_data,
    createdAt: data.created_at,
  };
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

  const suspicionLevel = getSuspicionLevel(result.analysis.suspicionScore);
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  return {
    title: `${result.repository.full_name} - StarBuster Analysis`,
    description: `Suspicion Score: ${result.analysis.suspicionScore}/100 | ${suspicionLevel}`,
    openGraph: {
      title: `${result.repository.full_name} - StarBuster Analysis`,
      description: `Suspicion Score: ${result.analysis.suspicionScore}/100 | ${suspicionLevel}`,
      url: `${baseUrl}/results/${result.id}`,
      type: "website",
      images: [
        {
          url: `${baseUrl}/results/${result.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${result.repository.full_name} analysis results`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${result.repository.full_name} - StarBuster Analysis`,
      description: `Suspicion Score: ${result.analysis.suspicionScore}/100 | ${suspicionLevel}`,
      images: [`${baseUrl}/results/${result.id}/opengraph-image`],
    },
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
    if (score >= 70) return { level: "High Risk", color: "text-red-600" };
    if (score >= 40) return { level: "Medium Risk", color: "text-yellow-600" };
    return { level: "Low Risk", color: "text-green-600" };
  };

  const suspicion = getSuspicionLevel(result.analysis.suspicionScore);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{result.repository.full_name}</h1>
          <ShareButton />
        </div>

        {/* Suspicion Score */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Suspicion Score</h2>
              <p className={`text-3xl font-bold ${suspicion.color}`}>
                {result.analysis.suspicionScore}/100
              </p>
              <p className={`text-lg ${suspicion.color}`}>{suspicion.level}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">
                ⭐ {result.repository.stargazers_count?.toLocaleString()} stars
              </p>
              <p className="text-gray-600">
                🔍 {result.analysis.analyzedSample} analyzed
              </p>
            </div>
          </div>
        </div>

        {/* Indicators */}
        {result.analysis.suspicionIndicators &&
          result.analysis.suspicionIndicators.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Suspicion Indicators
              </h3>
              <ul className="space-y-2">
                {result.analysis.suspicionIndicators.map(
                  (indicator: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">⚠️</span>
                      <span>{indicator}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

        {/* Repository Info */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>Language: {result.repository.language || "N/A"}</div>
          <div>Forks: {result.repository.forks_count?.toLocaleString()}</div>
          <div>
            Created:{" "}
            {new Date(result.repository.created_at).toLocaleDateString()}
          </div>
          <div>Analysis: {new Date(result.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
}
