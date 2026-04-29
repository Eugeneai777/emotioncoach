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

const MaleMidlifeVitalityShareCard = forwardRef<HTMLDivElement, MaleMidlifeVitalityShareCardProps>(
  ({ totalScore, maxScore, dimensionScores, primaryPattern, displayName, avatarUrl }, ref) => {
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const topDimensions = [...dimensionScores]
      .sort((a, b) => (b.maxScore ? b.score / b.maxScore : 0) - (a.maxScore ? a.score / a.maxScore : 0))
      .slice(0, 4);
    const actionTip = primaryPattern?.tips?.[0] || '先从睡眠、呼吸和每天一个小行动开始，把电量慢慢充回来。';

    return (
      <ShareCardBase
        ref={ref}
        sharePath="/assessment/male_midlife_vitality"
        width={340}
        padding={0}
        background="linear-gradient(145deg, #111827 0%, #134e4a 56%, #78350f 100%)"
        borderRadius={24}
        footerConfig={{
          ctaTitle: '扫码看你的有劲状态',
          ctaSubtitle: '3分钟 · 私密评估 · 免费出结果',
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
        <div style={{ padding: '24px 24px 16px', position: 'relative', overflow: 'hidden' }}>
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
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{displayName || '我'}的有劲状态报告</div>
              <div style={{ fontSize: 11, color: '#cbd5e1' }}>男人有劲状态评估</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 18, position: 'relative' }}>
            <div style={{ fontSize: 46, lineHeight: 1.1, marginBottom: 8 }}>{primaryPattern?.emoji || '🔋'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', lineHeight: 1.18, marginBottom: 8 }}>
              {primaryPattern?.label || '有劲状态画像'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, padding: '5px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)' }}>
              <span style={{ color: '#fbbf24', fontSize: 24, fontWeight: 900 }}>{percentage}</span>
              <span style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 700 }}>% 状态指数</span>
            </div>
          </div>

          <div style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 14, marginBottom: 14, position: 'relative' }}>
            {topDimensions.map((d) => {
              const pct = d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0;
              return (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                  <span style={{ fontSize: 14, width: 18 }}>{d.emoji}</span>
                  <span style={{ fontSize: 11, color: '#e5e7eb', width: 66, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
                  <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? '#14b8a6' : pct >= 45 ? '#f59e0b' : '#fb7185', borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#cbd5e1', width: 30, textAlign: 'right', fontWeight: 700 }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.94)', color: '#134e4a', position: 'relative' }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 5 }}>下一步建议</div>
            <div style={{ fontSize: 12, lineHeight: 1.55, color: '#334155' }}>{actionTip}</div>
          </div>
        </div>
      </ShareCardBase>
    );
  }
);

MaleMidlifeVitalityShareCard.displayName = 'MaleMidlifeVitalityShareCard';

export default MaleMidlifeVitalityShareCard;