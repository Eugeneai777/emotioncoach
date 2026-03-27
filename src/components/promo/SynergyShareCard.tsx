import React, { forwardRef } from 'react';
import ShareCardBase from '@/components/sharing/ShareCardBase';

interface SynergyShareCardProps {
  onReady?: () => void;
}

const SynergyShareCard = forwardRef<HTMLDivElement, SynergyShareCardProps>(
  ({ onReady }, ref) => {
    return (
      <div ref={ref} style={{ width: 380 }}>
        <ShareCardBase
          sharePath="/promo/synergy"
          width={380}
          background="linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #172554 100%)"
          showFooter
          footerConfig={{
            ctaTitle: '扫码了解详情',
            ctaSubtitle: '7天有劲训练营',
            qrLabel: '长按识别二维码',
            primaryColor: '#e2e8f0',
            secondaryColor: '#94a3b8',
            showQR: true,
            showBranding: true,
          }}
          onReady={onReady}
        >
          <div style={{ padding: '28px 24px 20px', color: '#e2e8f0' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
              fontSize: 11,
              marginBottom: 16,
            }}>
              🛡️ 专为35-55岁中年男性设计
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.3,
              marginBottom: 12,
              background: 'linear-gradient(to right, #a78bfa, #60a5fa, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              7天有劲训练营
            </h2>

            {/* Subtitle */}
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>
              情绪解压 · 关系修复 · 身心调理<br />
              AI教练 + 专业教练 + 知乐胶囊
            </p>

            {/* 3 Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { emoji: '🧠', text: 'AI情绪教练 · 24小时陪伴' },
                { emoji: '🧘', text: '7天冥想引导 · 真人录制' },
                { emoji: '💊', text: '知乐胶囊 · 天然植物配方' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <span style={{ fontSize: 20 }}>{item.emoji}</span>
                  <span style={{ fontSize: 13, color: '#cbd5e1' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </ShareCardBase>
      </div>
    );
  }
);

SynergyShareCard.displayName = 'SynergyShareCard';
export default SynergyShareCard;
