import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  questions, 
  calculateResult, 
  AssessmentResult,
  shouldAskFollowUp,
  getQuestionCategory,
  FollowUpAnswer
} from "./wealthBlockData";
import { FollowUpDialog, FollowUpData } from "./FollowUpDialog";

interface WealthBlockQuestionsProps {
  onComplete: (result: AssessmentResult, answers: Record<number, number>, followUpInsights?: FollowUpAnswer[]) => void;
}

export function WealthBlockQuestions({ onComplete }: WealthBlockQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  // AI追问相关状态
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [currentFollowUp, setCurrentFollowUp] = useState<FollowUpData | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([]);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [pendingNextQuestion, setPendingNextQuestion] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = answeredCount === questions.length;

  // 生成AI追问
  const generateFollowUp = useCallback(async (questionId: number, score: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setIsLoadingFollowUp(true);
    setShowFollowUp(true);

    try {
      const { data, error } = await supabase.functions.invoke('smart-question-followup', {
        body: {
          questionId,
          questionText: question.text,
          questionCategory: getQuestionCategory(questionId),
          userScore: score,
          previousAnswers: answers
        }
      });

      if (error) throw error;

      // 检查是否使用了fallback
      const followUpData = data.fallback || data;
      setCurrentFollowUp(followUpData);
    } catch (err) {
      console.error('Failed to generate follow-up:', err);
      // 使用默认追问
      setCurrentFollowUp({
        followUpQuestion: "这种感受通常在什么场景下出现？",
        quickOptions: ["工作中", "家庭中", "社交中", "其他"],
        contextHint: "帮助我们给你更精准的建议"
      });
    } finally {
      setIsLoadingFollowUp(false);
    }
  }, [answers]);

  const handleAnswer = async (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    
    // 检查是否需要AI追问
    if (shouldAskFollowUp(value, currentIndex, followUpAnswers.length)) {
      setPendingNextQuestion(true);
      await generateFollowUp(currentQuestion.id, value);
    } else {
      // 自动跳转到下一题（除非是最后一题）
      if (!isLastQuestion) {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 300);
      }
    }
  };

  // 处理追问回答
  const handleFollowUpAnswer = (answer: string) => {
    setFollowUpAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      selectedOption: answer,
      timestamp: new Date()
    }]);
    
    setShowFollowUp(false);
    setCurrentFollowUp(null);
    setPendingNextQuestion(false);
    
    toast.success("感谢分享！", { duration: 1500 });
    
    // 继续下一题
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300);
    }
  };

  // 跳过追问
  const handleSkipFollowUp = () => {
    setShowFollowUp(false);
    setCurrentFollowUp(null);
    setPendingNextQuestion(false);
    
    // 继续下一题
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300);
    }
  };

  const handleSubmit = () => {
    const result = calculateResult(answers);
    onComplete(result, answers, followUpAnswers.length > 0 ? followUpAnswers : undefined);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setShowFollowUp(false);
      setCurrentFollowUp(null);
      setPendingNextQuestion(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1 && !pendingNextQuestion) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="flex flex-col min-h-[500px]">
      {/* 进度指示 */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">答题进度</span>
          <div className="flex items-center gap-2">
            {followUpAnswers.length > 0 && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                💬 {followUpAnswers.length}个追问
              </span>
            )}
            <span className="text-sm font-medium text-amber-600">{currentIndex + 1} / {questions.length}</span>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* 题目区域 */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/30">
              <CardContent className="p-6 space-y-6">
                {/* 题目文本 */}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-100 text-amber-600 rounded-full text-sm font-bold">
                    {currentQuestion.id}
                  </div>
                  <p className="text-lg font-medium leading-relaxed px-2">
                    {currentQuestion.text}
                  </p>
                </div>

                {/* 水平评分条 */}
                <div className="pt-6">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">不符合</span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(value => {
                        const isSelected = answers[currentQuestion.id] === value;
                        return (
                          <motion.button
                            key={value}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            className={cn(
                              "w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-200 touch-manipulation",
                              isSelected
                                ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-200/50 scale-110"
                                : "border-2 border-muted bg-background text-muted-foreground hover:border-amber-300 hover:text-amber-600"
                            )}
                            onClick={() => handleAnswer(value)}
                            disabled={showFollowUp}
                          >
                            {value}
                          </motion.button>
                        );
                      })}
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">符合</span>
                  </div>
                </div>

                {/* AI追问对话框 */}
                {(showFollowUp || isLoadingFollowUp) && currentFollowUp && (
                  <FollowUpDialog
                    isOpen={showFollowUp}
                    followUp={currentFollowUp}
                    questionText={currentQuestion.text}
                    userScore={answers[currentQuestion.id] || 0}
                    onAnswer={handleFollowUpAnswer}
                    onSkip={handleSkipFollowUp}
                    isLoading={isLoadingFollowUp}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 导航按钮 */}
      <div className="flex gap-3 pt-6 mt-auto">
        <Button
          variant="outline"
          className="flex-1 h-12"
          disabled={currentIndex === 0}
          onClick={handlePrev}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一题
        </Button>
        
        {isLastQuestion ? (
          <Button
            className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
            disabled={!canSubmit || pendingNextQuestion}
            onClick={handleSubmit}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            查看结果
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex-1 h-12"
            disabled={!answers[currentQuestion.id] || pendingNextQuestion}
            onClick={handleNext}
          >
            下一题
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
