import { forwardRef, useMemo } from "react";
import {
  getStatusBand,
  getDeltaCopy,
  getActionForWeakestDimension,
  getStatusLabel,
} from "@/config/maleMidlifeVitalityCopy";

interface DimensionScore {
  key?: string;
  score: number;
  maxScore: number;
  label: string;
  emoji: string;
  rawScore?: number;
  rawMaxScore?: number;
}

interface MaleVitalityReportCardProps {
  totalScorePct: number; // 0-100 翻转后的"状态电量"
  dimensionScores: DimensionScore[]; // 已翻转
  primaryPattern?: { label?: string; description?: string } | null;
  aiInsight?: string | null;
  displayName?: string;
  testedAt: string; // ISO date string
}

const BAND_COLOR: Record<"full" | "half" | "low", { bg: string; text: string; bar: string }> = {
  full: { bg: "#ECFDF5", text: "#047857", bar: "#10B981" },
  half: { bg: "#FFFBEB", text: "#B45309", bar: "#F59E0B" },
  low: { bg: "#FFF1F2", text: "#BE123C", bar: "#F43F5E" },
};

/**
 * A4 比例（750×1060+，自适应内容高度）私密报告卡。
 * 通过 inline styles 兼容 html2canvas（不依赖 Tailwind 计算样式）。
 * 渲染时放在 left:-9999px 离屏位置；导出时 html2canvas 直接截屏。
 */
const MaleVitalityReportCard = forwardRef<HTMLDivElement, MaleVitalityReportCardProps>(
  ({ totalScorePct, dimensionScores, primaryPattern, aiInsight, displayName, testedAt }, ref) => {
    const band = getStatusBand(totalScorePct);
    const colorSet = BAND_COLOR[band.level];

    const sortedDims = useMemo(() => {
      // 按状态指数升序（弱的在前），便于"先看哪一项"
      return [...dimensionScores].sort((a, b) => a.score - b.score);
    }, [dimensionScores]);

    const weakest = sortedDims[0];
    const weeklyAction = weakest ? getActionForWeakestDimension(weakest.label) : "";

    const dateStr = (() => {
      try {
        const d = new Date(testedAt);
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
      } catch {
        return testedAt;
      }
    })();

    return (
      <div
        ref={ref}
        data-export-root
        style={{
          width: "750px",
          background: "#FFFFFF",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
          color: "#1F2937",
          padding: "48px 56px",
          boxSizing: "border-box",
        }}
      >
        {/* 报告头 */}
        <div style={{ borderBottom: "1px solid #E5E7EB", paddingBottom: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", letterSpacing: 1 }}>PRIVATE REPORT</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>男人有劲状态报告</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "#6B7280" }}>
              <div>{displayName || "本人"}</div>
              <div style={{ marginTop: 2 }}>{dateStr}</div>
            </div>
          </div>
        </div>

        {/* 总分电量条 */}
        <div
          style={{
            background: colorSet.bg,
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: colorSet.text, fontWeight: 600 }}>
                {band.headline}
              </div>
              <div style={{ fontSize: 13, color: "#4B5563", marginTop: 6, lineHeight: 1.5 }}>
                {band.subline}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: colorSet.text, lineHeight: 1 }}>
                {totalScorePct}
                <span style={{ fontSize: 18, marginLeft: 4 }}>%</span>
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>状态电量</div>
            </div>
          </div>
          {/* 电量进度条 */}
          <div
            style={{
              height: 8,
              background: "#FFFFFF",
              borderRadius: 4,
              marginTop: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max(2, totalScorePct)}%`,
                height: "100%",
                background: colorSet.bar,
                borderRadius: 4,
              }}
            />
          </div>
        </div>

        {/* 6 维明细 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📊 六维状态明细</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {sortedDims.map((d) => {
              const lifeLabel = getStatusLabel(d.label);
              // delta 在导出场景没有上次数据；用得分百分比反推一句话状态
              const tone = d.score >= 70 ? "up" : d.score < 50 ? "down" : "flat";
              const oneLine = getDeltaCopy(d.label, tone === "up" ? 5 : tone === "down" ? -5 : 0);
              const dimColor =
                d.score >= 70 ? "#047857" : d.score >= 50 ? "#B45309" : "#BE123C";
              return (
                <div
                  key={d.label}
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: 12,
                    padding: 14,
                    background: "#FAFAFA",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      <span style={{ marginRight: 4 }}>{d.emoji}</span>
                      {d.label}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: dimColor }}>{d.score}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                    生活化解读：{lifeLabel}
                  </div>
                  <div style={{ fontSize: 12, color: "#374151", marginTop: 6, lineHeight: 1.5 }}>
                    {oneLine}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 本周一个动作 */}
        {weakest && (
          <div
            style={{
              background: "#F0F9FF",
              border: "1px solid #BAE6FD",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0369A1", marginBottom: 6 }}>
              🎯 本周只做一件事
            </div>
            <div style={{ fontSize: 13, color: "#0C4A6E", lineHeight: 1.6 }}>{weeklyAction}</div>
          </div>
        )}

        {/* AI 解读 */}
        {aiInsight && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>🧠 AI 个性化洞察</div>
            <div
              style={{
                fontSize: 13,
                color: "#374151",
                lineHeight: 1.8,
                background: "#FAFAFA",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: "16px 20px",
                whiteSpace: "pre-wrap",
              }}
            >
              {aiInsight}
            </div>
          </div>
        )}

        {/* 主导模式 */}
        {primaryPattern?.label && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: "#6B7280" }}>当前主导状态</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              {primaryPattern.label}
            </div>
            {primaryPattern.description && (
              <div style={{ fontSize: 12, color: "#4B5563", marginTop: 6, lineHeight: 1.6 }}>
                {primaryPattern.description}
              </div>
            )}
          </div>
        )}

        {/* 免责声明 + 水印 */}
        <div
          style={{
            borderTop: "1px solid #E5E7EB",
            paddingTop: 16,
            marginTop: 8,
            fontSize: 11,
            color: "#9CA3AF",
            lineHeight: 1.6,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            ⚠️ 本报告仅供个人状态参考，非医学诊断。如持续出现身体不适或情绪困扰，建议及时咨询专业医生。
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <span>报告由「优劲」AI 生成 · 仅供本人使用</span>
            <span>{dateStr}</span>
          </div>
        </div>
      </div>
    );
  },
);

MaleVitalityReportCard.displayName = "MaleVitalityReportCard";

export default MaleVitalityReportCard;
