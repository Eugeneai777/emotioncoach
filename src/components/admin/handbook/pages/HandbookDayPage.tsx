import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";
import { DailyCheckBox } from "../shared/DailyCheckBox";

export interface DayCard {
  day: number;
  title: string;
  morning: string;
  noon: string;
  evening: string;
  reassure: string;
}

interface Props {
  recordIdTail: string;
  pageNumber: number;
  totalPages?: number;
  pageTitle: string;
  days: DayCard[];
  /** 单日（如 Day 7）下方的回顾小结，避免下方留白 */
  summary?: string;
}

const REASSURE_BY_DAY: Record<number, string> = {
  1: "没做到也行。第一天的目标只有一个：知道自己存在。",
  2: "今天动一点点，比完美的明天更值钱。",
  3: "卡住很正常，记下来比硬撑更重要。",
  4: "让一个人知道你在调，比独自扛更快好起来。",
  5: "身体在还债，对自己宽一点，不是放弃。",
  6: "走到这一天，你已经比 70% 的人多撑了 5 天。",
  7: "今天回头看：你没回到原点，你在向前走。",
};

export function HandbookDayPage({ recordIdTail, pageNumber, totalPages = 11, pageTitle, days, summary }: Props) {
  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page={pageNumber}>
      <HandbookHeader title={pageTitle} />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 22px 0" }}>{pageTitle}</h2>

      {days.map((d) => (
        <div
          key={d.day}
          style={{
            marginBottom: "26px",
            padding: "18px 20px",
            borderRadius: "10px",
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            breakInside: "avoid",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "hsl(var(--primary))",
                letterSpacing: "0.1em",
              }}
            >
              DAY {d.day}
            </span>
            <span style={{ fontSize: "16px", fontWeight: 600 }}>{d.title}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", rowGap: "7px", fontSize: "13px" }}>
            <div style={{ color: "hsl(var(--muted-foreground))" }}>早</div>
            <div>{d.morning}</div>
            <div style={{ color: "hsl(var(--muted-foreground))" }}>午</div>
            <div>{d.noon}</div>
            <div style={{ color: "hsl(var(--muted-foreground))" }}>晚</div>
            <div>{d.evening}</div>
          </div>

          <div
            style={{
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: "1px dashed hsl(var(--border))",
              fontSize: "12px",
              color: "hsl(var(--muted-foreground))",
              fontStyle: "italic",
              lineHeight: 1.65,
            }}
          >
            {REASSURE_BY_DAY[d.day] || d.reassure}
          </div>

          <DailyCheckBox />
        </div>
      ))}

      {summary && (
        <div
          style={{
            marginTop: "8px",
            padding: "20px 22px",
            borderRadius: "10px",
            background: "hsl(var(--primary) / 0.06)",
            border: "1px solid hsl(var(--primary) / 0.25)",
            breakInside: "avoid",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "hsl(var(--primary))",
              letterSpacing: "0.1em",
              fontWeight: 600,
              marginBottom: "10px",
            }}
          >
            7 天小结 · 写给走到这里的你
          </div>
          <div style={{ fontSize: "13px", lineHeight: 1.85, color: "hsl(var(--foreground))" }}>
            {summary}
          </div>
          <div
            style={{
              marginTop: "14px",
              paddingTop: "10px",
              borderTop: "1px dashed hsl(var(--border))",
              fontSize: "12px",
              color: "hsl(var(--muted-foreground))",
              lineHeight: 1.85,
            }}
          >
            <div style={{ marginBottom: "6px" }}>这 7 天，最让我意外的一件事是：</div>
            <div
              style={{
                borderBottom: "1px dotted hsl(var(--muted-foreground) / 0.4)",
                height: "22px",
                marginBottom: "10px",
              }}
            />
            <div style={{ marginBottom: "6px" }}>第 8 天，我想先做的一小步是：</div>
            <div
              style={{
                borderBottom: "1px dotted hsl(var(--muted-foreground) / 0.4)",
                height: "22px",
              }}
            />
          </div>
        </div>
      )}

      <HandbookFooter pageNumber={pageNumber} totalPages={totalPages} recordIdTail={recordIdTail} />
    </div>
  );
}
