import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { personalityTypeConfig, dimensionConfig, type MidlifeResult } from "./midlifeAwakeningData";
import ShareCardBase from "@/components/sharing/ShareCardBase";

interface MidlifeAwakeningShareCardProps {
  result: MidlifeResult;
  userName?: string;
  avatarUrl?: string;
  partnerCode?: string;
  onReady?: () => void;
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "20px", fontWeight: "700", color: "#fff", margin: 0 }}>{value}</p>
    </div>
  );
}

export const MidlifeAwakeningShareCard = React.forwardRef<HTMLDivElement, MidlifeAwakeningShareCardProps>(
  ({ result, userName, avatarUrl, partnerCode, onReady }, ref) => {
    const { user } = useAuth();
    const personality = personalityTypeConfig[result.personalityType];
    const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
      <ShareCardBase
        ref={ref}
        gradient="linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #e11d48 100%)"
        title="中场觉醒力测评 3.0"
        subtitle={dateStr}
        userName={userName || user?.user_metadata?.name || '用户'}
        avatarUrl={avatarUrl}
        partnerCode={partnerCode}
        qrPath="/midlife-awakening"
        onReady={onReady}
      >
        {/* 人格类型 */}
        <div style={{ textAlign: "center", margin: "12px 0" }}>
          <span style={{ fontSize: "36px" }}>{personality.emoji}</span>
          <p style={{ fontSize: "18px", fontWeight: "700", color: "#fff", marginTop: "8px" }}>{personality.name}</p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", marginTop: "4px" }}>{personality.tagline}</p>
        </div>

        {/* 核心指标 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", margin: "12px 0" }}>
          <MetricCard label="内耗风险" value={result.internalFrictionRisk} color="#ef4444" />
          <MetricCard label="行动力" value={result.actionPower} color="#3b82f6" />
          <MetricCard label="使命清晰" value={result.missionClarity} color="#f59e0b" />
        </div>
      </ShareCardBase>
    );
  }
);

MidlifeAwakeningShareCard.displayName = 'MidlifeAwakeningShareCard';
