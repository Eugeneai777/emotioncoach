import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import PageHeader from "@/components/PageHeader";
import { 
  SCL90StartScreen, 
  SCL90Questions, 
  SCL90Result, 
  SCL90HistoryPage,
  SCL90PaymentGate 
} from "@/components/scl90";
import { SCL90Result as SCL90ResultType } from "@/components/scl90/scl90Data";
import { useSCL90Purchase } from "@/hooks/useSCL90Purchase";
import { useAuth } from "@/hooks/useAuth";

type PageState = "start" | "questions" | "payment" | "result" | "history";

const SCL90Page = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: purchaseData, isLoading: isPurchaseLoading } = useSCL90Purchase();
  
  const [pageState, setPageState] = useState<PageState>("start");
  const [resultData, setResultData] = useState<{
    result: SCL90ResultType;
    answers: Record<number, number>;
  } | null>(null);
  
  // 待处理的答题结果（用于支付流程）
  const [pendingResult, setPendingResult] = useState<{
    result: SCL90ResultType;
    answers: Record<number, number>;
  } | null>(null);

  // 是否已购买过
  const hasPurchased = !!purchaseData;

  const handleStart = () => {
    setPageState("questions");
  };

  const handleComplete = (result: SCL90ResultType, answers: Record<number, number>) => {
    // 先保存待处理结果
    setPendingResult({ result, answers });
    
    // 检查是否已购买
    if (hasPurchased) {
      // 已购买：直接显示结果
      setResultData({ result, answers });
      setPageState("result");
    } else {
      // 未购买：进入付费墙
      setPageState("payment");
    }
  };

  const handlePaymentSuccess = (userId: string) => {
    // 支付成功：显示结果
    if (pendingResult) {
      setResultData(pendingResult);
      setPendingResult(null);
      setPageState("result");
    }
  };

  const handleViewHistory = () => {
    setPageState("history");
  };

  const handleRetake = () => {
    setResultData(null);
    setPendingResult(null);
    setPageState("questions");
  };

  const handleBackToStart = () => {
    setResultData(null);
    setPendingResult(null);
    setPageState("start");
  };

  // 历史页面单独渲染
  if (pageState === "history") {
    return (
      <div className="min-h-screen bg-background">
        <DynamicOGMeta pageKey="scl90" />
        <PageHeader title="SCL-90 测评历史" backTo="/scl90" />
        <main className="container max-w-2xl mx-auto px-3 py-4">
          <SCL90HistoryPage 
            onBack={handleBackToStart}
            onStartNew={handleStart}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DynamicOGMeta pageKey="scl90" />
      
      {pageState !== "questions" && pageState !== "payment" && (
        <PageHeader 
          title="SCL-90心理测评" 
          backTo="/energy-studio"
        />
      )}

      <main className="container max-w-2xl mx-auto px-3 py-4">
        {pageState === "start" && (
          <SCL90StartScreen 
            onStart={handleStart}
            onViewHistory={handleViewHistory}
          />
        )}

        {pageState === "questions" && (
          <SCL90Questions 
            onComplete={handleComplete}
            onExit={handleBackToStart}
          />
        )}

        {pageState === "payment" && pendingResult && (
          <SCL90PaymentGate
            result={pendingResult.result}
            answers={pendingResult.answers}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={handleBackToStart}
          />
        )}

        {pageState === "result" && resultData && (
          <SCL90Result 
            result={resultData.result}
            answers={resultData.answers}
            onRetake={handleRetake}
          />
        )}
      </main>
    </div>
  );
};

export default SCL90Page;
