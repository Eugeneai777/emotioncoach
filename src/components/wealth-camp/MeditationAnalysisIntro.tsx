import { motion } from "framer-motion";
import { Sparkles, Target, Heart, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MeditationAnalysisIntroProps {
  dayNumber?: number;
  meditationTitle?: string;
}

export const MeditationAnalysisIntro = ({
  dayNumber,
  meditationTitle,
}: MeditationAnalysisIntroProps) => {
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6 space-y-5">
          {/* 动画图标 */}
          <div className="flex justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2.5,
                ease: "easeInOut"
              }}
              className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-full flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </motion.div>
          </div>

          {/* 标题与说明 */}
          <div className="text-center space-y-2">
            <motion.h3 
              className="text-lg font-semibold text-amber-800 dark:text-amber-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              正在分析你的冥想感受...
            </motion.h3>
            <motion.p 
              className="text-sm text-amber-600 dark:text-amber-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              我会从行为、情绪、信念三个层面帮你梳理财富卡点
            </motion.p>
          </div>

          {/* 三层分析预览 */}
          <motion.div 
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex flex-col items-center p-3 bg-white/70 dark:bg-white/10 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xs font-medium text-amber-700 dark:text-amber-300">行为层</div>
              <div className="text-[10px] text-amber-500 dark:text-amber-500">四穷模式</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-white/70 dark:bg-white/10 rounded-xl">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center mb-2">
                <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-xs font-medium text-amber-700 dark:text-amber-300">情绪层</div>
              <div className="text-[10px] text-amber-500 dark:text-amber-500">五大情绪</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-white/70 dark:bg-white/10 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-2">
                <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-xs font-medium text-amber-700 dark:text-amber-300">信念层</div>
              <div className="text-[10px] text-amber-500 dark:text-amber-500">五大信念</div>
            </div>
          </motion.div>

          {/* 冥想主题信息 */}
          {(dayNumber || meditationTitle) && (
            <motion.div 
              className="bg-white/60 dark:bg-white/10 rounded-xl p-3 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <span className="text-sm text-amber-600 dark:text-amber-400">
                📝 {dayNumber ? `Day ${dayNumber}` : ''} {dayNumber && meditationTitle ? '·' : ''} {meditationTitle || ''}
              </span>
            </motion.div>
          )}

          {/* 加载动画点 */}
          <motion.div 
            className="flex justify-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};
