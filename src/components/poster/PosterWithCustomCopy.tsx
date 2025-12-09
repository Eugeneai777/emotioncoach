import { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { GeneratedCopy } from './CopyPreview';

interface PosterWithCustomCopyProps {
  copy: GeneratedCopy & { selectedHeadline: number; selectedSubtitle: number };
  partnerId: string;
  entryType: 'free' | 'paid';
  backgroundImageUrl?: string;
}

const PRODUCTION_DOMAIN = 'https://eugeneai.me';

const templateGradients: Record<string, string> = {
  emotion_button: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)',
  emotion_coach: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  parent_coach: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
  communication_coach: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  training_camp: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  member_365: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  partner_recruit: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
};

const templateEmojis: Record<string, string> = {
  emotion_button: '🆘',
  emotion_coach: '💚',
  parent_coach: '👨‍👩‍👧',
  communication_coach: '💬',
  training_camp: '🎯',
  member_365: '👑',
  partner_recruit: '🤝',
};

export const PosterWithCustomCopy = forwardRef<HTMLDivElement, PosterWithCustomCopyProps>(
  ({ copy, partnerId, entryType, backgroundImageUrl }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    useEffect(() => {
      const generateQR = async () => {
        const referralUrl = `${PRODUCTION_DOMAIN}/claim/${partnerId}?type=${entryType}`;
        const url = await QRCode.toDataURL(referralUrl, {
          width: 100,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        setQrCodeUrl(url);
      };
      generateQR();
    }, [partnerId, entryType]);

    const gradient = templateGradients[copy.recommended_template] || templateGradients.emotion_coach;
    const emoji = templateEmojis[copy.recommended_template] || '✨';
    const headline = copy.headline_options[copy.selectedHeadline];
    const subtitle = copy.subtitle_options[copy.selectedSubtitle];

    return (
      <div
        ref={ref}
        style={{
          width: '300px',
          height: '533px',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Background */}
        {backgroundImageUrl ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: gradient,
            }}
          />
        )}

        {/* Content Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: backgroundImageUrl 
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)'
              : 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 20px',
          }}
        >
          {/* Top Section - Emoji & Headline */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{emoji}</div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              {headline}
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.9)',
                marginTop: '8px',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Middle Section - Selling Points */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {copy.selling_points.map((point, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '16px' }}>✨</span>
                <span
                  style={{
                    fontSize: '13px',
                    color: 'white',
                    fontWeight: 500,
                  }}
                >
                  {point}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom Section - QR Code & CTA */}
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '8px',
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  margin: '0 0 4px 0',
                }}
              >
                {copy.call_to_action}
              </p>
              <p
                style={{
                  fontSize: '11px',
                  color: '#666',
                  margin: 0,
                }}
              >
                {entryType === 'free' ? '免费体验10次AI对话' : '¥9.9解锁50次对话'}
              </p>
            </div>
          </div>

          {/* Brand Footer */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '10px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              有劲生活 · 情绪梳理教练
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PosterWithCustomCopy.displayName = 'PosterWithCustomCopy';
