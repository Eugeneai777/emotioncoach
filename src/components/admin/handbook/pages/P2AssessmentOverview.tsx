import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { HANDBOOK_PAGE_STYLE } from "../handbookStyles";
import { HandbookHeader } from "../shared/HandbookHeader";
import { HandbookFooter } from "../shared/HandbookFooter";

interface Props {
  recordIdTail: string;
  totalPages: number;
  /** 已归一化的维度分（key → 0-100） */
  dims: Record<string, number>;
  /** key → 中文标签 */
  labelMap: Record<string, string>;
  /** 完整 AI 解读（300-450 字） */
  aiInsightsFull: string;
  /** 兜底文案，用在 AI 解读为空时 */
  fallbackText: string;
  /** 手册类型，控制小标题口吻 */
  type?: "male_vitality" | "emotion_health";
}

function clamp(n: number, min = 0, max = 100) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

export function P2AssessmentOverview({
  recordIdTail,
  totalPages,
  dims,
  labelMap,
  aiInsightsFull,
  fallbackText,
  type,
}: Props) {
  const entries = Object.entries(dims);
  const radarData = entries.map(([k, v]) => ({
    subject: labelMap[k] || k,
    value: clamp(v),
  }));

  const insight = (aiInsightsFull || "").trim() || fallbackText;

  return (
    <div style={HANDBOOK_PAGE_STYLE} data-page="2">
      <HandbookHeader title="第一章 · 测评全景" />
      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 6px 0" }}>
        这次答题的整体画像
      </h2>
      <p
        style={{
          color: "hsl(var(--muted-foreground))",
          margin: "0 0 18px 0",
          fontSize: "13px",
        }}
      >
        左边是你各个面向的雷达图，右边是分数明细。下方一段，是 AI 看完你这次答题给你的话。
      </p>

      {/* 上半：雷达 + 条形分数 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "20px",
          marginBottom: "14px",
          breakInside: "avoid",
        }}
      >
        <div
          style={{
            width: "320px",
            height: "260px",
            background: "#ffffff",
            borderRadius: "10px",
            border: "1px solid hsl(var(--border))",
            padding: "8px",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              />
              <Radar
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.35}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {entries.map(([k, vRaw]) => {
            const v = clamp(vRaw);
            const tone =
              v >= 70
                ? "hsl(var(--primary))"
                : v >= 40
                  ? "hsl(var(--muted-foreground))"
                  : "hsl(var(--destructive))";
            return (
              <div key={k}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}>
                    {labelMap[k] || k}
                  </span>
                  <span style={{ color: tone, fontWeight: 600 }}>{Math.round(v)}</span>
                </div>
                <div
                  style={{
                    height: "6px",
                    width: "100%",
                    background: "hsl(var(--muted))",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${v}%`,
                      background: tone,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 下半：AI 完整解读 */}
      <div
        style={{
          position: "relative",
          padding: "14px 16px",
          borderRadius: "10px",
          background: "hsl(var(--muted) / 0.4)",
          border: "1px solid hsl(var(--border))",
          fontSize: "13px",
          lineHeight: 1.78,
          color: "hsl(var(--foreground))",
          whiteSpace: "pre-wrap",
          breakInside: "avoid",
          maxHeight: "560px",
          overflow: "hidden",
          marginBottom: "88px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "hsl(var(--muted-foreground))",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          AI 完整解读
        </div>
        {insight}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "48px",
            background:
              "linear-gradient(to bottom, transparent, hsl(var(--background)) 90%)",
            pointerEvents: "none",
          }}
        />
      </div>

      <HandbookFooter pageNumber={2} totalPages={totalPages} recordIdTail={recordIdTail} />
    </div>
  );
}
