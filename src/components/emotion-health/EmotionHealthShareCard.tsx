import React, { useCallback } from "react";
import { Heart, Zap, Brain, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { patternConfig, blockedDimensionConfig, type EmotionHealthResult } from "./emotionHealthData";
import ShareCardBase from "@/components/sharing/ShareCardBase";

interface EmotionHealthShareCardProps {
  result: EmotionHealthResult;
  userName?: string;
  avatarUrl?: string;
  partnerCode?: string;
  onReady?: () => void;
}

// Index level thresholds and colors
const getIndexLevel = (value: number): { label: string; color: string } => {
  if (value <= 25) return { label: '健康', color: 'bg-emerald-500' };
  if (value <= 50) return { label: '轻度', color: 'bg-yellow-500' };
  if (value <= 75) return { label: '中度', color: 'bg-orange-500' };
  return { label: '严重', color: 'bg-rose-500' };
};

const getIndexColorHex = (value: number): string => {
  if (value <= 25) return '#10b981';
  if (value <= 50) return '#eab308';
  if (value <= 75) return '#f97316';
  return '#f43f5e';
};

// Index card component (inline styles for html2canvas compatibility)
function IndexCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const levelColor = getIndexColorHex(value);
  const levelLabel = getIndexLevel(value).label;
  
  return (
    <div style={{ 
      background: "rgba(255,255,255,0.1)", 
      borderRadius: "12px", 
      padding: "10px", 
      textAlign: "center" 
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "4px" }}>
        <Icon style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.7)" }} />
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontSize: "20px", fontWeight: "700", color: "#fff", margin: 0 }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginTop: "4px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: levelColor }} />
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>{levelLabel}</span>
      </div>
    </div>
  );
}

export const EmotionHealthShareCard = React.forwardRef<HTMLDivElement, EmotionHealthShareCardProps>(
  ({ result, userName, avatarUrl, partnerCode, onReady }, ref) => {
    const { user } = useAuth();
    
    const dateStr = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get partner code for QR
    const getPartnerCodeValue = useCallback(() => {
      if (partnerCode) return partnerCode;
      const storedRef = localStorage.getItem('share_ref_code');
      if (storedRef) return storedRef;
      return user?.id;
    }, [user, partnerCode]);

    const pattern = patternConfig[result.primaryPattern];
    const blocked = blockedDimensionConfig[result.blockedDimension];

    return (
      <ShareCardBase
        ref={ref}
        sharePath="/emotion-health"
        partnerCode={getPartnerCodeValue()}
        width={340}
        padding={20}
        background="linear-gradient(135deg, #5b21b6 0%, #7e22ce 50%, #be185d 100%)"
        onReady={onReady}
        footerConfig={{
          ctaTitle: "扫码测测你的情绪健康",
          ctaSubtitle: "32题找到情绪卡点",
          primaryColor: "#ec4899",
          secondaryColor: "#f9a8d4",
          brandingColor: "rgba(255,255,255,0.4)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(236, 72, 153, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Heart style={{ width: "16px", height: "16px", color: "#fbcfe8" }} />
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "#fbcfe8", margin: 0 }}>情绪健康测评</p>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#fff", margin: 0 }}>{dateStr}</p>
            </div>
          </div>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="avatar" 
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
              crossOrigin="anonymous"
            />
          ) : userName ? (
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "700",
              color: "#fff",
            }}>
              {userName.slice(0, 1)}
            </div>
          ) : null}
        </div>

        {/* Three dimensional indices */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
          <IndexCard label="能量" value={result.energyIndex} icon={Zap} />
          <IndexCard label="焦虑" value={result.anxietyIndex} icon={Brain} />
          <IndexCard label="压力" value={result.stressIndex} icon={Activity} />
        </div>

        {/* Primary pattern */}
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", marginBottom: "8px", margin: "0 0 8px 0" }}>我的情绪反应模式</p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "30px" }}>{pattern.emoji}</span>
            <div>
              <p style={{ fontWeight: "700", fontSize: "16px", color: "#fff", margin: 0 }}>{pattern.name}</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "2px 0 0 0" }}>{pattern.tagline}</p>
            </div>
          </div>
        </div>

        {/* Secondary pattern (if exists) */}
        {result.secondaryPattern && (
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "8px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>{patternConfig[result.secondaryPattern].emoji}</span>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
              次要模式：{patternConfig[result.secondaryPattern].name}
            </p>
          </div>
        )}

        {/* Blocked dimension */}
        <div style={{ background: "rgba(244, 63, 94, 0.2)", borderRadius: "8px", padding: "10px", marginBottom: "0" }}>
          <p style={{ fontSize: "12px", color: "#fda4af", margin: 0 }}>
            🎯 行动阻滞点：{blocked.blockPointName}
          </p>
        </div>
      </ShareCardBase>
    );
  }
);

EmotionHealthShareCard.displayName = "EmotionHealthShareCard";