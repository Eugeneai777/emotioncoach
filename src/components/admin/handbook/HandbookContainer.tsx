import { forwardRef } from "react";
import { P1Cover } from "./pages/P1Cover";
import { P2AssessmentOverview } from "./pages/P2AssessmentOverview";
import { HandbookVariantProvider } from "./shared/HandbookFooter";
import { P2ScenarioBreakdown, type ScenarioCardData } from "./pages/P2ScenarioBreakdown";
import { P3Strengths } from "./pages/P3Strengths";
import { P4Risks } from "./pages/P4Risks";
import { HandbookDayPage, type DayCard } from "./pages/HandbookDayPage";
import { P8Day7Invite } from "./pages/P8Day7Invite";
import { P9Companion } from "./pages/P9Companion";

export const HANDBOOK_TOTAL_PAGES = 11;

const MALE_LABEL: Record<string, string> = {
  energy: "精力续航",
  sleep: "睡眠修复",
  stress: "压力内耗",
  confidence: "信心",
  relationship: "关系温度",
  recovery: "恢复阻力",
};
const FEMALE_PATTERN_LABEL: Record<string, string> = {
  exhaustion: "情绪耗竭",
  tension: "紧绷绷紧",
  suppression: "压抑收回",
  avoidance: "回避卡住",
  energy_index: "精力指数",
  anxiety_index: "焦虑指数",
  stress_index: "压力指数",
};
const WOMEN_COMP_LABEL: Record<string, string> = {
  career: "职场生命力",
  brand: "个人品牌力",
  resilience: "情绪韧性",
  finance: "财务掌控力",
  relationship: "关系资本",
};
const MIDLIFE_LABEL: Record<string, string> = {
  internalFriction: "内耗循环",
  selfWorth: "价值松动",
  actionStagnation: "行动停滞",
  supportSystem: "支持系统",
  regretRisk: "后悔风险",
  missionClarity: "使命清晰",
};

export interface HandbookData {
  type: "male_vitality" | "emotion_health" | "women_competitiveness" | "midlife_awakening";
  recordId: string;
  displayName: string;
  assessmentDate: string;
  weakestLabel: string;
  totalScore?: number | null;
  clusters: ScenarioCardData[];
  strengths: string[];
  risks: string[];
  /** 7 天，分到 P6/P7/P8：Day1-2 / Day3-4 / Day5-6，Day7 单独放 P9 头部 */
  days: DayCard[];
  campName: string;
  campIntro: string;
  campValues: string[];
  whyNotAlone: string;
  ctaHint: string;
  coverNote: string;
  day7Reflection: string;
  /** 已归一化的维度分（key → 0-100） */
  dims?: Record<string, number>;
  /** 完整 AI 解读（取自 ai_insight / ai_analysis） */
  aiInsightsFull?: string;
}

export const HandbookContainer = forwardRef<HTMLDivElement, { data: HandbookData }>(
  function HandbookContainer({ data }, ref) {
    const tail = data.recordId.replace(/-/g, "").slice(-8);
    const d = data.days;
    const labelMap = data.type === "male_vitality" ? MALE_LABEL : FEMALE_PATTERN_LABEL;
    const dims = data.dims || {};
    const fallback =
      [data.coverNote, ...data.risks, ...data.strengths]
        .filter(Boolean)
        .join("\n\n") || "本次答题已完整记录，AI 解读将在下次刷新后写回。";
    return (
      <div
        ref={ref}
        data-export-root
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          background: "hsl(var(--background))",
        }}
      >
        <HandbookVariantProvider variant={data.type}>
        <P1Cover
          type={data.type}
          displayName={data.displayName}
          assessmentDate={data.assessmentDate}
          recordIdTail={tail}
          coverNote={data.coverNote}
          weakestLabel={data.weakestLabel}
          totalScore={data.totalScore}
        />
        <P2AssessmentOverview
          recordIdTail={tail}
          totalPages={HANDBOOK_TOTAL_PAGES}
          dims={dims}
          labelMap={labelMap}
          aiInsightsFull={data.aiInsightsFull || ""}
          fallbackText={fallback}
          type={data.type}
        />
        <P2ScenarioBreakdown recordIdTail={tail} clusters={data.clusters} pageNumber={3} totalPages={HANDBOOK_TOTAL_PAGES} />
        <P3Strengths recordIdTail={tail} strengths={data.strengths} pageNumber={4} totalPages={HANDBOOK_TOTAL_PAGES} />
        <P4Risks recordIdTail={tail} risks={data.risks} pageNumber={5} totalPages={HANDBOOK_TOTAL_PAGES} />
        {(() => {
          const isFemale = data.type === "emotion_health";
          const t12 = isFemale ? "Day 1-2 · 先回到自己" : "Day 1-2 · 先看见";
          const t34 = isFemale ? "Day 3-4 · 把'应该'放下一格" : "Day 3-4 · 动一点点";
          const t56 = isFemale ? "Day 5-6 · 让一个人看见你" : "Day 5-6 · 让一个人靠近";
          const t7 = isFemale ? "Day 7 · 回头看自己走了多远" : "Day 7 · 回头看，向前走";
          return (
            <>
              <HandbookDayPage recordIdTail={tail} pageNumber={6} totalPages={HANDBOOK_TOTAL_PAGES} pageTitle={t12} days={d.slice(0, 2)} />
              <HandbookDayPage recordIdTail={tail} pageNumber={7} totalPages={HANDBOOK_TOTAL_PAGES} pageTitle={t34} days={d.slice(2, 4)} />
              <HandbookDayPage recordIdTail={tail} pageNumber={8} totalPages={HANDBOOK_TOTAL_PAGES} pageTitle={t56} days={d.slice(4, 6)} />
              <HandbookDayPage
                recordIdTail={tail}
                pageNumber={9}
                totalPages={HANDBOOK_TOTAL_PAGES}
                pageTitle={t7}
                days={d.slice(6, 7)}
                summary={data.day7Reflection}
              />
            </>
          );
        })()}
        <P8Day7Invite
          recordIdTail={tail}
          pageNumber={10}
          totalPages={HANDBOOK_TOTAL_PAGES}
          campName={data.campName}
          intro={data.campIntro}
          values={data.campValues}
          whyNotAlone={data.whyNotAlone}
          ctaHint={data.ctaHint}
          day7Reflection={data.day7Reflection}
        />
        <P9Companion recordIdTail={tail} pageNumber={11} totalPages={HANDBOOK_TOTAL_PAGES} />
        </HandbookVariantProvider>
      </div>
    );
  },
);
