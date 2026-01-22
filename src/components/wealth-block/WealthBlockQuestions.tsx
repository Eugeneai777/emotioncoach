import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
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
import { DeepFollowUpDialog, DeepFollowUp, DeepFollowUpAnswer } from "./DeepFollowUpDialog";
import { AssessmentStartScreen } from "./AssessmentStartScreen";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WealthBlockQuestionsProps {
  onComplete: (result: AssessmentResult, answers: Record<number, number>, followUpInsights?: FollowUpAnswer[], deepFollowUpAnswers?: DeepFollowUpAnswer[]) => void;
  onExit?: () => void;
}

export function WealthBlockQuestions({ onComplete, onExit }: WealthBlockQuestionsProps) {
  // 新增：开始前介绍页状态
  const [showStartScreen, setShowStartScreen] = useState(true);
  
  console.log('[WealthBlockQuestions] Rendering, showStartScreen:', showStartScreen);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  // 进度激励状态
  const [shownMilestones, setShownMilestones] = useState<Set<number>>(new Set());
  
  // AI追问相关状态
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [currentFollowUp, setCurrentFollowUp] = useState<FollowUpData | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([]);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [pendingNextQuestion, setPendingNextQuestion] = useState(false);
  
  // 深度追问相关状态
  const [showDeepFollowUp, setShowDeepFollowUp] = useState(false);
  const [deepFollowUps, setDeepFollowUps] = useState<DeepFollowUp[]>([]);
  const [isLoadingDeepFollowUp, setIsLoadingDeepFollowUp] = useState(false);
  const [pendingResult, setPendingResult] = useState<{
    result: AssessmentResult;
    answers: Record<number, number>;
    followUpInsights?: FollowUpAnswer[];
  } | null>(null);
  
  // 退出确认弹窗状态
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = answeredCount === questions.length;

  // 进度激励配置
  const milestones = [
    { threshold: 25, emoji: "🌱", message: "很棒！已完成 1/4，继续保持～" },
    { threshold: 50, emoji: "⭐", message: "太棒了！已经过半，你做得很好！" },
    { threshold: 75, emoji: "🔥", message: "冲刺阶段！马上就要完成了！" },
    { threshold: 90, emoji: "🎯", message: "最后几题！胜利在望！" },
  ];

  // 检查并显示进度激励
  const checkMilestone = useCallback((newProgress: number) => {
    for (const milestone of milestones) {
      if (newProgress >= milestone.threshold && !shownMilestones.has(milestone.threshold)) {
        setShownMilestones(prev => new Set([...prev, milestone.threshold]));
        toast(
          <div className="flex items-center gap-2">
            <span className="text-xl">{milestone.emoji}</span>
            <span>{milestone.message}</span>
          </div>,
          { 
            duration: 2500,
            className: "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
          }
        );
        break;
      }
    }
  }, [shownMilestones]);

  // 生成AI追问 - MUST be defined before any early returns (React Rules of Hooks)
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

  // 生成深度追问 - MUST be defined before any early returns (React Rules of Hooks)
  const generateDeepFollowUp = useCallback(async (result: AssessmentResult) => {
    setIsLoadingDeepFollowUp(true);
    setShowDeepFollowUp(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-deep-followup', {
        body: {
          reactionPattern: result.reactionPattern,
          dominantPoor: result.dominantPoor,
          dominantEmotionBlock: result.dominantEmotionBlock,
          dominantBeliefBlock: result.dominantBeliefBlock,
          scores: {
            behavior: result.behaviorScore,
            emotion: result.emotionScore,
            belief: result.beliefScore
          },
          healthScore: Math.round(
            ((50 - result.behaviorScore) / 50 * 33) +
            ((50 - result.emotionScore) / 50 * 33) +
            ((50 - result.beliefScore) / 50 * 34)
          )
        }
      });

      if (error) throw error;

      if (data?.deepFollowUps && data.deepFollowUps.length > 0) {
        setDeepFollowUps(data.deepFollowUps);
      } else {
        // 如果没有生成追问，直接显示结果
        setShowDeepFollowUp(false);
        if (pendingResult) {
          onComplete(pendingResult.result, pendingResult.answers, pendingResult.followUpInsights, undefined);
        }
      }
    } catch (err) {
      console.error('Failed to generate deep follow-up:', err);
      // 出错时直接显示结果
      setShowDeepFollowUp(false);
      if (pendingResult) {
        onComplete(pendingResult.result, pendingResult.answers, pendingResult.followUpInsights, undefined);
      }
    } finally {
      setIsLoadingDeepFollowUp(false);
    }
  }, [pendingResult, onComplete]);

  // 如果显示开始介绍页，先渲染它 (all hooks must be called above this line)
  if (showStartScreen) {
    console.log('[WealthBlockQuestions] Showing start screen');
    return <AssessmentStartScreen onStart={() => {
      console.log('[WealthBlockQuestions] Start screen clicked, entering questions');
      setShowStartScreen(false);
    }} />;
  }
  
  console.log('[WealthBlockQuestions] Showing questions, currentIndex:', currentIndex);

  const handleAnswer = async (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    
    // 检查进度激励
    const newProgress = (Object.keys(newAnswers).length / questions.length) * 100;
    checkMilestone(newProgress);
    
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

  // 提交测评 - 先触发深度追问
  const handleSubmit = async () => {
    const result = calculateResult(answers);
    
    // 显示过渡提示
    toast.success("🎉 恭喜完成测评！正在生成深度问题...", { duration: 2000 });
    
    // 保存待提交的结果
    setPendingResult({
      result,
      answers,
      followUpInsights: followUpAnswers.length > 0 ? followUpAnswers : undefined
    });
    
    // 触发深度追问
    await generateDeepFollowUp(result);
  };

  // 深度追问完成
  const handleDeepFollowUpComplete = (deepAnswers: DeepFollowUpAnswer[]) => {
    setShowDeepFollowUp(false);
    if (pendingResult) {
      onComplete(pendingResult.result, pendingResult.answers, pendingResult.followUpInsights, deepAnswers);
    }
  };

  // 跳过深度追问
  const handleSkipDeepFollowUp = () => {
    setShowDeepFollowUp(false);
    if (pendingResult) {
      onComplete(pendingResult.result, pendingResult.answers, pendingResult.followUpInsights, undefined);
    }
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
    <div className="flex flex-col min-h-[calc(100dvh-180px)] sm:min-h-[500px]">
      {/* 深度追问对话框 */}
      {showDeepFollowUp && (
        <DeepFollowUpDialog
          followUps={deepFollowUps}
          onComplete={handleDeepFollowUpComplete}
          onSkip={handleSkipDeepFollowUp}
          isLoading={isLoadingDeepFollowUp}
        />
      )}

      {/* 退出确认弹窗 */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退出？</AlertDialogTitle>
            <AlertDialogDescription>
              你已回答了 {answeredCount} 道题目，退出后进度将不会保存。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续答题</AlertDialogCancel>
            <AlertDialogAction onClick={() => onExit?.()}>
              确认退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 进度指示 */}
      <div className="space-y-3 mb-6 pt-2">
        <div className="flex justify-between items-center">
          {/* 左侧：退出按钮 */}
          {onExit && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive -ml-2"
              onClick={() => {
                if (answeredCount > 0) {
                  setShowExitConfirm(true);
                } else {
                  onExit();
                }
              }}
            >
              <X className="w-4 h-4 mr-1" />
              退出
            </Button>
          )}
          
          {/* 右侧：进度信息 */}
          <div className="flex items-center gap-2 ml-auto">
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
            initial={{ opacity: 0.01, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0.01, x: -50 }}
            transition={{ duration: 0.2 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
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

                {/* 水平评分条 - 响应式优化 */}
                <div className="pt-4 sm:pt-6">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">不符合</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {[1, 2, 3, 4, 5].map(value => {
                        const isSelected = answers[currentQuestion.id] === value;
                        return (
                          <motion.button
                            key={value}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            className={cn(
                              "w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-base sm:text-lg transition-all duration-200 touch-manipulation",
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
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">符合</span>
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

      {/* 导航按钮 - 移动端 sticky 底部 */}
      <div className="flex gap-3 pt-4 sm:pt-6 mt-auto sticky bottom-0 bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] -mx-2 px-2 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:backdrop-blur-none">
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
