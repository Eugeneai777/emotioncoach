import { forwardRef } from 'react';
import { type PosterScheme } from './SchemePreview';
import { type PosterLayout } from './PosterLayoutSelector';
import { useQRCode } from '@/utils/qrCodeUtils';
import { getPartnerShareUrl } from '@/utils/partnerQRUtils';

interface PosterWithCustomCopyProps {
  copy: PosterScheme & { target_audience: string; promotion_scene: string };
  partnerId: string;
  entryType: 'free' | 'paid';
  backgroundImageUrl?: string;
  posterId?: string;
  layout?: PosterLayout;
  width?: number;
  height?: number;
}



const templateGradients: Record<string, string> = {
  emotion_button: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)',
  emotion_coach: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  parent_coach: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
  communication_coach: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  story_coach: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  emotion_journal_21: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  parent_emotion_21: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  '365_member': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  member_365: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  partner_recruit: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
};

const templateEmojis: Record<string, string> = {
  emotion_button: '🆘',
  emotion_coach: '💚',
  parent_coach: '👨‍👩‍👧',
  communication_coach: '💬',
  story_coach: '🌟',
  emotion_journal_21: '📝',
  parent_emotion_21: '👨‍👩‍👧',
  '365_member': '👑',
  member_365: '👑',
  partner_recruit: '🤝',
};

const templateNames: Record<string, string> = {
  emotion_button: '情绪按钮',
  emotion_coach: '情绪教练',
  parent_coach: '亲子教练',
  communication_coach: '沟通教练',
  story_coach: '故事教练',
  emotion_journal_21: '21天情绪日记营',
  parent_emotion_21: '21天亲子营',
  '365_member': '365会员',
  member_365: '365会员',
  partner_recruit: '有劲合伙人',
};

export const PosterWithCustomCopy = forwardRef<HTMLDivElement, PosterWithCustomCopyProps>(
  ({ copy, partnerId, entryType, backgroundImageUrl, posterId, layout = 'default', width = 300, height = 560 }, ref) => {
    let shareUrl = getPartnerShareUrl(partnerId, entryType);
    if (posterId) {
      shareUrl += (shareUrl.includes('?') ? '&' : '?') + `poster=${posterId}`;
    }
    const { qrCodeUrl } = useQRCode(shareUrl);

    const gradient = copy.color_scheme 
      ? `linear-gradient(135deg, ${copy.color_scheme.primary} 0%, ${copy.color_scheme.secondary || copy.color_scheme.primary} 100%)`
      : templateGradients[copy.recommended_template] || templateGradients.emotion_coach;
    const emoji = templateEmojis[copy.recommended_template] || '✨';
    const productName = templateNames[copy.recommended_template] || '有劲AI';

    const hasTrustElements = copy.trust_elements && (
      copy.trust_elements.data_point || 
      copy.trust_elements.authority_badge || 
      copy.trust_elements.user_proof || 
      copy.trust_elements.certification
    );

    const activeTrustElements = copy.trust_elements 
      ? Object.entries(copy.trust_elements).filter(([_, value]) => value).slice(0, 2)
      : [];

    // Dynamic scale factor for font sizes based on dimensions
    const scaleFactor = Math.min(width / 300, height / 560);
    
    // Common styles
    const containerStyle: React.CSSProperties = {
      width: `${width}px`,
      height: `${height}px`,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };

    const backgroundStyle: React.CSSProperties = backgroundImageUrl 
      ? { position: 'absolute', inset: 0, backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { position: 'absolute', inset: 0, background: gradient };

    const overlayGradient = backgroundImageUrl 
      ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)'
      : 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)';

    // Brand footer component
    const BrandFooter = () => (
      <div style={{ textAlign: 'center', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          Powered by 有劲AI
        </span>
      </div>
    );

    // Product badge component
    const ProductBadge = () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ fontSize: '14px' }}>{emoji}</span>
        <span style={{
          background: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(10px)',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          color: 'white',
          fontWeight: 500,
        }}>
          {productName}
        </span>
      </div>
    );

    // QR Section component
    const QRSection = () => (
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        {qrCodeUrl && (
          <img src={qrCodeUrl} alt="QR Code" style={{ width: '55px', height: '55px', borderRadius: '8px' }} />
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 4px 0' }}>
            {copy.call_to_action}
          </p>
          <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>
            {entryType === 'free' ? '免费体验10次AI对话' : '¥9.9解锁50次对话'}
          </p>
        </div>
      </div>
    );

    // Default layout
    const renderDefaultLayout = () => (
      <div style={{ ...containerStyle }} ref={ref}>
        <div style={backgroundStyle} />
        <div style={{
          position: 'absolute', inset: 0, background: overlayGradient,
          display: 'flex', flexDirection: 'column', padding: '20px 18px',
        }}>
          <ProductBadge />
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '19px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', lineHeight: 1.3, margin: 0 }}>
              {copy.headline}
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginTop: '6px', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              {copy.subtitle}
            </p>
          </div>

          {hasTrustElements && activeTrustElements.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {activeTrustElements.map(([key, value]) => (
                <span key={key} style={{
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px',
                  padding: '4px 10px', fontSize: '10px', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  {key === 'data_point' && '📊'}{key === 'authority_badge' && '🏛️'}{key === 'user_proof' && '👥'}{key === 'certification' && '✅'}
                  {value}
                </span>
              ))}
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
            {copy.selling_points.map((point, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '10px',
                padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ fontSize: '14px' }}>✨</span>
                <span style={{ fontSize: '12px', color: 'white', fontWeight: 500 }}>{point}</span>
              </div>
            ))}
          </div>

          {copy.urgency_text && (
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <span style={{ background: 'rgba(239, 68, 68, 0.9)', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px' }}>
                🔥 {copy.urgency_text}
              </span>
            </div>
          )}

          <div style={{ flexShrink: 0 }}>
            <QRSection />
            <BrandFooter />
          </div>
        </div>
      </div>
    );

    // Moments layout (朋友圈版)
    const renderMomentsLayout = () => (
      <div style={{ ...containerStyle }} ref={ref}>
        <div style={backgroundStyle} />
        <div style={{
          position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
          display: 'flex', flexDirection: 'column', padding: '24px 20px',
        }}>
          <ProductBadge />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '16px' }}>{emoji}</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.4)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
              「{copy.headline}」
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', marginBottom: '20px', lineHeight: 1.6 }}>
              {copy.subtitle}
            </p>
            <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.5)', marginBottom: '20px' }} />
            <div style={{ textAlign: 'left', width: '100%' }}>
              {copy.selling_points.slice(0, 3).map((point, i) => (
                <p key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginBottom: '8px', paddingLeft: '12px', borderLeft: '2px solid rgba(255,255,255,0.4)' }}>
                  {point}
                </p>
              ))}
            </div>
          </div>

          {copy.urgency_text && (
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 500 }}>✨ {copy.urgency_text}</span>
            </div>
          )}

          <div style={{ flexShrink: 0 }}>
            <QRSection />
            <BrandFooter />
          </div>
        </div>
      </div>
    );

    // Xiaohongshu layout (小红书版)
    const renderXiaohongshuLayout = () => (
      <div style={{ ...containerStyle }} ref={ref}>
        <div style={backgroundStyle} />
        <div style={{
          position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)',
          display: 'flex', flexDirection: 'column', padding: '20px 16px',
        }}>
          <ProductBadge />
          
          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            <span style={{ background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#e11d48', fontWeight: 600 }}>
              #{productName}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#e11d48', fontWeight: 600 }}>
              #情绪管理
            </span>
            <span style={{ background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#e11d48', fontWeight: 600 }}>
              #AI教练
            </span>
          </div>

          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.4)', lineHeight: 1.3, margin: '0 0 8px 0' }}>
            {copy.headline}
          </h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', marginBottom: '12px' }}>
            {copy.subtitle}
          </p>

          {/* Data cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {copy.selling_points.slice(0, 4).map((point, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.95)', borderRadius: '8px', padding: '12px 10px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                overflow: 'hidden',
              }}>
                <span style={{ fontSize: '16px', marginBottom: '4px' }}>
                  {['📊', '💡', '🎯', '⭐'][i]}
                </span>
                <span style={{ fontSize: '10px', color: '#1a1a1a', fontWeight: 500, overflow: 'hidden', maxHeight: '28px', wordBreak: 'break-all' as const }}>{point}</span>
              </div>
            ))}
          </div>

          {hasTrustElements && activeTrustElements.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {activeTrustElements.map(([key, value]) => (
                <span key={key} style={{
                  background: '#fef3c7', padding: '3px 8px', borderRadius: '4px', fontSize: '9px', color: '#92400e', fontWeight: 500,
                }}>
                  {key === 'data_point' && '📊 '}{key === 'authority_badge' && '🏛️ '}{key === 'user_proof' && '👥 '}{key === 'certification' && '✅ '}
                  {value}
                </span>
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {copy.urgency_text && (
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '4px' }}>
                🔥 {copy.urgency_text}
              </span>
            </div>
          )}

          <div style={{ flexShrink: 0 }}>
            <QRSection />
            <BrandFooter />
          </div>
        </div>
      </div>
    );

    // WeChat Group layout (微信群版)
    const renderWechatGroupLayout = () => (
      <div style={{ ...containerStyle }} ref={ref}>
        <div style={backgroundStyle} />
        <div style={{
          position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
          display: 'flex', flexDirection: 'column', padding: '24px 20px',
        }}>
          <ProductBadge />

          {/* Avatar group */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white',
                  background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 60%) 0%, hsl(${i * 60 + 30}, 70%, 50%) 100%)`,
                  marginLeft: i > 0 ? '-8px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px',
                }}>
                  {['😊', '🙂', '😄', '🤗', '😌'][i]}
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            已有 1,000+ 小伙伴加入学习
          </p>

          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', textAlign: 'center', lineHeight: 1.3, margin: '0 0 8px 0' }}>
            {copy.headline}
          </h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: '16px' }}>
            {copy.subtitle}
          </p>

          {/* Chat bubble style points */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
            {copy.selling_points.slice(0, 3).map((point, i) => (
              <div key={i} style={{
                background: i % 2 === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(149, 236, 105, 0.95)',
                borderRadius: '12px', borderTopLeftRadius: i % 2 === 0 ? '4px' : '12px', borderTopRightRadius: i % 2 === 0 ? '12px' : '4px',
                padding: '10px 14px', marginLeft: i % 2 === 0 ? 0 : '20px', marginRight: i % 2 === 0 ? '20px' : 0,
              }}>
                <span style={{ fontSize: '12px', color: '#1a1a1a' }}>{point}</span>
              </div>
            ))}
          </div>

          {copy.urgency_text && (
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <span style={{ background: 'rgba(34, 197, 94, 0.9)', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px' }}>
                💬 {copy.urgency_text}
              </span>
            </div>
          )}

          <div style={{ flexShrink: 0 }}>
            <QRSection />
            <BrandFooter />
          </div>
        </div>
      </div>
    );

    // Minimal layout (极简版)
    const renderMinimalLayout = () => (
      <div style={{ ...containerStyle }} ref={ref}>
        <div style={{ position: 'absolute', inset: 0, background: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{
          position: 'absolute', inset: 0, background: backgroundImageUrl ? 'rgba(0,0,0,0.6)' : 'transparent',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 28px', textAlign: 'center',
        }}>
          <ProductBadge />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'white', lineHeight: 1.4, margin: '0 0 16px 0', letterSpacing: '1px' }}>
              {copy.headline}
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>
              {copy.subtitle}
            </p>
            <div style={{ width: '60px', height: '1px', background: 'rgba(255,255,255,0.3)', marginBottom: '32px' }} />
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', maxWidth: '200px' }}>
              {copy.selling_points[0]}
            </p>
          </div>

          {copy.urgency_text && (
            <p style={{ fontSize: '11px', color: '#fbbf24', marginBottom: '16px' }}>
              {copy.urgency_text}
            </p>
          )}

          <div style={{ flexShrink: 0 }}>
            <QRSection />
            <BrandFooter />
          </div>
        </div>
      </div>
    );

    // Card layout (卡片版)
    const renderCardLayout = () => (
      <div style={{ ...containerStyle }} ref={ref}>
        <div style={backgroundStyle} />
        <div style={{
          position: 'absolute', inset: 0, background: overlayGradient,
          display: 'flex', flexDirection: 'column', padding: '20px 16px',
        }}>
          <ProductBadge />

          {/* Main content card */}
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.98)', borderRadius: '16px', padding: '20px',
            display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px', textAlign: 'center' }}>{emoji}</div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', lineHeight: 1.3, margin: '0 0 8px 0' }}>
              {copy.headline}
            </h1>
            <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginBottom: '16px' }}>
              {copy.subtitle}
            </p>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {copy.selling_points.map((point, i) => (
                <div key={i} style={{
                  background: '#f8fafc', borderRadius: '8px', padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '3px solid',
                  borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'][i % 4],
                }}>
                  <span style={{ fontSize: '11px', color: '#374151' }}>{point}</span>
                </div>
              ))}
            </div>

            {hasTrustElements && activeTrustElements.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {activeTrustElements.map(([key, value]) => (
                  <span key={key} style={{
                    background: '#e0f2fe', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', color: '#0369a1', fontWeight: 500,
                  }}>
                    {key === 'data_point' && '📊 '}{key === 'authority_badge' && '🏛️ '}{key === 'user_proof' && '👥 '}{key === 'certification' && '✅ '}
                    {value}
                  </span>
                ))}
              </div>
            )}

            {copy.urgency_text && (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px' }}>
                  🔥 {copy.urgency_text}
                </span>
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <QRSection />
            </div>
          </div>

          <BrandFooter />
        </div>
      </div>
    );

    // Render based on layout
    switch (layout) {
      case 'moments':
        return renderMomentsLayout();
      case 'xiaohongshu':
        return renderXiaohongshuLayout();
      case 'wechat_group':
        return renderWechatGroupLayout();
      case 'minimal':
        return renderMinimalLayout();
      case 'card':
        return renderCardLayout();
      default:
        return renderDefaultLayout();
    }
  }
);

PosterWithCustomCopy.displayName = 'PosterWithCustomCopy';
