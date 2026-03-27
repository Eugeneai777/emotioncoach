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
          background="linear-gradient(135deg, #f59e0b 0%, #ea580c 40%, #d97706 100%)"
          showFooter
          footerConfig={{
            ctaTitle: '扫码了解详情',
            ctaSubtitle: '7天有劲训练营',
            qrLabel: '长按识别二维码',
            primaryColor: '#ffffff',
            secondaryColor: '#fef3c7',
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
              🛡️ 专为高压人群设计的身心方案
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.3,
              marginBottom: 12,
              color: '#ffffff',
            }}>
              7天有劲训练营
            </h2>

            {/* Subtitle */}
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 20 }}>
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

SynergyShareCard.displayName = 'SynergyShareCard';
export default SynergyShareCard;
