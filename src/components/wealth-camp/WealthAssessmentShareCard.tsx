import React, { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getPromotionDomain } from '@/utils/partnerQRUtils';

interface WealthAssessmentShareCardProps {
  className?: string;
}

const WealthAssessmentShareCard = forwardRef<HTMLDivElement, WealthAssessmentShareCardProps>(
  ({ className }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const shareUrl = `${getPromotionDomain()}/wealth-block`;

    useEffect(() => {
      const generateQR = async () => {
        try {
          const qr = await QRCode.toDataURL(shareUrl, {
            width: 120,
            margin: 2,
            color: { dark: '#0d9488', light: '#ffffff' }
          });
          setQrCodeUrl(qr);
        } catch (error) {
          console.error('Failed to generate QR code:', error);
        }
      };
      generateQR();
    }, [shareUrl]);

    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: '360px',
          padding: '32px 24px',
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
          borderRadius: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorations */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            letterSpacing: '1px',
          }}>
            财富卡点自测
          </h2>
          <p style={{
            fontSize: '14px',
            opacity: 0.9,
            margin: 0,
          }}>
            发现你的3层财富障碍
          </p>
        </div>

        {/* Features */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '📋', text: '30道专业问题，精准诊断' },
              { icon: '🔍', text: '行为/情绪/信念三维分析' },
              { icon: '🤖', text: 'AI智能追问，深度洞察' },
            ].map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="扫码测评"
              style={{ width: '80px', height: '80px', borderRadius: '8px' }}
            />
          )}
          <div style={{ color: '#0d9488' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
              扫码开始测评
            </p>
            <p style={{ fontSize: '12px', opacity: 0.7, margin: 0 }}>
              3分钟了解你的财富卡点
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          opacity: 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}>
          <span>💎</span>
          <span>有劲AI · 让财富自然流动</span>
        </div>
      </div>
    );
  }
);

WealthAssessmentShareCard.displayName = 'WealthAssessmentShareCard';

export default WealthAssessmentShareCard;
