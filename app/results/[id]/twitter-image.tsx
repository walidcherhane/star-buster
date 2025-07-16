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
            backgroundColor: "#000000",
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
    if (score >= 70)
      return { level: "High Risk", color: "#ef4444", emoji: "🚨" };
    if (score >= 40)
      return { level: "Medium Risk", color: "#f59e0b", emoji: "⚠️" };
    return { level: "Low Risk", color: "#10b981", emoji: "✅" };
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
          background: "linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%)",
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
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "20px",
            padding: "40px",
            width: "90%",
            height: "80%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                marginRight: "15px",
              }}
            >
              ⭐ StarBuster
            </div>
            <div
              style={{
                fontSize: "20px",
                opacity: 0.8,
              }}
            >
              Fake Star Detection
            </div>
          </div>

          {/* Repository Name  */}
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              marginBottom: "15px",
              textAlign: "center",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {result.repository.full_name}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              gap: "20px",
            }}
          >
            <div style={{ fontSize: "48px" }}>{suspicion.emoji}</div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "64px",
                  fontWeight: "bold",
                  color: suspicion.color,
                }}
              >
                {result.analysis.suspicionScore}/100
              </div>
              <div
                style={{
                  fontSize: "20px",
                  color: suspicion.color,
                  fontWeight: "600",
                }}
              >
                {suspicion.level}
              </div>
            </div>
          </div>

          {/* Compact Stats */}
          <div
            style={{
              display: "flex",
              gap: "30px",
              fontSize: "16px",
              opacity: 0.9,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⭐</span>
              <span>
                {result.repository.stargazers_count?.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🔍</span>
              <span>{result.analysis.analyzedSample} analyzed</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📊</span>
              <span>
                {result.analysis.detailedSample > 0 ? "Advanced" : "Basic"}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
