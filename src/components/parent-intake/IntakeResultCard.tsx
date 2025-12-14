import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, ArrowRight, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParentIntake } from "@/hooks/useParentIntake";

interface IntakeResultCardProps {
  primaryType: string;
  secondaryType: string | null;
  onStartCoaching: () => void;
}

const TYPE_DISPLAY_INFO: Record<string, { emoji: string; title: string; color: string }> = {
  depression: { emoji: "😢", title: "情绪低落", color: "from-blue-400 to-indigo-500" },
  school_refusal: { emoji: "🏫", title: "不愿上学", color: "from-purple-400 to-violet-500" },
  screen_addiction: { emoji: "📱", title: "沉迷手机/游戏", color: "from-pink-400 to-rose-500" },
  rebellion: { emoji: "😤", title: "叛逆行为", color: "from-orange-400 to-red-500" },
  low_confidence: { emoji: "😔", title: "自卑不自信", color: "from-slate-400 to-gray-500" },
  learning_anxiety: { emoji: "📚", title: "学习焦虑", color: "from-yellow-400 to-amber-500" },
  social_conflict: { emoji: "👥", title: "人际关系困难", color: "from-cyan-400 to-teal-500" },
  emotional_explosion: { emoji: "💥", title: "情绪失控", color: "from-red-400 to-orange-500" },
};

export const IntakeResultCard: React.FC<IntakeResultCardProps> = ({
  primaryType,
  secondaryType,
  onStartCoaching,
}) => {
  const { getProblemTypeInfo } = useParentIntake();
  
  const primaryInfo = getProblemTypeInfo(primaryType);
  const displayInfo = TYPE_DISPLAY_INFO[primaryType] || {
    emoji: "💭",
    title: "情绪困扰",
    color: "from-orange-400 to-amber-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Success header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100"
        >
          <Sparkles className="h-8 w-8 text-orange-500" />
        </motion.div>
        <h2 className="text-xl font-semibold text-foreground">
          问卷分析完成
        </h2>
        <p className="text-sm text-muted-foreground">
          我们已为您定制专属的教练方案
        </p>
      </div>

      {/* Primary problem card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`p-6 rounded-2xl bg-gradient-to-br ${displayInfo.color} text-white shadow-lg`}
      >
        <div className="flex items-start gap-4">
          <span className="text-4xl">{displayInfo.emoji}</span>
          <div className="flex-1 space-y-2">
            <p className="text-white/80 text-sm">您的孩子可能正在经历</p>
            <h3 className="text-2xl font-bold">{displayInfo.title}</h3>
            {primaryInfo && (
              <p className="text-white/90 text-sm leading-relaxed">
                {primaryInfo.description}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Secondary type if exists */}
      {secondaryType && TYPE_DISPLAY_INFO[secondaryType] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-xl bg-white/80 border border-orange-100 flex items-center gap-3"
        >
          <span className="text-2xl">
            {TYPE_DISPLAY_INFO[secondaryType].emoji}
          </span>
          <div>
            <p className="text-xs text-muted-foreground">同时关注</p>
            <p className="font-medium text-foreground">
              {TYPE_DISPLAY_INFO[secondaryType].title}
            </p>
          </div>
        </motion.div>
      )}

      {/* What we'll do */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/80 rounded-xl p-5 space-y-4"
      >
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Heart className="h-4 w-4 text-orange-500" />
          专属教练方案
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-orange-600">1</span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">隐形四部曲引导</p>
              <p className="text-xs text-muted-foreground">
                在自然对话中，帮您完成觉察→理解→反应→转化
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-orange-600">2</span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">智能上下文传递</p>
              <p className="text-xs text-muted-foreground">
                提取关键信息，让孩子的AI教练更懂TA
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-orange-600">3</span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">双向沟通桥梁</p>
              <p className="text-xs text-muted-foreground">
                您和孩子都获得专属引导，形成正向循环
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3 pb-4"
      >
        <Button
          onClick={onStartCoaching}
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg"
        >
          开始专属对话
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            查看训练营
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <Users className="h-4 w-4 mr-2" />
            邀请孩子
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
