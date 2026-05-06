import { forwardRef } from "react";
import { ShareCardBase } from "@/components/sharing";

interface DimensionScore {
  score: number;
  maxScore: number;
  label: string;
  emoji: string;
}

interface WomenCompetitivenessShareCardProps {
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

const toPct = (score: number, max: number) =>
  max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;

const WomenCompetitivenessShareCard = forwardRef<HTMLDivElement, WomenCompetitivenessShareCardProps>(
  ({ totalScore, maxScore, dimensionScores, primaryPattern, displayName, avatarUrl }, ref) => {
    const percentage = toPct(totalScore, maxScore);
    const dims = dimensionScores.map((d) => ({ ...d, pct: toPct(d.score, d.maxScore) }));
    const topDimensions = [...dims].sort((a, b) => b.pct - a.pct).slice(0, 4);
    const actionTip =
      primaryPattern?.tips?.[0] ||
      '从今天起，每天留 15 分钟给自己——不是给孩子、不是给老板，而是把节奏感找回来。';

    return (
      <ShareCardBase
        ref={ref}
        sharePath="/assessment/women_competitiveness"
        width={360}
        padding={20}
        background="linear-gradient(145deg, #831843 0%, #6d28d9 56%, #ec4899 100%)"
        borderRadius={24}
        footerConfig={{
          ctaTitle: '扫码看你的35+绽放力',
          ctaSubtitle: '7分钟 · 私密 · 专为35+女性',
          primaryColor: '#831843',
          secondaryColor: '#64748b',
          showQR: true,
          showBranding: true,
          brandingColor: '#cbd5e1',
          layout: 'horizontal',
          tags: ['35+女性', '绽放力盘点'],
          tagColor: '#831843',
          tagBgColor: 'rgba(252, 231, 243, 0.85)',
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
          <div style={{ position: 'absolute', top: -58, right: -46, width: 132, height: 132, borderRadius: '50%', background: 'rgba(236,72,153,0.22)' }} />
          <div style={{ position: 'absolute', bottom: 42, left: -58, width: 116, height: 116, borderRadius: '50%', background: 'rgba(167,139,250,0.22)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, position: 'relative' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(244,114,182,0.65)' }}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 16, fontWeight: 800,
              }}>
                {(displayName || '我')[0]}
              </div>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fdf2f8', lineHeight: 1.4 }}>{displayName || '我'}的35+绽放报告</div>
              <div style={{ fontSize: 12, color: '#f5d0fe', lineHeight: 1.5, marginTop: 2 }}>35+女性竞争力评估</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 18, position: 'relative' }}>
            <div style={{ fontSize: 46, lineHeight: 1.1, marginBottom: 8 }}>{primaryPattern?.emoji || '👑'}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', lineHeight: 1.25, marginBottom: 8, paddingBottom: 2 }}>
              {primaryPattern?.label || '35+绽放画像'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, padding: '6px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <span style={{ color: '#fbcfe8', fontSize: 28, fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{percentage}</span>
              <span style={{ color: '#fce7f3', fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>% 绽放指数</span>
            </div>
          </div>

          <div style={{ background: 'rgba(30,16,55,0.45)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 16, marginBottom: 14, position: 'relative' }}>
            {topDimensions.map((d, idx) => {
              const pct = d.pct;
              const isLast = idx === topDimensions.length - 1;
              return (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isLast ? 0 : 12 }}>
                  <span style={{ fontSize: 16, width: 20, lineHeight: 1.4 }}>{d.emoji}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fdf2f8',
                      width: 96,
                      whiteSpace: 'nowrap',
                      lineHeight: 1.5,
                      paddingTop: 2,
                      paddingBottom: 3,
                    }}
                  >
                    {d.label}
                  </span>
                  <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.14)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? '#ec4899' : pct >= 45 ? '#a855f7' : '#fb7185', borderRadius: 999 }} />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: '#fce7f3',
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

          <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.94)', color: '#831843', position: 'relative' }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, lineHeight: 1.5 }}>下一步建议</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: '#3f3f46', wordBreak: 'break-word' }}>{actionTip}</div>
          </div>
        </div>
      </ShareCardBase>
    );
  }
);

WomenCompetitivenessShareCard.displayName = 'WomenCompetitivenessShareCard';

export default WomenCompetitivenessShareCard;
