import React, { forwardRef } from 'react';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { useQRCode } from '@/utils/qrCodeUtils';
import { getPatternConfig } from '@/config/reactionPatternConfig';

interface PartnerInfo {
  partnerId: string;
  partnerCode: string;
}

interface AssessmentValueShareCardProps {
  className?: string;
  avatarUrl?: string;
  displayName?: string;
  partnerInfo?: PartnerInfo;
  healthScore?: number;
  reactionPattern?: string;
}

const AssessmentValueShareCard = forwardRef<HTMLDivElement, AssessmentValueShareCardProps>(
  ({ className, avatarUrl, displayName, partnerInfo, healthScore = 68, reactionPattern = 'chase' }, ref) => {
    const patternConfig = getPatternConfig(reactionPattern);
    const displayPattern = patternConfig?.name || reactionPattern;

    const getShareUrl = (): string => {
      const baseUrl = `${getPromotionDomain()}/wealth-block`;
      if (partnerInfo?.partnerCode) {
        return `${baseUrl}?ref=${partnerInfo.partnerCode}`;
      }
      return baseUrl;
    };

    const shareUrl = getShareUrl();
    const { qrCodeUrl } = useQRCode(shareUrl);

    const valuePoints = [
      { emoji: '🎯', text: '30个真实财富场景深度测评' },
      { emoji: '🤖', text: 'AI智能分析行为/情绪/信念三层' },
      { emoji: '💡', text: '专属突破路径与行动建议' },
    ];

    const getScoreColor = (score: number): string => {
      if (score >= 80) return '#10b981';
      if (score >= 60) return '#f59e0b';
      if (score >= 40) return '#f97316';
      return '#ef4444';
    };

    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: '320px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
        }}
      >
        {/* Header with user info */}
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(251,191,35,0.5)',
              flexShrink: 0,
            }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(to bottom right, #fbbf24, #f97316)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>
                    {displayName?.[0] || '财'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {displayName || '财富探索者'}
              </p>
              <p style={{ color: 'rgba(252,211,77,0.8)', fontSize: '12px', margin: 0 }}>
                刚完成了AI财富心理测评 ✨
              </p>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '20px', marginBottom: '4px', marginTop: 0 }}>
              财富卡点测评
            </h2>
            <p style={{ color: 'rgba(196,181,253,0.7)', fontSize: '12px', margin: 0 }}>
              Powered by 有劲AI
            </p>
          </div>

          {/* Mini Score Preview */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '4px', marginTop: 0 }}>我的觉醒指数</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '30px', fontWeight: 700, color: getScoreColor(healthScore) }}>
                    {healthScore}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>/100</span>
                </div>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '4px', marginTop: 0 }}>反应模式</p>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: 'rgba(245,158,11,0.3)',
                  borderRadius: '9999px',
                  color: 'rgba(252,211,77,1)',
                  fontSize: '14px',
                  fontWeight: 500,
                }}>
                  {displayPattern}
                </span>
              </div>
            </div>
          </div>

          {/* Value Points */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 500, marginBottom: '8px', marginTop: 0 }}>🎁 测评包含</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {valuePoints.map((point, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{point.emoji}</span>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{point.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section with QR */}
          <div style={{
            background: 'linear-gradient(to right, rgba(245,158,11,0.2), rgba(249,115,22,0.2))',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(245,158,11,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontWeight: 500, fontSize: '14px', marginBottom: '4px', marginTop: 0 }}>
                  扫码体验专属你的
                </p>
                <p style={{ color: 'rgba(252,211,77,1)', fontWeight: 700, fontSize: '16px', margin: 0 }}>
                  AI财富心理诊断
                </p>
                <p style={{ color: 'rgba(252,211,77,0.7)', fontSize: '12px', marginTop: '8px', marginBottom: 0 }}>
                  🎁 测评你的财富卡点
                </p>
              </div>
              {qrCodeUrl && (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#fff',
                  padding: '6px',
                  flexShrink: 0,
                }}>
                  <img src={qrCodeUrl} alt="二维码" style={{ width: '100%', height: '100%' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 20px' }}>
          <p style={{ textAlign: 'center', color: 'rgba(196,181,253,0.5)', fontSize: '12px', margin: 0 }}>
            有劲AI · 让财富自由从认识自己开始
          </p>
        </div>
      </div>
    );
  }
);

AssessmentValueShareCard.displayName = 'AssessmentValueShareCard';

export default AssessmentValueShareCard;
