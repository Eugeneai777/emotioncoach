import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DynamicAssessmentQuestionsProps {
  questions: any[];
  scoreOptions?: any[];
  onComplete: (answers: Record<number, number>) => void;
  onExit: () => void;
}

export function DynamicAssessmentQuestions({ questions, scoreOptions, onComplete, onExit }: DynamicAssessmentQuestionsProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [direction, setDirection] = useState(1);

  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;
  const allAnswered = Object.keys(answers).length === questions.length;
  const q = questions[currentQ];
  const hasAnswer = answers[currentQ] !== undefined;
  const isLast = currentQ === questions.length - 1;

  const getOptionsForQuestion = useCallback((question: any) => {
    if (question.options?.length > 0) return question.options;
    if (!scoreOptions?.length) return [];
    if (question.positive === false) {
      const maxScore = Math.max(...scoreOptions.map((o: any) => o.score));
      const minScore = Math.min(...scoreOptions.map((o: any) => o.score));
      return scoreOptions.map((o: any) => ({ ...o, score: maxScore + minScore - o.score }));
    }
    return scoreOptions;
  }, [scoreOptions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentQ > 0) {
        setDirection(-1);
        setCurrentQ((i) => i - 1);
      } else if (e.key === "ArrowRight" && hasAnswer && !isLast) {
        setDirection(1);
        setCurrentQ((i) => i + 1);
      } else if (e.key === "Enter" && allAnswered && isLast) {
        onComplete(answers);
      }
      // Number keys 1-9 for quick answer
      const num = parseInt(e.key);
      if (!isNaN(num) && q) {
        const opts = getOptionsForQuestion(q);
        if (num >= 1 && num <= opts.length) {
          handleAnswer(currentQ, opts[num - 1].score);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQ, hasAnswer, isLast, allAnswered, answers, q, getOptionsForQuestion]);

  if (!q) return null;

  const options = getOptionsForQuestion(q);

  const handleAnswer = (questionIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: score }));
    if (questionIndex < questions.length - 1) {
      setDirection(1);
      setTimeout(() => setCurrentQ(questionIndex + 1), 250);
    }
  };

  const goBack = () => {
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ(currentQ - 1);
    }
  };

  // Count answered questions
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 max-w-lg mx-auto flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" onClick={onExit} className="shrink-0 rounded-full">
          <X className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground tabular-nums">
            {currentQ + 1}
          </span>
          <span className="text-xs text-muted-foreground">/ {questions.length}</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Progress with answered indicator */}
      <div className="space-y-1 mb-6">
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>已答 {answeredCount} 题</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Question with slide animation */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQ}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 50 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-5"
          >
            {/* Question text - cleaner card */}
            <div className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/50 p-5 sm:p-6 shadow-sm">
              <p className="text-base sm:text-lg font-semibold leading-relaxed text-foreground">
                {q.text}
              </p>
              {q.subtitle && (
                <p className="mt-2 text-xs text-muted-foreground">{q.subtitle}</p>
              )}
            </div>

            {/* Options - styled cards */}
            <div className="space-y-2.5">
              {options.map((opt: any, oi: number) => {
                const isSelected = answers[currentQ] === opt.score;
                return (
                  <motion.button
                    key={oi}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: oi * 0.04 }}
                    onClick={() => handleAnswer(currentQ, opt.score)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200",
                      "active:scale-[0.98]",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-card/80 hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    {/* Number badge */}
                    <span
                      className={cn(
                        "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : oi + 1}
                    </span>

                    {/* Label */}
                    <span
                      className={cn(
                        "flex-1 text-sm sm:text-base font-medium",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {opt.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40 sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pb-safe">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentQ === 0}
          onClick={goBack}
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> 上一题
        </Button>

        {/* Next button for answered non-last questions */}
        {hasAnswer && !isLast && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDirection(1); setCurrentQ((i) => i + 1); }}
            className="rounded-full text-primary"
          >
            下一题 <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}

        {allAnswered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              onClick={() => onComplete(answers)}
              className="gap-2 rounded-full shadow-lg px-6"
            >
              查看结果 <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
