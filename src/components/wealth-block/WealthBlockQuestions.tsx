import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { questions, scoreLabels, calculateResult, AssessmentResult } from "./wealthBlockData";

interface WealthBlockQuestionsProps {
  onComplete: (result: AssessmentResult, answers: Record<number, number>) => void;
}

export function WealthBlockQuestions({ onComplete }: WealthBlockQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canSubmit = answeredCount === questions.length;

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    
    // 自动跳转到下一题（除非是最后一题）
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300);
    }
  };

  const handleSubmit = () => {
    const result = calculateResult(answers);
    onComplete(result, answers);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="flex flex-col min-h-[500px]">
      {/* 进度指示 */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">答题进度</span>
          <span className="text-sm font-medium text-amber-600">{currentIndex + 1} / {questions.length}</span>
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

                {/* 选项列表 */}
                <div className="space-y-3 pt-2">
                  {scoreLabels.map(option => {
                    const isSelected = answers[currentQuestion.id] === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between",
                          isSelected
                            ? "border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700"
                            : "border-muted bg-background hover:border-amber-200 hover:bg-amber-50/30"
                        )}
                        onClick={() => handleAnswer(option.value)}
                      >
                        <span className={cn(
                          "font-medium",
                          isSelected ? "text-amber-700" : "text-foreground"
                        )}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
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
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            查看结果
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex-1 h-12"
            disabled={!answers[currentQuestion.id]}
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
