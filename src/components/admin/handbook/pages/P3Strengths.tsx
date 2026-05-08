import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";

interface Props {
  recordIdTail: string;
  strengths: string[];
}

export function P3Strengths({ recordIdTail, strengths }: Props) {
  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page="3">
      <HandbookHeader title="第三章 · 你的优势" />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}>这些块还在你手里</h2>
      <p style={{ color: "hsl(var(--muted-foreground))", margin: "0 0 28px 0", fontSize: "13px" }}>
        别只看跌的格，先确认还稳的那几格。这是你接下来 7 天能借力的地方。
      </p>

      {strengths.length === 0 ? (
        <div
          style={{
            padding: "20px",
            background: "hsl(var(--muted) / 0.4)",
            borderRadius: "8px",
            color: "hsl(var(--muted-foreground))",
            fontSize: "13px",
          }}
        >
          这次答题里，每一格都在不同程度地承压。这不是坏消息——意味着你已经撑了很久了。
        </div>
      ) : (
        <div>
          {strengths.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "14px",
                marginBottom: "14px",
                padding: "16px 18px",
                borderRadius: "8px",
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: "14px", lineHeight: 1.7 }}>{s}</div>
            </div>
          ))}
        </div>
      )}

      <HandbookFooter pageNumber={3} totalPages={9} recordIdTail={recordIdTail} />
    </div>
  );
}
