import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Sparkles, Loader2 } from "lucide-react";
import {
  shuffledQuestions,
  scoreLabels,
  dimensionMeta,
  subDimensionLabels,
  shouldTriggerFollowUp,
  type SubDimension,
  type Dimension,
} from "./parentAbilityData";
import { supabase } from "@/integrations/supabase/client";

export interface FollowUpAnswer {
  subDimension: SubDimension;
  dimension: Dimension;
  question: string;
  answer: string;
}

interface ParentAbilityQuestionsProps {
  onComplete: (answers: Record<number, number>, followUps: FollowUpAnswer[]) => void;
  onBack: () => void;
}

interface FollowUpData {
  followUpQuestion: string;
  quickOptions: string[];
  contextHint: string;
  subDimension: SubDimension;
  dimension: Dimension;
}

export function ParentAbilityQuestions({ onComplete, onBack }: ParentAbilityQuestionsProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [followUpCount, setFollowUpCount] = useState(0);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([]);
  const [activeFollowUp, setActiveFollowUp] = useState<FollowUpData | null>(null);
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);

  const total = shuffledQuestions.length;
  const current = shuffledQuestions[currentIndex];
  const hasAnswer = answers[current.id] !== undefined;
  const isLast = currentIndex === total - 1;
  const isFirst = currentIndex === 0;
  const progress = ((currentIndex + (hasAnswer ? 1 : 0)) / total) * 100;

  const fetchFollowUp = useCallback(async (subDim: SubDimension, dim: Dimension) => {
    setLoadingFollowUp(true);
    try {
      const questionText = `${dimensionMeta[dim].label} - ${subDimensionLabels[subDim]}`;
      const { data, error } = await supabase.functions.invoke('smart-question-followup', {
        body: {
          questionId: `parent-ability-${subDim}`,
          questionText,
          questionCategory: dim,
          userScore: 2,
          previousAnswers: [],
        },
      });

      if (error) throw error;

      const result = data?.fallback || data;
      setActiveFollowUp({
        followUpQuestion: result.followUpQuestion || '这种情况通常在什么场景下出现？',
        quickOptions: result.quickOptions || ['与孩子学习相关', '日常相处中', '社交场合', '其他'],
        contextHint: result.contextHint || '帮助我们给你更精准的建议',
        subDimension: subDim,
        dimension: dim,
      });
    } catch (e) {
      console.error('Follow-up fetch failed:', e);
      setActiveFollowUp({
        followUpQuestion: '这种情况通常在什么场景下出现？',
        quickOptions: ['与孩子学习相关', '日常相处中', '社交场合', '其他'],
        contextHint: '帮助我们给你更精准的建议',
        subDimension: subDim,
        dimension: dim,
      });
    } finally {
      setLoadingFollowUp(false);
    }
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setDirection('forward');
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, total]);

  const handleSelect = (value: number) => {
    const newAnswers = { ...answers, [current.id]: value };
    setAnswers(newAnswers);

    // Check AI follow-up trigger
    const { shouldTrigger, subDimension, dimension } = shouldTriggerFollowUp(newAnswers, currentIndex, followUpCount);
    if (shouldTrigger && subDimension && dimension) {
      fetchFollowUp(subDimension, dimension);
      setFollowUpCount(c => c + 1);
      return; // Don't advance until follow-up is done
    }

    if (!isLast) {
      setTimeout(goNext, 300);
    }
  };

  const handleFollowUpSelect = (option: string) => {
    if (!activeFollowUp) return;
    setFollowUpAnswers(prev => [...prev, {
      subDimension: activeFollowUp.subDimension,
      dimension: activeFollowUp.dimension,
      question: activeFollowUp.followUpQuestion,
      answer: option,
    }]);
    setActiveFollowUp(null);
    if (!isLast) {
      setTimeout(goNext, 200);
    }
  };

  const handlePrev = () => {
    if (activeFollowUp) {
      setActiveFollowUp(null);
      return;
    }
    if (!isFirst) {
      setDirection('backward');
      setCurrentIndex(i => i - 1);
    } else {
      onBack();
    }
  };

  const handleComplete = () => {
    if (Object.keys(answers).length === total) {
      onComplete(answers, followUpAnswers);
    }
  };

  const dimLabel = dimensionMeta[current.dimension].label;
  const subLabel = subDimensionLabels[current.subDimension];

  // Follow-up overlay
  if (loadingFollowUp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 p-4 flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <Sparkles className="h-8 w-8 text-teal-500 mx-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">AI 正在根据你的回答生成追问...</p>
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-teal-500" />
        </motion.div>
      </div>
    );
  }

  if (activeFollowUp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={handlePrev}>
            <ArrowLeft className="w-4 h-4 mr-1" />返回
          </Button>
          <span className="text-xs text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" />AI 追问
          </span>
        </div>
        <Progress value={progress} className="h-1.5 mb-6" />
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full text-center space-y-5"
            style={{ transform: 'translateZ(0)' }}
          >
            <p className="text-xs text-muted-foreground">{activeFollowUp.contextHint}</p>
            <h2 className="text-lg font-semibold text-foreground leading-relaxed px-2">
              {activeFollowUp.followUpQuestion}
            </h2>
            <div className="space-y-2">
              {activeFollowUp.quickOptions.map((opt, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleFollowUpSelect(opt)}
                  className="w-full p-3 rounded-xl border-2 border-border bg-background hover:border-teal-400 hover:bg-teal-50/50 text-sm transition-all text-left"
                >
                  {opt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 p-4 flex flex-col">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={handlePrev}>
          <ArrowLeft className="w-4 h-4 mr-1" />{isFirst ? '返回' : '上一题'}
        </Button>
        <span className="text-sm text-muted-foreground font-medium">{currentIndex + 1} / {total}</span>
        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">三力测评</span>
      </div>

      <Progress value={progress} className="h-1.5 mb-6" />

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
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                {dimensionMeta[current.dimension].icon} {dimLabel}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{subLabel}</span>
            </div>

            {/* 问题文本 */}
            <h2 className="text-lg font-semibold text-foreground leading-relaxed px-2">
              {current.text}
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
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                        : 'border-border bg-background hover:border-emerald-300 hover:bg-emerald-50/50'
                      }
                    `}
                  >
                    <span className={`text-lg font-bold ${isSelected ? 'text-emerald-600' : 'text-muted-foreground'}`}>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6" style={{ transform: 'translateZ(0)' }}>
          <Button
            onClick={handleComplete}
            disabled={Object.keys(answers).length < total}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-full shadow-lg"
          >
            <Check className="mr-2 h-5 w-5" />查看三力分析报告
          </Button>
        </motion.div>
      )}

      {/* 下一题提示 */}
      {!isLast && hasAnswer && !activeFollowUp && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center">
          <button
            onClick={goNext}
            className="text-sm text-emerald-600 flex items-center justify-center gap-1 mx-auto"
          >
            下一题 <ArrowRight className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
