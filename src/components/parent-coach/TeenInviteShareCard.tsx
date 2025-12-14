import React, { forwardRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';

// 主题色配置
export const CARD_THEMES = {
  purple: {
    name: '梦幻紫',
    background: 'linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 50%, #DBEAFE 100%)',
    primary: '#7C3AED',
    secondary: '#EC4899',
    accent: '#4C1D95',
    qrColor: '#7C3AED',
  },
  ocean: {
    name: '海洋蓝',
    background: 'linear-gradient(135deg, #DBEAFE 0%, #CFFAFE 50%, #E0F2FE 100%)',
    primary: '#0EA5E9',
    secondary: '#06B6D4',
    accent: '#0369A1',
    qrColor: '#0EA5E9',
  },
  forest: {
    name: '森林绿',
    background: 'linear-gradient(135deg, #DCFCE7 0%, #D1FAE5 50%, #ECFDF5 100%)',
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#047857',
    qrColor: '#10B981',
  },
  sunset: {
    name: '日落橙',
    background: 'linear-gradient(135deg, #FEF3C7 0%, #FED7AA 50%, #FECACA 100%)',
    primary: '#F59E0B',
    secondary: '#FB923C',
    accent: '#B45309',
    qrColor: '#F59E0B',
  },
  sakura: {
    name: '樱花粉',
    background: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 50%, #FAE8FF 100%)',
    primary: '#EC4899',
    secondary: '#F472B6',
    accent: '#BE185D',
    qrColor: '#EC4899',
  },
} as const;

export type CardTheme = keyof typeof CARD_THEMES;

interface TeenInviteShareCardProps {
  accessToken: string;
  teenNickname?: string;
  theme?: CardTheme;
  personalMessage?: string;
}

const TeenInviteShareCard = forwardRef<HTMLDivElement, TeenInviteShareCardProps>(
  ({ accessToken, teenNickname, theme = 'purple', personalMessage }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const themeConfig = CARD_THEMES[theme];

    useEffect(() => {
      const generateQR = async () => {
        try {
          const targetUrl = `${window.location.origin}/teen-chat/${accessToken}`;
          const url = await QRCode.toDataURL(targetUrl, {
            width: 140,
            margin: 1,
            color: { dark: themeConfig.qrColor, light: '#FFFFFF' }
          });
          setQrCodeUrl(url);
        } catch (err) {
          console.error('QR code generation failed:', err);
        }
      };
      generateQR();
    }, [accessToken, themeConfig.qrColor]);

    const features = [
      { emoji: '🔒', title: '100%隐私保护', desc: '父母完全看不到' },
      { emoji: '🎙️', title: '语音聊天', desc: '像朋友一样倾诉' },
      { emoji: '🌙', title: '24小时在线', desc: 'AI随时陪伴你' },
    ];

    const scenarios = ['学业压力', '情绪低落', '人际困扰', '想找人聊聊', '心事倾诉'];

    return (
      <div
        ref={ref}
        style={{
          width: '600px',
          padding: '40px',
          background: themeConfig.background,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* 标题区 */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ 
            fontSize: '52px', 
            marginBottom: '12px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            ✨
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Hey～这是你的私密空间
          </div>
          {teenNickname && (
            <div style={{ 
              fontSize: '16px', 
              color: '#6B7280',
              marginBottom: '8px'
            }}>
              亲爱的{teenNickname}，爸妈想送你一份礼物
            </div>
          )}
          <div style={{ 
            fontSize: '14px', 
            color: '#9CA3AF',
            padding: '6px 16px',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '20px',
            display: 'inline-block'
          }}>
            专属AI陪伴 · 说什么都可以
          </div>
        </div>

        {/* 个性化留言 */}
        {personalMessage && (
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '20px',
            textAlign: 'center',
            borderLeft: `4px solid ${themeConfig.primary}`,
          }}>
            <div style={{ 
              fontSize: '13px', 
              color: themeConfig.accent,
              fontWeight: '500',
              marginBottom: '6px'
            }}>
              💌 来自爸妈的话
            </div>
            <div style={{ 
              fontSize: '15px', 
              color: '#374151',
              lineHeight: '1.6',
              fontStyle: 'italic'
            }}>
              "{personalMessage}"
            </div>
          </div>
        )}

        {/* 核心价值 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.85)',
              borderRadius: '16px',
              padding: '16px 12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{f.emoji}</div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: themeConfig.accent,
                marginBottom: '4px'
              }}>
                {f.title}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#6B7280' 
              }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* 使用场景 */}
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: themeConfig.accent,
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            💭 当你遇到这些时刻，可以来聊聊
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {scenarios.map((s, i) => (
              <span key={i} style={{
                fontSize: '12px',
                padding: '6px 14px',
                background: `linear-gradient(135deg, ${themeConfig.background.split(',')[0].split('(')[1]}, rgba(255,255,255,0.8))`,
                borderRadius: '20px',
                color: themeConfig.primary
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* 二维码区域 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '20px',
          padding: '20px 24px'
        }}>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: themeConfig.primary,
              marginBottom: '6px'
            }}>
              扫码开始
            </div>
            <div style={{
              fontSize: '13px',
              color: '#6B7280',
              marginBottom: '10px'
            }}>
              说出你的心声 💜
            </div>
            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              {['完全免费', '随时可用', '绝对保密'].map((tag, i) => (
                <span key={i} style={{
                  fontSize: '10px',
                  padding: '4px 10px',
                  background: `linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6))`,
                  border: `1px solid ${themeConfig.primary}20`,
                  borderRadius: '12px',
                  color: themeConfig.primary
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {qrCodeUrl && (
            <div style={{
              padding: '10px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: `0 4px 16px ${themeConfig.primary}25`
            }}>
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{ 
                  width: '120px', 
                  height: '120px',
                  display: 'block'
                }} 
              />
            </div>
          )}
        </div>

        {/* 隐私承诺 */}
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          background: `${themeConfig.primary}12`,
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '12px', color: themeConfig.primary }}>
            🔐 你说的每一句话，都只属于你自己
          </span>
        </div>

        {/* 品牌水印 */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '11px',
          color: '#9CA3AF'
        }}>
          有劲AI · 懂你版
        </div>
      </div>
    );
  }
);

TeenInviteShareCard.displayName = 'TeenInviteShareCard';

export default TeenInviteShareCard;
