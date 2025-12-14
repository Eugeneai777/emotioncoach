import React, { forwardRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';

// 主题色配置
export const CARD_THEMES = {
  purple: {
    name: '梦幻紫',
    background: 'linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 50%, #DBEAFE 100%)',
    primary: '#7C3AED',
    secondary: '#EC4899',
    qrColor: '#7C3AED',
  },
  ocean: {
    name: '海洋蓝',
    background: 'linear-gradient(135deg, #DBEAFE 0%, #CFFAFE 50%, #E0F2FE 100%)',
    primary: '#0EA5E9',
    secondary: '#06B6D4',
    qrColor: '#0EA5E9',
  },
  forest: {
    name: '森林绿',
    background: 'linear-gradient(135deg, #DCFCE7 0%, #D1FAE5 50%, #ECFDF5 100%)',
    primary: '#10B981',
    secondary: '#34D399',
    qrColor: '#10B981',
  },
  sunset: {
    name: '日落橙',
    background: 'linear-gradient(135deg, #FEF3C7 0%, #FED7AA 50%, #FECACA 100%)',
    primary: '#F59E0B',
    secondary: '#FB923C',
    qrColor: '#F59E0B',
  },
  sakura: {
    name: '樱花粉',
    background: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 50%, #FAE8FF 100%)',
    primary: '#EC4899',
    secondary: '#F472B6',
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
            width: 160,
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

    return (
      <div
        ref={ref}
        style={{
          width: '100%',
          maxWidth: '400px',
          minWidth: '300px',
          padding: '24px',
          background: themeConfig.background,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* 标题区 - 简化 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '12px',
          }}>
            ✨
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            {teenNickname ? `Hey ${teenNickname}～` : 'Hey～'}
          </div>
          <div style={{ 
            fontSize: '18px', 
            color: '#374151',
            fontWeight: '500'
          }}>
            这是你的秘密基地
          </div>
        </div>

        {/* 个性化留言 - 简化样式 */}
        {personalMessage && (
          <div style={{
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#6B7280',
              lineHeight: '1.5',
            }}>
              💌 {personalMessage}
            </div>
          </div>
        )}

        {/* 极简功能展示 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          fontSize: '15px',
          color: '#6B7280',
        }}>
          🔒 100%保密 &nbsp;·&nbsp; 🎙️ 随时语音聊
        </div>

        {/* 二维码区域 - 居中简化 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '20px',
          padding: '24px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: themeConfig.primary,
            marginBottom: '16px'
          }}>
            扫码开始 💜
          </div>
          {qrCodeUrl && (
            <div style={{
              padding: '12px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: `0 4px 20px ${themeConfig.primary}20`
            }}>
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{ 
                  width: '140px', 
                  height: '140px',
                  display: 'block'
                }} 
              />
            </div>
          )}
        </div>

        {/* 品牌水印 */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '12px',
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
