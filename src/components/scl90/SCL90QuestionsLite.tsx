import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { scl90Questions, scl90ScoreLabels, type SCL90Question } from "./scl90Data";

interface SCL90QuestionsLiteProps {
  onComplete: (answers: Record<number, number>) => void;
  onExit: () => void;
  /** 是否显示底部信息（公众号链接、付费提示、备案信息） */
  showFooterInfo?: boolean;
}

export function SCL90QuestionsLite({
  onComplete,
  onExit,
  showFooterInfo = false
}: SCL90QuestionsLiteProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  const totalQuestions = scl90Questions.length;
  const currentQuestion = scl90Questions[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // 自动滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  const handleAnswer = (questionId: number, value: number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // 非最后一题时自动推进
    if (!isLastQuestion) {
      setTimeout(() => {
        setDirection('forward');
        setCurrentIndex(prev => prev + 1);
      }, 300);
    } else {
      // 最后一题完成后触发完成回调
      setTimeout(() => {
        onComplete(newAnswers);
      }, 300);
    }
  };

  // 动画变体
  const slideVariants = {
    enter: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? 50 : -50,
      opacity: 0.01,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'forward' | 'backward') => ({
      x: dir === 'forward' ? -50 : 50,
      opacity: 0.01,
    }),
  };

  // 获取激励文案
  const getMotivationText = () => {
    const percent = (currentIndex / totalQuestions) * 100;
    if (percent < 25) return "认真作答，了解真实的自己";
    if (percent < 50) return "继续加油，已完成四分之一";
    if (percent < 75) return "过半了，保持专注";
    if (percent < 90) return "即将完成，胜利在望";
    return "最后几题，马上揭晓结果！";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-indigo-50/30 to-white pb-[calc(80px+env(safe-area-inset-bottom))]">
      {/* 固定顶部标题栏 */}
      <div 
        className="fixed top-0 inset-x-0 z-40 bg-gradient-to-b from-purple-50 to-purple-50/95 backdrop-blur-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-4 py-3 space-y-2">
          {/* 标题和进度 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-white text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600">
                SCL-90
              </span>
              <h1 className="text-base font-semibold text-foreground">心理健康测评</h1>
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {currentIndex + 1}/{totalQuestions}
            </span>
          </div>
          
          {/* 进度条 */}
          <Progress value={progress} className="h-1.5" />
          
          {/* 激励文案 */}
          <p className="text-xs text-muted-foreground text-center">
            {getMotivationText()}
          </p>
        </div>
      </div>

      {/* 内容区域 - 留出顶部空间 */}
      <div className="pt-28 px-4">
        {/* 单题卡片 - 使用动画 */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="w-full"
          >
            <LiteQuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              selectedValue={answers[currentQuestion.id]}
              onSelect={(value) => handleAnswer(currentQuestion.id, value)}
            />
          </motion.div>
        </AnimatePresence>

        {/* 底部信息区域（仅首题且 showFooterInfo=true 时显示） */}
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
    </div>
  );
}

interface LiteQuestionCardProps {
  question: SCL90Question;
  questionNumber: number;
  totalQuestions: number;
  selectedValue?: number;
  onSelect: (value: number) => void;
}

function LiteQuestionCard({ 
  question, 
  questionNumber, 
  totalQuestions,
  selectedValue, 
  onSelect
}: LiteQuestionCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-border/20">
      {/* 题目文本 */}
      <div className="text-center mb-8">
        <p className="text-lg font-medium leading-relaxed text-foreground">
          {question.text}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          请根据最近一周内的实际感受选择
        </p>
      </div>
      
      {/* 垂直选项按钮 */}
      <div className="flex flex-col gap-3">
        {scl90ScoreLabels.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => onSelect(option.value)}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "h-14 rounded-xl border-2 text-base font-medium transition-all duration-200 flex items-center justify-center",
              selectedValue === option.value
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-md"
                : "bg-white border-border/40 text-foreground hover:bg-muted/30 hover:border-primary/30"
            )}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
