import React, { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getPromotionDomain } from '@/utils/partnerQRUtils';

interface WealthCampShareCardProps {
  className?: string;
  avatarUrl?: string;
  displayName?: string;
  currentDay?: number;
  totalDays?: number;
}

const WealthCampShareCard = forwardRef<HTMLDivElement, WealthCampShareCardProps>(
  ({ className, avatarUrl, displayName = '财富觉醒者', currentDay, totalDays = 21 }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const shareUrl = `${getPromotionDomain()}/wealth-camp-intro`;

    useEffect(() => {
      const generateQR = async () => {
        try {
          const qr = await QRCode.toDataURL(shareUrl, {
            width: 120,
            margin: 2,
            color: { dark: '#d97706', light: '#ffffff' }
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
          background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
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

        {/* User Info with Progress */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          position: 'relative',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '44px',
              height: '44px',
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
                <span style={{ fontSize: '20px' }}>👤</span>
              )}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
                {displayName}
              </p>
              <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>
                邀请你一起加入
              </p>
            </div>
          </div>
          {currentDay && (
            <div style={{
              textAlign: 'center',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              padding: '6px 12px',
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>
                第{currentDay}天
              </div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                /{totalDays}天
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px', position: 'relative' }}>
          <div style={{ fontSize: '36px', marginBottom: '6px' }}>🏕️</div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 4px 0',
            letterSpacing: '1px',
          }}>
            21天财富突破训练营
          </h2>
          <p style={{
            fontSize: '12px',
            opacity: 0.9,
            margin: 0,
          }}>
            系统突破财富卡点
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
              { icon: '🧘', text: '每日5分钟冥想 + AI教练梳理' },
              { icon: '📈', text: '3阶段进阶：共振→觉醒→升维' },
              { icon: '📔', text: '财富日记追踪成长轨迹' },
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
              alt="扫码加入"
              style={{ width: '80px', height: '80px', borderRadius: '8px' }}
            />
          )}
          <div style={{ color: '#d97706' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
              扫码加入训练营
            </p>
            <p style={{ fontSize: '12px', opacity: 0.7, margin: 0 }}>
              21天突破财富障碍
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

WealthCampShareCard.displayName = 'WealthCampShareCard';

export default WealthCampShareCard;
