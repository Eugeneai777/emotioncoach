import { forwardRef } from 'react';
import { type IntroShareConfig, getShareUrl } from '@/config/introShareConfig';
import { useQRCode } from '@/utils/qrCodeUtils';

export type CardTemplate = 'concise' | 'value' | 'scenario';

interface IntroShareCardProps {
  config: IntroShareConfig;
  template: CardTemplate;
  partnerCode?: string;
  avatarUrl?: string;
  displayName?: string;
}

export const TEMPLATE_LABELS: Record<CardTemplate, string> = {
  concise: '简洁版',
  value: '价值版',
  scenario: '场景版',
};

export const IntroShareCard = forwardRef<HTMLDivElement, IntroShareCardProps>(
  ({ config, template, partnerCode, avatarUrl, displayName }, ref) => {
    const shareUrl = getShareUrl(config.targetUrl, partnerCode);
    const { qrCodeUrl } = useQRCode(shareUrl);

    const containerStyle: React.CSSProperties = {
      width: template === 'scenario' ? '320px' : template === 'value' ? '320px' : '320px',
      height: template === 'scenario' ? '540px' : template === 'value' ? '480px' : '420px',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };

    const BrandFooter = () => (
      <div style={{ textAlign: 'center', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <img 
          src="/logo-youjin-ai.png" 
          alt="有劲AI" 
          style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)' }} 
        />
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          有劲AI · 每个人的生活教练
        </span>
      </div>
    );

    const QRSection = ({ compact = false }: { compact?: boolean }) => (
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: compact ? '10px' : '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        {qrCodeUrl && (
          <img src={qrCodeUrl} alt="QR Code" style={{ width: compact ? '55px' : '65px', height: compact ? '55px' : '65px', borderRadius: '8px' }} />
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 4px 0' }}>
            扫码了解更多
          </p>
          <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>
            长按识别二维码
          </p>
        </div>
      </div>
    );

    // User Header Component (reusable across templates)
    const UserHeader = ({ style }: { style?: React.CSSProperties }) => (
      (avatarUrl || displayName) ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', ...style }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)' }} crossOrigin="anonymous" />
          ) : (
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'white' }}>
              {displayName?.[0] || '👤'}
            </div>
          )}
          <div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>{displayName || '朋友'} 推荐</p>
          </div>
        </div>
      ) : null
    );

    // Template A: 简洁版 (朋友圈)
    const renderConciseTemplate = () => (
      <div style={containerStyle} ref={ref}>
        <div style={{ position: 'absolute', inset: 0, background: config.gradient }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.3) 100%)',
          display: 'flex', flexDirection: 'column', padding: '28px 24px',
        }}>
          {/* User Header */}
          <UserHeader />

          {/* Emoji + Title */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{config.emoji}</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', margin: 0 }}>
              {config.title}
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginTop: '8px', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              {config.subtitle}
            </p>
          </div>

          {/* Highlights */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
            {config.highlights.map((point, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '16px' }}>✨</span>
                <span style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>{point}</span>
              </div>
            ))}
          </div>

          <QRSection />
          <BrandFooter />
        </div>
      </div>
    );

    // Template B: 价值版 (微信好友)
    const renderValueTemplate = () => (
      <div style={containerStyle} ref={ref}>
        <div style={{ position: 'absolute', inset: 0, background: config.gradient }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
          display: 'flex', flexDirection: 'column', padding: '24px 20px',
        }}>
          {/* User Avatar + Recommends */}
          <UserHeader />

          {/* Main Content */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>{config.emoji}</div>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', margin: '0 0 8px 0' }}>
              {config.title}
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
              {config.subtitle}
            </p>
          </div>

          {/* Value Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
            <span style={{ background: 'rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', color: 'white', fontWeight: 500 }}>
              🎯 专业引导
            </span>
            <span style={{ background: 'rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', color: 'white', fontWeight: 500 }}>
              ⏰ 24小时
            </span>
            <span style={{ background: 'rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', color: 'white', fontWeight: 500 }}>
              📊 智能分析
            </span>
          </div>

          {/* Highlights */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
            {config.highlights.map((point, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '14px' }}>{['💡', '🌟', '🚀'][i] || '✨'}</span>
                <span style={{ fontSize: '12px', color: 'white' }}>{point}</span>
              </div>
            ))}
          </div>

          <QRSection />
          <BrandFooter />
        </div>
      </div>
    );

    // Template C: 场景版 (详细说明)
    const renderScenarioTemplate = () => (
      <div style={containerStyle} ref={ref}>
        <div style={{ position: 'absolute', inset: 0, background: config.gradient }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
          display: 'flex', flexDirection: 'column', padding: '24px 20px',
        }}>
          {/* User Header */}
          <UserHeader style={{ marginBottom: '12px' }}/>

          {/* Category Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <span style={{
              background: 'rgba(255,255,255,0.25)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              color: 'white',
              fontWeight: 500,
            }}>
              {config.category === 'coach' ? '🎯 AI教练' : config.category === 'partner' ? '💪 合伙人' : config.category === 'camp' ? '🔥 训练营' : '✨ 工具'}
            </span>
          </div>

          {/* Main Content */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{config.emoji}</div>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', margin: '0 0 8px 0' }}>
              {config.title}
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', margin: 0, fontStyle: 'italic' }}>
              「{config.subtitle}」
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {config.highlights.map((point, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '20px', marginBottom: '6px' }}>
                  {['💡', '🌟', '🚀', '📊'][i] || '✨'}
                </span>
                <span style={{ fontSize: '11px', color: '#1a1a1a', fontWeight: 500, lineHeight: 1.3 }}>{point}</span>
              </div>
            ))}
            {/* 补充第4个格子 */}
            {config.highlights.length === 3 && (
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '20px', marginBottom: '6px' }}>🎁</span>
                <span style={{ fontSize: '11px', color: '#1a1a1a', fontWeight: 500 }}>免费体验</span>
              </div>
            )}
          </div>

          {/* CTA Text */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <span style={{ 
              background: 'rgba(255,255,255,0.2)', 
              color: 'white', 
              fontSize: '12px', 
              fontWeight: 500, 
              padding: '6px 16px', 
              borderRadius: '20px' 
            }}>
              ✨ 扫码开启你的成长之旅
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <QRSection compact />
          <BrandFooter />
        </div>
      </div>
    );

    switch (template) {
      case 'value':
        return renderValueTemplate();
      case 'scenario':
        return renderScenarioTemplate();
      case 'concise':
      default:
        return renderConciseTemplate();
    }
  }
);

IntroShareCard.displayName = 'IntroShareCard';

export default IntroShareCard;
