import { forwardRef } from "react";
import { ShareCardBase } from "@/components/sharing";
import logoImage from "@/assets/logo-youjin-ai.png";

interface SBTIShareCardProps {
  personalityLabel: string;
  personalityEmoji: string;
  subtitle?: string;
  quote?: string;
  traits: string[];
  matchPercent: number;
  displayName?: string;
  avatarUrl?: string;
  partnerCode?: string;
}

const SBTIShareCard = forwardRef<HTMLDivElement, SBTIShareCardProps>(
  ({ personalityLabel, personalityEmoji, subtitle, quote, traits, matchPercent, displayName, avatarUrl, partnerCode }, ref) => {
    return (
      <ShareCardBase
        ref={ref}
        sharePath="/assessment/sbti_personality"
        partnerCode={partnerCode}
        width={340}
        padding={0}
        background="linear-gradient(145deg, #0f0c29 0%, #302b63 50%, #24243e 100%)"
        borderRadius={24}
        footerConfig={{
          ctaTitle: '扫码测你的搞钱人格',
          ctaSubtitle: '🎭 全网爆火 · 人格测试',
          primaryColor: '#e2e8f0',
          secondaryColor: '#94a3b8',
          showQR: true,
          showBranding: true,
          brandingColor: '#64748b',
          layout: 'horizontal',
        }}
      >
        <div style={{ padding: '24px 24px 16px' }}>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(139,92,246,0.5)' }}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 16, fontWeight: 700,
              }}>
                {(displayName || '我')[0]}
              </div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                {displayName || '我'}的搞钱人格
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>SBTI 人格测评结果</div>
            </div>
          </div>

          {/* Personality hero */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 56, lineHeight: 1.1, marginBottom: 8 }}>
              {personalityEmoji}
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: '#fff',
              letterSpacing: '0.05em', marginBottom: 4,
              textShadow: '0 2px 12px rgba(139,92,246,0.4)',
            }}>
              {personalityLabel}
            </div>
            {subtitle && (
              <div style={{
                fontSize: 14, color: '#c4b5fd', fontWeight: 500,
                marginBottom: 8,
              }}>
                {subtitle}
              </div>
            )}
            <div style={{
              display: 'inline-block',
              padding: '3px 14px', borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.3))',
              border: '1px solid rgba(139,92,246,0.4)',
              fontSize: 12, color: '#c4b5fd', fontWeight: 600,
            }}>
              匹配度 {matchPercent}%
            </div>
          </div>

          {/* Trait tags */}
          {traits.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              justifyContent: 'center', marginBottom: 16,
            }}>
              {traits.slice(0, 5).map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12, padding: '4px 12px',
                    borderRadius: 16,
                    background: 'rgba(139,92,246,0.15)',
                    border: '1px solid rgba(139,92,246,0.25)',
                    color: '#e2e8f0', fontWeight: 500,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Quote */}
          {quote && (
            <div style={{
              padding: '10px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 12, color: '#94a3b8', fontStyle: 'italic',
              lineHeight: 1.6, textAlign: 'center',
            }}>
              「{quote}」
            </div>
          )}
        </div>
      </ShareCardBase>
    );
  }
);

SBTIShareCard.displayName = 'SBTIShareCard';

export default SBTIShareCard;
