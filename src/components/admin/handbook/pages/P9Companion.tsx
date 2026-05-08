import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";

interface Props {
  recordIdTail: string;
}

export function P9Companion({ recordIdTail }: Props) {
  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page="9">
      <HandbookHeader title="长期陪伴" />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 12px 0" }}>这本手册不是终点</h2>
      <p style={{ color: "hsl(var(--muted-foreground))", margin: "0 0 24px 0", fontSize: "14px", lineHeight: 1.8 }}>
        7 天结束后，状态可能反复。这很正常——身体和情绪从来不是一次调整就稳定的。
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
        {[
          { t: "随时找顾问", d: "扫描上一页二维码加企微，复诊式跟进，不打扰、不催。" },
          { t: "每月一次复测", d: "比较 30 天前的自己，看哪些指标真的稳了。" },
          { t: "进入小群", d: "20-30 人同频小群，听听别人是怎么走过来的。" },
          { t: "1v1 复盘", d: "训练营第 7 天有 1v1 复盘，可单独再约 1 次深度。" },
        ].map((it, i) => (
          <div
            key={i}
            style={{
              padding: "16px 18px",
              borderRadius: "8px",
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>{it.t}</div>
            <div style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", lineHeight: 1.7 }}>{it.d}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "24px",
          borderRadius: "10px",
          background: "hsl(var(--muted) / 0.4)",
          fontSize: "13px",
          color: "hsl(var(--muted-foreground))",
          textAlign: "center",
          lineHeight: 1.8,
        }}
      >
        本手册由 AI 个性化生成，仅供参考，不替代专业医疗或心理咨询。<br />
        如出现持续胸痛、自伤念头等紧急情况，请立即就医或拨打 12320。
      </div>

      <HandbookFooter pageNumber={9} totalPages={9} recordIdTail={recordIdTail} />
    </div>
  );
}
