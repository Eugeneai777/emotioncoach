import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ParentLiteAnswer {
  questionId: string;
  values: string[];
}

interface ParentLiteQuestionsProps {
  onComplete: (answers: ParentLiteAnswer[]) => void;
  onBack: () => void;
}

const QUESTIONS = [
  {
    id: "child_issue",
    question: "孩子目前最让你头疼的是什么？",
    type: "single" as const,
    options: [
      { value: "emotional", label: "情绪波动大（易怒/低落/焦虑）", emoji: "😤" },
      { value: "school", label: "不愿上学 / 学习动力不足", emoji: "🏫" },
      { value: "screen", label: "沉迷手机/游戏", emoji: "📱" },
      { value: "communication", label: "不愿沟通 / 关上了心门", emoji: "🚪" },
      { value: "conflict", label: "亲子冲突频繁", emoji: "💥" },
    ],
  },
  {
    id: "parent_reaction",
    question: "面对孩子的问题，你最常的反应是？",
    type: "single" as const,
    options: [
      { value: "lecture", label: "忍不住讲道理、说教", emoji: "💬" },
      { value: "explode", label: "情绪爆发、吼叫", emoji: "🌋" },
      { value: "helpless", label: "不知所措、内心焦虑", emoji: "😰" },
      { value: "withdraw", label: "选择沉默、回避", emoji: "🤐" },
    ],
  },
  {
    id: "repair_ability",
    question: "和孩子发生冲突后，你通常怎么做？",
    type: "single" as const,
    options: [
      { value: "wait", label: "等孩子自己好起来", emoji: "⏳" },
      { value: "pretend", label: "当没发生过，回到日常", emoji: "🙈" },
      { value: "apologize", label: "主动道歉或尝试沟通", emoji: "💕" },
      { value: "stuck", label: "想修复但不知道怎么开口", emoji: "😶" },
    ],
  },
  {
    id: "parent_feeling",
    question: "作为妈妈，你最深的感受是？",
    type: "single" as const,
    options: [
      { value: "exhausted", label: "身心俱疲，快撑不住了", emoji: "😩" },
      { value: "guilty", label: "觉得自己不是好妈妈", emoji: "💔" },
      { value: "lonely", label: "没人理解我的辛苦", emoji: "🥺" },
      { value: "anxious", label: "怕耽误了孩子的未来", emoji: "😟" },
    ],
  },
  {
    id: "expectation",
    question: "你最希望获得什么帮助？",
    type: "single" as const,
    options: [
      { value: "method", label: "具体可用的沟通技巧", emoji: "🛠️" },
      { value: "understand", label: "读懂孩子行为背后的需求", emoji: "💭" },
      { value: "self_care", label: "先稳住自己的情绪", emoji: "🌿" },
      { value: "reconnect", label: "修复亲子关系的方法", emoji: "🤝" },
    ],
  },
];

export function ParentLiteQuestions({ onComplete, onBack }: ParentLiteQuestionsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const question = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const isLast = currentStep === QUESTIONS.length - 1;
  const currentAnswer = answers[question.id] || [];
  const canProceed = currentAnswer.length > 0;

  const handleSelect = (value: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: [value] }));
    
    // Auto-advance after short delay for single select
    if (!isLast) {
      setTimeout(() => setCurrentStep(s => s + 1), 350);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    } else {
      onBack();
    }
  };

  const handleComplete = () => {
    const result: ParentLiteAnswer[] = QUESTIONS.map(q => ({
      questionId: q.id,
      values: answers[q.id] || [],
    }));
    onComplete(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground text-sm min-w-0 truncate">亲子关系快速体检</h1>
            <p className="text-xs text-muted-foreground">
              {currentStep + 1} / {QUESTIONS.length}
            </p>
          </div>
        </div>
        <div className="h-1 bg-emerald-100">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      {/* Question */}
      <main className="container max-w-lg mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-6">{question.question}</h2>
            <div className="space-y-3">
              {question.options.map((opt) => {
                const isSelected = currentAnswer.includes(opt.value);
                return (
                  <Card
                    key={opt.value}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500/30"
                        : "hover:border-emerald-300 hover:shadow-sm"
                    )}
                    onClick={() => handleSelect(opt.value)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-xl shrink-0">{opt.emoji}</span>
                      <span className={cn("text-sm", isSelected ? "font-medium text-emerald-800" : "text-foreground")}>
                        {opt.label}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer - only show on last question */}
      {isLast && canProceed && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-emerald-100 p-4">
          <div className="container max-w-lg mx-auto">
            <Button
              onClick={handleComplete}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              查看我的诊断结果
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
