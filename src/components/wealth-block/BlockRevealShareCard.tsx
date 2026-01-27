import React, { forwardRef } from 'react';
import ShareCardBase from '@/components/sharing/ShareCardBase';

interface PartnerInfo {
  partnerId: string;
  partnerCode: string;
}

interface BlockRevealShareCardProps {
  className?: string;
  avatarUrl?: string;
  displayName?: string;
  partnerInfo?: PartnerInfo;
  dominantPoor?: string;
  reactionPattern?: string;
  insightQuote?: string;
  onReady?: () => void;
}

const poorTypeConfig: Record<string, { emoji: string; label: string }> = {
  '嘴穷': { emoji: '🗣️', label: '嘴穷' },
  '手穷': { emoji: '✋', label: '手穷' },
  '眼穷': { emoji: '👁️', label: '眼穷' },
  '心穷': { emoji: '💔', label: '心穷' },
};

const BlockRevealShareCard = forwardRef<HTMLDivElement, BlockRevealShareCardProps>(
  ({ 
    className, 
    avatarUrl, 
    displayName = '财富觉醒者', 
    partnerInfo, 
    dominantPoor = '心穷',
    reactionPattern = '逃避型',
    insightQuote,
    onReady,
  }, ref) => {
    const poorConfig = poorTypeConfig[dominantPoor] || poorTypeConfig['心穷'];

    return (
      <ShareCardBase
        ref={ref}
        className={className}
        sharePath="/wealth-block"
        partnerCode={partnerInfo?.partnerCode}
        width={340}
        padding={28}
        background="linear-gradient(135deg, #1e1b4b 0%, #4c1d95 60%, #7c3aed 100%)"
        onReady={onReady}
        footerConfig={{
          ctaTitle: "扫码测测你的财富盲区",
          ctaSubtitle: "🎁 免费精准诊断",
          primaryColor: "#4c1d95",
          secondaryColor: "rgba(76, 29, 149, 0.7)",
          brandingColor: "rgba(255,255,255,0.8)",
          brandingOpacity: 1,
        }}
      >
        {/* Background stars decoration */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '30px',
          fontSize: '20px',
          opacity: 0.3,
        }}>✨</div>
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '60px',
          fontSize: '14px',
          opacity: 0.2,
        }}>⭐</div>
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '20px',
          fontSize: '16px',
          opacity: 0.25,
        }}>✨</div>

        {/* User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
          position: 'relative',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.5)',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                crossOrigin="anonymous"
              />
            ) : (
              <span style={{ fontSize: '18px' }}>👤</span>
            )}
          </div>
          <div style={{ color: '#fff' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>
              {displayName}
            </p>
            <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>
              的财富盲区报告
            </p>
          </div>
        </div>

        {/* Header with 3 monkeys */}
        <div style={{ textAlign: 'center', marginBottom: '18px', position: 'relative' }}>
          <div style={{ 
            fontSize: '28px', 
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
          }}>
            <span>🙈</span>
            <span>🙉</span>
            <span>🙊</span>
          </div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            letterSpacing: '0.5px',
            color: '#fff',
          }}>
            财富盲区测评
          </h2>
          <p style={{
            fontSize: '14px',
            fontWeight: '500',
            margin: 0,
            opacity: 0.95,
            lineHeight: 1.5,
            color: '#fff',
          }}>
            「90%的人看不见自己的卡点<br/>你是那10%吗？」
          </p>
        </div>

        {/* Revealed Blocks */}
        <div style={{
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{ 
            fontSize: '11px', 
            opacity: 0.8, 
            marginBottom: '12px',
            textAlign: 'center',
            color: '#fff',
          }}>
            👁️ 已揭示的盲区
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
          }}>
            {/* Dominant Poor Type */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '6px',
                margin: '0 auto 6px',
              }}>
                <span style={{ fontSize: '28px' }}>{poorConfig.emoji}</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{poorConfig.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.7, color: '#fff' }}>主导卡点</div>
            </div>
            
            {/* Reaction Pattern */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '6px',
                margin: '0 auto 6px',
              }}>
                <span style={{ fontSize: '28px' }}>🔄</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{reactionPattern}</div>
              <div style={{ fontSize: '10px', opacity: 0.7, color: '#fff' }}>反应模式</div>
            </div>
          </div>
        </div>

        {/* Insight Quote (if provided) */}
        {insightQuote && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '0',
            fontStyle: 'italic',
            fontSize: '12px',
            lineHeight: 1.5,
            textAlign: 'center',
            borderLeft: '3px solid rgba(255,255,255,0.4)',
            color: '#fff',
          }}>
            "{insightQuote}"
          </div>
        )}
      </ShareCardBase>
    );
  }
);

BlockRevealShareCard.displayName = 'BlockRevealShareCard';

export default BlockRevealShareCard;