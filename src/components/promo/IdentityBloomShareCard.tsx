import React, { forwardRef } from 'react';
import ShareCardBase from '@/components/sharing/ShareCardBase';

interface IdentityBloomShareCardProps {
  onReady?: () => void;
}

const IdentityBloomShareCard = forwardRef<HTMLDivElement, IdentityBloomShareCardProps>(
  ({ onReady }, ref) => {
    return (
      <div ref={ref} style={{ width: 380 }}>
        <ShareCardBase
          sharePath="/promo/identity-bloom"
          width={380}
          background="linear-gradient(135deg, #4338ca 0%, #6d28d9 40%, #7c3aed 100%)"
          showFooter
          footerConfig={{
            ctaTitle: '扫码了解详情',
            ctaSubtitle: '身份绽放训练营',
            qrLabel: '长按识别二维码',
            primaryColor: '#ffffff',
            secondaryColor: '#e0e7ff',
            showQR: true,
            showBranding: true,
          }}
          onReady={onReady}
        >
          <div style={{ padding: '28px 24px 20px', color: '#ffffff' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              fontSize: 11,
              marginBottom: 16,
            }}>
              🌟 找回真实自己·活出生命力量
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.3,
              marginBottom: 12,
              color: '#ffffff',
            }}>
              身份绽放训练营
            </h2>

            {/* Subtitle */}
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 20 }}>
              身份重建 · 关系重塑 · 能量觉醒<br />
              专业教练 + 知乐胶囊×4
            </p>

            {/* 3 Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { emoji: '🎯', text: '资深教练小组辅导 · 量身定制' },
                { emoji: '📚', text: '16节音频课 + 16次教练课' },
                { emoji: '💊', text: '知乐胶囊×4 · 天然植物配方' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <span style={{ fontSize: 20 }}>{item.emoji}</span>
                  <span style={{ fontSize: 13, color: '#ffffff' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </ShareCardBase>
      </div>
    );
  }
);

IdentityBloomShareCard.displayName = 'IdentityBloomShareCard';
export default IdentityBloomShareCard;
