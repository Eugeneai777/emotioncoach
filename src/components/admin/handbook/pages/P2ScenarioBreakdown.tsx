import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";

export interface ScenarioCardData {
  key: string;
  title: string;
  subtitle: string;
  /** 这个簇里 3-6 条用户答题 → 选项摘要 */
  items: Array<{ q: string; a: string }>;
  /** AI 个性化心声（已 sanitize） */
  insight: string;
}

interface Props {
  recordIdTail: string;
  clusters: ScenarioCardData[];
  pageNumber?: number;
  totalPages?: number;
}

function clip(s: string, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function P2ScenarioBreakdown({ recordIdTail, clusters, pageNumber = 3, totalPages = 10 }: Props) {
  // 限制最多 4 个场景卡，避免溢出
  const shown = clusters.slice(0, 4);

  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page={pageNumber}>
      <HandbookHeader title="第二章 · 你的生活切面" />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}>你最近的几个生活切面</h2>
      <p style={{ color: "hsl(var(--muted-foreground))", margin: "0 0 22px 0", fontSize: "13px" }}>
        我们把你这次答的题，按发生在哪一刻整理给你看。
      </p>

      {shown.map((c) => (
        <div
          key={c.key}
          style={{
            marginBottom: "14px",
            padding: "14px 16px",
            borderRadius: "10px",
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            breakInside: "avoid",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "hsl(var(--foreground))" }}>
              {c.title}
            </span>
            <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>{c.subtitle}</span>
          </div>

          <div style={{ marginBottom: "10px" }}>
            {c.items.slice(0, 3).map((it, i) => (
              <div
                key={i}
                style={{
                  fontSize: "12px",
                  color: "hsl(var(--muted-foreground))",
                  paddingLeft: "10px",
                  borderLeft: "2px solid hsl(var(--muted))",
                  marginBottom: "5px",
                  lineHeight: 1.6,
                }}
              >
                {clip(it.q, 26)} <span style={{ color: "hsl(var(--foreground))" }}>→ {clip(it.a, 18)}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "hsl(var(--foreground))",
              background: "hsl(var(--muted) / 0.4)",
              padding: "9px 12px",
              borderRadius: "6px",
              lineHeight: 1.65,
            }}
          >
            {c.insight}
          </div>
        </div>
      ))}

      <HandbookFooter pageNumber={pageNumber} totalPages={totalPages} recordIdTail={recordIdTail} />
    </div>
  );
}
