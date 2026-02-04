import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { 
  emotionHealthQuestions, 
  emotionHealthScoreLabels,
  getLayerProgress,
  layerConfig,
  type EmotionHealthQuestion
} from "./emotionHealthData";
import { LayerTransitionCard } from "./LayerTransitionCard";

interface EmotionHealthQuestionsLiteProps {
  onComplete: (answers: Record<number, number>) => void;
  onExit: () => void;
  /** 是否跳过引导页，直接显示第一题 */
  skipStartScreen?: boolean;
  /** 是否显示底部信息（公众号链接、付费提示、备案信息） */
  showFooterInfo?: boolean;
}

export function EmotionHealthQuestionsLite({
  onComplete,
  onExit,
  skipStartScreen = false,
  showFooterInfo = false
}: EmotionHealthQuestionsLiteProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [pendingTransitionKey, setPendingTransitionKey] = useState<'screening-pattern' | 'pattern-blockage' | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  const totalQuestions = emotionHealthQuestions.length;
  const currentQuestion = emotionHealthQuestions[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  
  const answeredCount = Object.keys(answers).length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // 获取当前层级信息
  const { currentLayer } = getLayerProgress(currentQuestion.id);
  const currentLayerConfig = layerConfig[currentLayer];

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
        // 检查下一题是否是层间过渡点
        const nextQuestionId = emotionHealthQuestions[currentIndex + 1].id;
        const nextLayerInfo = getLayerProgress(nextQuestionId);
        
        if (nextLayerInfo.isLayerTransition && nextLayerInfo.transitionKey) {
          setPendingTransitionKey(nextLayerInfo.transitionKey);
          setShowTransition(true);
        } else {
          setDirection('forward');
          setCurrentIndex(prev => prev + 1);
        }
      }, 300);
    } else {
      // 最后一题完成后触发完成回调
      setTimeout(() => {
        onComplete(newAnswers);
      }, 300);
    }
  };

  const handleTransitionContinue = () => {
    setShowTransition(false);
    setPendingTransitionKey(null);
    setDirection('forward');
    setCurrentIndex(prev => prev + 1);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-purple-50/30 to-white pb-[calc(80px+env(safe-area-inset-bottom))]">
      {/* 固定顶部标题栏 */}
      <div 
        className="fixed top-0 inset-x-0 z-40 bg-gradient-to-b from-rose-50 to-rose-50/95 backdrop-blur-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-4 py-3 space-y-2">
          {/* 标题和进度 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center justify-center px-3 py-1 rounded-full text-white text-xs font-medium bg-gradient-to-r",
                currentLayerConfig.color
              )}>
                {currentLayerConfig.name}
              </span>
              <h1 className="text-base font-semibold text-foreground">情绪健康测评</h1>
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {currentIndex + 1}/{totalQuestions}
            </span>
          </div>
          
          {/* 进度条 */}
          <Progress value={progress} className="h-1.5" />
          
          {/* 激励文案 */}
          <p className="text-xs text-muted-foreground text-center">
            完成测评后将获得专业分析报告
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
              layerColor={currentLayerConfig.color}
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

interface LiteQuestionCardProps {
  question: EmotionHealthQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedValue?: number;
  onSelect: (value: number) => void;
  layerColor: string;
}

function LiteQuestionCard({ 
  question, 
  questionNumber, 
  totalQuestions,
  selectedValue, 
  onSelect, 
  layerColor 
}: LiteQuestionCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-border/20">
      {/* 题目文本 */}
      <div className="text-center mb-8">
        <p className="text-lg font-medium leading-relaxed text-foreground">
          {question.text}
        </p>
      </div>
      
      {/* 垂直选项按钮 */}
      <div className="flex flex-col gap-3">
        {emotionHealthScoreLabels.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => onSelect(option.value)}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "h-14 rounded-xl border-2 text-base font-medium transition-all duration-200 flex items-center justify-center",
              selectedValue === option.value
                ? "bg-gradient-to-r from-rose-500 to-purple-500 text-white border-transparent shadow-md"
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
