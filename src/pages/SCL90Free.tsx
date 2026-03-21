import { useState, useCallback } from "react";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { 
  SCL90QuestionsLite, 
  SCL90Result as SCL90ResultComponent, 
  calculateSCL90Result 
} from "@/components/scl90";
import type { SCL90Result } from "@/components/scl90/scl90Data";

type PageState = "questions" | "result";

export default function SCL90FreePage() {
  const [pageState, setPageState] = useState<PageState>("questions");
  const [currentResult, setCurrentResult] = useState<SCL90Result | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});

  const handleComplete = useCallback((answers: Record<number, number>) => {
    const result = calculateSCL90Result(answers);
    setCurrentResult(result);
    setCurrentAnswers(answers);
    setPageState("result");
  }, []);

  const handleRetake = useCallback(() => {
    setCurrentResult(null);
    setCurrentAnswers({});
    setPageState("questions");
  }, []);

  const handleExit = useCallback(() => {
    setPageState("questions");
  }, []);

  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-background"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <DynamicOGMeta pageKey="scl90Lite" />

      {pageState === "questions" && (
        <SCL90QuestionsLite 
          onComplete={handleComplete} 
          onExit={handleExit}
          showFooterInfo={false}
        />
      )}

      {pageState === "result" && currentResult && (
        <SCL90ResultComponent 
          result={currentResult}
          answers={currentAnswers}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}
