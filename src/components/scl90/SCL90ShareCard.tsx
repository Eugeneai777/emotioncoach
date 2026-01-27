import React from "react";
import { Brain } from "lucide-react";
import { SCL90Result as SCL90ResultType, scl90FactorInfo, SCL90Factor } from "./scl90Data";
import ShareCardBase from "@/components/sharing/ShareCardBase";

interface SCL90ShareCardProps {
  result: SCL90ResultType;
  userName?: string;
  avatarUrl?: string;
  partnerCode?: string;
  onReady?: () => void;
}

const getSeverityInfo = (level: string) => {
  const map: Record<string, { label: string; color: string; bgColor: string }> = {
    normal: { label: "心理健康", color: "#10b981", bgColor: "#ecfdf5" },
    mild: { label: "轻度症状", color: "#f59e0b", bgColor: "#fffbeb" },
    moderate: { label: "中度症状", color: "#f97316", bgColor: "#fff7ed" },
    severe: { label: "重度症状", color: "#ef4444", bgColor: "#fef2f2" },
  };
  return map[level] || map.normal;
};

export const SCL90ShareCard = React.forwardRef<HTMLDivElement, SCL90ShareCardProps>(
  ({ result, userName, avatarUrl, partnerCode, onReady }, ref) => {
    const severityInfo = getSeverityInfo(result.severityLevel);
    const primaryInfo = result.primarySymptom 
      ? scl90FactorInfo[result.primarySymptom] 
      : null;

    // Get top 3 high factors
    const topFactors = Object.entries(result.factorScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const dateStr = new Date().toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <ShareCardBase
        ref={ref}
        sharePath="/scl90"
        partnerCode={partnerCode}
        width={340}
        padding={20}
        background="linear-gradient(135deg, #581c87 0%, #312e81 50%, #1e293b 100%)"
        onReady={onReady}
        footerConfig={{
          ctaTitle: "扫码测测你的心理状态",
          ctaSubtitle: "全球著名权威抑郁焦虑自测量表",
          primaryColor: "#a855f7",
          secondaryColor: "#c4b5fd",
          brandingColor: "rgba(255,255,255,0.4)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(168, 85, 247, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Brain style={{ width: "20px", height: "20px", color: "#d8b4fe" }} />
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "#d8b4fe", margin: 0 }}>SCL-90 心理健康自评</p>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#fff", margin: 0 }}>{dateStr}</p>
            </div>
          </div>
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt=""
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
              crossOrigin="anonymous"
            />
          )}
        </div>

        {/* Severity Badge */}
        <div 
          style={{ 
            borderRadius: "12px", 
            padding: "16px", 
            marginBottom: "16px",
            backgroundColor: severityInfo.bgColor,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "24px", fontWeight: "700", color: severityInfo.color, margin: 0 }}>
                {severityInfo.label}
              </p>
              <p style={{ fontSize: "12px", marginTop: "4px", color: severityInfo.color + "cc", margin: "4px 0 0 0" }}>
                总体症状指数 (GSI)
              </p>
            </div>
            <div style={{ fontSize: "36px", fontWeight: "700", color: severityInfo.color }}>
              {result.gsi.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0 }}>{result.totalScore}</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>总分</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0 }}>{result.positiveCount}</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>阳性项数</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0 }}>{result.positiveScoreAvg.toFixed(2)}</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>阳性均分</p>
          </div>
        </div>

        {/* Primary Symptom */}
        {primaryInfo && (
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "8px", margin: "0 0 8px 0" }}>主要关注维度</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "24px" }}>{primaryInfo.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: "600", color: "#fff", margin: 0 }}>{primaryInfo.name}</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "2px 0 0 0", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {primaryInfo.description}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "20px", fontWeight: "700", color: "#fbbf24", margin: 0 }}>
                  {result.factorScores[result.primarySymptom!].toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Factors */}
        <div style={{ marginBottom: "0" }}>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "8px", margin: "0 0 8px 0" }}>10维度得分 TOP3</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {topFactors.map(([key, score], index) => {
              const info = scl90FactorInfo[key as SCL90Factor];
              const percentage = Math.min((score / 5) * 100, 100);
              const colors = ["#f59e0b", "#a855f7", "#6366f1"];
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", width: "20px" }}>{info.emoji}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", width: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{info.name}</span>
                  <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        height: "100%", 
                        borderRadius: "4px",
                        width: `${percentage}%`,
                        backgroundColor: colors[index],
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "500", width: "40px", textAlign: "right", color: "#fff" }}>
                    {(score as number).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </ShareCardBase>
    );
  }
);

SCL90ShareCard.displayName = "SCL90ShareCard";