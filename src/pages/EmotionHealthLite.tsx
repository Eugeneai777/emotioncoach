import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEmotionHealthPurchase } from "@/hooks/useEmotionHealthPurchase";
import { EmotionHealthQuestionsLite } from "@/components/emotion-health/EmotionHealthQuestionsLite";
import { EmotionHealthResult, calculateEmotionHealthResult } from "@/components/emotion-health";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import type { EmotionHealthResultType } from "@/components/emotion-health";

type PageState = "questions" | "result";

export default function EmotionHealthLitePage() {
  const [pageState, setPageState] = useState<PageState>("questions");
  const [currentResult, setCurrentResult] = useState<EmotionHealthResultType | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [showPayDialog, setShowPayDialog] = useState(false);
  
  const { user } = useAuth();
  const { data: purchaseRecord, refetch: refetchPurchase } = useEmotionHealthPurchase();
  const hasPurchased = !!purchaseRecord;
  
  // 完成测评回调
  const handleComplete = useCallback((answers: Record<number, number>) => {
    const result = calculateEmotionHealthResult(answers);
    setCurrentResult(result);
    setCurrentAnswers(answers);
    
    if (hasPurchased) {
      setPageState("result");
    } else {
      // 显示付费弹窗
      setShowPayDialog(true);
    }
  }, [hasPurchased]);
  
  // 支付成功回调
  const handlePaymentSuccess = useCallback((userId: string) => {
    console.log("[EmotionHealthLite] Payment success for user:", userId);
    setShowPayDialog(false);
    refetchPurchase();
    setPageState("result");
  }, [refetchPurchase]);

  // 重新测评
  const handleRetake = useCallback(() => {
    setCurrentResult(null);
    setCurrentAnswers({});
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
        <EmotionHealthQuestionsLite 
          onComplete={handleComplete} 
          onExit={handleExit}
          skipStartScreen={true}
          showFooterInfo={!hasPurchased}
        />
      )}
      
      {/* 结果页 */}
      {pageState === "result" && currentResult && (
        <EmotionHealthResult 
          result={currentResult} 
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
        packageKey="emotion_health_assessment"
        packageName="情绪健康测评"
      />
    </div>
  );
}
