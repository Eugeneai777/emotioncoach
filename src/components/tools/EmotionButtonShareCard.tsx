import React, { forwardRef, useEffect } from 'react';
import { useQRCode } from '@/utils/qrCodeUtils';
import { getPromotionDomain } from '@/utils/partnerQRUtils';

interface EmotionButtonShareCardProps {
  partnerCode?: string;
  onReady?: () => void;
}

const EmotionButtonShareCard = forwardRef<HTMLDivElement, EmotionButtonShareCardProps>(
  ({ partnerCode, onReady }, ref) => {
    const shareUrl = partnerCode 
      ? `${getPromotionDomain()}/energy-studio?ref=${partnerCode}`
      : `${getPromotionDomain()}/energy-studio`;
    const { qrCodeUrl, isLoading } = useQRCode(shareUrl);

    useEffect(() => {
      if (!isLoading) onReady?.();
    }, [isLoading, onReady]);

    // 9种情绪 emoji
    const emotions = [
      { emoji: '😰', title: '恐慌' },
      { emoji: '😟', title: '担心' },
      { emoji: '😔', title: '负面' },
      { emoji: '😨', title: '恐惧' },
      { emoji: '😤', title: '烦躁' },
      { emoji: '😫', title: '压力' },
      { emoji: '😪', title: '无力' },
      { emoji: '🤯', title: '崩溃' },
      { emoji: '😢', title: '失落' },
    ];

    // 4阶段
    const stages = [
      { emoji: '🌬️', title: '觉察', color: '#0D9488' },
      { emoji: '💭', title: '理解', color: '#0891B2' },
      { emoji: '🛡️', title: '稳定', color: '#2563EB' },
      { emoji: '✨', title: '转化', color: '#4F46E5' },
    ];

    // 科学理论
    const theories = [
      { name: '多迷走神经理论', author: 'Stephen Porges' },
      { name: '认知行为疗法 CBT', author: 'Aaron Beck' },
      { name: '自我效能理论', author: 'Albert Bandura' },
      { name: '安全学习理论', author: 'Craske 等' },
    ];

    return (
      <div
        ref={ref}
        style={{
          width: '420px',
          padding: '24px',
          background: 'linear-gradient(135deg, #E6FFFA 0%, #CFFAFE 50%, #DBEAFE 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* 标题区 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '12px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            🆘
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#0F172A',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            情绪🆘按钮
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#475569',
            padding: '6px 16px',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '20px',
            display: 'inline-block'
          }}>
            基于神经科学的即时情绪稳定系统
          </div>
        </div>

        {/* 数据信任区 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {[
            { num: '288', label: '专业认知提醒' },
            { num: '9种', label: '情绪场景覆盖' },
            { num: '4阶段', label: '神经科学流程' },
            { num: '100%', label: '即时可用' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              padding: '12px 8px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#0D9488',
                marginBottom: '4px'
              }}>
                {item.num}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#64748B' 
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* 9种情绪 */}
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            🎯 覆盖 9 种常见情绪场景
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {emotions.map((e, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'linear-gradient(135deg, #F0FDFA, #E0F2FE)',
                padding: '6px 10px',
                borderRadius: '16px',
                fontSize: '12px'
              }}>
                <span style={{ fontSize: '16px' }}>{e.emoji}</span>
                <span style={{ color: '#475569' }}>{e.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4阶段流程 */}
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            🧠 4阶段神经科学设计
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}>
            {stages.map((s, i) => (
              <React.Fragment key={i}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '24px', 
                    marginBottom: '4px' 
                  }}>
                    {s.emoji}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: s.color 
                  }}>
                    {s.title}
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div style={{ 
                    color: '#CBD5E1', 
                    fontSize: '16px' 
                  }}>
                    →
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 科学依据 */}
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            🔬 四大科学理论支撑
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px'
          }}>
            {theories.map((t, i) => (
              <div key={i} style={{
                background: 'linear-gradient(135deg, #F0FDFA, #F0F9FF)',
                padding: '10px 12px',
                borderRadius: '10px',
                borderLeft: '3px solid #0D9488'
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#0F172A',
                  marginBottom: '2px'
                }}>
                  {t.name}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: '#64748B' 
                }}>
                  {t.author}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部 CTA + 二维码 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '16px',
          padding: '16px 20px'
        }}>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#0D9488',
              marginBottom: '4px'
            }}>
              扫码立即使用
            </div>
            <div style={{
              fontSize: '12px',
              color: '#64748B',
              marginBottom: '8px'
            }}>
              免费 · 即时 · 专业
            </div>
            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              {['30秒情绪急救', '随时可用', '无需注册'].map((tag, i) => (
                <span key={i} style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  background: 'linear-gradient(135deg, #CCFBF1, #CFFAFE)',
                  borderRadius: '10px',
                  color: '#0D9488'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {qrCodeUrl && (
            <div style={{
              padding: '8px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{ 
                  width: '100px', 
                  height: '100px',
                  display: 'block'
                }} 
              />
            </div>
          )}
        </div>

        {/* 品牌水印 */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '11px',
          color: '#94A3B8'
        }}>
          Powered by 有劲AI
        </div>
      </div>
    );
  }
);

EmotionButtonShareCard.displayName = 'EmotionButtonShareCard';

export default EmotionButtonShareCard;
