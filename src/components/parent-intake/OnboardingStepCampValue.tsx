import { motion } from "framer-motion";
import { Clock, MessageCircle, CheckSquare, TrendingUp } from "lucide-react";

const CAMP_BENEFITS = [
  {
    icon: Clock,
    emoji: "⏰",
    title: "每天15分钟",
    description: "不需要大块时间，融入日常生活",
  },
  {
    icon: MessageCircle,
    emoji: "💬",
    title: "每天做一次亲子教练对话",
    description: "在对话中理解孩子，找到沟通方法",
  },
  {
    icon: CheckSquare,
    emoji: "📝",
    title: "打卡记录",
    description: "看见自己每一天的进步和成长",
  },
  {
    icon: TrendingUp,
    emoji: "📊",
    title: "系统成长",
    description: "21天养成新的亲子沟通习惯",
  },
];

const CAMP_RULES = [
  "每天完成一次亲子教练对话",
  "可以补打卡，不用担心错过",
  "21天后获得专属成长报告",
];

export const OnboardingStepCampValue = () => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100">
      {/* Header */}
      <div className="text-center mb-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="text-4xl mb-3"
        >
          🏕️
        </motion.div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          为什么推荐21天训练营？
        </h2>
        <p className="text-muted-foreground text-sm">
          科学研究表明，21天足以养成一个新习惯
        </p>
      </div>

      {/* Benefits */}
      <div className="space-y-3 mb-5">
        {CAMP_BENEFITS.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-start gap-3 bg-muted/30 rounded-xl p-3"
          >
            <span className="text-xl flex-shrink-0">{benefit.emoji}</span>
            <div>
              <p className="font-semibold text-foreground text-sm">{benefit.title}</p>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Camp Rules */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100/50"
      >
        <p className="text-sm font-medium text-foreground mb-3">📋 训练营规则：</p>
        <ul className="space-y-2">
          {CAMP_RULES.map((rule, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};
