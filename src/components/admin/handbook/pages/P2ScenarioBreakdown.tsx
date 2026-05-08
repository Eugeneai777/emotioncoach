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
}

export function P2ScenarioBreakdown({ recordIdTail, clusters }: Props) {
  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page="2">
      <HandbookHeader title="第二章 · 你的生活场景" />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}>不按题号看，按场景看</h2>
      <p style={{ color: "hsl(var(--muted-foreground))", margin: "0 0 28px 0", fontSize: "13px" }}>
        我们把答题重新组织成 4-5 个生活切片，让你看到"在哪一刻最难"。
      </p>

      {clusters.map((c) => (
        <div
          key={c.key}
          style={{
            marginBottom: "20px",
            padding: "18px 20px",
            borderRadius: "10px",
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "hsl(var(--foreground))" }}>
              {c.title}
            </span>
            <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>{c.subtitle}</span>
          </div>

          <div style={{ marginBottom: "12px" }}>
            {c.items.slice(0, 4).map((it, i) => (
              <div
                key={i}
                style={{
                  fontSize: "12px",
                  color: "hsl(var(--muted-foreground))",
                  paddingLeft: "12px",
                  borderLeft: "2px solid hsl(var(--muted))",
                  marginBottom: "6px",
                }}
              >
                {it.q} <span style={{ color: "hsl(var(--foreground))" }}>→ {it.a}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "hsl(var(--foreground))",
              background: "hsl(var(--muted) / 0.4)",
              padding: "10px 12px",
              borderRadius: "6px",
              lineHeight: 1.7,
            }}
          >
            {c.insight}
          </div>
        </div>
      ))}

      <HandbookFooter pageNumber={2} totalPages={9} recordIdTail={recordIdTail} />
    </div>
  );
}
