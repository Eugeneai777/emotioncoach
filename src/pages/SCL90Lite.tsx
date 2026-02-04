import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSCL90Purchase } from "@/hooks/useSCL90Purchase";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { 
  SCL90QuestionsLite, 
  SCL90Result as SCL90ResultComponent, 
  SCL90PayDialog,
  calculateSCL90Result 
} from "@/components/scl90";
import type { SCL90Result } from "@/components/scl90/scl90Data";

type PageState = "questions" | "result";

export default function SCL90LitePage() {
  const [pageState, setPageState] = useState<PageState>("questions");
  const [currentResult, setCurrentResult] = useState<SCL90Result | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [showPayDialog, setShowPayDialog] = useState(false);
  
  const { user } = useAuth();
  const { data: purchaseRecord, refetch: refetchPurchase } = useSCL90Purchase();
  const hasPurchased = !!purchaseRecord;
  
  // 完成测评回调
  const handleComplete = useCallback((answers: Record<number, number>) => {
    const result = calculateSCL90Result(answers);
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
    console.log("[SCL90Lite] Payment success for user:", userId);
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
      <DynamicOGMeta pageKey="scl90Lite" />
      
      {/* 测评页 */}
      {pageState === "questions" && (
        <SCL90QuestionsLite 
          onComplete={handleComplete} 
          onExit={handleExit}
          showFooterInfo={!hasPurchased}
        />
      )}
      
      {/* 结果页 */}
      {pageState === "result" && currentResult && (
        <SCL90ResultComponent 
          result={currentResult}
          answers={currentAnswers}
          onRetake={handleRetake}
        />
      )}
      
      {/* 付费弹窗 */}
      {currentResult && (
        <SCL90PayDialog
          open={showPayDialog}
          onOpenChange={setShowPayDialog}
          onSuccess={handlePaymentSuccess}
          userId={user?.id}
          pendingAnswers={currentAnswers}
          pendingResult={currentResult}
        />
      )}
    </div>
  );
}
