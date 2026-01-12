import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Heart, ArrowRight, Sparkles } from "lucide-react";

interface AssessmentStartScreenProps {
  onStart: () => void;
}

export function AssessmentStartScreen({ onStart }: AssessmentStartScreenProps) {
  const tips = [
    "没有对错之分，如实作答即可",
    "选择最接近你真实反应的数字",
    "AI会根据回答适时深入追问",
    "全程约 5-8 分钟"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-4"
      >
        {/* 标题 */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2 text-2xl font-bold text-amber-800"
          >
            <Sparkles className="h-6 w-6 text-amber-500" />
            <span>准备开始测评</span>
          </motion.div>
        </div>

        {/* 测评小贴士 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <span className="font-medium text-amber-800">测评小贴士</span>
              </div>
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* 评分方式 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📊</span>
                <span className="font-medium text-amber-800">评分方式</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>完全不符合</span>
                <span>非常符合</span>
              </div>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((score) => (
                  <motion.div
                    key={score}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6 + score * 0.05, duration: 0.2 }}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                      ${score === 3 
                        ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300' 
                        : 'bg-gray-100 text-gray-500'
                      }
                    `}
                  >
                    {score}
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                点击数字选择你的答案
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 鼓励语 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-amber-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-pink-400" />
                <span className="font-medium text-pink-700">放轻松</span>
              </div>
              <p className="text-sm text-muted-foreground">
                这不是考试，没有"正确答案"<br />
                你只需真实面对自己 💫
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 开始按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="pt-4"
        >
          <Button
            onClick={onStart}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-base rounded-full shadow-lg"
          >
            <span>开始第一题</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
