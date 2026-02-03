import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAssessmentPurchase } from "@/hooks/useAssessmentPurchase";
import { LiteIntroCard } from "@/components/wealth-block/LiteIntroCard";
import { LiteFooter } from "@/components/wealth-block/LiteFooter";
import { WealthBlockQuestions } from "@/components/wealth-block/WealthBlockQuestions";
import { WealthBlockResult } from "@/components/wealth-block/WealthBlockResult";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import { AssessmentResult, FollowUpAnswer } from "@/components/wealth-block/wealthBlockData";
import { DeepFollowUpAnswer } from "@/components/wealth-block/DeepFollowUpDialog";

type PageState = "questions" | "result";

export default function WealthAssessmentLitePage() {
  const [pageState, setPageState] = useState<PageState>("questions");
  const [currentResult, setCurrentResult] = useState<AssessmentResult | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [followUpInsights, setFollowUpInsights] = useState<FollowUpAnswer[]>([]);
  const [deepFollowUpAnswers, setDeepFollowUpAnswers] = useState<DeepFollowUpAnswer[]>([]);
  const [showPayDialog, setShowPayDialog] = useState(false);
  
  const { user } = useAuth();
  const { data: purchaseRecord, refetch: refetchPurchase } = useAssessmentPurchase();
  const hasPurchased = !!purchaseRecord;
  
  // 完成测评回调
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
    
    if (hasPurchased) {
      setPageState("result");
    } else {
      // 显示付费弹窗
      setShowPayDialog(true);
    }
  }, [hasPurchased]);
  
  // 支付成功回调
  const handlePaymentSuccess = useCallback((userId: string) => {
    console.log("[WealthAssessmentLite] Payment success for user:", userId);
    setShowPayDialog(false);
    refetchPurchase();
    setPageState("result");
  }, [refetchPurchase]);

  // 重新测评
  const handleRetake = useCallback(() => {
    setCurrentResult(null);
    setCurrentAnswers({});
    setFollowUpInsights([]);
    setDeepFollowUpAnswers([]);
    setPageState("questions");
  }, []);

  // 退出测评 - 重新开始答题
  const handleExit = useCallback(() => {
    setPageState("questions");
  }, []);
  
  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-background"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* 测评页 */}
      {pageState === "questions" && (
        <WealthBlockQuestions 
          onComplete={handleComplete} 
          onExit={handleExit}
          skipStartScreen={true}
        />
      )}
      
      {/* 结果页 */}
      {pageState === "result" && currentResult && (
        <WealthBlockResult 
          result={currentResult} 
          followUpInsights={followUpInsights}
          deepFollowUpAnswers={deepFollowUpAnswers}
          onRetake={handleRetake}
        />
      )}
      
      {/* 付费弹窗 */}
      <AssessmentPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        onSuccess={handlePaymentSuccess}
        userId={user?.id}
        hasPurchased={hasPurchased}
        packageKey="wealth_block_assessment"
        packageName="财富卡点测评"
      />
    </div>
  );
}
