import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { personalityTypeConfig, type MidlifeResult } from "./midlifeAwakeningData";
import ShareCardBase from "@/components/sharing/ShareCardBase";

interface MidlifeAwakeningShareCardProps {
  result: MidlifeResult;
  userName?: string;
  avatarUrl?: string;
  partnerCode?: string;
  onReady?: () => void;
}

function MetricCard({ label, value, isGood }: { label: string; value: number; isGood: boolean }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "12px", padding: "10px 6px", textAlign: "center" }}>
      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.65)", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "22px", fontWeight: "700", color: "#fff", margin: "2px 0 0" }}>{value}</p>
      <p style={{ fontSize: "9px", color: isGood ? "#86efac" : "#fcd34d", margin: 0 }}>
        {isGood ? "✓ 状态良好" : "⚡ 需关注"}
      </p>
    </div>
  );
}

export const MidlifeAwakeningShareCard = React.forwardRef<HTMLDivElement, MidlifeAwakeningShareCardProps>(
  ({ result, userName, avatarUrl, partnerCode, onReady }, ref) => {
    const { user } = useAuth();
    const personality = personalityTypeConfig[result.personalityType];

    // 判断指标状态
    const frictionGood = result.internalFrictionRisk <= 40;
    const actionGood = result.actionPower >= 60;
    const missionGood = result.missionClarity >= 60;

    return (
      <ShareCardBase
        ref={ref}
        background="linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #d946ef 100%)"
        sharePath="/midlife-awakening"
        partnerCode={partnerCode}
        onReady={onReady}
        footerConfig={{
          ctaTitle: "扫码测测你的觉醒力",
          ctaSubtitle: "🎁 3分钟出结果",
        }}
      >
        {/* 标题 */}
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: 0, letterSpacing: "1px" }}>中场觉醒力测评 3.0</p>
        </div>

        {/* 人格类型 */}
        <div style={{ textAlign: "center", margin: "10px 0" }}>
          <span style={{ fontSize: "40px" }}>{personality.emoji}</span>
          <p style={{ fontSize: "20px", fontWeight: "800", color: "#fff", marginTop: "6px", marginBottom: "0" }}>
            {personality.name}
          </p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", marginTop: "4px", marginBottom: "0" }}>
            {personality.tagline}
          </p>
        </div>

        {/* 核心指标 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", margin: "10px 0" }}>
          <MetricCard label="内耗风险" value={result.internalFrictionRisk} isGood={frictionGood} />
          <MetricCard label="行动力" value={result.actionPower} isGood={actionGood} />
          <MetricCard label="使命清晰" value={result.missionClarity} isGood={missionGood} />
        </div>

        {/* 价值感文案 — 为什么值得做 */}
        <div style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "12px",
          padding: "10px 12px",
          marginTop: "4px",
        }}>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)", margin: 0, lineHeight: "1.6" }}>
            📊 6维深度扫描你的内耗、行动力与人生方向
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)", margin: "4px 0 0", lineHeight: "1.6" }}>
            🧭 精准定位你的觉醒阶段 + AI个性化建议
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)", margin: "4px 0 0", lineHeight: "1.6" }}>
            💡 看清卡住你的模式，找到突破方向
          </p>
        </div>
      </ShareCardBase>
    );
  }
);

MidlifeAwakeningShareCard.displayName = 'MidlifeAwakeningShareCard';
