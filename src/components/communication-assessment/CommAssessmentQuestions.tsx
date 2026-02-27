import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { questions, scoreLabels, type Perspective } from "./communicationAssessmentData";

interface CommAssessmentQuestionsProps {
  perspective: Perspective;
  onComplete: (answers: Record<number, number>) => void;
  onBack: () => void;
}

export function CommAssessmentQuestions({ perspective, onComplete, onBack }: CommAssessmentQuestionsProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const total = questions.length;
  const current = questions[currentIndex];
  const questionText = perspective === 'parent' ? current.parentText : current.teenText;
  const hasAnswer = answers[current.id] !== undefined;
  const isLast = currentIndex === total - 1;
  const isFirst = currentIndex === 0;
  const progress = ((currentIndex + (hasAnswer ? 1 : 0)) / total) * 100;

  const handleSelect = (value: number) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));

    // 自动前进
    if (!isLast) {
      setTimeout(() => {
        setDirection('forward');
        setCurrentIndex((i) => i + 1);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setDirection('backward');
      setCurrentIndex((i) => i - 1);
    } else {
      onBack();
    }
  };

  const handleComplete = () => {
    if (Object.keys(answers).length === total) {
      onComplete(answers);
    }
  };

  const dimensionLabel = (() => {
    const dimMap: Record<string, string> = {
      listening: '倾听能力', empathy: '情感回应', boundary: '边界设定',
      expression: '表达方式', conflict: '冲突处理', understanding: '共情理解',
    };
    return dimMap[current.dimension] || '';
  })();

  return (
    <div className="min-h-[calc(100vh-48px)] bg-gradient-to-b from-sky-50 to-indigo-50 p-4 pb-32 flex flex-col">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={handlePrev}>
          <ArrowLeft className="w-4 h-4 mr-1" />{isFirst ? '返回' : '上一题'}
        </Button>
        <span className="text-sm text-muted-foreground font-medium">{currentIndex + 1} / {total}</span>
        <span className="text-xs text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
          {perspective === 'parent' ? '家长版' : '青少年版'}
        </span>
      </div>

      {/* 进度条 */}
      <Progress value={progress} className="h-1.5 mb-6" />

      {/* 题目 */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: direction === 'forward' ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'forward' ? -60 : 60 }}
            transition={{ duration: 0.25 }}
            className="w-full text-center space-y-6"
            style={{ transform: 'translateZ(0)' }}
          >
            {/* 维度标签 */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
              <span>{dimensionLabel}</span>
            </div>

            {/* 问题文本 */}
            <h2 className="text-lg font-semibold text-foreground leading-relaxed px-2">
              {questionText}
            </h2>

            {/* 选项按钮 */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {scoreLabels.map((opt) => {
                const isSelected = answers[current.id] === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(opt.value)}
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all
                      ${isSelected
                        ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md'
                        : 'border-border bg-background hover:border-sky-300 hover:bg-sky-50/50'
                      }
                    `}
                  >
                    <span className={`text-lg font-bold ${isSelected ? 'text-sky-600' : 'text-muted-foreground'}`}>
                      {opt.value}
                    </span>
                    <span className="text-xs text-muted-foreground">{opt.shortLabel}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 完成按钮 */}
      {isLast && hasAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
          style={{ transform: 'translateZ(0)' }}
        >
          <Button
            onClick={handleComplete}
            disabled={Object.keys(answers).length < total}
            className="w-full h-12 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-medium rounded-full shadow-lg"
          >
            <Check className="mr-2 h-5 w-5" />查看分析报告
          </Button>
        </motion.div>
      )}

      {/* 跳转提示 */}
      {!isLast && hasAnswer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center">
          <button
            onClick={() => { setDirection('forward'); setCurrentIndex((i) => i + 1); }}
            className="text-sm text-sky-600 flex items-center justify-center gap-1 mx-auto"
          >
            下一题 <ArrowRight className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
