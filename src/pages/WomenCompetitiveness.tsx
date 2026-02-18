import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompetitivenessQuestions } from "@/components/women-competitiveness/CompetitivenessQuestions";
import { CompetitivenessResult } from "@/components/women-competitiveness/CompetitivenessResult";
import { CompetitivenessHistory } from "@/components/women-competitiveness/CompetitivenessHistory";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { CompetitivenessResult as ResultType, FollowUpAnswer, CompetitivenessCategory } from "@/components/women-competitiveness/competitivenessData";

type Phase = "questions" | "result" | "history";

export default function WomenCompetitiveness() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("questions");
  const [result, setResult] = useState<ResultType | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [followUpInsights, setFollowUpInsights] = useState<FollowUpAnswer[] | undefined>();
  const [historyAssessmentId, setHistoryAssessmentId] = useState<string | undefined>();
  const [preloadedAiAnalysis, setPreloadedAiAnalysis] = useState<string | null>(null);

  const handleComplete = (res: ResultType, ans: Record<number, number>, insights?: FollowUpAnswer[]) => {
    setResult(res);
    setAnswers(ans);
    setFollowUpInsights(insights);
    setHistoryAssessmentId(undefined);
    setPreloadedAiAnalysis(null);
    setPhase("result");
  };

  const handleViewHistoryReport = (assessment: any) => {
    setResult({
      totalScore: assessment.total_score,
      level: assessment.level,
      categoryScores: assessment.category_scores as Record<CompetitivenessCategory, number>,
      strongestCategory: assessment.strongest_category as CompetitivenessCategory,
      weakestCategory: assessment.weakest_category as CompetitivenessCategory,
    });
    setAnswers(assessment.answers || {});
    setFollowUpInsights(assessment.follow_up_insights || undefined);
    setHistoryAssessmentId(assessment.id);
    setPreloadedAiAnalysis(assessment.ai_analysis || null);
    setPhase("result");
  };

  if (phase === "history") {
    return (
      <CompetitivenessHistory
        onBack={() => setPhase("questions")}
        onViewReport={handleViewHistoryReport}
      />
    );
  }

  if (phase === "result" && result) {
    return (
      <CompetitivenessResult
        result={result}
        answers={answers}
        followUpInsights={followUpInsights}
        assessmentId={historyAssessmentId}
        preloadedAiAnalysis={preloadedAiAnalysis}
        onBack={() => {
          setPhase("questions");
          setResult(null);
          setAnswers({});
          setFollowUpInsights(undefined);
          setHistoryAssessmentId(undefined);
          setPreloadedAiAnalysis(null);
        }}
      />
    );
  }

  return (
    <>
      <DynamicOGMeta pageKey="womenCompetitiveness" />
      <CompetitivenessQuestions
        onComplete={handleComplete}
        onExit={() => navigate(-1)}
        onHistory={() => setPhase("history")}
      />
    </>
  );
}
