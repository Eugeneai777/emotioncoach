import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  if (!q) return null;

  const getOptionsForQuestion = (question: any) => {
    if (question.options?.length > 0) return question.options;
    if (!scoreOptions?.length) return [];
    if (question.positive === false) {
      const maxScore = Math.max(...scoreOptions.map((o: any) => o.score));
      const minScore = Math.min(...scoreOptions.map((o: any) => o.score));
      return scoreOptions.map((o: any) => ({ ...o, score: maxScore + minScore - o.score }));
    }
    return scoreOptions;
  };

  const options = getOptionsForQuestion(q);

  const handleAnswer = (questionIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: score }));
    if (questionIndex < questions.length - 1) {
      setDirection(1);
      setTimeout(() => setCurrentQ(questionIndex + 1), 200);
    }
  };

  const goBack = () => {
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ(currentQ - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={onExit} className="shrink-0">
          <X className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {currentQ + 1} / {questions.length}
        </span>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2 mb-6" />

      {/* Question with slide animation */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQ}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 60 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <Card className="mb-6">
              <CardContent className="p-5 sm:p-6">
                <p className="text-base sm:text-lg font-medium leading-relaxed">{q.text}</p>
              </CardContent>
            </Card>

            <div className="space-y-2.5">
              {options.map((opt: any, oi: number) => (
                <Button
                  key={oi}
                  variant={answers[currentQ] === opt.score ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto py-3 px-4 text-sm sm:text-base active:scale-[0.98] transition-transform"
                  onClick={() => handleAnswer(currentQ, opt.score)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation - fixed bottom on mobile */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50 sticky bottom-0 bg-background pb-safe">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentQ === 0}
          onClick={goBack}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> 上一题
        </Button>
        {allAnswered && (
          <Button onClick={() => onComplete(answers)} className="gap-2">
            查看结果 <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
