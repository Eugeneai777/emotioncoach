import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import PageHeader from "@/components/PageHeader";
import { 
  SCL90StartScreen, 
  SCL90Questions, 
  SCL90Result, 
  SCL90HistoryPage 
} from "@/components/scl90";
import { SCL90Result as SCL90ResultType } from "@/components/scl90/scl90Data";

type PageState = "start" | "questions" | "result" | "history";

const SCL90Page = () => {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("start");
  const [resultData, setResultData] = useState<{
    result: SCL90ResultType;
    answers: Record<number, number>;
  } | null>(null);

  const handleStart = () => {
    setPageState("questions");
  };

  const handleComplete = (result: SCL90ResultType, answers: Record<number, number>) => {
    setResultData({ result, answers });
    setPageState("result");
  };

  const handleViewHistory = () => {
    setPageState("history");
  };

  const handleRetake = () => {
    setResultData(null);
    setPageState("questions");
  };

  const handleBackToStart = () => {
    setResultData(null);
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
      
      {pageState !== "questions" && (
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
