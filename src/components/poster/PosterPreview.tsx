import { forwardRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import { PosterTemplate } from "./PosterTemplateGrid";
import { getPartnerShareUrl } from "@/utils/partnerQRUtils";

interface PosterPreviewProps {
  template: PosterTemplate;
  partnerId: string;
  entryType: 'free' | 'paid';
  backgroundImageUrl?: string;
}

export const PosterPreview = forwardRef<HTMLDivElement, PosterPreviewProps>(
  ({ template, partnerId, entryType, backgroundImageUrl }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    useEffect(() => {
      const generateQR = async () => {
        const shareUrl = getPartnerShareUrl(partnerId, entryType);
        try {
          const qrDataUrl = await QRCode.toDataURL(shareUrl, {
            width: 200,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          setQrCodeUrl(qrDataUrl);
        } catch (err) {
          console.error('QR generation error:', err);
        }
      };
      generateQR();
    }, [partnerId, entryType]);

    // Gradient backgrounds for different templates
    const gradientStyles: Record<string, string> = {
      emotion_button: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 50%, #22d3ee 100%)',
      emotion_coach: 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #059669 100%)',
      parent_coach: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #7c3aed 100%)',
      communication_coach: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #4f46e5 100%)',
      training_camp: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #dc2626 100%)',
      '365_member': 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #facc15 100%)',
      partner_recruit: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #d946ef 100%)'
    };

    // Template-specific content
    const templateContent: Record<string, { title: string; subtitle: string; dataPoints: { value: string; label: string }[] }> = {
      emotion_button: {
        title: '情绪按钮',
        subtitle: '基于神经科学的即时情绪稳定系统',
        dataPoints: [
          { value: '288', label: '认知提醒' },
          { value: '9', label: '情绪场景' },
          { value: '4', label: '阶段设计' },
          { value: '100%', label: '即时可用' }
        ]
      },
      emotion_coach: {
        title: '情绪教练',
        subtitle: 'AI深度陪伴你的每一次情绪梳理',
        dataPoints: [
          { value: '4', label: '部曲对话' },
          { value: '∞', label: '无限对话' },
          { value: '专属', label: '情绪简报' },
          { value: '24h', label: '随时陪伴' }
        ]
      },
      parent_coach: {
        title: '亲子教练',
        subtitle: '让亲子沟通更轻松更有爱',
        dataPoints: [
          { value: '科学', label: '育儿方法' },
          { value: '专业', label: '心理支持' },
          { value: '实用', label: '沟通技巧' },
          { value: '持续', label: '成长陪伴' }
        ]
      },
      communication_coach: {
        title: '沟通教练',
        subtitle: '轻松说出想说的话，让对方愿意听',
        dataPoints: [
          { value: '高效', label: '表达技巧' },
          { value: '化解', label: '冲突方法' },
          { value: '建立', label: '健康边界' },
          { value: '提升', label: '影响力' }
        ]
      },
      training_camp: {
        title: '训练营',
        subtitle: '21天打卡 · 社群陪伴 · 习惯养成',
        dataPoints: [
          { value: '21', label: '天打卡' },
          { value: '每日', label: '视频学习' },
          { value: '社群', label: '互相陪伴' },
          { value: '证书', label: '完成奖励' }
        ]
      },
      '365_member': {
        title: '365会员',
        subtitle: '全功能解锁，陪伴你一整年',
        dataPoints: [
          { value: '1000', label: 'AI点数' },
          { value: '全部', label: '教练功能' },
          { value: '专属', label: '训练营' },
          { value: '365', label: '天有效' }
        ]
      },
      partner_recruit: {
        title: '有劲合伙人',
        subtitle: 'AI时代的创业新机会',
        dataPoints: [
          { value: '50%', label: '最高佣金' },
          { value: '3级', label: '分销体系' },
          { value: '被动', label: '收入来源' },
          { value: '0', label: '门槛启动' }
        ]
      }
    };

    const content = templateContent[template.key] || templateContent.emotion_button;

    return (
      <div
        ref={ref}
        style={{
          width: '300px',
          height: '533px',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        {/* Background */}
        {backgroundImageUrl ? (
          <img 
            src={backgroundImageUrl} 
            alt="background"
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: gradientStyles[template.key] || gradientStyles.emotion_button
            }}
          />
        )}

        {/* Content Overlay */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: backgroundImageUrl 
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)'
              : 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 16px 16px',
            color: 'white',
            boxSizing: 'border-box'
          }}
        >
          {/* Top Section */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>{template.emoji}</div>
            <h2 style={{ 
              fontSize: '22px', 
              fontWeight: 'bold', 
              marginBottom: '4px',
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              margin: 0
            }}>
              {content.title}
            </h2>
            <p style={{ 
              fontSize: '12px', 
              opacity: 0.95,
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              margin: 0
            }}>
              {content.subtitle}
            </p>
          </div>

          {/* Data Points */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginBottom: '12px'
          }}>
            {content.dataPoints.map((point, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '2px' }}>{point.value}</div>
                <div style={{ fontSize: '10px', opacity: 0.9 }}>{point.label}</div>
              </div>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Bottom Section - QR Code */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '14px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="QR Code"
                style={{ width: '64px', height: '64px', borderRadius: '6px', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: 'bold',
                marginBottom: '3px',
                color: entryType === 'free' ? '#059669' : '#d97706'
              }}>
                {entryType === 'free' ? '🆓 扫码免费体验' : '💰 扫码 ¥9.9 开启'}
              </div>
              <div style={{ fontSize: '10px', color: '#666', lineHeight: 1.4 }}>
                体验套餐 · 50点AI额度 · 365天有效
              </div>
            </div>
          </div>

          {/* Brand Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: '10px',
            opacity: 0.85,
            textShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}>
            有劲生活 · 情绪梳理教练
          </div>
        </div>
      </div>
    );
  }
);

PosterPreview.displayName = 'PosterPreview';
