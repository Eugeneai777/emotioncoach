import React, { forwardRef } from 'react';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { useQRCode } from '@/utils/qrCodeUtils';

export interface AssessmentPromoConfig {
  emoji: string;
  title: string;
  subtitle: string;
  highlights: { icon: string; text: string }[];
  gradient: string;
  accentColor: string;
  sharePath: string;
  tagline: string;
}

// 各测评的推广配置
export const ASSESSMENT_PROMO_CONFIGS: Record<string, AssessmentPromoConfig> = {
  midlife_awakening: {
    emoji: '🧭',
    title: '中场觉醒力测评',
    subtitle: '3分钟发现你的觉醒方向',
    highlights: [
      { icon: '📊', text: '6维深度扫描内耗、行动力与人生方向' },
      { icon: '🧠', text: 'AI个性化解读 + 1对1觉醒对话' },
      { icon: '💡', text: '精准定位觉醒阶段，找到突破方向' },
    ],
    gradient: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
    accentColor: '#a855f7',
    sharePath: '/midlife-awakening',
    tagline: '有劲AI · 发现你的觉醒力',
  },
  emotion_health: {
    emoji: '💚',
    title: '情绪健康测评',
    subtitle: '科学量表深度了解你的情绪状态',
    highlights: [
      { icon: '📋', text: 'PHQ-9 + GAD-7 双专业量表精准评估' },
      { icon: '🧠', text: 'AI情绪解读 + 个性化调节方案' },
      { icon: '💡', text: '找到情绪出口，走出内耗循环' },
    ],
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    accentColor: '#7c3aed',
    sharePath: '/emotion-health',
    tagline: '有劲AI · 找到你的情绪出口',
  },
  women_competitiveness: {
    emoji: '👑',
    title: '35+女性竞争力测评',
    subtitle: '发现你的独特竞争优势',
    highlights: [
      { icon: '💎', text: '5大竞争力维度全面扫描' },
      { icon: '🧠', text: 'AI深度洞察 + 个性化成长建议' },
      { icon: '🌟', text: '看清你的核心优势与发展方向' },
    ],
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
    accentColor: '#f59e0b',
    sharePath: '/assessment/women-competitiveness',
    tagline: '有劲AI · 发现你的独特优势',
  },
};

interface AssessmentPromoShareCardProps {
  config: AssessmentPromoConfig;
  avatarUrl?: string;
  displayName?: string;
  className?: string;
}

const AssessmentPromoShareCard = forwardRef<HTMLDivElement, AssessmentPromoShareCardProps>(
  ({ config, avatarUrl, displayName = '觉醒者', className }, ref) => {
    const shareUrl = `${getPromotionDomain()}${config.sharePath}`;
    const { qrCodeUrl } = useQRCode(shareUrl);

    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: '360px',
          padding: '32px 24px',
          background: config.gradient,
          borderRadius: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorations */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '-40px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />

        {/* User info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '20px', position: 'relative',
          background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px 12px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.6)', overflow: 'hidden',
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
            ) : (
              <span style={{ fontSize: '18px' }}>👤</span>
            )}
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{displayName}</p>
            <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>推荐你做这个测评</p>
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>{config.emoji}</div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '2px' }}>
            {config.title}
          </h2>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, fontWeight: '500' }}>
            {config.subtitle}
          </p>
        </div>

        {/* Highlights */}
        <div style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: '16px',
          padding: '16px', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {config.highlights.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.5' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
          background: 'rgba(255,255,255,0.95)', borderRadius: '16px',
          padding: '16px', marginBottom: '20px',
        }}>
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="扫码测评" style={{ width: '80px', height: '80px', borderRadius: '8px' }} />
          )}
          <div style={{ color: config.accentColor }}>
            <p style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0' }}>扫码免费测评</p>
            <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>🎁 3分钟出结果</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', fontSize: '12px', opacity: 0.8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <span>💎</span>
          <span>{config.tagline}</span>
        </div>
      </div>
    );
  }
);

AssessmentPromoShareCard.displayName = 'AssessmentPromoShareCard';

export default AssessmentPromoShareCard;
