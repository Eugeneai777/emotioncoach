import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Clock, FileText, Lock, PlayCircle, ChevronRight, Heart } from "lucide-react";
import { scl90ScoreLabels } from "./scl90Data";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSCL90Progress } from "./useSCL90Progress";

interface SCL90StartScreenProps {
  onStart: () => void;
  onContinue?: () => void;
  onBack?: () => void;
  onViewHistory?: () => void;
}

const guideItems = [
  { emoji: "🔇", text: "安静环境，专注作答" },
  { emoji: "⏱️", text: "预计 10-15 分钟完成" },
  { emoji: "📋", text: "根据最近 7 天感受选择" },
  { emoji: "✍️", text: "凭第一直觉，如实作答" },
];

export function SCL90StartScreen({ onStart, onContinue, onViewHistory }: SCL90StartScreenProps) {
  const { savedProgress, hasUnfinishedProgress, clearProgress, isLoaded } = useSCL90Progress();
  const answeredCount = savedProgress ? Object.keys(savedProgress.answers).length : 0;

  const handleStartNew = () => {
    clearProgress();
    onStart();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md space-y-5">
          
          {/* 标题区域 */}
          <motion.div 
            className="text-center space-y-3"
            initial={{ opacity: 0.01, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg"
              initial={{ opacity: 0.01, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-violet-900 dark:text-violet-100">
              SCL-90 心理健康自评
            </h1>
            <p className="text-sm text-violet-600 dark:text-violet-300">
              专业自测，清楚了解自己的情绪状态
            </p>
          </motion.div>

          {/* 继续答题提示 */}
          {isLoaded && hasUnfinishedProgress && (
            <motion.div
              initial={{ opacity: 0.01, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
            >
              <Card className="border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-amber-950/30 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          有未完成的测评
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          已完成 {answeredCount}/90 题
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={onContinue || onStart}
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4"
                    >
                      继续
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 答题指南卡片 */}
          <motion.div
            initial={{ opacity: 0.01, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
          >
            <Card className="border-violet-200 dark:border-violet-800 bg-white/80 dark:bg-violet-950/30 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <h3 className="font-medium text-violet-900 dark:text-violet-100">答题指南</h3>
                </div>
                
                <div className="space-y-2">
                  {guideItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0.01, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + index * 0.05, duration: 0.3 }}
                      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
                      className="flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300"
                    >
                      <span>{item.emoji}</span>
                      <span>{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* 分隔线 */}
                <div className="border-t border-violet-100 dark:border-violet-800 pt-3">
                  <p className="text-xs text-violet-500 dark:text-violet-400 text-center mb-3">
                    评分标准预览
                  </p>
                  
                  {/* 评分预览圆形按钮 */}
                  <div className="flex gap-2 justify-center">
                    {scl90ScoreLabels.map((score, index) => (
                      <motion.div
                        key={score.value}
                        initial={{ scale: 0.8, opacity: 0.01 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.35 + index * 0.04, duration: 0.3 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
                        className={cn(
                          "w-11 h-11 rounded-full flex flex-col items-center justify-center",
                          "cursor-pointer transition-all duration-200 shadow-sm",
                          "border",
                          score.value === 1 && "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
                          score.value === 2 && "bg-lime-50 border-lime-200 dark:bg-lime-950/30 dark:border-lime-800",
                          score.value === 3 && "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
                          score.value === 4 && "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
                          score.value === 5 && "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                        )}
                      >
                        <span className={cn(
                          "text-sm font-bold",
                          score.value === 1 && "text-emerald-600 dark:text-emerald-400",
                          score.value === 2 && "text-lime-600 dark:text-lime-400",
                          score.value === 3 && "text-amber-600 dark:text-amber-400",
                          score.value === 4 && "text-orange-600 dark:text-orange-400",
                          score.value === 5 && "text-red-600 dark:text-red-400"
                        )}>
                          {score.value}
                        </span>
                        <span className={cn(
                          "text-[8px]",
                          score.value === 1 && "text-emerald-500 dark:text-emerald-500",
                          score.value === 2 && "text-lime-500 dark:text-lime-500",
                          score.value === 3 && "text-amber-500 dark:text-amber-500",
                          score.value === 4 && "text-orange-500 dark:text-orange-500",
                          score.value === 5 && "text-red-500 dark:text-red-500"
                        )}>
                          {score.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 放轻松鼓励卡片 */}
          <motion.div
            initial={{ opacity: 0.01, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
          >
            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/80 to-violet-50/80 dark:from-purple-950/30 dark:to-violet-950/30 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                      放轻松 💜
                    </h3>
                    <p className="text-sm text-purple-600 dark:text-purple-300">
                      这不是考试，没有对错之分。只是帮你更好地了解自己的心理状态。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 专业背书 */}
          <motion.div
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.3 }}
            style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
            className="flex justify-center gap-4 text-xs text-violet-500 dark:text-violet-400"
          >
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>全球使用超40年</span>
            </div>
            <div className="flex items-center gap-1">
              <span>90题 · 10维度</span>
            </div>
          </motion.div>

          {/* 开始按钮 */}
          <motion.div
            initial={{ opacity: 0.01, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
            className="pt-2"
          >
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Button 
                onClick={hasUnfinishedProgress ? handleStartNew : onStart} 
                className={cn(
                  "w-full h-12 text-base font-medium rounded-full shadow-lg",
                  "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600",
                  "text-white"
                )}
              >
                <Brain className="w-5 h-5 mr-2" />
                {hasUnfinishedProgress ? "重新开始测评" : "开始测评"}
              </Button>
            </motion.div>
            
            {onViewHistory && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={onViewHistory} 
                className="w-full mt-2 text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300"
              >
                查看历史记录
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </motion.div>

          {/* 隐私提示 */}
          <motion.p
            initial={{ opacity: 0.01 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
            className="text-[11px] text-violet-400 dark:text-violet-500 text-center flex items-center justify-center gap-1"
          >
            <Lock className="w-3 h-3" />
            数据保密，仅供自我参考，不能替代专业诊断
          </motion.p>
        </div>
      </div>
    </div>
  );
}
