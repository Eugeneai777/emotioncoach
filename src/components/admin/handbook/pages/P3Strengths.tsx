import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";
import { SunRise } from "../shared/HandbookMotifs";

const USAGE_TIPS = [
  "今日用法：把这点稳定，留给一件最值得的事，别均摊。",
  "今日用法：今天遇到难选的事，先用这一格做判断。",
  "今日用法：把它讲给一个人听，被看见会让它更稳。",
  "今日用法：写下来。能稳的东西，写下来才不会丢。",
];

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
                marginBottom: "28px",
                padding: "20px 22px",
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
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", lineHeight: 1.7 }}>{s}</div>
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "hsl(var(--primary))",
                    background: "hsl(var(--primary) / 0.08)",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    display: "inline-block",
                  }}
                >
                  {USAGE_TIPS[i % USAGE_TIPS.length]}
                </div>
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: "8px",
              padding: "16px 20px",
              borderRadius: "8px",
              background: "hsl(var(--primary) / 0.05)",
              borderLeft: "3px solid hsl(var(--primary))",
              fontSize: "13px",
              lineHeight: 1.8,
              color: "hsl(var(--foreground))",
              fontStyle: "italic",
            }}
          >
            把还稳的部分先用起来——这就是你这 7 天最聪明的策略。先稳住一格，再去碰最难的那格。
          </div>
        </div>
      )}

      <div style={{ position: "absolute", right: "48px", bottom: "130px", opacity: 0.9 }}>
        <SunRise size={120} />
      </div>

      <HandbookFooter pageNumber={pageNumber} totalPages={totalPages} recordIdTail={recordIdTail} />
    </div>
  );
}
