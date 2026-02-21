import React, { forwardRef } from 'react';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { useQRCode } from '@/utils/qrCodeUtils';

interface PartnerInfo {
  partnerId: string;
  partnerCode: string;
}

interface WealthBlockPromoShareCardProps {
  className?: string;
  avatarUrl?: string;
  displayName?: string;
  partnerInfo?: PartnerInfo;
}

const WealthBlockPromoShareCard = forwardRef<HTMLDivElement, WealthBlockPromoShareCardProps>(
  ({ className, avatarUrl, displayName = '财富觉醒者', partnerInfo }, ref) => {
    const baseUrl = `${getPromotionDomain()}/wealth-block`;
    const shareUrl = partnerInfo?.partnerCode
      ? `${baseUrl}?ref=${partnerInfo.partnerCode}`
      : baseUrl;

    const { qrCodeUrl } = useQRCode(shareUrl);

    const sellingPoints = [
      { icon: '🔍', text: '30个真实财富场景深度扫描' },
      { icon: '🧠', text: 'AI智能解码行为/情绪/信念三层卡点' },
      { icon: '💡', text: '90%的人测完才发现：不是赚得少，是留不住' },
    ];

    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: '360px',
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #d97706 0%, #9333ea 100%)',
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
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>💰</div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '2px' }}>
            财富卡点测评
          </h2>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, fontWeight: '500' }}>
            3分钟找到你的财富天花板
          </p>
        </div>

        {/* Selling points */}
        <div style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: '16px',
          padding: '16px', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sellingPoints.map((item, index) => (
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
          <div style={{ color: '#7c3aed' }}>
            <p style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0' }}>扫码免费测评</p>
            <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>找到你的财富突破口</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', fontSize: '12px', opacity: 0.8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <span>💎</span>
          <span>有劲AI · 让财富自然流动</span>
        </div>
      </div>
    );
  }
);

WealthBlockPromoShareCard.displayName = 'WealthBlockPromoShareCard';

export default WealthBlockPromoShareCard;
