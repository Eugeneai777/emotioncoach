import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
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

export function EmotionHealthQuestions({
  answers,
  onAnswerChange,
  onComplete,
  onBack
}: EmotionHealthQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [pendingTransitionKey, setPendingTransitionKey] = useState<'screening-pattern' | 'pattern-blockage' | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  const totalQuestions = emotionHealthQuestions.length;
  const currentQuestion = emotionHealthQuestions[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isFirstQuestion = currentIndex === 0;
  
  const answeredCount = Object.keys(answers).length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  
  const hasCurrentAnswer = answers[currentQuestion.id] !== undefined;
  const isAllComplete = answeredCount === totalQuestions;

  // 获取当前层级信息
  const { currentLayer } = getLayerProgress(currentQuestion.id);
  const currentLayerConfig = layerConfig[currentLayer];

  // 自动滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  const handleAnswer = (value: number) => {
    onAnswerChange(currentQuestion.id, value);
    
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
    }
  };

  const handleTransitionContinue = () => {
    setShowTransition(false);
    setPendingTransitionKey(null);
    setDirection('forward');
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (!isFirstQuestion) {
      setDirection('backward');
      setCurrentIndex(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const handleNext = () => {
    if (isLastQuestion && isAllComplete) {
      onComplete();
    } else if (hasCurrentAnswer && !isLastQuestion) {
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

  return (
    <div className="space-y-4 min-h-[calc(100dvh-120px)] flex flex-col">
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
              第 {currentIndex + 1} / {totalQuestions} 题
            </span>
            <span className="font-medium text-primary">
              已完成 {answeredCount} 题
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* 单题卡片 - 使用动画 */}
      <div className="flex-1 flex items-center justify-center py-4">
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
            <SingleQuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              selectedValue={answers[currentQuestion.id]}
              onSelect={handleAnswer}
              layerColor={currentLayerConfig.color}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 导航按钮 */}
      <div className="flex gap-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <Button
          variant="outline"
          onClick={handlePrev}
          className="flex-1 h-12"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {isFirstQuestion ? "返回" : "上一题"}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!hasCurrentAnswer}
          className="flex-1 h-12 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
        >
          {isLastQuestion ? (
            isAllComplete ? "查看结果" : "请完成所有题目"
          ) : (
            <>
              下一题
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

interface SingleQuestionCardProps {
  question: EmotionHealthQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedValue?: number;
  onSelect: (value: number) => void;
  layerColor: string;
}

function SingleQuestionCard({ 
  question, 
  questionNumber, 
  totalQuestions,
  selectedValue, 
  onSelect, 
  layerColor 
}: SingleQuestionCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-200",
      selectedValue !== undefined && "ring-2 ring-primary/30"
    )}>
      <CardContent className="p-6">
        {/* 题号徽章 */}
        <div className="text-center mb-6">
          <span className={cn(
            "inline-flex items-center justify-center px-4 py-2 rounded-full text-white text-sm font-semibold bg-gradient-to-r",
            layerColor
          )}>
            ① 第 {questionNumber} / {totalQuestions} 题
          </span>
        </div>
        
        {/* 题目文本 */}
        <div className="text-center mb-8">
          <p className="text-lg font-medium leading-relaxed">{question.text}</p>
        </div>
        
        {/* 2x2 选项网格 */}
        <div className="grid grid-cols-2 gap-3">
          {emotionHealthScoreLabels.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => onSelect(option.value)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "h-14 rounded-xl border-2 text-sm font-medium transition-all duration-200 flex items-center justify-center",
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
