import { useState, useCallback } from "react";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { WealthBlockQuestions } from "@/components/wealth-block/WealthBlockQuestions";
import { WealthBlockResult } from "@/components/wealth-block/WealthBlockResult";
import { AssessmentResult, FollowUpAnswer } from "@/components/wealth-block/wealthBlockData";
import { DeepFollowUpAnswer } from "@/components/wealth-block/DeepFollowUpDialog";
import { useFooterHeight } from "@/hooks/useFooterHeight";

type PageState = "questions" | "result";

export default function WealthAssessmentFreePage() {
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
        />
      )}

      {/* 公司信息和ICP备案 */}
      <LiteFooter wechatUrl="https://mp.weixin.qq.com/s/your-wechat-url" />
    </div>
  );
}
