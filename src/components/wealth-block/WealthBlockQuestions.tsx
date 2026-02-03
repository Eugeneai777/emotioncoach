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
  FollowUpAnswer,
  scoreLabels
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
  skipStartScreen?: boolean;
}

export function WealthBlockQuestions({ onComplete, onExit, skipStartScreen = false }: WealthBlockQuestionsProps) {
  // 开始前介绍页状态：根据 skipStartScreen prop 决定初始值
  const [showStartScreen, setShowStartScreen] = useState(!skipStartScreen);
  
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

  // 生成深度追问 - 修复闭包陷阱：传递参数而非依赖 state
  const generateDeepFollowUp = useCallback(async (
    result: AssessmentResult,
    pendingData: {
      result: AssessmentResult;
      answers: Record<number, number>;
      followUpInsights?: FollowUpAnswer[];
    }
  ) => {
    setIsLoadingDeepFollowUp(true);
    setShowDeepFollowUp(true);

    // 15秒超时保护
    const timeoutId = setTimeout(() => {
      console.warn('[WealthBlockQuestions] Deep follow-up generation timeout');
      setShowDeepFollowUp(false);
      setIsLoadingDeepFollowUp(false);
      onComplete(pendingData.result, pendingData.answers, pendingData.followUpInsights, undefined);
    }, 15000);

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

      clearTimeout(timeoutId);

      if (error) throw error;

      if (data?.deepFollowUps && data.deepFollowUps.length > 0) {
        setDeepFollowUps(data.deepFollowUps);
      } else {
        // 如果没有生成追问，直接显示结果
        setShowDeepFollowUp(false);
        onComplete(pendingData.result, pendingData.answers, pendingData.followUpInsights, undefined);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Failed to generate deep follow-up:', err);
      // 出错时直接显示结果
      setShowDeepFollowUp(false);
      onComplete(pendingData.result, pendingData.answers, pendingData.followUpInsights, undefined);
    } finally {
      setIsLoadingDeepFollowUp(false);
    }
  }, [onComplete]);

  // 如果显示开始介绍页，先渲染它 (all hooks must be called above this line)
  if (showStartScreen) {
    console.log('[WealthBlockQuestions] Showing start screen');
    return <AssessmentStartScreen 
      onStart={() => {
        console.log('[WealthBlockQuestions] Start screen clicked, entering questions');
        setShowStartScreen(false);
      }}
      onBack={onExit}
    />;
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
    
    // 构建待提交的数据（直接传递，避免闭包陷阱）
    const pendingData = {
      result,
      answers,
      followUpInsights: followUpAnswers.length > 0 ? followUpAnswers : undefined
    };
    
    // 仍然设置状态（供其他回调使用）
    setPendingResult(pendingData);
    
    // 将 pendingData 作为参数传入，而非依赖 state
    await generateDeepFollowUp(result, pendingData);
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
    // 使用柔和渐变背景
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white pb-[calc(80px+env(safe-area-inset-bottom))]">
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

      {/* 顶部标题区域 */}
      <div className="pt-safe px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* 左侧：退出按钮 */}
          {onExit ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-9 w-9"
              onClick={() => {
                if (answeredCount > 0) {
                  setShowExitConfirm(true);
                } else {
                  onExit();
                }
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-9" />
          )}
          
          {/* 中间：标题 + 徽章 */}
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-lg">财富卡点测评</h1>
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full mt-1">
              🌐 专业版
            </span>
          </div>
          
          {/* 右侧：追问数量 */}
          <div className="w-9 flex justify-end">
            {followUpAnswers.length > 0 && (
              <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                💬{followUpAnswers.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 问题卡片区域 */}
      <div className="flex-1 px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0.01, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0.01, x: -50 }}
            transition={{ duration: 0.2 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="max-w-lg mx-auto"
          >
            <Card className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                {/* 顶部信息栏：进度提示 + 百分比 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    即将获取专业的分析报告
                  </span>
                  <span className="text-xl font-semibold text-amber-600">
                    {Math.round(progress)}%
                  </span>
                </div>
                
                {/* 进度条 - 细长橙色 */}
                <Progress value={progress} className="h-1 mb-6" />
                
                {/* 题目文本 */}
                <p className="text-lg font-medium leading-relaxed mb-6 px-2">
                  {currentQuestion.text}
                </p>
                
                {/* 垂直选项列表 */}
                <div className="space-y-3">
                  {scoreLabels.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full py-4 px-6 rounded-full text-left transition-all duration-200 touch-manipulation",
                          isSelected
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                        onClick={() => handleAnswer(option.value)}
                        disabled={showFollowUp}
                      >
                        {option.label}
                      </motion.button>
                    );
                  })}
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

      {/* 导航按钮 - 胶囊样式 */}
      <div className="px-4 max-w-lg mx-auto">
        <div className="flex gap-4 pt-6 pb-safe">
          {/* 上一题 - outline 胶囊 */}
          <Button
            variant="outline"
            className="flex-1 h-14 rounded-full border-2 border-amber-400 text-amber-600 hover:bg-amber-50"
            disabled={currentIndex === 0}
            onClick={handlePrev}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            上一题
          </Button>
          
          {isLastQuestion ? (
            <Button
              className="flex-1 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              disabled={!canSubmit || pendingNextQuestion}
              onClick={handleSubmit}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              查看结果
            </Button>
          ) : (
            <Button
              className="flex-1 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              disabled={!answers[currentQuestion.id] || pendingNextQuestion}
              onClick={handleNext}
            >
              下一题
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* 仅首屏（第一题）显示底部信息 */}
      {currentIndex === 0 && (
        <div className="mt-8 pt-6 border-t border-border/30 space-y-3 text-center pb-[env(safe-area-inset-bottom)]">
          {/* 关注公众号链接 - 点击跳转到微信关注流程 */}
          <a 
            href="/wechat-auth?mode=follow"
            className="text-muted-foreground text-sm block"
          >
            点此关注公众号
          </a>
          
          {/* 付费提示 - 统一灰色 */}
          <p className="text-muted-foreground text-xs">
            需付费后方可查看结果，结果纯属娱乐仅供参考
          </p>
          
          {/* 公司信息和ICP备案 */}
          <p className="text-muted-foreground text-xs">
            北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
          </p>
        </div>
      )}
    </div>
  );
}
