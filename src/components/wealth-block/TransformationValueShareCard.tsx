import React, { forwardRef } from 'react';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { useQRCode } from '@/utils/qrCodeUtils';

interface PartnerInfo {
  partnerId: string;
  partnerCode: string;
}

interface TransformationValueShareCardProps {
  className?: string;
  avatarUrl?: string;
  displayName?: string;
  partnerInfo?: PartnerInfo;
  healthScore?: number;
  targetScore?: number;
}

const valuePoints = [
  { icon: '🔍', text: '看见隐藏的财富卡点' },
  { icon: '🧠', text: '觉察自动化反应模式' },
  { icon: '📊', text: '建立个人成长档案' },
];

const TransformationValueShareCard = forwardRef<HTMLDivElement, TransformationValueShareCardProps>(
  ({ 
    className, 
    avatarUrl, 
    displayName = '财富觉醒者', 
    partnerInfo, 
    healthScore = 58,
    targetScore = 81
  }, ref) => {
    const getShareUrl = (): string => {
      const baseUrl = `${getPromotionDomain()}/wealth-block`;
      if (partnerInfo?.partnerCode) {
        return `${baseUrl}?ref=${partnerInfo.partnerCode}`;
      }
      return baseUrl;
    };
    
    const shareUrl = getShareUrl();
    const growthDelta = targetScore - healthScore;
    const { qrCodeUrl } = useQRCode(shareUrl);

    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: '340px',
          padding: '28px 24px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #84cc16 50%, #22c55e 100%)',
          borderRadius: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />

        {/* User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '18px',
          position: 'relative',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.6)',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.2)',
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
          <div>
            <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>
              {displayName}
            </p>
            <p style={{ fontSize: '11px', opacity: 0.85, margin: 0 }}>
              的觉醒之旅
            </p>
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px', position: 'relative' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 6px 0',
            letterSpacing: '0.5px',
          }}>
            财富觉醒之旅
          </h2>
          <p style={{
            fontSize: '15px',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }}>
            「从看见到改变，只需7天」
          </p>
        </div>

        {/* Score Transformation */}
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}>
            {/* Day 0 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px' }}>Day 0</div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                opacity: 0.7,
              }}>
                {healthScore}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>起点</div>
            </div>
            
            {/* Arrow with growth */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span>→</span>
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#fff',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '10px',
                padding: '2px 8px',
                marginTop: '4px',
              }}>
                +{growthDelta}
              </div>
            </div>
            
            {/* Day 7 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px' }}>Day 7</div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}>
                {targetScore}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.9 }}>目标</div>
            </div>
          </div>
        </div>

        {/* Value Points */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {valuePoints.map((point, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>{point.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: '500' }}>{point.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div style={{
          textAlign: 'center',
          marginBottom: '16px',
          fontSize: '11px',
          opacity: 0.9,
        }}>
          🌟 1000+人完成，平均觉醒指数 +23
        </div>

        {/* QR Code Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '14px',
        }}>
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="扫码测评"
              style={{ width: '70px', height: '70px', borderRadius: '8px' }}
            />
          )}
          <div style={{ color: '#16a34a' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' }}>
              扫码免费定位起点
            </p>
            <p style={{ fontSize: '11px', opacity: 0.7, margin: 0 }}>
              🎁 开启你的觉醒之旅
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          opacity: 0.85,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}>
          <span>💎</span>
          <span>Powered by 有劲AI</span>
        </div>
      </div>
    );
  }
);

TransformationValueShareCard.displayName = 'TransformationValueShareCard';

export default TransformationValueShareCard;
