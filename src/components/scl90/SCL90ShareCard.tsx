import React from "react";
import { Brain } from "lucide-react";
import { SCL90Result as SCL90ResultType, scl90FactorInfo, SCL90Factor } from "./scl90Data";
import { useQRCode } from "@/utils/qrCodeUtils";
import { SHARE_DOMAIN } from "@/config/introShareConfig";

interface SCL90ShareCardProps {
  result: SCL90ResultType;
  userName?: string;
  avatarUrl?: string;
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
  ({ result, userName, avatarUrl }, ref) => {
    const { qrCodeUrl } = useQRCode(`${SHARE_DOMAIN}/scl90`, "SHARE_CARD");
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
      <div
        ref={ref}
        className="w-[340px] bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <p className="text-xs text-purple-300">SCL-90 心理健康自评</p>
              <p className="text-sm font-semibold">{dateStr}</p>
            </div>
          </div>
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full border-2 border-white/20"
              crossOrigin="anonymous"
            />
          )}
        </div>

        {/* Severity Badge */}
        <div 
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: severityInfo.bgColor }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-2xl font-bold"
                style={{ color: severityInfo.color }}
              >
                {severityInfo.label}
              </p>
              <p className="text-xs mt-1" style={{ color: severityInfo.color + "cc" }}>
                总体症状指数 (GSI)
              </p>
            </div>
            <div 
              className="text-4xl font-bold"
              style={{ color: severityInfo.color }}
            >
              {result.gsi.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/10 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-white">{result.totalScore}</p>
            <p className="text-xs text-white/60">总分</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-white">{result.positiveCount}</p>
            <p className="text-xs text-white/60">阳性项数</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-white">{result.positiveScoreAvg.toFixed(2)}</p>
            <p className="text-xs text-white/60">阳性均分</p>
          </div>
        </div>

        {/* Primary Symptom */}
        {primaryInfo && (
          <div className="bg-white/10 rounded-xl p-3 mb-4">
            <p className="text-xs text-white/60 mb-2">主要关注维度</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{primaryInfo.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold">{primaryInfo.name}</p>
                <p className="text-xs text-white/70 line-clamp-2">
                  {primaryInfo.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-amber-400">
                  {result.factorScores[result.primarySymptom!].toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Factors */}
        <div className="mb-4">
          <p className="text-xs text-white/60 mb-2">10维度得分 TOP3</p>
          <div className="space-y-1.5">
            {topFactors.map(([key, score], index) => {
              const info = scl90FactorInfo[key as SCL90Factor];
              const percentage = Math.min((score / 5) * 100, 100);
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-sm w-5">{info.emoji}</span>
                  <span className="text-xs text-white/80 w-16 truncate">{info.name}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: index === 0 ? "#f59e0b" : index === 1 ? "#a855f7" : "#6366f1"
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">
                    {(score as number).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex-1">
          <p className="text-xs text-white/60 mb-0.5">扫码测测你的心理状态</p>
            <p className="text-sm font-medium text-purple-300">全球著名权威抑郁焦虑自测量表</p>
            <p className="text-xs text-white/40 mt-1">Powered by 有劲AI</p>
          </div>
          {qrCodeUrl && (
            <div className="w-16 h-16 bg-white rounded-lg p-1 flex-shrink-0">
              <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

SCL90ShareCard.displayName = "SCL90ShareCard";
