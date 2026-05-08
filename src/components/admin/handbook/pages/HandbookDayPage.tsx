import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";

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
  pageTitle: string;
  days: DayCard[];
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

export function HandbookDayPage({ recordIdTail, pageNumber, pageTitle, days }: Props) {
  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page={pageNumber}>
      <HandbookHeader title={pageTitle} />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 22px 0" }}>{pageTitle}</h2>

      {days.map((d) => (
        <div
          key={d.day}
          style={{
            marginBottom: "18px",
            padding: "16px 18px",
            borderRadius: "10px",
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            breakInside: "avoid",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "10px" }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", rowGap: "6px", fontSize: "13px" }}>
            <div style={{ color: "hsl(var(--muted-foreground))" }}>早</div>
            <div>{d.morning}</div>
            <div style={{ color: "hsl(var(--muted-foreground))" }}>午</div>
            <div>{d.noon}</div>
            <div style={{ color: "hsl(var(--muted-foreground))" }}>晚</div>
            <div>{d.evening}</div>
          </div>

          <div
            style={{
              marginTop: "10px",
              paddingTop: "8px",
              borderTop: "1px dashed hsl(var(--border))",
              fontSize: "12px",
              color: "hsl(var(--muted-foreground))",
              fontStyle: "italic",
              lineHeight: 1.65,
            }}
          >
            {REASSURE_BY_DAY[d.day] || d.reassure}
          </div>
        </div>
      ))}

      <HandbookFooter pageNumber={pageNumber} totalPages={9} recordIdTail={recordIdTail} />
    </div>
  );
}
