import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  scl90Questions,
  scl90ScoreLabels,
  calculateSCL90Result,
  SCL90Result,
} from "./scl90Data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSCL90Progress } from "./useSCL90Progress";

interface SCL90QuestionsProps {
  onComplete: (result: SCL90Result, answers: Record<number, number>) => void;
  onExit?: () => void;
}

const QUESTIONS_PER_PAGE = 9;

export function SCL90Questions({ onComplete, onExit }: SCL90QuestionsProps) {
  const { savedProgress, saveProgress, clearProgress } = useSCL90Progress();
  
  // 从保存的进度初始化状态
  const [currentPage, setCurrentPage] = useState(() => savedProgress?.currentPage || 0);
  const [answers, setAnswers] = useState<Record<number, number>>(() => savedProgress?.answers || {});
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化时从savedProgress恢复
  useEffect(() => {
    if (!isInitialized && savedProgress) {
      setCurrentPage(savedProgress.currentPage);
      setAnswers(savedProgress.answers);
      setIsInitialized(true);
    } else if (!savedProgress) {
      setIsInitialized(true);
    }
  }, [savedProgress, isInitialized]);

  // 自动保存进度（每次answers或currentPage变化时）
  useEffect(() => {
    if (isInitialized && Object.keys(answers).length > 0) {
      saveProgress(answers, currentPage);
    }
  }, [answers, currentPage, saveProgress, isInitialized]);

  const totalPages = Math.ceil(scl90Questions.length / QUESTIONS_PER_PAGE);

  // 当前页的题目
  const currentQuestions = useMemo(() => {
    return scl90Questions.slice(
      currentPage * QUESTIONS_PER_PAGE,
      (currentPage + 1) * QUESTIONS_PER_PAGE
    );
  }, [currentPage]);

  // 已答题数
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / 90) * 100;
  const remainingCount = 90 - answeredCount;

  // 当前页是否全部答完
  const isCurrentPageComplete = currentQuestions.every(q => answers[q.id] !== undefined);

  // 是否最后一页
  const isLastPage = currentPage === totalPages - 1;

  // 是否全部答完
  const isAllComplete = answeredCount === 90;

  // 判断某页是否已完成
  const isPageCompleted = useCallback((pageIndex: number) => {
    const startIdx = pageIndex * QUESTIONS_PER_PAGE;
    const endIdx = Math.min((pageIndex + 1) * QUESTIONS_PER_PAGE, 90);
    for (let i = startIdx; i < endIdx; i++) {
      const questionId = scl90Questions[i]?.id;
      if (questionId && answers[questionId] === undefined) {
        return false;
      }
    }
    return true;
  }, [answers]);

  // 处理答案选择
  const handleAnswer = useCallback((questionId: number, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  }, []);

  // 跳转到指定页
  const handleGoToPage = useCallback((pageIndex: number) => {
    setCurrentPage(pageIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 下一页
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages]);

  // 上一页
  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // 提交测评
  const handleSubmit = useCallback(() => {
    const result = calculateSCL90Result(answers);
    clearProgress();
    onComplete(result, answers);
  }, [answers, onComplete, clearProgress]);

  // 退出确认
  const handleExitClick = useCallback(() => {
    if (answeredCount > 0) {
      setShowExitConfirm(true);
    } else {
      onExit?.();
    }
  }, [answeredCount, onExit]);

  return (
    <div className="space-y-4">
      {/* 顶部导航 + 进度 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitClick}
            className="gap-1.5 text-sm -ml-2"
          >
            <X className="w-4 h-4" />
            退出
          </Button>
          
          {/* 圆点页码指示器 */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleGoToPage(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-200",
                  i === currentPage 
                    ? "bg-primary w-4" 
                    : isPageCompleted(i)
                      ? "bg-primary/50 w-2"
                      : "bg-muted w-2"
                )}
                aria-label={`跳转到第 ${i + 1} 页`}
              />
            ))}
          </div>
          
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentPage + 1}/{totalPages}
          </span>
        </div>
        
        {/* 渐变进度条 */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          还剩 <strong className="text-foreground">{remainingCount}</strong> 题
        </p>
      </div>

      {/* 题目列表 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0.01, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0.01, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
          style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
        >
          {currentQuestions.map((question, index) => (
            <div
              key={question.id}
              className={cn(
                "p-3 sm:p-4 rounded-xl border bg-card",
                answers[question.id] !== undefined 
                  ? "border-primary/30 bg-primary/5" 
                  : "border-border"
              )}
            >
              {/* 题目文本 - 题号内联 */}
              <div className="flex items-start gap-2 mb-3">
                <span className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  answers[question.id] !== undefined
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {question.id}
                </span>
                <p className="text-sm font-medium leading-relaxed pt-0.5">{question.text}</p>
              </div>

              {/* 评分选项 - 优化为5列等宽网格 */}
              <div className="grid grid-cols-5 gap-1.5 mt-3">
                {scl90ScoreLabels.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(question.id, option.value)}
                    className={cn(
                      "flex flex-col items-center justify-center",
                      "min-h-[52px] rounded-lg border-2 transition-all duration-200",
                      "touch-manipulation active:scale-95",
                      answers[question.id] === option.value
                        ? "ring-2 ring-offset-1 ring-primary border-primary bg-primary/10 scale-[1.02]"
                        : "border-muted-foreground/20 hover:border-primary/40",
                      option.color
                    )}
                  >
                    <span className="text-sm font-bold">{option.value}</span>
                    <span className="text-[10px] font-medium opacity-80">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 底部导航按钮 */}
      <div className="flex gap-3 pt-2 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-[calc(16px+env(safe-area-inset-bottom))]">
        <Button
          variant="outline"
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className="flex-1 h-11"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          上一页
        </Button>

        {isLastPage ? (
          <Button
            onClick={handleSubmit}
            disabled={!isAllComplete}
            className={cn(
              "flex-1 h-11",
              isAllComplete && "bg-gradient-to-r from-purple-600 to-indigo-600"
            )}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            {isAllComplete ? "提交测评" : `还剩 ${remainingCount} 题`}
          </Button>
        ) : (
          <Button
            onClick={handleNextPage}
            disabled={!isCurrentPageComplete}
            className="flex-1 h-11"
          >
            下一页
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* 退出确认对话框 */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要退出吗？</AlertDialogTitle>
            <AlertDialogDescription>
              您已完成 {answeredCount} 道题目，进度将自动保存，下次可继续答题。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续答题</AlertDialogCancel>
            <AlertDialogAction onClick={() => onExit?.()}>
              确认退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
