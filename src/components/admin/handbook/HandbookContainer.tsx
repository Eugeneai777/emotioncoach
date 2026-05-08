import { forwardRef } from "react";
import { P1Cover } from "./pages/P1Cover";
import { P2ScenarioBreakdown, type ScenarioCardData } from "./pages/P2ScenarioBreakdown";
import { P3Strengths } from "./pages/P3Strengths";
import { P4Risks } from "./pages/P4Risks";
import { HandbookDayPage, type DayCard } from "./pages/HandbookDayPage";
import { P8Day7Invite } from "./pages/P8Day7Invite";
import { P9Companion } from "./pages/P9Companion";

export interface HandbookData {
  type: "male_vitality" | "emotion_health";
  recordId: string;
  displayName: string;
  assessmentDate: string;
  weakestLabel: string;
  totalScore?: number | null;
  clusters: ScenarioCardData[];
  strengths: string[];
  risks: string[];
  /** 7 天，分到 P5/P6/P7：Day1-2 / Day3-4 / Day5-6，Day7 单独放 P8 头部 */
  days: DayCard[];
  campName: string;
  campIntro: string;
  campValues: string[];
  whyNotAlone: string;
  ctaHint: string;
  coverNote: string;
  day7Reflection: string;
}

export const HandbookContainer = forwardRef<HTMLDivElement, { data: HandbookData }>(
  function HandbookContainer({ data }, ref) {
    const tail = data.recordId.replace(/-/g, "").slice(-8);
    const d = data.days;
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
        <P1Cover
          type={data.type}
          displayName={data.displayName}
          assessmentDate={data.assessmentDate}
          recordIdTail={tail}
          coverNote={data.coverNote}
          weakestLabel={data.weakestLabel}
          totalScore={data.totalScore}
        />
        <P2ScenarioBreakdown recordIdTail={tail} clusters={data.clusters} />
        <P3Strengths recordIdTail={tail} strengths={data.strengths} />
        <P4Risks recordIdTail={tail} risks={data.risks} />
        <HandbookDayPage recordIdTail={tail} pageNumber={5} pageTitle="Day 1-2 · 先看见" days={d.slice(0, 2)} />
        <HandbookDayPage recordIdTail={tail} pageNumber={6} pageTitle="Day 3-4 · 动一点点" days={d.slice(2, 4)} />
        <HandbookDayPage recordIdTail={tail} pageNumber={7} pageTitle="Day 5-6 · 让一个人靠近" days={d.slice(4, 6)} />
        <P8Day7Invite
          recordIdTail={tail}
          campName={data.campName}
          intro={data.campIntro}
          values={data.campValues}
          whyNotAlone={data.whyNotAlone}
          ctaHint={data.ctaHint}
          day7Reflection={data.day7Reflection}
        />
        <P9Companion recordIdTail={tail} />
      </div>
    );
  },
);
