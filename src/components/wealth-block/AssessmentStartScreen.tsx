import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Play, Lock, ArrowLeft } from "lucide-react";

interface AssessmentStartScreenProps {
  onStart: () => void;
  onBack?: () => void;
}

export function AssessmentStartScreen({ onStart, onBack }: AssessmentStartScreenProps) {
  const tips = [
    "没有对错，如实作答即可",
    "点击 1-5 选择最接近你的选项",
    "全程约 5 分钟，AI会适时追问"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4 flex flex-col items-center justify-center relative">
      {/* 返回按钮 */}
      {onBack && (
        <motion.div
          initial={{ opacity: 0.01 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-4"
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-4"
        style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
      >
        {/* 个性化欢迎标题 */}
        <motion.div
          initial={{ opacity: 0.01, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-center mb-4"
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <div className="text-3xl mb-2">✨</div>
          <h1 className="text-xl font-bold text-amber-800 mb-1">准备好了吗？</h1>
          <p className="text-sm text-muted-foreground">让我们开始探索你的财富模式</p>
        </motion.div>

        {/* 答题指南 - 合并小贴士和评分方式 */}
        <motion.div
          initial={{ opacity: 0.01, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📝</span>
                <span className="font-medium text-amber-800">答题指南</span>
              </div>
              
              {/* 精简的提示列表 */}
              <ul className="space-y-1.5 mb-4">
                {tips.map((tip, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0.01, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05, duration: 0.2 }}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                    style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                  >
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </motion.li>
                ))}
              </ul>

              {/* 评分预览 */}
              <div className="pt-3 border-t border-amber-100">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>不符合</span>
                  <span>符合</span>
                </div>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <motion.div
                      key={score}
                      initial={{ scale: 0.8, opacity: 0.01 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.35 + score * 0.03, duration: 0.2 }}
                      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className={`
                        w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium
                        cursor-pointer transition-all duration-200
                        ${score <= 2 
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                          : score === 3
                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                            : 'bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700 hover:from-amber-300 hover:to-orange-300'
                        }
                      `}
                    >
                      {score}
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 放轻松鼓励语 */}
        <motion.div
          initial={{ opacity: 0.01, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-amber-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-pink-400" />
                <span className="font-medium text-pink-700">放轻松</span>
              </div>
              <p className="text-sm text-muted-foreground">
                这不是考试，没有"正确答案"，你只需真实面对自己
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 开始按钮 */}
        <motion.div
          initial={{ opacity: 0.01, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="pt-2"
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Button
              onClick={onStart}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-base rounded-full shadow-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              <span>开始探索</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* 隐私保障提示 */}
        <motion.div
          initial={{ opacity: 0.01 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            回答完全保密，仅用于生成专属分析报告
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
