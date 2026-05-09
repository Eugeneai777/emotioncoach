import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";
import { SealStamp } from "../shared/HandbookMotifs";

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
      ? "不灌鸡汤，先陪你看清自己卡在哪。"
      : "不催你成为更好的你，先陪你回到自己。";

  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page="1">
      <HandbookHeader title="封面" />
      <div style={{ marginTop: "72px" }}>
        <div
          style={{
            fontSize: "13px",
            color: "hsl(var(--muted-foreground))",
            letterSpacing: "0.2em",
            marginBottom: "18px",
          }}
        >
          PERSONAL · 7 DAYS
        </div>
        <h1
          style={{
            fontSize: "44px",
            fontWeight: 700,
            color: "hsl(var(--foreground))",
            margin: "0 0 18px 0",
            lineHeight: 1.3,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: "17px", color: "hsl(var(--muted-foreground))", margin: 0, lineHeight: 1.7 }}>
          {sub}
        </p>
      </div>

      <div
        style={{
          marginTop: "56px",
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
          marginTop: "40px",
          padding: "20px 24px",
          borderLeft: "3px solid hsl(var(--primary))",
          fontSize: "15px",
          color: "hsl(var(--foreground))",
          lineHeight: 1.85,
        }}
      >
        {coverNote}
      </div>

      <div
        style={{
          marginTop: "32px",
          padding: "20px 24px",
          borderRadius: "10px",
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "hsl(var(--foreground))" }}>
          这本手册怎么看
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", rowGap: "10px", columnGap: "20px", fontSize: "13px", color: "hsl(var(--muted-foreground))", lineHeight: 1.7 }}>
          <div>① 看你最近的几个生活切面</div>
          <div>② 看你还稳的部分 / 该歇的部分</div>
          <div>③ 跟着 7 天，每天 5 分钟</div>
          <div>④ 第 8 天，再决定下一步去哪</div>
        </div>
      </div>

      <div style={{ position: "absolute", right: "56px", bottom: "110px", opacity: 0.95 }}>
        <SealStamp size={96} />
      </div>

      <HandbookFooter pageNumber={1} totalPages={11} recordIdTail={recordIdTail} />
    </div>
  );
}
