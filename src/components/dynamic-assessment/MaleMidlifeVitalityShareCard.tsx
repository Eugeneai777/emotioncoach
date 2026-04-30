import { forwardRef } from "react";
import { ShareCardBase } from "@/components/sharing";

interface DimensionScore {
  score: number;
  maxScore: number;
  label: string;
  emoji: string;
}

interface MaleMidlifeVitalityShareCardProps {
  totalScore: number;
  maxScore: number;
  dimensionScores: DimensionScore[];
  primaryPattern?: {
    label?: string;
    emoji?: string;
    description?: string;
    tips?: string[];
  };
  displayName?: string;
  avatarUrl?: string;
}

// 与结果页保持一致：恢复阻力分越低 = 状态越好，需翻转为"状态指数 %"
const toVitalityStatusScore = (score: number, max: number) =>
  max > 0 ? Math.max(0, Math.min(100, Math.round(100 - (score / max) * 100))) : 0;

const labelMap: Record<string, string> = {
  '压力内耗': '压力调节',
  '恢复阻力': '行动恢复力',
};

const MaleMidlifeVitalityShareCard = forwardRef<HTMLDivElement, MaleMidlifeVitalityShareCardProps>(
  ({ totalScore, maxScore, dimensionScores, primaryPattern, displayName, avatarUrl }, ref) => {
    const percentage = toVitalityStatusScore(totalScore, maxScore);
    const statusDimensions = dimensionScores.map((d) => ({
      ...d,
      label: labelMap[d.label] ?? d.label,
      score: toVitalityStatusScore(d.score, d.maxScore),
      maxScore: 100,
    }));
    const topDimensions = [...statusDimensions]
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    const actionTip = primaryPattern?.tips?.[0] || '先从睡眠、呼吸和每天一个小行动开始，把电量慢慢充回来。';

    return (
      <ShareCardBase
        ref={ref}
        sharePath="/assessment/male_midlife_vitality"
        width={360}
        padding={20}
        background="linear-gradient(145deg, #111827 0%, #134e4a 56%, #78350f 100%)"
        borderRadius={24}
        footerConfig={{
          ctaTitle: '扫码看你的有劲状态',
          ctaSubtitle: '3分钟 · 私密 · 免费',
          primaryColor: '#134e4a',
          secondaryColor: '#64748b',
          showQR: true,
          showBranding: true,
          brandingColor: '#cbd5e1',
          layout: 'horizontal',
          tags: ['非诊断', '状态盘点'],
          tagColor: '#0f766e',
          tagBgColor: 'rgba(204, 251, 241, 0.7)',
        }}
      >
        <div
          style={{
            padding: '4px 4px 12px',
            position: 'relative',
            overflow: 'hidden',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          }}
        >
          <div style={{ position: 'absolute', top: -58, right: -46, width: 132, height: 132, borderRadius: '50%', background: 'rgba(245,158,11,0.18)' }} />
          <div style={{ position: 'absolute', bottom: 42, left: -58, width: 116, height: 116, borderRadius: '50%', background: 'rgba(20,184,166,0.18)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, position: 'relative' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(251,191,36,0.55)' }}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #14b8a6, #f59e0b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 16, fontWeight: 800,
              }}>
                {(displayName || '我')[0]}
              </div>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', lineHeight: 1.4 }}>{displayName || '我'}的有劲状态报告</div>
              <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, marginTop: 2 }}>男人有劲状态评估</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 18, position: 'relative' }}>
            <div style={{ fontSize: 46, lineHeight: 1.1, marginBottom: 8 }}>{primaryPattern?.emoji || '🔋'}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', lineHeight: 1.25, marginBottom: 8, paddingBottom: 2 }}>
              {primaryPattern?.label || '有劲状态画像'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, padding: '6px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)' }}>
              <span style={{ color: '#fbbf24', fontSize: 28, fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{percentage}</span>
              <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>% 状态指数</span>
            </div>
          </div>

          <div style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 14, position: 'relative' }}>
            {topDimensions.map((d, idx) => {
              const pct = d.score;
              const isLast = idx === topDimensions.length - 1;
              return (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isLast ? 0 : 12 }}>
                  <span style={{ fontSize: 16, width: 20, lineHeight: 1.4 }}>{d.emoji}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#f1f5f9',
                      width: 96,
                      whiteSpace: 'nowrap',
                      lineHeight: 1.5,
                      paddingTop: 2,
                      paddingBottom: 3,
                    }}
                  >
                    {d.label}
                  </span>
                  <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? '#14b8a6' : pct >= 45 ? '#f59e0b' : '#fb7185', borderRadius: 999 }} />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: '#e2e8f0',
                      width: 40,
                      textAlign: 'right',
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.5,
                    }}
                  >
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.94)', color: '#134e4a', position: 'relative' }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, lineHeight: 1.5 }}>下一步建议</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: '#334155', wordBreak: 'break-word' }}>{actionTip}</div>
          </div>
        </div>
      </ShareCardBase>
    );
  }
);

MaleMidlifeVitalityShareCard.displayName = 'MaleMidlifeVitalityShareCard';

export default MaleMidlifeVitalityShareCard;