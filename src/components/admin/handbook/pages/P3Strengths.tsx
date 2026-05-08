import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";

interface Props {
  recordIdTail: string;
  strengths: string[];
  pageNumber?: number;
  totalPages?: number;
}

export function P3Strengths({ recordIdTail, strengths, pageNumber = 4, totalPages = 10 }: Props) {
  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page={pageNumber}>
      <HandbookHeader title="第三章 · 你目前还稳的部分" />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}>这些地方，你还撑得住</h2>
      <p style={{ color: "hsl(var(--muted-foreground))", margin: "0 0 28px 0", fontSize: "13px", lineHeight: 1.7 }}>
        这一页是你目前还稳的部分。优先用它接住自己，别一上来就挑最难的硬扛。
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

      <HandbookFooter pageNumber={pageNumber} totalPages={totalPages} recordIdTail={recordIdTail} />
    </div>
  );
}
