import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  midlifeQuestions,
  midlifeScoreLabels,
  getDimensionProgress,
  dimensionConfig,
  dimensionTransitionConfig,
  type MidlifeQuestion,
  type MidlifeDimension,
  type DimensionTransitionKey,
} from "./midlifeAwakeningData";
import { useProgressMilestones } from "@/hooks/useProgressMilestones";
import { MilestoneAchievementOverlay } from "@/components/common/MilestoneAchievementOverlay";

interface MidlifeAwakeningQuestionsProps {
  answers: Record<number, number>;
  onAnswerChange: (questionId: number, value: number) => void;
  onComplete: () => void;
  onBack: () => void;
}

// 维度进度指示器
function DimensionProgressIndicator({ currentDimension }: { currentDimension: MidlifeDimension }) {
  const dims: MidlifeDimension[] = [
    'internalFriction', 'selfWorth', 'actionStagnation',
    'supportSystem', 'regretRisk', 'missionClarity',
  ];
  const currentIndex = dims.indexOf(currentDimension);

  return (
    <div className="flex items-center justify-center gap-1">
      {dims.map((dim, index) => {
        const config = dimensionConfig[dim];
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;
        return (
          <div key={dim} className="flex items-center">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300",
              isComplete && "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
              isActive && `bg-gradient-to-r ${config.color} text-white shadow-md`,
              !isActive && !isComplete && "bg-muted text-muted-foreground"
            )}>
              {isComplete ? <Check className="w-3 h-3" /> : index + 1}
            </div>
            {index < dims.length - 1 && (
              <div className={cn("w-3 h-0.5 mx-0.5", index < currentIndex ? "bg-emerald-500" : "bg-muted")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// 维度过渡卡片
function DimensionTransitionCard({ transitionKey, onContinue }: { transitionKey: DimensionTransitionKey; onContinue: () => void }) {
  const config = dimensionTransitionConfig[transitionKey];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <Card className="w-full max-w-sm overflow-hidden">
        <div className={`bg-gradient-to-r ${config.color} p-6 text-center text-white`}>
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-4xl block mb-3">
            {config.emoji}
          </motion.span>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-lg font-bold">
            {config.text}
          </motion.h2>
        </div>
        <CardContent className="p-6 text-center">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-sm text-muted-foreground mb-6">
            {config.subtext}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Button onClick={onContinue} className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600">
              继续 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// 单题卡片
function SingleQuestionCard({ question, questionNumber, totalQuestions, selectedValue, onSelect, layerColor }: {
  question: MidlifeQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedValue?: number;
  onSelect: (value: number) => void;
  layerColor: string;
}) {
  return (
    <Card className={cn("transition-all duration-200", selectedValue !== undefined && "ring-2 ring-primary/30")}>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <span className={cn("inline-flex items-center justify-center px-4 py-2 rounded-full text-white text-sm font-semibold bg-gradient-to-r", layerColor)}>
            第 {questionNumber} / {totalQuestions} 题
          </span>
        </div>
        <div className="text-center mb-8">
          <p className="text-lg font-medium leading-relaxed">{question.text}</p>
        </div>
        {/* 5分制 Likert 评分 */}
        <div className="space-y-2">
          {midlifeScoreLabels.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => onSelect(option.value)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full h-11 rounded-xl border-2 text-sm font-medium transition-all duration-200 flex items-center justify-center",
                selectedValue === option.value
                  ? option.color + " border-2 shadow-md scale-[1.02]"
                  : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-muted-foreground/20"
              )}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MidlifeAwakeningQuestions({ answers, onAnswerChange, onComplete, onBack }: MidlifeAwakeningQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [pendingTransitionKey, setPendingTransitionKey] = useState<DimensionTransitionKey | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const totalQuestions = midlifeQuestions.length;
  const currentQuestion = midlifeQuestions[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isFirstQuestion = currentIndex === 0;
  const answeredCount = Object.keys(answers).length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const hasCurrentAnswer = answers[currentQuestion.id] !== undefined;
  const isAllComplete = answeredCount === totalQuestions;

  const { currentDimension } = getDimensionProgress(currentQuestion.id);
  const currentDimConfig = dimensionConfig[currentDimension];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  const tryAdvance = (nextIndex: number) => {
    if (nextIndex >= totalQuestions) return;
    const nextQ = midlifeQuestions[nextIndex];
    const nextInfo = getDimensionProgress(nextQ.id);
    if (nextInfo.isDimensionTransition && nextInfo.transitionKey) {
      setPendingTransitionKey(nextInfo.transitionKey);
      setShowTransition(true);
    } else {
      setDirection('forward');
      setCurrentIndex(nextIndex);
    }
  };

  const { activeMilestone, trigger: triggerMilestone, dismiss: dismissMilestone } = useProgressMilestones();

  const handleAnswer = (value: number) => {
    const wasAnswered = answers[currentQuestion.id] !== undefined;
    onAnswerChange(currentQuestion.id, value);
    const newCount = wasAnswered ? answeredCount : answeredCount + 1;
    triggerMilestone((newCount / totalQuestions) * 100);
    if (!isLastQuestion) {
      setTimeout(() => tryAdvance(currentIndex + 1), 300);
    }
  };

  const handleTransitionContinue = () => {
    setShowTransition(false);
    setPendingTransitionKey(null);
    setDirection('forward');
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (!isFirstQuestion) { setDirection('backward'); setCurrentIndex(prev => prev - 1); }
    else onBack();
  };

  const handleNext = () => {
    if (isLastQuestion && isAllComplete) onComplete();
    else if (hasCurrentAnswer && !isLastQuestion) tryAdvance(currentIndex + 1);
  };

  const slideVariants = {
    enter: (dir: 'forward' | 'backward') => ({ x: dir === 'forward' ? 50 : -50, opacity: 0.01 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 'forward' | 'backward') => ({ x: dir === 'forward' ? -50 : 50, opacity: 0.01 }),
  };

  return (
    <div className="space-y-4 min-h-[calc(100dvh-120px)] flex flex-col">
      <MilestoneAchievementOverlay milestone={activeMilestone} onDismiss={dismissMilestone} />
      <Card>
        <CardContent className="p-4 space-y-3">
          <DimensionProgressIndicator currentDimension={currentDimension} />
          <div className="text-center">
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", `bg-gradient-to-r ${currentDimConfig.color} text-white`)}>
              {currentDimConfig.icon} {currentDimConfig.shortName}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">第 {currentIndex + 1} / {totalQuestions} 题</span>
            <span className="font-medium text-primary">已完成 {answeredCount} 题</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="flex-1 flex items-center justify-center py-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentQuestion.id} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: "easeOut" }} style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }} className="w-full">
            <SingleQuestionCard question={currentQuestion} questionNumber={currentIndex + 1} totalQuestions={totalQuestions} selectedValue={answers[currentQuestion.id]} onSelect={handleAnswer} layerColor={currentDimConfig.color} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <Button variant="outline" onClick={handlePrev} className="flex-1 h-12">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {isFirstQuestion ? "返回" : "上一题"}
        </Button>
        <Button onClick={handleNext} disabled={!hasCurrentAnswer} className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          {isLastQuestion ? (isAllComplete ? "查看结果" : "请完成所有题目") : (<>下一题 <ChevronRight className="w-4 h-4 ml-1" /></>)}
        </Button>
      </div>

      <AnimatePresence>
        {showTransition && pendingTransitionKey && (
          <DimensionTransitionCard transitionKey={pendingTransitionKey} onContinue={handleTransitionContinue} />
        )}
      </AnimatePresence>
    </div>
  );
}
