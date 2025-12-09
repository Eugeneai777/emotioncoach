import { forwardRef } from "react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { getPartnerShareUrl, getDefaultShareUrl } from "@/utils/partnerQRUtils";

interface ShareCardExportProps {
  post: {
    post_type: string;
    title: string | null;
    content: string | null;
    image_urls: string[] | null;
    emotion_theme: string | null;
    emotion_intensity: number | null;
    insight: string | null;
    action: string | null;
    camp_day: number | null;
    badges: any;
    camp_type?: string;
    template_id?: string;
    camp_name?: string;
  };
  partnerInfo?: {
    isPartner: boolean;
    partnerId?: string;
    entryType?: 'free' | 'paid';
  };
}

// 情绪emoji映射
const getEmotionEmoji = (theme: string | null): string => {
  if (!theme) return "💭";
  const emojiMap: Record<string, string> = {
    '平静': '😌', '焦虑': '😰', '开心': '😊', '喜悦': '😄', '愤怒': '😤',
    '悲伤': '😢', '感恩': '🙏', '兴奋': '🤩', '困惑': '😕', '放松': '😊',
    '压力': '😓', '满足': '😌', '失落': '😔', '紧张': '😬', '温暖': '🥰',
    '孤独': '😞', '委屈': '😢', '不屑': '😒', '释然': '😌', '期待': '🤗',
    '烦躁': '😤', '无奈': '😮‍💨', '自豪': '😊', '羞愧': '😳', '后悔': '😔', '嫉妒': '😠'
  };
  return emojiMap[theme] || "💭";
};

// 计算阶段信息
const getPhaseInfo = (campDay: number | null) => {
  if (!campDay) return { phase: '共振期', progress: 0, emoji: '🌱' };
  if (campDay <= 7) {
    return { phase: '共振期', progress: campDay / 7 * 33, emoji: '🌱', nextPhase: '觉醒期' };
  }
  if (campDay <= 14) {
    return { phase: '觉醒期', progress: 33 + (campDay - 7) / 7 * 33, emoji: '🌟', nextPhase: '升维期' };
  }
  return { phase: '升维期', progress: 66 + Math.min((campDay - 14) / 7, 1) * 34, emoji: '✨', nextPhase: '完成' };
};

// 根据合伙人状态和帖子来源生成二维码URL
const getQRCodeUrl = (partnerInfo: ShareCardExportProps['partnerInfo'], post: ShareCardExportProps['post']): string => {
  // 合伙人：使用统一的合伙人分享URL
  if (partnerInfo?.isPartner && partnerInfo?.partnerId) {
    const entryType = partnerInfo.entryType || 'free';
    return getPartnerShareUrl(partnerInfo.partnerId, entryType);
  }

  // 非合伙人：使用默认分享URL
  return getDefaultShareUrl(post);
};

// 生成来源标签
const getSourceLabel = (postType: string, campName?: string, badges?: any): {
  label: string;
  emoji: string;
} | null => {
  const normalizedType = String(postType || '').trim().toLowerCase();
  if (normalizedType !== 'story') return null;
  
  const displayCampName = campName || badges?.campName || badges?.camp_name;
  if (displayCampName) {
    return { label: `${displayCampName}·今日成长故事`, emoji: '🌸' };
  }
  
  return { label: '今日成长故事', emoji: '🌸' };
};

// 智能格式化内容 - 纯内联样式版本
const formatContent = (content: string) => {
  const parts = content.split(/(\【[^】]+\】[^\【]*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const match = part.match(/\【([^】]+)\】\s*(.*)/s);
    if (match) {
      const [, title, text] = match;
      const titleStyles: Record<string, { emoji: string; color: string }> = {
        '问题': { emoji: '❓', color: '#ea580c' },
        '转折': { emoji: '🔄', color: '#2563eb' },
        '成长': { emoji: '🌱', color: '#16a34a' },
        '反思': { emoji: '💭', color: '#9333ea' },
        '洞察': { emoji: '💡', color: '#ca8a04' },
        '行动': { emoji: '🎯', color: '#dc2626' }
      };
      const style = titleStyles[title] || { emoji: '📌', color: '#be185d' };
      
      return (
        <div key={index} style={{ marginBottom: index === parts.length - 1 ? '0' : '16px' }}>
          <div style={{ 
            fontWeight: '700', 
            marginBottom: '6px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '16px',
            color: style.color
          }}>
            <span>【{title}】</span>
          </div>
          <p style={{ 
            color: '#4b5563', 
            lineHeight: '1.75', 
            paddingLeft: '20px',
            fontSize: '14px',
            margin: '0'
          }}>
            {text.trim()}
          </p>
        </div>
      );
    }
    
    return (
      <p key={index} style={{ 
        color: '#4b5563', 
        lineHeight: '1.75', 
        fontSize: '14px',
        marginBottom: index === parts.length - 1 ? '0' : '12px',
        margin: '0 0 12px 0'
      }}>
        {part}
      </p>
    );
  });
};

const ShareCardExport = forwardRef<HTMLDivElement, ShareCardExportProps>(({ post, partnerInfo }, ref) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const phaseInfo = getPhaseInfo(post.camp_day);
  const emotionEmoji = getEmotionEmoji(post.emotion_theme);
  const sourceLabel = getSourceLabel(post.post_type, post.camp_name, post.badges);

  useEffect(() => {
    const qrUrl = getQRCodeUrl(partnerInfo, post);
    QRCode.toDataURL(qrUrl, { width: 120, margin: 1 }).then(setQrCodeUrl);
  }, [partnerInfo, post]);

  return (
    <div 
      ref={ref} 
      data-share-card
      style={{
        position: 'relative',
        width: '600px',
        padding: '32px 32px 40px',
        minHeight: 'auto',
        overflow: 'hidden',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #fce7f3, #f3e8ff, #dbeafe)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif'
      }}
    >
      {/* 装饰性元素 */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '24px', opacity: 0.2 }}>✨</div>
      <div style={{ position: 'absolute', top: '80px', left: '16px', fontSize: '20px', opacity: 0.2 }}>💫</div>
      <div style={{ position: 'absolute', bottom: '160px', right: '32px', fontSize: '20px', opacity: 0.2 }}>🌟</div>

      {/* 顶部留白 */}
      <div style={{ paddingTop: '32px' }} />

      {/* 打卡进度区 */}
      {post.camp_day && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '20px' }}>
            <span style={{ fontWeight: '700', color: '#be185d' }}>
              🔥 我的第 {post.camp_day} 天 · {phaseInfo.phase} {phaseInfo.emoji}
            </span>
          </div>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.5)', 
            borderRadius: '9999px', 
            overflow: 'hidden', 
            height: '16px' 
          }}>
            <div style={{ 
              height: '100%', 
              background: '#be185d', 
              width: `${phaseInfo.progress}%`,
              transition: 'width 0.5s'
            }} />
          </div>
          <p style={{ 
            textAlign: 'center', 
            color: '#6b7280', 
            marginTop: '4px', 
            fontSize: '14px',
            margin: '4px 0 0 0'
          }}>
            {phaseInfo.nextPhase !== '完成' ? `${phaseInfo.nextPhase}在望` : '即将完成21天旅程'}
          </p>
        </div>
      )}

      {/* 标题 */}
      {post.title && (
        <h2 style={{ 
          fontWeight: '700', 
          color: '#1f2937', 
          textAlign: 'center', 
          fontSize: '24px', 
          marginBottom: '32px',
          margin: '0 0 32px 0'
        }}>
          {post.title.replace(/^[^\w\s\u4e00-\u9fa5]+/, '').trim()}
        </h2>
      )}

      {/* 图片 */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <img 
            src={post.image_urls[0]} 
            alt="分享图片" 
            crossOrigin="anonymous"
            style={{ 
              width: '100%', 
              height: '256px', 
              objectFit: 'cover', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
            }} 
          />
        </div>
      )}

      {/* 内容 - 纯色背景替代 backdrop-blur */}
      {post.content && (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.85)', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
          border: '1px solid rgba(190, 24, 93, 0.1)',
          padding: '16px',
          marginBottom: '16px'
        }}>
          {/* 来源标签 */}
          {sourceLabel && (
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '9999px',
                fontWeight: '500',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                background: 'linear-gradient(to right, rgb(252, 231, 243), rgb(243, 232, 255))',
                fontSize: '14px',
                color: '#be185d'
              }}>
                <span style={{ color: '#be185d' }}>{sourceLabel.emoji}</span>
                <span style={{ color: '#be185d' }}>{sourceLabel.label}</span>
              </span>
            </div>
          )}
          
          <div>{formatContent(post.content)}</div>
        </div>
      )}

      {/* 洞察与行动 */}
      {(post.insight || post.action) && (
        <div style={{ 
          background: 'rgba(243, 244, 246, 0.5)', 
          borderRadius: '12px', 
          border: '1px solid rgba(190, 24, 93, 0.1)',
          marginBottom: '16px',
          padding: '16px'
        }}>
          {post.insight && (
            <div style={{ 
              paddingBottom: post.action ? '12px' : '0', 
              marginBottom: post.action ? '12px' : '0',
              borderBottom: post.action ? '1px solid rgba(190, 24, 93, 0.1)' : 'none'
            }}>
              <p style={{ 
                fontWeight: '700', 
                color: '#be185d', 
                marginBottom: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '14px',
                margin: '0 0 8px 0'
              }}>
                <span>💡</span>
                <span>今日洞察</span>
              </p>
              <p style={{ 
                color: '#374151', 
                lineHeight: '1.75', 
                fontSize: '14px',
                margin: '0'
              }}>
                {post.insight}
              </p>
            </div>
          )}
          {post.action && (
            <div>
              <p style={{ 
                fontWeight: '700', 
                color: '#be185d', 
                marginBottom: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '14px',
                margin: '0 0 8px 0'
              }}>
                <span>🎯</span>
                <span>行动计划</span>
              </p>
              <p style={{ 
                color: '#374151', 
                lineHeight: '1.75', 
                fontSize: '14px',
                margin: '0'
              }}>
                {post.action}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 勋章展示 */}
      {post.badges && Object.keys(post.badges).length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          {Object.entries(post.badges)
            .filter(([_, badge]: [string, any]) => badge?.icon && badge?.name)
            .slice(0, 3)
            .map(([key, badge]: [string, any]) => (
              <div 
                key={key} 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(190, 24, 93, 0.2), rgba(190, 24, 93, 0.1))', 
                  borderRadius: '12px', 
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                  border: '1px solid rgba(190, 24, 93, 0.2)',
                  padding: '12px 16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{badge.icon}</span>
                  <span style={{ fontWeight: '500', color: '#1f2937', fontSize: '14px' }}>
                    {badge.name}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* 分隔线 */}
      <div style={{ borderTop: '1px solid rgba(190, 24, 93, 0.2)', margin: '24px 0' }} />

      {/* 底部CTA区域 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 品牌水印 + 价值清单 + 二维码 */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {/* 价值清单 */}
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ 
              fontWeight: '700', 
              marginBottom: '8px', 
              fontSize: '16px',
              color: '#be185d',
              margin: '0 0 8px 0'
            }}>
              有劲AI · 情绪日记
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
              <span style={{ marginTop: '2px', color: '#be185d' }}>✅</span>
              <span style={{ color: '#1f2937' }}>温暖AI陪伴</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
              <span style={{ marginTop: '2px', color: '#be185d' }}>✅</span>
              <span style={{ color: '#1f2937' }}>系统成长方法</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
              <span style={{ marginTop: '2px', color: '#be185d' }}>✅</span>
              <span style={{ color: '#1f2937' }}>社群共振支持</span>
            </div>
          </div>

          {/* 二维码 */}
          {qrCodeUrl && (
            <div style={{ flexShrink: 0 }}>
              <img 
                src={qrCodeUrl} 
                alt="二维码"
                style={{ 
                  width: '112px', 
                  height: '112px', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                  border: '2px solid rgba(190, 24, 93, 0.2)' 
                }} 
              />
            </div>
          )}
        </div>

        {/* 科学数据背书 */}
        <div style={{ 
          textAlign: 'center', 
          background: 'rgba(255, 255, 255, 0.5)', 
          borderRadius: '8px', 
          border: '1px solid rgba(190, 24, 93, 0.1)',
          padding: '12px 16px'
        }}>
          <p style={{ 
            fontWeight: '500', 
            fontSize: '14px',
            color: '#1f2937',
            margin: '0'
          }}>
            📊 21天科学验证：焦虑↓31% · 睡眠↑28% · 执行力×2.4
          </p>
        </div>

        {/* 最终CTA */}
        <div style={{ 
          textAlign: 'center', 
          background: 'linear-gradient(to right, rgba(190, 24, 93, 0.2), rgba(219, 39, 119, 0.2))', 
          borderRadius: '8px',
          padding: '12px 16px'
        }}>
          <p style={{ 
            fontWeight: '700', 
            fontSize: '16px',
            color: '#be185d',
            margin: '0'
          }}>
            {partnerInfo?.isPartner 
              ? "🎁 扫码领取专属福利，立享预购优惠" 
              : "🎁 扫码了解详情，开启你的成长之旅"}
          </p>
        </div>
      </div>
    </div>
  );
});

ShareCardExport.displayName = "ShareCardExport";

export default ShareCardExport;
