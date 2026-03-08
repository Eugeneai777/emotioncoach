import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

interface DynamicAssessmentQuestionsProps {
  questions: any[];
  scoreOptions?: any[]; // Template-level shared options
  onComplete: (answers: Record<number, number>) => void;
  onExit: () => void;
}

export function DynamicAssessmentQuestions({ questions, scoreOptions, onComplete, onExit }: DynamicAssessmentQuestionsProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;
  const allAnswered = Object.keys(answers).length === questions.length;
  const q = questions[currentQ];

  if (!q) return null;

  // Resolve options: per-question options > template-level scoreOptions with positive/reverse handling
  const getOptionsForQuestion = (question: any) => {
    if (question.options?.length > 0) return question.options;
    if (!scoreOptions?.length) return [];
    
    // If question has positive=false (reversed), flip the scores
    if (question.positive === false) {
      const maxScore = Math.max(...scoreOptions.map((o: any) => o.score));
      const minScore = Math.min(...scoreOptions.map((o: any) => o.score));
      return scoreOptions.map((o: any) => ({
        ...o,
        score: maxScore + minScore - o.score,
      }));
    }
    return scoreOptions;
  };

  const options = getOptionsForQuestion(q);

  const handleAnswer = (questionIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: score }));
    if (questionIndex < questions.length - 1) {
      setTimeout(() => setCurrentQ(questionIndex + 1), 200);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={onExit}>
          <X className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentQ + 1} / {questions.length}
        </span>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2 mb-6" />

      {/* Question */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <p className="text-lg font-medium leading-relaxed">{q.text}</p>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="space-y-3">
        {options.map((opt: any, oi: number) => (
          <Button
            key={oi}
            variant={answers[currentQ] === opt.score ? "default" : "outline"}
            className="w-full justify-start text-left h-auto py-3 px-4"
            onClick={() => handleAnswer(currentQ, opt.score)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentQ === 0}
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
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
