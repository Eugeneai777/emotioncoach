import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";
import qiweiQr from "@/assets/qiwei-assistant-qr.jpg";

interface Props {
  recordIdTail: string;
  pageNumber?: number;
  totalPages?: number;
  campName: string;
  intro: string;
  values: string[];
  whyNotAlone: string;
  ctaHint: string;
  day7Reflection: string;
}

export function P8Day7Invite({
  recordIdTail,
  pageNumber = 9,
  totalPages = 10,
  campName,
  intro,
  values,
  whyNotAlone,
  ctaHint,
  day7Reflection,
}: Props) {
  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page={pageNumber}>
      <HandbookHeader title="第 8 天 · 下一步" />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}>第 8 天，你想去哪？</h2>
      <p style={{ color: "hsl(var(--muted-foreground))", margin: "0 0 24px 0", fontSize: "13px", lineHeight: 1.7 }}>
        {day7Reflection}
      </p>

      <div
        style={{
          padding: "24px",
          borderRadius: "12px",
          background: "hsl(var(--primary) / 0.06)",
          border: "1px solid hsl(var(--primary) / 0.3)",
          marginBottom: "20px",
        }}
      >
        <div style={{ fontSize: "12px", color: "hsl(var(--primary))", letterSpacing: "0.1em", marginBottom: "6px" }}>
          推荐你进入
        </div>
        <div style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>{campName}</div>
        <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", margin: "0 0 16px 0", lineHeight: 1.7 }}>
          {intro}
        </p>

        <div style={{ marginBottom: "14px" }}>
          {values.map((v, i) => (
            <div
              key={i}
              style={{
                fontSize: "13px",
                marginBottom: "8px",
                paddingLeft: "20px",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "8px",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "hsl(var(--primary))",
                }}
              />
              {v}
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "12px",
            borderRadius: "6px",
            background: "hsl(var(--background))",
            fontSize: "12px",
            color: "hsl(var(--muted-foreground))",
            fontStyle: "italic",
          }}
        >
          {whyNotAlone}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "center",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid hsl(var(--border))",
          background: "hsl(var(--card))",
        }}
      >
        <img
          src={qiweiQr}
          alt="顾问企微二维码"
          style={{ width: "120px", height: "120px", borderRadius: "8px", flexShrink: 0 }}
          crossOrigin="anonymous"
        />
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>{ctaHint}</div>
          <div style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", lineHeight: 1.7 }}>
            打开微信扫一扫，添加顾问企业微信。<br />
            告诉 TA 你想报名「{campName}」，享老学员价。
          </div>
        </div>
      </div>

      <HandbookFooter pageNumber={pageNumber} totalPages={totalPages} recordIdTail={recordIdTail} />
    </div>
  );
}
