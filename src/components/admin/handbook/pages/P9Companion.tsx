import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";
import { ArcDivider } from "../shared/HandbookMotifs";

interface Props {
  recordIdTail: string;
  pageNumber?: number;
  totalPages?: number;
}

export function P9Companion({ recordIdTail, pageNumber = 10, totalPages = 10 }: Props) {
  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page={pageNumber}>
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
          marginTop: "32px",
          padding: "22px 24px",
          borderLeft: "3px solid hsl(var(--primary))",
          background: "hsl(var(--primary) / 0.04)",
          borderRadius: "0 8px 8px 0",
        }}
      >
        <div
          style={{
            fontFamily: '"ZCOOL XiaoWei", "Ma Shan Zheng", "PingFang SC", serif',
            fontSize: "17px",
            color: "hsl(var(--foreground))",
            lineHeight: 1.85,
          }}
        >
          这本手册不是治疗，是一个朋友在你旁边坐了 7 天。
          <br />
          之后我们也还在。
        </div>
        <div
          style={{
            marginTop: "10px",
            fontSize: "12px",
            color: "hsl(var(--muted-foreground))",
            textAlign: "right",
          }}
        >
          — 有劲 AI 团队
        </div>
      </div>

      <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", opacity: 0.7 }}>
        <ArcDivider width={200} />
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "18px 22px",
          borderRadius: "10px",
          background: "hsl(var(--muted) / 0.4)",
          fontSize: "12px",
          color: "hsl(var(--muted-foreground))",
          textAlign: "center",
          lineHeight: 1.8,
        }}
      >
        本手册由 AI 个性化生成，仅供参考，不替代专业医疗或心理咨询。<br />
        如出现持续胸痛、自伤念头等紧急情况，请立即就医或拨打 12320。
      </div>

      <HandbookFooter pageNumber={pageNumber} totalPages={totalPages} recordIdTail={recordIdTail} />
    </div>
  );
}
