import React, { useCallback } from "react";
import { Heart, Zap, Brain, Activity } from "lucide-react";
import { useQRCode } from "@/utils/qrCodeUtils";
import { getShareUrl } from "@/config/introShareConfig";
import { useAuth } from "@/hooks/useAuth";
import { patternConfig, blockedDimensionConfig, type EmotionHealthResult, type PatternType, type BlockedDimension } from "./emotionHealthData";

interface EmotionHealthShareCardProps {
  result: EmotionHealthResult;
  userName?: string;
  avatarUrl?: string;
}

// Index level thresholds and colors
const getIndexLevel = (value: number): { label: string; color: string } => {
  if (value <= 25) return { label: '健康', color: 'bg-emerald-500' };
  if (value <= 50) return { label: '轻度', color: 'bg-yellow-500' };
  if (value <= 75) return { label: '中度', color: 'bg-orange-500' };
  return { label: '严重', color: 'bg-rose-500' };
};

// Index card component
function IndexCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const level = getIndexLevel(value);
  return (
    <div className="bg-white/10 rounded-xl p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className="w-3.5 h-3.5 text-white/70" />
        <p className="text-[10px] text-white/70">{label}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <div className="flex items-center justify-center gap-1 mt-1">
        <div className={`w-1.5 h-1.5 rounded-full ${level.color}`} />
        <span className="text-[10px] text-white/60">{level.label}</span>
      </div>
    </div>
  );
}

export const EmotionHealthShareCard = React.forwardRef<HTMLDivElement, EmotionHealthShareCardProps>(
  ({ result, userName, avatarUrl }, ref) => {
    const { user } = useAuth();
    
    const dateStr = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get partner code for QR
    const getPartnerCodeValue = useCallback(() => {
      const storedRef = localStorage.getItem('share_ref_code');
      if (storedRef) return storedRef;
      return user?.id;
    }, [user]);

    // Generate QR code with partner tracking
    const shareUrl = getShareUrl('/emotion-health', getPartnerCodeValue());
    const { qrCodeUrl } = useQRCode(shareUrl, 'SHARE_CARD');

    const pattern = patternConfig[result.primaryPattern];
    const blocked = blockedDimensionConfig[result.blockedDimension];

    return (
      <div
        ref={ref}
        className="w-[340px] bg-gradient-to-br from-violet-900 via-purple-900 to-rose-900 text-white p-5 rounded-2xl"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500/30 flex items-center justify-center">
              <Heart className="w-4 h-4 text-pink-300" />
            </div>
            <div>
              <p className="text-[10px] text-pink-200">情绪健康测评</p>
              <p className="text-sm font-semibold">{dateStr}</p>
            </div>
          </div>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="avatar" 
              className="w-10 h-10 rounded-full border-2 border-white/20"
              crossOrigin="anonymous"
            />
          ) : userName ? (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {userName.slice(0, 1)}
            </div>
          ) : null}
        </div>

        {/* Three dimensional indices */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <IndexCard label="能量" value={result.energyIndex} icon={Zap} />
          <IndexCard label="焦虑" value={result.anxietyIndex} icon={Brain} />
          <IndexCard label="压力" value={result.stressIndex} icon={Activity} />
        </div>

        {/* Primary pattern */}
        <div className="bg-white/10 rounded-xl p-3 mb-3">
          <p className="text-[10px] text-white/60 mb-2">我的情绪反应模式</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{pattern.emoji}</span>
            <div>
              <p className="font-bold text-base">{pattern.name}</p>
              <p className="text-xs text-white/70">{pattern.tagline}</p>
            </div>
          </div>
        </div>

        {/* Secondary pattern (if exists) */}
        {result.secondaryPattern && (
          <div className="bg-white/5 rounded-lg p-2 mb-3 flex items-center gap-2">
            <span className="text-lg">{patternConfig[result.secondaryPattern].emoji}</span>
            <p className="text-xs text-white/60">
              次要模式：{patternConfig[result.secondaryPattern].name}
            </p>
          </div>
        )}

        {/* Blocked dimension */}
        <div className="bg-rose-500/20 rounded-lg p-2.5 mb-4">
          <p className="text-xs text-rose-200">
            🎯 行动阻滞点：{blocked.blockPointName}
          </p>
        </div>

        {/* Footer with QR code */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex-1 pr-3">
            <p className="text-[10px] text-white/60">扫码测测你的情绪健康状态</p>
            <p className="text-sm font-medium text-pink-300">32题找到情绪卡点</p>
            <p className="text-[10px] text-white/40 mt-1">Powered by 有劲AI</p>
          </div>
          {qrCodeUrl && (
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="w-16 h-16 rounded-lg bg-white p-1"
            />
          )}
        </div>
      </div>
    );
  }
);

EmotionHealthShareCard.displayName = "EmotionHealthShareCard";
