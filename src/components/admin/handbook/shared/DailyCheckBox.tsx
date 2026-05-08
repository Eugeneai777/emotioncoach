/**
 * 每日 mini 打卡格 — 让用户从"读"变成"写"
 * 纯 HTML/CSS 渲染，html2canvas 友好
 */
import { Drop } from "./HandbookMotifs";

export function DailyCheckBox() {
  const box = {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "1px solid hsl(var(--muted-foreground) / 0.5)",
    borderRadius: "2px",
    marginRight: "6px",
    verticalAlign: "-3px",
  } as React.CSSProperties;

  const ticks = (count: number) => (
    <span style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            width: "8px",
            height: "1px",
            background: "hsl(var(--muted-foreground) / 0.5)",
            display: "inline-block",
          }}
        />
      ))}
    </span>
  );

  const writingLine = {
    flex: 1,
    borderBottom: "1px dotted hsl(var(--muted-foreground) / 0.4)",
    height: "22px",
  } as React.CSSProperties;

  return (
    <div
      style={{
        marginTop: "14px",
        paddingTop: "12px",
        borderTop: "1px dashed hsl(var(--border))",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        rowGap: "16px",
        columnGap: "16px",
        fontSize: "12px",
        color: "hsl(var(--muted-foreground))",
        position: "relative",
      }}
    >
      <div>
        <span style={box} />早做了&nbsp;&nbsp;
        <span style={box} />午做了&nbsp;&nbsp;
        <span style={box} />晚做了
      </div>
      <div style={{ textAlign: "right" }}>
        身体感觉 1 {ticks(9)} 10
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
        <span style={{ flexShrink: 0 }}>今日一句话：</span>
        <span style={writingLine} />
        <span style={{ opacity: 0.5 }}>
          <Drop size={14} />
        </span>
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ flexShrink: 0, opacity: 0 }}>今日一句话：</span>
        <span style={writingLine} />
      </div>
    </div>
  );
}
