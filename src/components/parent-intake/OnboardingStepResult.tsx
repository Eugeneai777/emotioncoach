import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { useParentIntake } from "@/hooks/useParentIntake";

interface OnboardingStepResultProps {
  primaryType: string;
  secondaryType: string | null;
}

const TYPE_DISPLAY_INFO: Record<string, { emoji: string; title: string; color: string }> = {
  emotional: { emoji: "💔", title: "情绪低落", color: "from-blue-400 to-indigo-500" },
  behavioral: { emoji: "⚡", title: "行为问题", color: "from-orange-400 to-red-500" },
  academic: { emoji: "📚", title: "学业困扰", color: "from-green-400 to-teal-500" },
  social: { emoji: "👥", title: "社交困难", color: "from-purple-400 to-pink-500" },
  screen: { emoji: "📱", title: "屏幕依赖", color: "from-cyan-400 to-blue-500" },
  communication: { emoji: "💬", title: "沟通障碍", color: "from-pink-400 to-rose-500" },
};

export const OnboardingStepResult = ({
  primaryType,
  secondaryType,
}: OnboardingStepResultProps) => {
  const { getProblemTypeInfo } = useParentIntake();

  const primaryInfo = TYPE_DISPLAY_INFO[primaryType] || { 
    emoji: "🌟", 
    title: getProblemTypeInfo(primaryType)?.type_name || "成长挑战",
    color: "from-purple-400 to-pink-500"
  };

  const secondaryInfo = secondaryType ? (TYPE_DISPLAY_INFO[secondaryType] || {
    emoji: "💫",
    title: getProblemTypeInfo(secondaryType)?.type_name || "次要关注",
    color: "from-teal-400 to-cyan-500"
  }) : null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-4"
        >
          <Sparkles className="w-8 h-8 text-purple-500" />
        </motion.div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          我们理解你的处境
        </h2>
        <p className="text-muted-foreground text-sm">
          根据你的回答，我们识别了以下关注点
        </p>
      </div>

      {/* Primary Problem */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`bg-gradient-to-r ${primaryInfo.color} rounded-2xl p-4 mb-4`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{primaryInfo.emoji}</span>
          <div className="text-white">
            <p className="text-xs opacity-80">主要关注</p>
            <p className="font-bold text-lg">{primaryInfo.title}</p>
          </div>
        </div>
      </motion.div>

      {/* Secondary Problem (if exists) */}
      {secondaryInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-muted/50 rounded-2xl p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{secondaryInfo.emoji}</span>
            <div>
              <p className="text-xs text-muted-foreground">次要关注</p>
              <p className="font-medium text-foreground">{secondaryInfo.title}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empathy Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-start gap-3 bg-purple-50 rounded-xl p-4"
      >
        <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          每个孩子都在用自己的方式表达需求。接下来，让我们一起了解如何更好地支持 TA 成长。
        </p>
      </motion.div>
    </div>
  );
};
