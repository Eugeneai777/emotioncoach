import { forwardRef, useMemo } from "react";

interface DimensionScore {
  key?: string;
  score: number;
  maxScore: number;
  label: string;
  emoji: string;
}

interface WomenCompetitivenessReportCardProps {
  totalScorePct: number; // 0-100 绽放指数
  dimensionScores: DimensionScore[];
  primaryPattern?: { label?: string; description?: string } | null;
  aiInsight?: string | null;
  displayName?: string;
  testedAt: string;
}

type Band = { level: 'full' | 'half' | 'low'; headline: string; subline: string };

const getBand = (pct: number): Band => {
  if (pct >= 80)
    return {
      level: 'full',
      headline: '你已经在绽放期',
      subline:
        '底盘稳，资源、能量、关系都在你这边。可以开始把它放大成系统性影响力。',
    };
  if (pct >= 60)
    return {
      level: 'half',
      headline: '你具备绽放底气',
      subline: '只是被多线消耗稀释了。重启节奏感后会快速回弹。',
    };
  if (pct >= 40)
    return {
      level: 'half',
      headline: '不是不行，是同时扛太多线',
      subline: '35+ 的你需要先把电量充回来，再谈竞争力突破。',
    };
  return {
    level: 'low',
    headline: '当前已经在低电量运行',
    subline: '不建议硬撑。先把睡眠、情绪、节奏修复，再谈外部突破。',
  };
};

const BAND_COLOR: Record<Band['level'], { bg: string; text: string; bar: string }> = {
  full: { bg: '#FDF2F8', text: '#9D174D', bar: '#EC4899' },
  half: { bg: '#FAF5FF', text: '#6B21A8', bar: '#A855F7' },
  low: { bg: '#FFE4E6', text: '#9F1239', bar: '#F43F5E' },
};

/** 维度行动建议（35+ 女性场景） */
const WOMEN_WEEK_ACTION: Record<string, string> = {
  职场生命力:
    '本周只做一件事：挑一个被你拖了很久的"职业小决定"，今天就给它 30 分钟想清楚 + 发出第一条消息。',
  个人品牌力:
    '本周只做一件事：把你最近做过最像自己的一件事，写成 1 段话发出去（朋友圈/小红书均可）。',
  情绪韧性:
    '本周只做一件事：每晚临睡前写 3 行"今天哪一刻我没被情绪带走"，重建对自己的信任。',
  财务掌控力:
    '本周只做一件事：花 20 分钟看清"这个月真正的固定开销"，把数字写下来，掌控感会立刻回来。',
  关系经营力:
    '本周只做一件事：挑 1 个最近被你忽略的人，主动发一条不带任何请求的关心。',
};

const DEFAULT_WOMEN_ACTION =
  '本周只做一件事：挑一项最弱的维度，每天给它 10 分钟，先恢复对它的"我能"感。';

const WomenCompetitivenessReportCard = forwardRef<HTMLDivElement, WomenCompetitivenessReportCardProps>(
  ({ totalScorePct, dimensionScores, primaryPattern, aiInsight, displayName, testedAt }, ref) => {
    const band = getBand(totalScorePct);
    const colorSet = BAND_COLOR[band.level];

    const sortedDims = useMemo(
      () => [...dimensionScores].sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore)),
      [dimensionScores],
    );
    const weakest = sortedDims[0];
    const weeklyAction = weakest
      ? WOMEN_WEEK_ACTION[weakest.label] || DEFAULT_WOMEN_ACTION
      : DEFAULT_WOMEN_ACTION;

    const dateStr = (() => {
      try {
        const d = new Date(testedAt);
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      } catch {
        return testedAt;
      }
    })();

    return (
      <div
        ref={ref}
        data-export-root
        style={{
          width: '750px',
          background: '#FFFFFF',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
          color: '#1F2937',
          padding: '48px 56px',
          boxSizing: 'border-box',
        }}
      >
        {/* 报告头 */}
        <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 12, color: '#9D174D', letterSpacing: 1 }}>PRIVATE REPORT</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>35+ 绽放报告</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#6B7280' }}>
              <div>{displayName || '本人'}</div>
              <div style={{ marginTop: 2 }}>{dateStr}</div>
            </div>
          </div>
        </div>

        {/* 总分卡 */}
        <div
          style={{
            background: colorSet.bg,
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: colorSet.text, fontWeight: 600 }}>{band.headline}</div>
              <div style={{ fontSize: 13, color: '#4B5563', marginTop: 6, lineHeight: 1.5 }}>{band.subline}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: colorSet.text, lineHeight: 1 }}>
                {totalScorePct}
                <span style={{ fontSize: 18, marginLeft: 4 }}>%</span>
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>绽放指数</div>
            </div>
          </div>
          <div
            style={{
              height: 8,
              background: '#FFFFFF',
              borderRadius: 4,
              marginTop: 16,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(2, totalScorePct)}%`,
                height: '100%',
                background: colorSet.bar,
                borderRadius: 4,
              }}
            />
          </div>
        </div>

        {/* 五维明细 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📊 五维绽放明细</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {sortedDims.map((d) => {
              const pct = d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0;
              const dimColor = pct >= 70 ? '#9D174D' : pct >= 50 ? '#6B21A8' : '#9F1239';
              const oneLine =
                pct >= 70
                  ? '这是你的优势区，可以拿来撬动别的维度。'
                  : pct >= 50
                    ? '基本盘还在，但需要主动维护。'
                    : '当下被消耗最严重的一项，先从这里恢复。';
              return (
                <div
                  key={d.label}
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: 14,
                    background: '#FAFAFA',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      <span style={{ marginRight: 4 }}>{d.emoji}</span>
                      {d.label}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: dimColor }}>{pct}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#374151', marginTop: 8, lineHeight: 1.5 }}>{oneLine}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 本周一个动作 */}
        {weakest && (
          <div
            style={{
              background: '#FDF2F8',
              border: '1px solid #FBCFE8',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#9D174D', marginBottom: 6 }}>
              🎯 本周只做一件事
            </div>
            <div style={{ fontSize: 13, color: '#831843', lineHeight: 1.6 }}>{weeklyAction}</div>
          </div>
        )}

        {/* AI 解读 */}
        {aiInsight && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>🧠 AI 个性化洞察</div>
            <div
              style={{
                fontSize: 13,
                color: '#374151',
                lineHeight: 1.8,
                background: '#FAFAFA',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: '16px 20px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {aiInsight}
            </div>
          </div>
        )}

        {/* 主导画像 */}
        {primaryPattern?.label && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: '#6B7280' }}>当前绽放画像</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{primaryPattern.label}</div>
            {primaryPattern.description && (
              <div style={{ fontSize: 12, color: '#4B5563', marginTop: 6, lineHeight: 1.6 }}>
                {primaryPattern.description}
              </div>
            )}
          </div>
        )}

        {/* 免责声明 + 水印 */}
        <div
          style={{
            borderTop: '1px solid #E5E7EB',
            paddingTop: 16,
            marginTop: 8,
            fontSize: 11,
            color: '#9CA3AF',
            lineHeight: 1.6,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            ⚠️ 本报告仅供个人成长参考，非医学诊断。如有持续情绪困扰，建议咨询专业心理工作者。
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <span>报告由「优劲」AI 生成 · 仅供本人使用</span>
            <span>{dateStr}</span>
          </div>
        </div>
      </div>
    );
  },
);

WomenCompetitivenessReportCard.displayName = 'WomenCompetitivenessReportCard';

export default WomenCompetitivenessReportCard;
