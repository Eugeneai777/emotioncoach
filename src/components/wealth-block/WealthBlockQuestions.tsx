import { useState, useCallback, useRef, useEffect } from "react";
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
  showFooterInfo?: boolean;
}

export function WealthBlockQuestions({ onComplete, onExit, skipStartScreen = false, showFooterInfo = false }: WealthBlockQuestionsProps) {
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

  // 视觉引导状态
  const [pulseSubmit, setPulseSubmit] = useState(false);
  const followUpRef = useRef<HTMLDivElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const followUpAbortRef = useRef<AbortController | null>(null);
  const deepAbortRef = useRef<AbortController | null>(null);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = answeredCount === questions.length;

  // 卸载时取消所有进行中的请求，避免内存泄漏与状态污染
  useEffect(() => {
    return () => {
      followUpAbortRef.current?.abort();
      deepAbortRef.current?.abort();
    };
  }, []);

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

    // 取消之前未完成的请求
    followUpAbortRef.current?.abort();
    const ac = new AbortController();
    followUpAbortRef.current = ac;

    setIsLoadingFollowUp(true);
    setShowFollowUp(true);

    // 选答后下一帧滚动到追问骨架卡，确保用户立刻看到反馈
    requestAnimationFrame(() => {
      followUpRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    // 6秒超时保护，超时后静默走 fallback，不打断流程
    const timeoutId = setTimeout(() => {
      console.warn('[WealthBlockQuestions] Follow-up generation timeout');
      ac.abort();
      // 不直接 setShowFollowUp(false)，而是塞入兜底追问，让用户依然能交互
      setCurrentFollowUp({
        followUpQuestion: "这种情况通常在什么场景下出现？",
        quickOptions: ["工作中", "家庭中", "社交中", "其他"],
        contextHint: "（AI 响应较慢，已为你准备通用选项）"
      });
      setIsLoadingFollowUp(false);
    }, 6000);

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

      clearTimeout(timeoutId);
      if (ac.signal.aborted) return;

      if (error) throw error;

      // 检查是否使用了fallback
      const followUpData = data.fallback || data;
      setCurrentFollowUp(followUpData);
    } catch (err) {
      clearTimeout(timeoutId);
      if (ac.signal.aborted) return;
      console.error('Failed to generate follow-up:', err);
      // 使用默认追问，确保用户不会卡住
      setCurrentFollowUp({
        followUpQuestion: "这种感受通常在什么场景下出现？",
        quickOptions: ["工作中", "家庭中", "社交中", "其他"],
        contextHint: "帮助我们给你更精准的建议"
      });
    } finally {
      if (!ac.signal.aborted) {
        setIsLoadingFollowUp(false);
      }
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
    deepAbortRef.current?.abort();
    const ac = new AbortController();
    deepAbortRef.current = ac;

    setIsLoadingDeepFollowUp(true);
    setShowDeepFollowUp(true);

    // 8秒超时保护：失败/超时直接进入结果页，不阻塞用户
    const timeoutId = setTimeout(() => {
      console.warn('[WealthBlockQuestions] Deep follow-up generation timeout');
      ac.abort();
      setShowDeepFollowUp(false);
      setIsLoadingDeepFollowUp(false);
      onComplete(pendingData.result, pendingData.answers, pendingData.followUpInsights, undefined);
    }, 8000);

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
      if (ac.signal.aborted) return;

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
      if (ac.signal.aborted) return;
      console.error('Failed to generate deep follow-up:', err);
      // 出错时直接显示结果
      setShowDeepFollowUp(false);
      onComplete(pendingData.result, pendingData.answers, pendingData.followUpInsights, undefined);
    } finally {
      if (!ac.signal.aborted) {
        setIsLoadingDeepFollowUp(false);
      }
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
    
    // 检查是否需要AI追问（最后一题不触发，避免卡住）
    if (!isLastQuestion && shouldAskFollowUp(value, currentIndex, followUpAnswers.length)) {
      setPendingNextQuestion(true);
      try {
        await generateFollowUp(currentQuestion.id, value);
      } catch (e) {
        // 兜底：任何异常都不能让按钮永久 disabled
        console.error('[WealthBlockQuestions] generateFollowUp threw', e);
        setPendingNextQuestion(false);
      }
    } else {
      // 自动跳转到下一题（除非是最后一题）
      if (!isLastQuestion) {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 300);
      } else {
        // 最后一题：800ms 后滚动到"查看结果"按钮 + 高亮脉冲
        setTimeout(() => {
          submitBtnRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          setPulseSubmit(true);
          // 4 秒后停止脉冲，避免视觉疲劳
          setTimeout(() => setPulseSubmit(false), 4000);
        }, 800);
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
                    {progress < 30
                      ? "即将获取专业的分析报告"
                      : progress < 70
                        ? "完成后可免费获得专业AI教练解说 🎙️"
                        : "马上就好！报告+免费AI教练解说等你 🎁"}
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
                        disabled={showFollowUp && !isLoadingFollowUp}
                      >
                        {option.label}
                      </motion.button>
                    );
                  })}
                </div>

                {/* 最后一题：选答后显示引导，避免用户找不到"查看结果"按钮 */}
                {isLastQuestion && answers[currentQuestion.id] && !showFollowUp && (
                  <p className="mt-4 text-center text-sm text-amber-600 font-medium animate-fade-in">
                    👇 点击下方「查看结果」生成你的报告
                  </p>
                )}

                {/* AI追问对话框 - loading 阶段也渲染骨架，给用户即时反馈 */}
                {(showFollowUp || isLoadingFollowUp) && (
                  <FollowUpDialog
                    ref={followUpRef}
                    isOpen={showFollowUp || isLoadingFollowUp}
                    followUp={currentFollowUp ?? { followUpQuestion: '', quickOptions: [], contextHint: '' }}
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
              ref={submitBtnRef}
              className={cn(
                "flex-1 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
                pulseSubmit && "animate-pulse ring-4 ring-amber-300/60"
              )}
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

      {/* 仅在 showFooterInfo=true 且首屏（第一题）时显示底部信息 */}
      {showFooterInfo && currentIndex === 0 && (
        <div className="mt-16 pt-6 border-t border-border/30 space-y-3 text-center pb-[env(safe-area-inset-bottom)]">
          <p className="text-muted-foreground text-sm">
            💡 先体验后付费 ¥9.9
          </p>
          <p className="text-muted-foreground text-xs">
            北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
          </p>
        </div>
      )}
    </div>
  );
}
