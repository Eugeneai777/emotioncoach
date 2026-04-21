import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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

  // Pre-compute shuffled options for all questions (stable across re-renders)
  const shuffledOptionsMap = useMemo(() => {
    return questions.map((question, idx) => {
      const opts = getOptionsForQuestion(question);
      return seededShuffle(opts, idx * 97 + 31);
    });
  }, [questions, getOptionsForQuestion]);

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
      const num = parseInt(e.key);
      if (!isNaN(num) && q) {
        const opts = shuffledOptionsMap[currentQ] as any[];
        if (num >= 1 && num <= opts.length) {
          handleAnswer(currentQ, opts[num - 1].score);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQ, hasAnswer, isLast, allAnswered, answers, q, shuffledOptionsMap]);

  if (!q) return null;

  const options = shuffledOptionsMap[currentQ];

  const handleAnswer = (questionIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: score }));
    if (questionIndex < questions.length - 1) {
      setDirection(1);
      setTimeout(() => setCurrentQ(questionIndex + 1), 300);
    }
  };

  const goBack = () => {
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ(currentQ - 1);
    }
  };

  const answeredCount = Object.keys(answers).length;

  // Gradient color interpolation for progress
  const progressColor = progress < 50
    ? `hsl(var(--primary))`
    : `hsl(var(--primary))`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 max-w-lg mx-auto flex flex-col">
      {/* Top bar */}
      <motion.div
        className="flex items-center justify-between mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button variant="ghost" size="icon" onClick={onExit} className="shrink-0 rounded-full">
          <X className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <motion.span
            key={currentQ}
            className="text-sm font-medium text-foreground tabular-nums"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {currentQ + 1}
          </motion.span>
          <span className="text-xs text-muted-foreground">/ {questions.length}</span>
        </div>
        <div className="w-9" />
      </motion.div>

      {/* Gradient Progress Bar */}
      <div className="space-y-1 mb-6">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/60">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 60%, hsl(var(--accent, var(--primary))) 100%)",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          />
          {/* Animated shine effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
              width: `${progress}%`,
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>已答 {answeredCount} 题</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Question with enhanced slide animation */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQ}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -direction * 60, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-5"
          >
            {/* Question text */}
            <motion.div
              className="rounded-2xl bg-card/95 backdrop-blur-md border border-border/40 p-5 sm:p-6 shadow-lg"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <p className="text-base sm:text-lg font-semibold leading-relaxed text-foreground">
                {q.text}
              </p>
              {q.subtitle && (
                <p className="mt-2 text-xs text-muted-foreground">{q.subtitle}</p>
              )}
            </motion.div>

            {/* Options with stagger */}
            <div className="space-y-2.5">
              {options.map((opt: any, oi: number) => {
                const isSelected = answers[currentQ] === opt.score;
                return (
                  <motion.button
                    key={`${currentQ}-${opt.score}-${oi}`}
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: 0.1 + oi * 0.06,
                      duration: 0.35,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAnswer(currentQ, opt.score)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-300",
                      isSelected
                        ? "border-primary bg-primary/8 shadow-md shadow-primary/10"
                        : "border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                    )}
                  >
                    {/* Number badge */}
                    <motion.span
                      className={cn(
                        "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                      animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : oi + 1}
                    </motion.span>

                    {/* Label */}
                    <span
                      className={cn(
                        "flex-1 text-sm sm:text-base font-medium transition-colors duration-300",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {opt.label}
                    </span>

                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-primary shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <motion.div
        className="flex items-center justify-between mt-6 pt-4 border-t border-border/40 sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pb-safe"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={currentQ === 0}
          onClick={goBack}
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> 上一题
        </Button>

        {hasAnswer && !isLast && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDirection(1); setCurrentQ((i) => i + 1); }}
              className="rounded-full text-primary"
            >
              下一题 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {allAnswered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Button
              onClick={() => onComplete(answers)}
              className="gap-2 rounded-full shadow-lg px-6"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
              }}
            >
              查看结果 <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
