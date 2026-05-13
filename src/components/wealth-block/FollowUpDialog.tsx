import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, ChevronRight, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export interface FollowUpData {
  followUpQuestion: string;
  quickOptions: string[];
  contextHint?: string;
}

interface FollowUpDialogProps {
  isOpen: boolean;
  followUp: FollowUpData;
  questionText: string;
  userScore: number;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export const FollowUpDialog = forwardRef<HTMLDivElement, FollowUpDialogProps>(function FollowUpDialog({
  isOpen,
  followUp,
  questionText,
  userScore,
  onAnswer,
  onSkip,
  isLoading = false
}, ref) {
  const [customAnswer, setCustomAnswer] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    if (option === "其他" || option === "其他...") {
      setShowCustomInput(true);
    } else {
      setSelectedOption(option);
      setTimeout(() => {
        onAnswer(option);
        setSelectedOption(null);
      }, 600);
    }
  };

  const handleCustomSubmit = () => {
    if (customAnswer.trim()) {
      onAnswer(customAnswer.trim());
      setCustomAnswer("");
      setShowCustomInput(false);
    }
  };

  const handleSkip = () => {
    setCustomAnswer("");
    setShowCustomInput(false);
    setSelectedOption(null);
    onSkip();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0.01, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0.01, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          className="mt-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-5"
        >
          {isLoading ? (
            <>
              {/* 骨架：头部 + 跳过按钮 */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary">想多了解一点</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
                  跳过
                </Button>
              </div>

              {/* 原题目提示 */}
              <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  你刚才选择了 {userScore} 分
                </p>
              </div>

              {/* 加载中说明 */}
              <div className="mb-4 flex items-center gap-2 text-base font-medium text-foreground">
                <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                <span>AI 正在为你生成追问…</span>
              </div>

              {/* 占位 chip */}
              <div className="flex flex-wrap gap-2 mb-2">
                <Skeleton className="h-9 w-20 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-16 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-full" />
              </div>

              {/* 底部跳过链接，强化退出通道 */}
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={onSkip}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  不想等，跳过下一题 →
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 头部 */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary">想多了解一点</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
                  跳过
                </Button>
              </div>

              {/* 原题目提示 */}
              <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  你对「{questionText.length > 30 ? questionText.slice(0, 30) + '...' : questionText}」选择了 {userScore} 分
                </p>
              </div>

              {/* 追问问题 */}
              <p className="mb-4 text-base font-medium text-foreground">
                {followUp.followUpQuestion}
              </p>

              {/* 提示文字 */}
              {followUp.contextHint && (
                <p className="mb-4 text-xs text-muted-foreground">
                  💡 {followUp.contextHint}
                </p>
              )}

              {/* 点击即回答提示 */}
              {!showCustomInput && (
                <p className="mb-2 text-xs text-muted-foreground/70">👆 点击选项即为回答</p>
              )}

              {/* 快速选项 - 移动端滚动优化 */}
              {!showCustomInput ? (
                <div className="flex flex-wrap gap-2 max-h-[30vh] overflow-y-auto pb-1">
                  {followUp.quickOptions.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOptionClick(option)}
                      disabled={selectedOption !== null}
                      className={`rounded-full border px-4 py-2 text-sm transition-all ${
                        selectedOption === option
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-background hover:border-primary hover:bg-primary/5"
                      } ${selectedOption !== null && selectedOption !== option ? "opacity-50" : ""}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {selectedOption === option && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          >
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </motion.span>
                        )}
                        {option}
                      </span>
                    </motion.button>
                  ))}
                </div>
              ) : (
              <motion.div
                  initial={{ opacity: 0.01, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                  style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                >
                  <Input
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    placeholder="请简单描述一下..."
                    className="w-full"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customAnswer.trim()) {
                        handleCustomSubmit();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomInput(false)}
                    >
                      返回选项
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCustomSubmit}
                      disabled={!customAnswer.trim()}
                    >
                      确定
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* 底部提示 */}
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  跳过，继续下一题 →
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
