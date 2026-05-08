import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";

interface Props {
  recordIdTail: string;
  risks: string[];
  pageNumber?: number;
  totalPages?: number;
}

export function P4Risks({ recordIdTail, risks, pageNumber = 5, totalPages = 10 }: Props) {
  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page={pageNumber}>
      <HandbookHeader title="第四章 · 风险预警" />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}>这些信号别再忽略</h2>
      <p style={{ color: "hsl(var(--muted-foreground))", margin: "0 0 28px 0", fontSize: "13px" }}>
        不是吓你，是把你身体/情绪在小声说的话写出来。看到，就已经是开始了。
      </p>

      {risks.length === 0 ? (
        <div
          style={{
            padding: "20px",
            background: "hsl(var(--muted) / 0.4)",
            borderRadius: "8px",
            color: "hsl(var(--muted-foreground))",
            fontSize: "13px",
          }}
        >
          目前没有特别突出的红灯信号。继续保持这周的节奏。
        </div>
      ) : (
        <div>
          {risks.map((r, i) => (
            <div
              key={i}
              style={{
                marginBottom: "14px",
                padding: "16px 18px",
                borderRadius: "8px",
                background: "hsl(var(--destructive) / 0.06)",
                borderLeft: "3px solid hsl(var(--destructive))",
                fontSize: "14px",
                lineHeight: 1.7,
              }}
            >
              {r}
            </div>
          ))}
        </div>
      )}

      <HandbookFooter pageNumber={pageNumber} totalPages={totalPages} recordIdTail={recordIdTail} />
    </div>
  );
}
