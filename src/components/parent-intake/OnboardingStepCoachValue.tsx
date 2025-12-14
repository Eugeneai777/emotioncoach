import { motion } from "framer-motion";
import { Clock, Brain, FileText, Heart } from "lucide-react";

const VALUE_POINTS = [
  {
    icon: Clock,
    emoji: "🎯",
    title: "随时陪伴",
    description: "24小时在线，随时倾诉育儿烦恼",
    color: "from-blue-400 to-cyan-400",
  },
  {
    icon: Brain,
    emoji: "💡",
    title: "科学方法",
    description: "基于四部曲：觉察→理解→影响→行动",
    color: "from-purple-400 to-pink-400",
  },
  {
    icon: FileText,
    emoji: "🔄",
    title: "即时反馈",
    description: "每次对话生成简报，看见自己的成长",
    color: "from-green-400 to-teal-400",
  },
  {
    icon: Heart,
    emoji: "🌉",
    title: "双向连接",
    description: "同时帮助你和孩子，建立沟通桥梁",
    color: "from-pink-400 to-rose-400",
  },
];

export const OnboardingStepCoachValue = () => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="text-4xl mb-3"
        >
          👨‍👩‍👧
        </motion.div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          亲子教练能为你做什么？
        </h2>
        <p className="text-muted-foreground text-sm">
          你的专属育儿伙伴，陪你走过每个挑战
        </p>
      </div>

      {/* Value Points */}
      <div className="space-y-3">
        {VALUE_POINTS.map((point, index) => (
          <motion.div
            key={point.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-start gap-3 bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors"
          >
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${point.color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-lg">{point.emoji}</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{point.title}</p>
              <p className="text-sm text-muted-foreground">{point.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Highlight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-5 text-center"
      >
        <p className="text-sm text-purple-600 font-medium">
          ✨ 父母先稳，孩子才愿意走向你
        </p>
      </motion.div>
    </div>
  );
};
