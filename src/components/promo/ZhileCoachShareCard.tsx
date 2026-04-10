import React, { forwardRef } from 'react';
import ShareCardBase from '@/components/sharing/ShareCardBase';

interface ZhileCoachShareCardProps {
  onReady?: () => void;
}

const ZhileCoachShareCard = forwardRef<HTMLDivElement, ZhileCoachShareCardProps>(
  ({ onReady }, ref) => {
    return (
      <div ref={ref} style={{ width: 380 }}>
        <ShareCardBase
          sharePath="/promo/zhile-coach?ref=share"
          width={380}
          background="linear-gradient(135deg, #ea580c 0%, #d97706 40%, #f59e0b 100%)"
          showFooter
          footerConfig={{
            ctaTitle: '扫码了解详情',
            ctaSubtitle: '¥389 身心诊断体验',
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
              🎯 30分钟1V1深度咨询
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: 26,
              fontWeight: 900,
              lineHeight: 1.3,
              marginBottom: 8,
              color: '#ffffff',
            }}>
              ¥389 身心诊断体验
            </h2>

            {/* Subtitle */}
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 20 }}>
              找到你失眠、暴躁、没劲的真正根源<br />
              专属教练 + 知乐胶囊 + 学员服务群
            </p>

            {/* 3 Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { emoji: '🧑‍⚕️', text: '1V1专属教练 · 深度情绪诊断' },
                { emoji: '💊', text: '知乐胶囊 · 天然植物配方' },
                { emoji: '👥', text: '专属服务群 · 持续跟踪指导' },
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

ZhileCoachShareCard.displayName = 'ZhileCoachShareCard';
export default ZhileCoachShareCard;
