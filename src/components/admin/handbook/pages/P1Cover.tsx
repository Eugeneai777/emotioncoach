import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";

interface Props {
  type: "male_vitality" | "emotion_health";
  displayName: string;
  assessmentDate: string;
  recordIdTail: string;
  coverNote: string;
  weakestLabel: string;
  totalScore?: number | null;
}

export function P1Cover({
  type,
  displayName,
  assessmentDate,
  recordIdTail,
  coverNote,
  weakestLabel,
  totalScore,
}: Props) {
  const title = type === "male_vitality" ? "男人有劲 · 7 天伴随手册" : "情绪健康 · 7 天伴随手册";
  const sub =
    type === "male_vitality"
      ? "不打鸡血，不讲道理。让你看清电量，再决定下一步。"
      : "不催决定，不堆术语。让你被自己温柔地接住。";

  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page="1">
      <HandbookHeader title="封面" />
      <div style={{ marginTop: "100px" }}>
        <div
          style={{
            fontSize: "13px",
            color: "hsl(var(--muted-foreground))",
            letterSpacing: "0.2em",
            marginBottom: "16px",
          }}
        >
          PERSONAL · 7 DAYS
        </div>
        <h1
          style={{
            fontSize: "38px",
            fontWeight: 700,
            color: "hsl(var(--foreground))",
            margin: "0 0 16px 0",
            lineHeight: 1.3,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: "15px", color: "hsl(var(--muted-foreground))", margin: 0 }}>{sub}</p>
      </div>

      <div
        style={{
          marginTop: "80px",
          padding: "24px",
          borderRadius: "12px",
          background: "hsl(var(--muted) / 0.4)",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", marginBottom: "8px" }}>
          这本手册写给：
        </div>
        <div style={{ fontSize: "22px", fontWeight: 600, marginBottom: "20px" }}>{displayName}</div>
        <div style={{ display: "flex", gap: "32px", fontSize: "13px", color: "hsl(var(--muted-foreground))" }}>
          <div>
            <div style={{ marginBottom: "4px" }}>测评日期</div>
            <div style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}>{assessmentDate}</div>
          </div>
          <div>
            <div style={{ marginBottom: "4px" }}>主导信号</div>
            <div style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}>{weakestLabel || "—"}</div>
          </div>
          {totalScore != null && (
            <div>
              <div style={{ marginBottom: "4px" }}>总分</div>
              <div style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}>{totalScore}</div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: "60px",
          padding: "20px 24px",
          borderLeft: "3px solid hsl(var(--primary))",
          fontSize: "15px",
          color: "hsl(var(--foreground))",
          lineHeight: 1.8,
        }}
      >
        {coverNote}
      </div>

      <HandbookFooter pageNumber={1} totalPages={9} recordIdTail={recordIdTail} />
    </div>
  );
}
