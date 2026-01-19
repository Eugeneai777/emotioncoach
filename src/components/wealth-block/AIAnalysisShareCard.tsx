import React, { forwardRef } from 'react';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { useQRCode } from '@/utils/qrCodeUtils';


interface PartnerInfo {
  partnerId: string;
  partnerCode: string;
}

interface AssessmentData {
  healthScore: number;
  reactionPattern: string;
  patternEmoji: string;
  dominantPoor: string;
  dominantPoorEmoji: string;
  aiInsightPreview?: string;
}

interface AIAnalysisShareCardProps {
  className?: string;
  avatarUrl?: string;
  displayName?: string;
  partnerInfo?: PartnerInfo;
  assessmentData?: AssessmentData;
}

const AIAnalysisShareCard = forwardRef<HTMLDivElement, AIAnalysisShareCardProps>(
  ({ className, avatarUrl, displayName = '财富觉醒者', partnerInfo, assessmentData }, ref) => {
    const getShareUrl = (): string => {
      const baseUrl = `${getPromotionDomain()}/wealth-block`;
      if (partnerInfo?.partnerCode) {
        return `${baseUrl}?ref=${partnerInfo.partnerCode}`;
      }
      return baseUrl;
    };
    
    const shareUrl = getShareUrl();
    const qrCodeUrl = useQRCode(shareUrl);

    const healthScore = assessmentData?.healthScore ?? 65;
    const getScoreColor = (score: number) => {
      if (score >= 80) return '#22c55e';
      if (score >= 60) return '#eab308';
      if (score >= 40) return '#f97316';
      return '#ef4444';
    };

    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: '360px',
          padding: '24px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
          borderRadius: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background effects */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(139,92,246,0.2)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(236,72,153,0.15)',
        }} />
        
        {/* Header */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(167,139,250,0.4)',
              overflow: 'hidden',
            }}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <span style={{ fontSize: '20px' }}>🤖</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                AI智能分析报告
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {displayName}
              </div>
            </div>
          </div>
          
          {/* Health Score Gauge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(${getScoreColor(healthScore)} ${healthScore * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 30px ${getScoreColor(healthScore)}40`,
            }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ fontSize: '28px', fontWeight: 700 }}>{healthScore}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>觉醒指数</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analysis Results */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Reaction Pattern */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(139,92,246,0.2)',
            borderRadius: '12px',
            marginBottom: '10px',
            border: '1px solid rgba(139,92,246,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{assessmentData?.patternEmoji || '🧭'}</span>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>财富反应模式</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {assessmentData?.reactionPattern || '避险型'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Dominant Poor */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(236,72,153,0.15)',
            borderRadius: '12px',
            marginBottom: '12px',
            border: '1px solid rgba(236,72,153,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{assessmentData?.dominantPoorEmoji || '🤐'}</span>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>主导行为卡点</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {assessmentData?.dominantPoor || '嘴穷'}
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Insight Preview */}
          {assessmentData?.aiInsightPreview && (
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '12px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
                🤖 AI洞察预览
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: '1.5',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {assessmentData.aiInsightPreview}
              </div>
            </div>
          )}
          
          {/* Three Locks Badge */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}>
            <div style={{
              padding: '6px 10px',
              background: 'rgba(251,191,36,0.2)',
              borderRadius: '20px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span>🔒</span> 时间锁
            </div>
            <div style={{
              padding: '6px 10px',
              background: 'rgba(6,182,212,0.2)',
              borderRadius: '20px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span>🔒</span> 数据锁
            </div>
            <div style={{
              padding: '6px 10px',
              background: 'rgba(244,63,94,0.2)',
              borderRadius: '20px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span>🔒</span> 关系锁
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '4px',
            }}>
              有劲AI · 财富教练
            </div>
            <div style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.6)',
            }}>
              扫码体验AI智能测评
            </div>
            <div style={{
              fontSize: '9px',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '2px',
            }}>
              仅需¥9.9 · 30个场景深度测评
            </div>
          </div>
          {qrCodeUrl && (
            <div style={{
              padding: '6px',
              background: '#ffffff',
              borderRadius: '8px',
            }}>
              <img src={qrCodeUrl} alt="QR Code" style={{ width: '70px', height: '70px' }} />
            </div>
          )}
        </div>
      </div>
    );
  }
);

AIAnalysisShareCard.displayName = 'AIAnalysisShareCard';

export default AIAnalysisShareCard;
