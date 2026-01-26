import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

  // 当前页是否全部答完
  const isCurrentPageComplete = currentQuestions.every(q => answers[q.id] !== undefined);

  // 是否最后一页
  const isLastPage = currentPage === totalPages - 1;

  // 是否全部答完
  const isAllComplete = answeredCount === 90;

  // 处理答案选择
  const handleAnswer = useCallback((questionId: number, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  }, []);

  // 下一页
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      // 滚动到顶部
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
    // 清除保存的进度
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
      {/* 顶部导航 */}
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
        <span className="text-sm text-muted-foreground">
          第 {currentPage + 1} 页 / {totalPages} 页
        </span>
      </div>

      {/* 进度条 */}
      <div className="space-y-1.5">
        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          已完成 {answeredCount} / 90 题
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
                "p-4 rounded-xl border bg-card",
                answers[question.id] !== undefined 
                  ? "border-primary/30 bg-primary/5" 
                  : "border-border"
              )}
            >
              {/* 题目文本 */}
              <div className="flex items-start gap-3 mb-3">
                <span className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                  answers[question.id] !== undefined
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {question.id}
                </span>
                <p className="text-sm font-medium pt-1">{question.text}</p>
              </div>

              {/* 评分选项 */}
              <div className="flex flex-wrap gap-1.5 ml-10">
                {scl90ScoreLabels.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(question.id, option.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      answers[question.id] === option.value
                        ? "ring-2 ring-primary ring-offset-1 scale-105"
                        : "hover:scale-105",
                      option.color
                    )}
                  >
                    {option.value} {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 底部导航按钮 */}
      <div className="flex gap-3 pt-2 sticky bottom-0 bg-background pb-4">
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
            {isAllComplete ? "提交测评" : `还剩 ${90 - answeredCount} 题`}
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
              您已完成 {answeredCount} 道题目，退出后答题进度将丢失。
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
