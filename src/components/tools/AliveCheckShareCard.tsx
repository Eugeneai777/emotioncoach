import React, { forwardRef } from 'react';
import ShareCardBase from '@/components/sharing/ShareCardBase';

interface AliveCheckShareCardProps {
  partnerCode?: string;
  onReady?: () => void;
}

const AliveCheckShareCard = forwardRef<HTMLDivElement, AliveCheckShareCardProps>(
  ({ partnerCode, onReady }, ref) => {
    const features = [
      { icon: '🛡️', title: '每日安全确认', desc: '一键打卡，确认平安' },
      { icon: '📧', title: '自动通知', desc: '超时未打卡，自动邮件提醒' },
      { icon: '⏰', title: '灵活阈值', desc: '1-7天可调，适应不同需求' },
      { icon: '🔒', title: '隐私保护', desc: '仅记录时间，不追踪位置' },
    ];

    const targetAudience = [
      { emoji: '🏠', text: '独居的年轻人/老人' },
      { emoji: '✈️', text: '远离家人的游子' },
      { emoji: '💼', text: '高强度工作的职场人' },
      { emoji: '🌙', text: '有夜间活动习惯的人' },
    ];

    return (
      <ShareCardBase
        ref={ref}
        sharePath="/energy-studio?tool=alive-check"
        partnerCode={partnerCode}
        width={420}
        padding={32}
        background="linear-gradient(135deg, #fdf2f8 0%, #fff1f2 50%, #fce7f3 100%)"
        onReady={onReady}
        footerConfig={{
          ctaTitle: "扫码体验",
          ctaSubtitle: "让关心你的人安心",
          primaryColor: "#881337",
          secondaryColor: "#9f1239",
          brandingColor: "#be185d",
          brandingOpacity: 0.7,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💗</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#881337',
            margin: '0 0 8px 0',
          }}>
            每日安全守护
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#9f1239',
            margin: 0,
          }}>
            一个让人安心的安全确认系统
          </p>
        </div>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{feature.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#881337', marginBottom: '2px' }}>
                {feature.title}
              </div>
              <div style={{ fontSize: '11px', color: '#9f1239' }}>{feature.desc}</div>
            </div>
          ))}
        </div>

        {/* Target Audience */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#881337',
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            适合人群
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }}>
            {targetAudience.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#9f1239',
                }}
              >
                <span>{item.emoji}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '0',
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#881337',
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            使用流程
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>📝</div>
              <div style={{ fontSize: '11px', color: '#9f1239' }}>设置联系人</div>
            </div>
            <div style={{ color: '#f472b6', fontSize: '16px' }}>→</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>✅</div>
              <div style={{ fontSize: '11px', color: '#9f1239' }}>每日打卡</div>
            </div>
            <div style={{ color: '#f472b6', fontSize: '16px' }}>→</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🔔</div>
              <div style={{ fontSize: '11px', color: '#9f1239' }}>自动通知</div>
            </div>
          </div>
        </div>
      </ShareCardBase>
    );
  }
);

AliveCheckShareCard.displayName = 'AliveCheckShareCard';

export default AliveCheckShareCard;