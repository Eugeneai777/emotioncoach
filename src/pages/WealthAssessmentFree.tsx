import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { WealthBlockQuestions } from "@/components/wealth-block/WealthBlockQuestions";
import { WealthBlockResult } from "@/components/wealth-block/WealthBlockResult";
import { AssessmentResult, FollowUpAnswer } from "@/components/wealth-block/wealthBlockData";
import { DeepFollowUpAnswer } from "@/components/wealth-block/DeepFollowUpDialog";
import { useFooterHeight } from "@/hooks/useFooterHeight";
import { useAuth } from "@/hooks/useAuth";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import { toast } from "sonner";

function FreeFooter() {
  const { footerRef } = useFooterHeight();
  return (
    <div
      ref={footerRef}
      className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t py-3 px-4"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <p className="text-muted-foreground text-xs text-center">
        北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
      </p>
    </div>
  );
}

type PageState = "questions" | "result";

export default function WealthAssessmentFreePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pageState, setPageState] = useState<PageState>("questions");
  const [currentResult, setCurrentResult] = useState<AssessmentResult | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [followUpInsights, setFollowUpInsights] = useState<FollowUpAnswer[]>([]);
  const [deepFollowUpAnswers, setDeepFollowUpAnswers] = useState<DeepFollowUpAnswer[]>([]);

  // 完成测评回调 — 直接展示结果，无需付费
  const handleComplete = useCallback((
    result: AssessmentResult,
    answers: Record<number, number>,
    insights?: FollowUpAnswer[],
    deepAnswers?: DeepFollowUpAnswer[]
  ) => {
    setCurrentResult(result);
    setCurrentAnswers(answers);
    if (insights) setFollowUpInsights(insights);
    if (deepAnswers) setDeepFollowUpAnswers(deepAnswers);
    setPageState("result");
  }, []);

  // 重新测评
  const handleRetake = useCallback(() => {
    setCurrentResult(null);
    setCurrentAnswers({});
    setFollowUpInsights([]);
    setDeepFollowUpAnswers([]);
    setPageState("questions");
  }, []);

  // 退出测评
  const handleExit = useCallback(() => {
    setPageState("questions");
  }, []);

  // 购买前检查登录状态
  const handleAuthRequired = useCallback((): boolean => {
    if (user) return true;
    toast.info("请先登录后再购买训练营");
    setPostAuthRedirect(window.location.pathname + window.location.search);
    navigate("/auth");
    return false;
  }, [user, navigate]);

  return (
    <div
      className="h-screen overflow-y-auto overscroll-contain bg-background"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <DynamicOGMeta pageKey="wealthAssessmentLite" />

      {pageState === "questions" && (
        <WealthBlockQuestions
          onComplete={handleComplete}
          onExit={handleExit}
          skipStartScreen={true}
          showFooterInfo={false}
        />
      )}

      {pageState === "result" && currentResult && (
        <WealthBlockResult
          result={currentResult}
          followUpInsights={followUpInsights}
          deepFollowUpAnswers={deepFollowUpAnswers}
          onRetake={handleRetake}
          onAuthRequired={handleAuthRequired}
        />
      )}
      {/* 公司信息和ICP备案 — 参考 LiteFooter 样式 */}
      <FreeFooter />
    </div>
  );
}
