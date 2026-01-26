import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { 
  emotionHealthQuestions, 
  emotionHealthScoreLabels,
  getLayerProgress,
  layerConfig,
  type EmotionHealthQuestion
} from "./emotionHealthData";
import { LayerProgressIndicator, LayerLabel } from "./LayerProgressIndicator";
import { LayerTransitionCard } from "./LayerTransitionCard";

interface EmotionHealthQuestionsProps {
  answers: Record<number, number>;
  onAnswerChange: (questionId: number, value: number) => void;
  onComplete: () => void;
  onBack: () => void;
}

const QUESTIONS_PER_PAGE = 4;

export function EmotionHealthQuestions({
  answers,
  onAnswerChange,
  onComplete,
  onBack
}: EmotionHealthQuestionsProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [pendingTransitionKey, setPendingTransitionKey] = useState<'screening-pattern' | 'pattern-blockage' | null>(null);
  
  const totalPages = Math.ceil(emotionHealthQuestions.length / QUESTIONS_PER_PAGE);
  
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, emotionHealthQuestions.length);
  const currentQuestions = emotionHealthQuestions.slice(startIndex, endIndex);
  
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / emotionHealthQuestions.length) * 100;
  
  const isCurrentPageComplete = currentQuestions.every(q => answers[q.id] !== undefined);
  const isAllComplete = answeredCount === emotionHealthQuestions.length;

  // 获取当前层级信息
  const firstQuestionId = currentQuestions[0]?.id ?? 1;
  const { currentLayer, isLayerTransition, transitionKey } = getLayerProgress(firstQuestionId);
  const currentLayerConfig = layerConfig[currentLayer];

  // 自动滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      // 检查下一页的第一题是否是层间过渡点
      const nextPageFirstId = (currentPage + 1) * QUESTIONS_PER_PAGE + 1;
      const nextLayerInfo = getLayerProgress(nextPageFirstId);
      
      if (nextLayerInfo.isLayerTransition && nextLayerInfo.transitionKey) {
        setPendingTransitionKey(nextLayerInfo.transitionKey);
        setShowTransition(true);
      } else {
        setCurrentPage(prev => prev + 1);
      }
    } else if (isAllComplete) {
      onComplete();
    }
  };

  const handleTransitionContinue = () => {
    setShowTransition(false);
    setPendingTransitionKey(null);
    setCurrentPage(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-4">
      {/* 层级进度指示器 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <LayerProgressIndicator currentLayer={currentLayer} />
          <LayerLabel currentLayer={currentLayer} />
        </CardContent>
      </Card>

      {/* 总体进度条 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              已完成 {answeredCount} / {emotionHealthQuestions.length} 题
            </span>
            <span className="font-medium text-primary">
              第 {currentPage + 1} / {totalPages} 页
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* 题目列表 */}
      <div className="space-y-3">
        {currentQuestions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            questionNumber={startIndex + index + 1}
            selectedValue={answers[question.id]}
            onSelect={(value) => onAnswerChange(question.id, value)}
            layerColor={currentLayerConfig.color}
          />
        ))}
      </div>

      {/* 导航按钮 */}
      <div className="flex gap-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <Button
          variant="outline"
          onClick={handlePrev}
          className="flex-1 h-11"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {currentPage === 0 ? "返回" : "上一页"}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isCurrentPageComplete}
          className="flex-1 h-11 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
        >
          {currentPage === totalPages - 1 ? (
            isAllComplete ? "查看结果" : "请完成所有题目"
          ) : (
            <>
              下一页
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      {/* 层间过渡卡片 */}
      <AnimatePresence>
        {showTransition && pendingTransitionKey && (
          <LayerTransitionCard
            transitionKey={pendingTransitionKey}
            onContinue={handleTransitionContinue}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface QuestionCardProps {
  question: EmotionHealthQuestion;
  questionNumber: number;
  selectedValue?: number;
  onSelect: (value: number) => void;
  layerColor: string;
}

function QuestionCard({ question, questionNumber, selectedValue, onSelect, layerColor }: QuestionCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-200",
      selectedValue !== undefined && "ring-1 ring-primary/30"
    )}>
      <CardContent className="p-4">
        <div className="mb-3">
          <span className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-medium mr-2 bg-gradient-to-r",
            layerColor
          )}>
            {questionNumber}
          </span>
          <span className="text-sm font-medium">{question.text}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {emotionHealthScoreLabels.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={cn(
                "p-2.5 rounded-lg border text-sm font-medium transition-all duration-200",
                selectedValue === option.value
                  ? option.color + " border-2"
                  : "bg-muted/30 border-transparent hover:bg-muted/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
