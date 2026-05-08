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

export function HandbookDayPage({ recordIdTail, pageNumber, pageTitle, days }: Props) {
  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page={pageNumber}>
      <HandbookHeader title={pageTitle} />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 24px 0" }}>{pageTitle}</h2>

      {days.map((d) => (
        <div
          key={d.day}
          style={{
            marginBottom: "20px",
            padding: "18px 20px",
            borderRadius: "10px",
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
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

          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", rowGap: "8px", fontSize: "13px" }}>
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
            }}
          >
            {d.reassure}
          </div>
        </div>
      ))}

      <HandbookFooter pageNumber={pageNumber} totalPages={9} recordIdTail={recordIdTail} />
    </div>
  );
}
