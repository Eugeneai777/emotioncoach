import React, { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getPromotionDomain } from '@/utils/partnerQRUtils';

interface PartnerInfo {
  partnerId: string;
  partnerCode: string;
}

interface FearAwakeningShareCardProps {
  className?: string;
  avatarUrl?: string;
  displayName?: string;
  partnerInfo?: PartnerInfo;
  dominantLock?: 'anxiety' | 'scarcity' | 'stigma';
  healthScore?: number;
}

const lockConfig = {
  anxiety: { label: '焦虑锁', emoji: '😰', color: '#ef4444' },
  scarcity: { label: '匮乏锁', emoji: '💸', color: '#f97316' },
  stigma: { label: '污名锁', emoji: '😶', color: '#eab308' },
};

const FearAwakeningShareCard = forwardRef<HTMLDivElement, FearAwakeningShareCardProps>(
  ({ className, avatarUrl, displayName = '财富觉醒者', partnerInfo, dominantLock = 'anxiety', healthScore = 65 }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    
    const getShareUrl = (): string => {
      const baseUrl = `${getPromotionDomain()}/wealth-block`;
      if (partnerInfo?.partnerCode) {
        return `${baseUrl}?ref=${partnerInfo.partnerCode}`;
      }
      return baseUrl;
    };
    
    const shareUrl = getShareUrl();
    const dominant = lockConfig[dominantLock];

    useEffect(() => {
      const generateQR = async () => {
        try {
          const qr = await QRCode.toDataURL(shareUrl, {
            width: 100,
            margin: 2,
            color: { dark: '#ef4444', light: '#ffffff' }
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
          width: '340px',
          padding: '28px 24px',
          background: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
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
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />

        {/* User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
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
              的情绪锁诊断
            </p>
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔓</div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            letterSpacing: '0.5px',
          }}>
            财富情绪锁诊断
          </h2>
          <p style={{
            fontSize: '15px',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}>
            「你有多少财富被情绪锁住了？」
          </p>
        </div>

        {/* Three Locks */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}>
          {Object.entries(lockConfig).map(([key, config]) => (
            <div
              key={key}
              style={{
                background: key === dominantLock ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px 14px',
                textAlign: 'center',
                border: key === dominantLock ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                transform: key === dominantLock ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{config.emoji}</div>
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: key === dominantLock ? config.color : '#fff',
              }}>
                {config.label}
              </div>
              {key === dominantLock && (
                <div style={{
                  fontSize: '10px',
                  marginTop: '2px',
                  color: '#ef4444',
                  fontWeight: '500',
                }}>
                  主导
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Score Display */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '6px' }}>
            当前觉醒指数
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}>
            {healthScore}
            <span style={{ fontSize: '14px', fontWeight: '500', marginLeft: '2px' }}>分</span>
          </div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
            看见锁，才能解锁 🔑
          </div>
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
          marginBottom: '16px',
        }}>
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="扫码测评"
              style={{ width: '70px', height: '70px', borderRadius: '8px' }}
            />
          )}
          <div style={{ color: '#ef4444' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' }}>
              扫码诊断你的情绪锁
            </p>
            <p style={{ fontSize: '11px', opacity: 0.7, margin: 0 }}>
              ¥9.9 限时体验
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
          <span>有劲AI · 财富教练</span>
        </div>
      </div>
    );
  }
);

FearAwakeningShareCard.displayName = 'FearAwakeningShareCard';

export default FearAwakeningShareCard;
