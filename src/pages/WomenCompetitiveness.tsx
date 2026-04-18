import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CompetitivenessQuestions } from "@/components/women-competitiveness/CompetitivenessQuestions";
import { CompetitivenessResult } from "@/components/women-competitiveness/CompetitivenessResult";
import { CompetitivenessHistory } from "@/components/women-competitiveness/CompetitivenessHistory";
import { CompetitivenessStartScreen } from "@/components/women-competitiveness/CompetitivenessStartScreen";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { CompetitivenessResult as ResultType, FollowUpAnswer, CompetitivenessCategory } from "@/components/women-competitiveness/competitivenessData";
import { useAuth } from "@/hooks/useAuth";
import { useDynamicAssessmentPurchase } from "@/hooks/useDynamicAssessmentPurchase";

type Phase = "start" | "questions" | "result" | "history";

const PACKAGE_KEY = "women_competitiveness_assessment";

export default function WomenCompetitiveness() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: purchaseRecord, isLoading: purchaseLoading, refetch: refetchPurchase } =
    useDynamicAssessmentPurchase(PACKAGE_KEY);
  const hasPurchased = !!purchaseRecord;

  const [phase, setPhase] = useState<Phase>("start");
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [followUpInsights, setFollowUpInsights] = useState<FollowUpAnswer[] | undefined>();
  const [historyAssessmentId, setHistoryAssessmentId] = useState<string | undefined>();
  const [preloadedAiAnalysis, setPreloadedAiAnalysis] = useState<string | null>(null);

  const isLoading = authLoading || purchaseLoading;

  // 🔒 付费墙守门：未登录 → 跳登录；未付费 → 拉支付弹窗；已付费 → 进入答题
  const handleStart = () => {
    if (!user) {
      toast.error("请先登录");
      navigate("/auth?redirect=/women-competitiveness");
      return;
    }
    if (!hasPurchased) {
      setShowPayDialog(true);
      return;
    }
    setPhase("questions");
  };

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

  const handlePaymentSuccess = () => {
    setShowPayDialog(false);
    refetchPurchase();
    setPhase("questions");
  };

  if (phase === "history") {
    return (
      <CompetitivenessHistory
        onBack={() => setPhase("start")}
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
          setPhase("start");
          setResult(null);
          setAnswers({});
          setFollowUpInsights(undefined);
          setHistoryAssessmentId(undefined);
          setPreloadedAiAnalysis(null);
        }}
      />
    );
  }

  if (phase === "questions") {
    return (
      <>
        <DynamicOGMeta pageKey="womenCompetitiveness" />
        <CompetitivenessQuestions
          onComplete={handleComplete}
          onExit={() => setPhase("start")}
          onHistory={() => setPhase("history")}
        />
      </>
    );
  }

  // 默认 'start' phase：付费墙启动屏
  return (
    <>
      <DynamicOGMeta pageKey="womenCompetitiveness" />
      {isLoading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-purple-50">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">正在加载...</p>
        </div>
      ) : (
        <CompetitivenessStartScreen
          onStart={handleStart}
          onHistory={() => setPhase("history")}
        />
      )}

      <AssessmentPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        onSuccess={handlePaymentSuccess}
        userId={user?.id}
        hasPurchased={hasPurchased}
        packageKey={PACKAGE_KEY}
        packageName="35+女性竞争力测评"
        returnUrl="/women-competitiveness"
      />
    </>
  );
}
