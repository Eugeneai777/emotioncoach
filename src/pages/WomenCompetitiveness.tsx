import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompetitivenessQuestions } from "@/components/women-competitiveness/CompetitivenessQuestions";
import { CompetitivenessResult } from "@/components/women-competitiveness/CompetitivenessResult";
import { CompetitivenessResult as ResultType, FollowUpAnswer } from "@/components/women-competitiveness/competitivenessData";

type Phase = "questions" | "result";

export default function WomenCompetitiveness() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("questions");
  const [result, setResult] = useState<ResultType | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [followUpInsights, setFollowUpInsights] = useState<FollowUpAnswer[] | undefined>();

  const handleComplete = (res: ResultType, ans: Record<number, number>, insights?: FollowUpAnswer[]) => {
    setResult(res);
    setAnswers(ans);
    setFollowUpInsights(insights);
    setPhase("result");
  };

  if (phase === "result" && result) {
    return (
      <CompetitivenessResult
        result={result}
        answers={answers}
        followUpInsights={followUpInsights}
        onBack={() => {
          setPhase("questions");
          setResult(null);
          setAnswers({});
          setFollowUpInsights(undefined);
        }}
      />
    );
  }

  return (
    <CompetitivenessQuestions
      onComplete={handleComplete}
      onExit={() => navigate(-1)}
    />
  );
}
