import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ChevronRight, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DeepFollowUp {
  question: string;
  options: string[];
  targetBlock: string;
  intent: string;
}

export interface DeepFollowUpAnswer {
  question: string;
  answer: string;
  targetBlock: string;
}

interface DeepFollowUpDialogProps {
  followUps: DeepFollowUp[];
  onComplete: (answers: DeepFollowUpAnswer[]) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export function DeepFollowUpDialog({ 
  followUps, 
  onComplete, 
  onSkip,
  isLoading = false 
}: DeepFollowUpDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<DeepFollowUpAnswer[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const currentQuestion = followUps[currentIndex];
  const isLastQuestion = currentIndex === followUps.length - 1;
  const progress = ((currentIndex + 1) / followUps.length) * 100;

  const handleSelectOption = (option: string) => {
    if (option === "其他（自由输入）" || option === "其他") {
      setShowCustomInput(true);
      return;
    }

    const newAnswer: DeepFollowUpAnswer = {
      question: currentQuestion.question,
      answer: option,
      targetBlock: currentQuestion.targetBlock
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setShowCustomInput(false);
    setCustomInput("");

    if (isLastQuestion) {
      onComplete(updatedAnswers);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;

    const newAnswer: DeepFollowUpAnswer = {
      question: currentQuestion.question,
      answer: customInput.trim(),
      targetBlock: currentQuestion.targetBlock
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setShowCustomInput(false);
    setCustomInput("");

    if (isLastQuestion) {
      onComplete(updatedAnswers);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      >
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI 正在为你准备深度问题</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  基于你的测评结果，生成个性化追问...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">深度了解</span>
              </div>
              <span className="text-sm text-white/80">
                {currentIndex + 1} / {followUps.length}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <CardContent className="p-5 space-y-5">
            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                  </div>
                  <p className="text-base font-medium leading-relaxed pt-1">
                    {currentQuestion.question}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2 pl-11">
                  {currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectOption(option)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border-2 transition-all",
                        "hover:border-violet-300 hover:bg-violet-50",
                        "active:scale-[0.98]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{option}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Custom input */}
                {showCustomInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pl-11 space-y-2"
                  >
                    <Input
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="说说你的感受..."
                      className="text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomInput("");
                        }}
                      >
                        取消
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCustomSubmit}
                        disabled={!customInput.trim()}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        确定
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Skip button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={onSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                跳过，直接查看结果
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
