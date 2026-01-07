import React, { forwardRef } from 'react';
import { TrendingUp, Target, Sparkles } from 'lucide-react';

interface GrowthPosterCardProps {
  avatarUrl?: string;
  displayName?: string;
  currentDay: number;
  totalDays: number;
  awakeningIndex: number;
  avgBehavior: number;
  avgEmotion: number;
  avgBelief: number;
  coreBreakthrough?: {
    type: 'behavior' | 'emotion' | 'belief';
    title: string;
    content: string;
  };
  dominantPoor?: string;
  transformationRate?: number;
}

const GrowthPosterCard = forwardRef<HTMLDivElement, GrowthPosterCardProps>(({
  avatarUrl,
  displayName = '财富觉醒者',
  currentDay,
  totalDays,
  awakeningIndex,
  avgBehavior,
  avgEmotion,
  avgBelief,
  coreBreakthrough,
  dominantPoor,
  transformationRate,
}, ref) => {
  const progressPercent = Math.min((currentDay / totalDays) * 100, 100);
  
  const getLevel = (index: number) => {
    if (index >= 80) return { label: '深度觉醒', color: '#10b981' };
    if (index >= 60) return { label: '稳步成长', color: '#f59e0b' };
    if (index >= 40) return { label: '初步觉察', color: '#3b82f6' };
    return { label: '起步阶段', color: '#6b7280' };
  };

  const level = getLevel(awakeningIndex);

  const getBreakthroughColor = (type?: string) => {
    switch (type) {
      case 'behavior': return { bg: 'rgba(217, 119, 6, 0.15)', border: '#d97706', text: '#d97706' };
      case 'emotion': return { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#ec4899' };
      case 'belief': return { bg: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6', text: '#8b5cf6' };
      default: return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#10b981' };
    }
  };

  const breakthroughColors = getBreakthroughColor(coreBreakthrough?.type);

  return (
    <div
      ref={ref}
      style={{
        width: 360,
        minHeight: 540,
        background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fde68a 100%)',
        borderRadius: 20,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 20,
        position: 'relative',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, #f59e0b, #f97316)',
          border: '3px solid white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          color: 'white',
        }}>
          {!avatarUrl && '💰'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#78350f' }}>{displayName}</div>
          <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>21天财富训练营</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#d97706', textAlign: 'center' }}>
            Day {currentDay}
          </div>
          <div style={{ fontSize: 10, color: '#92400e', textAlign: 'center' }}>/{totalDays}天</div>
        </div>
      </div>

      {/* Awakening Index Card */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#78350f', marginBottom: 4 }}>觉醒指数</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: level.color }}>{awakeningIndex.toFixed(0)}</span>
              <span style={{ fontSize: 14, color: '#92400e' }}>/ 100</span>
            </div>
          </div>
          <div style={{
            background: level.color,
            color: 'white',
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
          }}>
            {level.label}
          </div>
        </div>
        
        {/* Progress bar */}
        <div style={{
          height: 8,
          background: '#f3f4f6',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <div style={{
            height: '100%',
            width: `${awakeningIndex}%`,
            background: `linear-gradient(90deg, #f59e0b, ${level.color})`,
            borderRadius: 4,
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Three dimension scores */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {[
            { label: '行为', score: avgBehavior, color: '#d97706' },
            { label: '情绪', score: avgEmotion, color: '#ec4899' },
            { label: '信念', score: avgBelief, color: '#8b5cf6' },
          ].map((dim) => (
            <div key={dim.label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{dim.label}流动度</div>
              <div style={{
                height: 4,
                background: '#f3f4f6',
                borderRadius: 2,
                overflow: 'hidden',
                marginBottom: 4,
              }}>
                <div style={{
                  height: '100%',
                  width: `${(dim.score / 5) * 100}%`,
                  background: dim.color,
                  borderRadius: 2,
                }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: dim.color }}>{dim.score.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Breakthrough */}
      {coreBreakthrough && (
        <div style={{
          background: breakthroughColors.bg,
          border: `1px solid ${breakthroughColors.border}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            marginBottom: 8,
            color: breakthroughColors.text,
          }}>
            <Sparkles size={14} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{coreBreakthrough.title}</span>
          </div>
          <div style={{
            fontSize: 14,
            color: '#374151',
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}>
            "{coreBreakthrough.content}"
          </div>
        </div>
      )}

      {/* Transformation Stats */}
      {(dominantPoor || transformationRate !== undefined) && (
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
        }}>
          {dominantPoor && (
            <div style={{
              flex: 1,
              background: 'white',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <Target size={16} style={{ color: '#f59e0b', margin: '0 auto 4px' }} />
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>主攻模式</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#78350f' }}>{dominantPoor}</div>
            </div>
          )}
          {transformationRate !== undefined && (
            <div style={{
              flex: 1,
              background: 'white',
              borderRadius: 12,
              padding: 12,
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <TrendingUp size={16} style={{ color: '#10b981', margin: '0 auto 4px' }} />
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>转化率</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>{transformationRate}%</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        paddingTop: 12,
        borderTop: '1px dashed rgba(120, 53, 15, 0.2)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#78350f', marginBottom: 4 }}>
          💰 让财富自然流动
        </div>
        <div style={{ fontSize: 11, color: '#92400e' }}>
          扫码开启你的财富觉醒之旅
        </div>
      </div>
    </div>
  );
});

GrowthPosterCard.displayName = 'GrowthPosterCard';

export default GrowthPosterCard;
