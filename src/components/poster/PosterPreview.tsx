import { forwardRef } from "react";
import { PosterTemplate } from "./PosterTemplateGrid";
import { getPartnerShareUrl } from "@/utils/partnerQRUtils";
import { useQRCode } from "@/utils/qrCodeUtils";

interface PosterPreviewProps {
  template: PosterTemplate;
  partnerId: string;
  entryType: 'free' | 'paid';
  backgroundImageUrl?: string;
  customTagline?: string;
  customSellingPoints?: string[];
  scene?: 'default' | 'moments' | 'xiaohongshu' | 'wechat_group';
}

export const PosterPreview = forwardRef<HTMLDivElement, PosterPreviewProps>(
  ({ template, partnerId, entryType, backgroundImageUrl, customTagline, customSellingPoints, scene = 'default' }, ref) => {
    const shareUrl = getPartnerShareUrl(partnerId, entryType);
    const { qrCodeUrl } = useQRCode(shareUrl, 'LARGE');

    // Product slogan mapping
    const getProductSlogan = (key: string): string => {
      const slogans: Record<string, string> = {
        emotion_button: '30秒情绪急救',
        emotion_coach: 'AI深度陪伴梳理',
        parent_coach: '科学化解亲子僵局',
        communication_coach: '高情商沟通指南',
        story_coach: '把经历变成力量',
        emotion_journal_21: '21天建立新回路',
        parent_emotion_21: '21天突破亲子困境',
        '365_member': '一整年情绪自由',
        partner_recruit: '边助人边赚收入',
        wealth_block: '3分钟定位财富天花板',
        experience_pack: '9.9元解锁7项专业服务',
        scl90: '专业心理健康自评',
        emotion_health: '三层诊断情绪卡点',
        alive_check: '每日安全守护',
        vibrant_life: '24小时智能生活陪伴',
        awakening: '6维深度觉察训练',
        parent_teen: '亲子双轨隐私陪伴'
      };
      return slogans[key] || '有劲生活';
    };

    // Product category mapping
    const getProductCategory = (key: string): string => {
      const categories: Record<string, string> = {
        emotion_button: '情绪工具',
        emotion_coach: 'AI教练',
        parent_coach: 'AI教练',
        communication_coach: 'AI教练',
        story_coach: 'AI教练',
        vibrant_life: 'AI教练',
        emotion_journal_21: '训练营',
        parent_emotion_21: '训练营',
        awakening: '觉察工具',
        parent_teen: '亲子工具',
        '365_member': '年度会员',
        partner_recruit: '创业机会',
        wealth_block: '财富心理测评',
        experience_pack: '超值体验包',
        scl90: '专业测评',
        emotion_health: '专业测评',
        alive_check: '安全工具'
      };
      return categories[key] || '有劲生活';
    };

    // Gradient backgrounds for different templates
    const gradientStyles: Record<string, string> = {
      emotion_button: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 50%, #22d3ee 100%)',
      emotion_coach: 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #059669 100%)',
      parent_coach: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #7c3aed 100%)',
      communication_coach: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #4f46e5 100%)',
      story_coach: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #eab308 100%)',
      emotion_journal_21: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f43f5e 100%)',
      parent_emotion_21: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
      '365_member': 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #facc15 100%)',
      partner_recruit: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #d946ef 100%)',
      wealth_block: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
      experience_pack: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #fbbf24 100%)',
      scl90: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)',
      emotion_health: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%)',
      alive_check: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #fb7185 100%)',
      vibrant_life: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #8b5cf6 100%)',
      awakening: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
      parent_teen: 'linear-gradient(135deg, #d946ef 0%, #a855f7 50%, #8b5cf6 100%)'
    };

    // Get display content
    const displayTagline = customTagline || template.tagline;
    const displaySellingPoints = customSellingPoints && customSellingPoints.length > 0 
      ? customSellingPoints 
      : template.sellingPoints;

    // Scene-specific CTA text
    const getCtaText = () => {
      if (scene === 'moments') return '👇 长按识别，开启疗愈之旅';
      if (scene === 'xiaohongshu') return '🔗 扫码立即体验';
      if (scene === 'wechat_group') return '👥 群友都在用，扫码加入';
      return entryType === 'free' ? '🆓 扫码免费体验' : '💰 扫码 ¥9.9 开启';
    };

    // Render based on scene type
    const renderContent = () => {
      switch (scene) {
        case 'moments':
          return renderMomentsLayout();
        case 'xiaohongshu':
          return renderXiaohongshuLayout();
        case 'wechat_group':
          return renderWechatGroupLayout();
        default:
          return renderDefaultLayout();
      }
    };

    // 朋友圈版：故事感排版 - 大标题 + 情感引导
    const renderMomentsLayout = () => (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: backgroundImageUrl 
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)'
          : 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 18px 16px',
        color: 'white',
        boxSizing: 'border-box'
      }}>
        {/* 顶部装饰光晕 */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '100px',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Emoji标识 */}
        <div style={{ 
          fontSize: '36px', 
          textAlign: 'center',
          marginBottom: '4px',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
        }}>
          {template.emoji}
        </div>

        {/* 产品名 + 定位语 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            marginBottom: '4px'
          }}>
            {template.name}
          </div>
          <div style={{
            fontSize: '11px',
            opacity: 0.9,
            background: 'rgba(255,255,255,0.2)',
            padding: '3px 10px',
            borderRadius: '12px',
            display: 'inline-block'
          }}>
            {getProductSlogan(template.key)}
          </div>
        </div>

        {/* 主标语 - 故事感大字 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '12px',
          padding: '0 8px',
          overflow: 'hidden',
          maxHeight: '80px'
        }}>
          <p style={{
            fontSize: '15px',
            fontWeight: '600',
            lineHeight: 1.4,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            margin: 0,
            letterSpacing: '0.5px'
          }}>
            「{displayTagline}」
          </p>
        </div>

        {/* 卖点 - 诗意排列 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          marginBottom: '10px',
          padding: '0 12px'
        }}>
          {displaySellingPoints.slice(0, 3).map((point, idx) => (
            <div 
              key={idx}
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '8px 12px',
                fontSize: '12px',
                lineHeight: 1.4,
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                textShadow: '0 1px 4px rgba(0,0,0,0.3)'
              }}
            >
              ✨ {point}
            </div>
          ))}
        </div>

        {/* 情感引导语 */}
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          opacity: 0.85,
          marginBottom: '8px',
          fontStyle: 'italic'
        }}>
          — 愿你也能找到内心的力量 —
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ flexShrink: 0 }}>
          {renderQRSection()}
        </div>
      </div>
    );

    // 小红书版：数据卡片排版 - 标签风格 + 数据突出
    const renderXiaohongshuLayout = () => (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: backgroundImageUrl 
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)'
          : 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 16px 16px',
        color: 'white',
        boxSizing: 'border-box'
      }}>
        {/* 顶部标签栏 */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '14px',
          flexWrap: 'wrap'
        }}>
          <span style={{
            background: 'rgba(255,255,255,0.9)',
            color: '#ef4444',
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '10px',
            fontWeight: '600'
          }}>
            🔥 热门推荐
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '10px'
          }}>
            #情绪管理
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '10px'
          }}>
            #心理健康
          </span>
        </div>

        {/* Emoji + 产品名 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '32px' }}>{template.emoji}</span>
          <div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              textShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}>
              {template.name}
            </div>
            {/* 产品定位语 */}
            <div style={{ 
              fontSize: '11px', 
              opacity: 0.95,
              marginTop: '3px',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}>
              {getProductSlogan(template.key)}
            </div>
            <div style={{ 
              fontSize: '10px', 
              opacity: 0.9,
              background: 'rgba(255,255,255,0.2)',
              padding: '2px 6px',
              borderRadius: '8px',
              display: 'inline-block',
              marginTop: '4px'
            }}>
              Powered by 有劲AI
            </div>
          </div>
        </div>

        {/* 主标语 */}
        <div style={{
          fontSize: '15px',
          fontWeight: '500',
          lineHeight: 1.5,
          marginBottom: '10px',
          textShadow: '0 1px 6px rgba(0,0,0,0.4)',
          padding: '0 4px',
          overflow: 'hidden',
          maxHeight: '60px'
        }}>
          {displayTagline}
        </div>

        {/* 数据卡片网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
          marginBottom: '10px'
        }}>
          {displaySellingPoints.slice(0, 4).map((point, idx) => {
            // 提取数字或关键词
            const match = point.match(/(\d+|∞)/);
            const number = match ? match[1] : '✓';
            const text = point.replace(/(\d+|∞)/, '').trim();
            
            return (
              <div 
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: '12px',
                  padding: '12px 10px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#0d9488',
                  marginBottom: '2px'
                }}>
                  {number}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: '#374151',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  maxHeight: '28px',
                  wordBreak: 'break-all' as const
                }}>
                  {text || point}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ flexShrink: 0 }}>
          {renderQRSection()}
        </div>
      </div>
    );

    // 微信群版：社群推荐排版 - 群友背书 + 信任感
    const renderWechatGroupLayout = () => (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: backgroundImageUrl 
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)'
          : 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.38) 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 16px 16px',
        color: 'white',
        boxSizing: 'border-box'
      }}>
        {/* 顶部群友推荐标识 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px'
        }}>
          <div style={{
            display: 'flex',
            marginLeft: '-4px'
          }}>
            {['👤', '👤', '👤'].map((_, idx) => (
              <div 
                key={idx}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: `hsl(${180 + idx * 30}, 60%, 50%)`,
                  border: '2px solid white',
                  marginLeft: idx > 0 ? '-8px' : '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}
              >
                {['😊', '🥰', '😄'][idx]}
              </div>
            ))}
          </div>
          <span style={{
            fontSize: '11px',
            opacity: 0.95,
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 10px',
            borderRadius: '12px'
          }}>
            群友都在推荐 👍
          </span>
        </div>

        {/* Emoji + 产品名 + 类别标签 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <span style={{ 
            fontSize: '36px',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))'
          }}>
            {template.emoji}
          </span>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ 
                fontSize: '20px', 
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}>
                {template.name}
              </span>
              <span style={{
                fontSize: '10px',
                background: 'rgba(16, 185, 129, 0.9)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                {getProductCategory(template.key)}
              </span>
            </div>
            {/* 产品定位语 */}
            <div style={{ 
              fontSize: '11px', 
              opacity: 0.9,
              marginTop: '4px',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}>
              {getProductSlogan(template.key)}
            </div>
          </div>
        </div>

        {/* 主标语 - 对话框样式 */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          borderTopLeftRadius: '4px',
          padding: '10px 12px',
          marginBottom: '10px',
          color: '#1f2937',
          overflow: 'hidden',
          maxHeight: '60px',
          fontSize: '14px',
          lineHeight: 1.5,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          💬 "{displayTagline}"
        </div>

        {/* 卖点列表 - 清单样式 */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '14px',
          padding: '10px 12px',
          marginBottom: '10px'
        }}>
          {displaySellingPoints.slice(0, 3).map((point, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                lineHeight: 1.4,
                marginBottom: idx < displaySellingPoints.slice(0, 3).length - 1 ? '8px' : '0'
              }}
            >
              <span style={{
                width: '18px',
                height: '18px',
                background: 'rgba(16, 185, 129, 0.9)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                flexShrink: 0
              }}>
                ✓
              </span>
              <span>{point}</span>
            </div>
          ))}
        </div>

        {/* 低门槛提示 */}
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          background: 'rgba(251, 191, 36, 0.9)',
          color: '#78350f',
          padding: '6px 12px',
          borderRadius: '20px',
          marginBottom: '10px',
          fontWeight: '500'
        }}>
          🎁 新用户免费体验 · 无需下载
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ flexShrink: 0 }}>
          {renderQRSection()}
        </div>
      </div>
    );

    // 默认布局 - 通用版
    const renderDefaultLayout = () => (
      <div style={{
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
        padding: '20px 16px 14px',
        color: 'white',
        boxSizing: 'border-box'
      }}>
        {/* Emoji标识 */}
        <div style={{ 
          fontSize: '30px', 
          textAlign: 'center',
          marginBottom: '4px',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
        }}>
          {template.emoji}
        </div>

        {/* 产品名 */}
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          textAlign: 'center',
          marginBottom: '4px',
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          margin: 0
        }}>
          {template.name}
        </h2>

        {/* 产品定位语 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '6px'
        }}>
          <span style={{
            fontSize: '12px',
            background: 'rgba(255,255,255,0.25)',
            padding: '4px 12px',
            borderRadius: '12px',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)'
          }}>
            {getProductSlogan(template.key)}
          </span>
        </div>

        {/* 主标语 */}
        <p style={{ 
          fontSize: '14px', 
          textAlign: 'center',
          lineHeight: 1.5,
          opacity: 0.95,
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          margin: '0 0 10px 0',
          padding: '0 8px',
          overflow: 'hidden',
          maxHeight: '60px'
        }}>
          {displayTagline}
        </p>

        {/* 卖点卡片 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          marginBottom: '10px'
        }}>
          {displaySellingPoints.slice(0, 3).map((point, idx) => (
            <div 
              key={idx}
              style={{
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '7px 10px',
                fontSize: '12px',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <span style={{ fontSize: '14px' }}>✨</span>
              <span>{point}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* 底部二维码区 */}
        <div style={{ flexShrink: 0 }}>
          {renderQRSection()}
        </div>
      </div>
    );

    // 通用二维码区域
    const renderQRSection = () => (
      <>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '14px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          {qrCodeUrl && (
            <img 
              src={qrCodeUrl} 
              alt="QR Code"
              style={{ 
                width: '55px', 
                height: '55px', 
                borderRadius: '8px', 
                flexShrink: 0,
                border: '2px solid #f0f0f0'
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: 'bold',
              marginBottom: '4px',
              color: entryType === 'free' ? '#059669' : '#d97706'
            }}>
              {getCtaText()}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.4 }}>
              {entryType === 'free' 
                ? '免费体验 · 10次AI对话' 
                : '体验套餐 · 50点AI额度 · 365天有效'
              }
            </div>
          </div>
        </div>

        {/* 品牌Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '6px',
          fontSize: '10px',
          opacity: 0.85,
          textShadow: '0 1px 3px rgba(0,0,0,0.3)'
        }}>
          有劲AI · 每个人的生活教练
        </div>
      </>
    );

    return (
      <div
        ref={ref}
        style={{
          width: '300px',
          height: '560px',
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

        {/* Render scene-specific content */}
        {renderContent()}
      </div>
    );
  }
);

PosterPreview.displayName = 'PosterPreview';
