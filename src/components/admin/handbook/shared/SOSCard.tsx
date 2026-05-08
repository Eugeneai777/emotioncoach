/**
 * 风险页 SOS 三步卡 — 信号出现时怎么办
 */

const STEPS = [
  { tag: "看见", body: "写下来：今天什么时候、在做什么、跟谁在一起，这个信号最强。" },
  { tag: "暂停", body: "不立刻反应。深呼吸 3 次，每次 4 秒吸 / 6 秒呼，给身体 90 秒。" },
  { tag: "选择", body: "我现在能做的最小一步是什么？只要做 1 件，不求做完。" },
];

export function SOSCard() {
  return (
    <div
      style={{
        marginTop: "28px",
        padding: "20px 22px",
        borderRadius: "10px",
        background: "hsl(var(--muted) / 0.35)",
        border: "1px solid hsl(var(--border))",
        breakInside: "avoid",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "hsl(var(--foreground))",
          marginBottom: "4px",
          letterSpacing: "0.05em",
        }}
      >
        如果上面的信号出现了 · 三步缓冲
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "hsl(var(--muted-foreground))",
          marginBottom: "14px",
          lineHeight: 1.65,
        }}
      >
        不是修好它，是先不让自己滑下去。这三步顺序很重要。
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        {STEPS.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "hsl(var(--primary))",
                letterSpacing: "0.15em",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              STEP {i + 1} · {s.tag}
            </div>
            <div style={{ fontSize: "12px", lineHeight: 1.7, color: "hsl(var(--foreground))" }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
