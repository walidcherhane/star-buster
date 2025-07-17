// app/results/[id]/twitter-image.tsx
import { ImageResponse } from "next/og";
import { createClient } from "@/utils/supabase/server";

export const runtime = "edge";
export const alt = "StarBuster Analysis Results";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

async function getAnalysisResult(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("id", id)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;

  return {
    repository: data.repository_data,
    analysis: data.analysis_data,
    createdAt: data.created_at,
  };
}

export default async function TwitterImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAnalysisResult(id);

  if (!result) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            color: "#1e293b",
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          Analysis Not Found
        </div>
      ),
      { ...size }
    );
  }

  const getSuspicionLevel = (score: number) => {
    if (score >= 70) return { level: "High Risk", color: "#dc2626" };
    if (score >= 40) return { level: "Medium Risk", color: "#d97706" };
    return { level: "Low Risk", color: "#059669" };
  };

  const suspicion = getSuspicionLevel(result.analysis.suspicionScore);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "40px",
          borderRadius: "16px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: "80px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          Github Stars Analysis Report
        </div>

        {/* Top Row: Repo Name and Description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1e293b",
              marginBottom: "10px",
            }}
          >
            {result.repository.full_name}
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 200,
              color: "#64748b",
            }}
          >
            {result.repository.description || "No description available"}
          </div>
        </div>

        {/* Score Section: Suspicion Score and Stars */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "4px",
              }}
            >
              {result.analysis.suspicionScore}/100
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: suspicion.color,
              }}
            >
              {suspicion.level}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              fontSize: "16px",
              color: "#64748b",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>⭐</span>
              <span>
                {result.repository.stargazers_count?.toLocaleString()} stars
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>🔍</span>
              <span>{result.analysis.analyzedSample} analyzed</span>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Language, Forks, Created, and Analysis */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            fontSize: "16px",
            color: "#64748b",
          }}
        >
          <div>Language: {result.repository.language || "N/A"}</div>
          <div>Forks: {result.repository.forks_count?.toLocaleString()}</div>
          <div>
            Created:{" "}
            {new Date(result.repository.created_at).toLocaleDateString()}
          </div>
          <div>Analysis: {new Date(result.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
