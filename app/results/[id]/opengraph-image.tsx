// app/results/[id]/opengraph-image.tsx
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
  };
}

export default async function Image({
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
            backgroundColor: "#1f2937",
            color: "white",
            fontSize: 32,
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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "40px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            width: "90%",
            height: "80%",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                marginRight: "20px",
              }}
            >
              ⭐ StarBuster
            </div>
          </div>

          {/* Repository Name */}
          <div
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            {result.repository.full_name}
          </div>

          {/* Score */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "30px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "72px",
                  fontWeight: "bold",
                  color: suspicion.color,
                }}
              >
                {result.analysis.suspicionScore}/100
              </div>
              <div
                style={{
                  fontSize: "24px",
                  color: suspicion.color,
                  fontWeight: "600",
                }}
              >
                {suspicion.level}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              fontSize: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⭐</span>
              <span>
                {result.repository.stargazers_count?.toLocaleString()} stars
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🔍</span>
              <span>{result.analysis.analyzedSample} analyzed</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📊</span>
              <span>
                {result.analysis.detailedSample > 0 ? "Advanced" : "Basic"}{" "}
                Analysis
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
