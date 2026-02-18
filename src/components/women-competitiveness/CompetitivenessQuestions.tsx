import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoImage from "@/assets/logo-youjin-ai.png";
import {
  questions,
  scoreLabels,
  categoryInfo,
  calculateResult,
  shouldAskFollowUp,
  getQuestionCategory,
  CompetitivenessResult,
  FollowUpAnswer,
} from "./competitivenessData";
import { FollowUpDialog, FollowUpData } from "../wealth-block/FollowUpDialog";
import { CompetitivenessStartScreen } from "./CompetitivenessStartScreen";
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

interface CompetitivenessQuestionsProps {
  onComplete: (result: CompetitivenessResult, answers: Record<number, number>, followUpInsights?: FollowUpAnswer[]) => void;
  onExit?: () => void;
  onHistory?: () => void;
}

export function CompetitivenessQuestions({ onComplete, onExit, onHistory }: CompetitivenessQuestionsProps) {
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [shownMilestones, setShownMilestones] = useState<Set<number>>(new Set());

  // AI追问
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [currentFollowUp, setCurrentFollowUp] = useState<FollowUpData | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([]);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [pendingNextQuestion, setPendingNextQuestion] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = answeredCount === questions.length;

  const milestones = [
    { threshold: 25, emoji: "🌱", message: "很棒！已完成 1/4，继续保持～" },
    { threshold: 50, emoji: "⭐", message: "太棒了！已经过半，你做得很好！" },
    { threshold: 75, emoji: "🔥", message: "冲刺阶段！马上就要完成了！" },
    { threshold: 90, emoji: "🎯", message: "最后几题！胜利在望！" },
  ];

  const checkMilestone = useCallback((newProgress: number) => {
    for (const milestone of milestones) {
      if (newProgress >= milestone.threshold && !shownMilestones.has(milestone.threshold)) {
        setShownMilestones(prev => new Set([...prev, milestone.threshold]));
        toast(
          <div className="flex items-center gap-2">
            <span className="text-xl">{milestone.emoji}</span>
            <span>{milestone.message}</span>
          </div>,
          { duration: 2500 }
        );
        break;
      }
    }
  }, [shownMilestones]);

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
          questionCategory: question.category,
          userScore: score,
          previousAnswers: answers
        }
      });

      if (error) throw error;
      const followUpData = data.fallback || data;
      setCurrentFollowUp(followUpData);
    } catch (err) {
      console.error('Failed to generate follow-up:', err);
      setCurrentFollowUp({
        followUpQuestion: "这种感受通常在什么场景下出现？",
        quickOptions: ["工作中", "家庭中", "社交中", "其他"],
        contextHint: "帮助我们给你更精准的建议"
      });
    } finally {
      setIsLoadingFollowUp(false);
    }
  }, [answers]);

  if (showStartScreen) {
    return <CompetitivenessStartScreen onStart={() => setShowStartScreen(false)} onBack={onExit} onHistory={onHistory} />;
  }

  const handleAnswer = async (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    const newProgress = (Object.keys(newAnswers).length / questions.length) * 100;
    checkMilestone(newProgress);

    if (shouldAskFollowUp(value, currentIndex, followUpAnswers.length)) {
      setPendingNextQuestion(true);
      await generateFollowUp(currentQuestion.id, value);
    } else {
      if (!isLastQuestion) {
        setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
      }
    }
  };

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
    if (!isLastQuestion) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  };

  const handleSkipFollowUp = () => {
    setShowFollowUp(false);
    setCurrentFollowUp(null);
    setPendingNextQuestion(false);
    if (!isLastQuestion) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  };

  const handleSubmit = () => {
    const result = calculateResult(answers);
    toast.success("🎉 测评完成！正在生成你的竞争力报告...", { duration: 2000 });
    onComplete(result, answers, followUpAnswers.length > 0 ? followUpAnswers : undefined);
  };

  const catInfo = categoryInfo[currentQuestion.category];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-purple-50/30 to-white pb-[calc(80px+env(safe-area-inset-bottom))]">
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
            <AlertDialogAction onClick={() => onExit?.()}>确认退出</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 顶部 */}
      <div className="pt-safe px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-1">
            <div
              onClick={() => onExit?.()}
              className="flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <img
                src={logoImage}
                alt="有劲AI"
                className="w-9 h-9 rounded-full object-cover"
              />
            </div>
            {onExit && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-9 w-9"
                onClick={() => answeredCount > 0 ? setShowExitConfirm(true) : onExit()}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center">
            <h1 className="font-bold text-lg">竞争力测评</h1>
            <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full mt-1">
              {catInfo.emoji} {catInfo.name}
            </span>
          </div>

          <div className="w-9 flex justify-end">
            {followUpAnswers.length > 0 && (
              <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                💬{followUpAnswers.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 题目卡片 */}
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
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    {progress < 30 ? "即将获取专业分析报告"
                      : progress < 70 ? "完成后可获得AI竞争力画像 🎨"
                      : "马上就好！专属报告等你 🎁"}
                  </span>
                  <span className="text-xl font-semibold text-rose-600">
                    {Math.round(progress)}%
                  </span>
                </div>

                <Progress value={progress} className="h-1 mb-6" />

                <p className="text-lg font-medium leading-relaxed mb-6 px-2">
                  {currentQuestion.text}
                </p>

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
                            ? "bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow-md"
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

      {/* 导航 */}
      <div className="px-4 max-w-lg mx-auto">
        <div className="flex gap-4 pt-6 pb-safe">
          <Button
            variant="outline"
            className="flex-1 rounded-full h-12"
            onClick={() => {
              setShowFollowUp(false);
              setCurrentFollowUp(null);
              setPendingNextQuestion(false);
              if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
            }}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> 上一题
          </Button>

          {isLastQuestion && canSubmit ? (
            <Button
              className="flex-1 rounded-full h-12 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
              onClick={handleSubmit}
            >
              查看结果 🎉
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1 rounded-full h-12"
              onClick={() => !pendingNextQuestion && currentIndex < questions.length - 1 && setCurrentIndex(prev => prev + 1)}
              disabled={currentIndex >= questions.length - 1 || !answers[currentQuestion.id] || pendingNextQuestion}
            >
              下一题 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
