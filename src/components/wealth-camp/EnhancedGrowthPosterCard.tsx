import React, { forwardRef } from 'react';
import { TrendingUp, Sparkles, Calendar, Star } from 'lucide-react';

interface ChartDataPoint {
  day: number;
  value: number;
  hasData: boolean;
}

interface EnhancedGrowthPosterCardProps {
  avatarUrl?: string;
  displayName?: string;
  currentDay: number;
  totalDays: number;
  awakeningIndex: number;
  awakeningChange: number;
  chartData: ChartDataPoint[];
  coreBreakthrough?: {
    type: 'behavior' | 'emotion' | 'belief';
    title: string;
    content: string;
  };
  aiMessage?: string;
  consecutiveDays?: number;
  peakIndex?: number;
}

const EnhancedGrowthPosterCard = forwardRef<HTMLDivElement, EnhancedGrowthPosterCardProps>(({
  avatarUrl,
  displayName = '财富觉醒者',
  currentDay,
  totalDays,
  awakeningIndex,
  awakeningChange,
  chartData,
  coreBreakthrough,
  aiMessage,
  consecutiveDays = 0,
  peakIndex,
}, ref) => {
  const getLevel = (index: number) => {
    if (index >= 80) return { label: '高度觉醒', emoji: '🟢', color: '#10b981' };
    if (index >= 60) return { label: '稳步觉醒', emoji: '🟡', color: '#eab308' };
    if (index >= 40) return { label: '初步觉醒', emoji: '🟠', color: '#f97316' };
    return { label: '觉醒起步', emoji: '🔴', color: '#ef4444' };
  };

  const level = getLevel(awakeningIndex);

  const getBreakthroughStyle = (type?: string) => {
    switch (type) {
      case 'behavior': return { bg: 'rgba(217, 119, 6, 0.12)', border: '#d97706', emoji: '🎯' };
      case 'emotion': return { bg: 'rgba(236, 72, 153, 0.12)', border: '#ec4899', emoji: '💗' };
      case 'belief': return { bg: 'rgba(139, 92, 246, 0.12)', border: '#8b5cf6', emoji: '💡' };
      default: return { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', emoji: '✨' };
    }
  };

  const breakthroughStyle = getBreakthroughStyle(coreBreakthrough?.type);

  // Mini chart rendering
  const renderMiniChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const maxVal = Math.max(...chartData.map(d => d.value), 100);
    const chartHeight = 60;
    const chartWidth = 280;
    const pointWidth = chartWidth / Math.max(chartData.length - 1, 1);

    const points = chartData.map((d, i) => ({
      x: i * pointWidth,
      y: chartHeight - (d.value / maxVal) * chartHeight,
      hasData: d.hasData,
    }));

    const pathD = points
      .filter(p => p.hasData || points.every(pp => !pp.hasData))
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <svg width={chartWidth} height={chartHeight + 20} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(val => (
          <line
            key={val}
            x1={0}
            y1={chartHeight - (val / maxVal) * chartHeight}
            x2={chartWidth}
            y2={chartHeight - (val / maxVal) * chartHeight}
            stroke="#e5e7eb"
            strokeWidth={0.5}
            strokeDasharray="3,3"
          />
        ))}
        
        {/* Gradient fill */}
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        {points.length > 1 && (
          <path
            d={`${pathD} L ${points[points.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`}
            fill="url(#chartGradient)"
          />
        )}
        
        {/* Main line */}
        <path
          d={pathD}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.hasData ? 4 : 3}
              fill={p.hasData ? '#f59e0b' : 'white'}
              stroke={p.hasData ? 'white' : '#d1d5db'}
              strokeWidth={2}
              strokeDasharray={p.hasData ? '' : '2,2'}
            />
            {/* Day label */}
            <text
              x={p.x}
              y={chartHeight + 14}
              fontSize={8}
              fill="#9ca3af"
              textAnchor="middle"
            >
              D{chartData[i].day}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div
      ref={ref}
      style={{
        width: 360,
        minHeight: 580,
        background: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 30%, #fed7aa 100%)',
        borderRadius: 24,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: -80,
        right: -80,
        width: 200,
        height: 200,
        background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 150,
        height: 150,
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
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, #f59e0b, #f97316)',
          border: '3px solid white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          color: 'white',
        }}>
          {!avatarUrl && '💰'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#78350f' }}>{displayName}</div>
          <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>财富觉醒训练营</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: 14,
          padding: '10px 14px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>
            Day {currentDay}
          </div>
          <div style={{ fontSize: 9, color: '#92400e' }}>/{totalDays}天</div>
        </div>
      </div>

      {/* Awakening Index Hero */}
      <div style={{
        background: 'white',
        borderRadius: 18,
        padding: 20,
        marginBottom: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#78350f', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={12} />
              觉醒指数
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 42, fontWeight: 700, color: level.color }}>{awakeningIndex.toFixed(0)}</span>
              {awakeningChange !== 0 && (
                <span style={{ 
                  fontSize: 14, 
                  fontWeight: 600,
                  color: awakeningChange > 0 ? '#10b981' : '#ef4444',
                }}>
                  {awakeningChange > 0 ? '+' : ''}{awakeningChange.toFixed(0)}
                </span>
              )}
            </div>
          </div>
          <div style={{
            background: `${level.color}15`,
            border: `1px solid ${level.color}40`,
            color: level.color,
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span>{level.emoji}</span>
            <span>{level.label}</span>
          </div>
        </div>

        {/* Mini Growth Chart */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>觉醒曲线</div>
          {renderMiniChart()}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f59e0b' }}>{consecutiveDays}</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>连续打卡</div>
          </div>
          {peakIndex !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#10b981' }}>{peakIndex.toFixed(0)}</div>
              <div style={{ fontSize: 9, color: '#9ca3af' }}>最高觉醒</div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#8b5cf6' }}>{currentDay}</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>已完成天</div>
          </div>
        </div>
      </div>

      {/* Core Breakthrough */}
      {coreBreakthrough && (
        <div style={{
          background: breakthroughStyle.bg,
          border: `1px solid ${breakthroughStyle.border}30`,
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            marginBottom: 8,
            color: breakthroughStyle.border,
          }}>
            <span>{breakthroughStyle.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{coreBreakthrough.title}</span>
          </div>
          <div style={{
            fontSize: 13,
            color: '#374151',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            "{coreBreakthrough.content.length > 60 
              ? coreBreakthrough.content.slice(0, 60) + '...' 
              : coreBreakthrough.content}"
          </div>
        </div>
      )}

      {/* AI Message */}
      {aiMessage && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
          position: 'relative',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            marginBottom: 8,
            color: '#b45309',
          }}>
            <Sparkles size={14} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>AI教练寄语</span>
          </div>
          <div style={{
            fontSize: 12,
            color: '#78350f',
            lineHeight: 1.6,
          }}>
            {aiMessage.length > 80 ? aiMessage.slice(0, 80) + '...' : aiMessage}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        paddingTop: 16,
        borderTop: '1px dashed rgba(120, 53, 15, 0.2)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#78350f', marginBottom: 4 }}>
          💰 有劲AI · 财富教练
        </div>
        <div style={{ fontSize: 10, color: '#92400e' }}>
          扫码开启你的财富觉醒之旅
        </div>
      </div>
    </div>
  );
});

EnhancedGrowthPosterCard.displayName = 'EnhancedGrowthPosterCard';

export default EnhancedGrowthPosterCard;
