import { motion } from "framer-motion";
import { MessageSquare, Mic } from "lucide-react";

const SCENARIO_EXAMPLES = [
  {
    emoji: "😤",
    text: "孩子又不愿上学，我该怎么办？",
  },
  {
    emoji: "💢",
    text: "刚和孩子吵完架，心里很难受",
  },
  {
    emoji: "🤔",
    text: "不知道怎么和青春期的孩子沟通",
  },
  {
    emoji: "😰",
    text: "孩子沉迷手机，说什么都不听",
  },
];

const INTERACTION_MODES = [
  {
    icon: MessageSquare,
    title: "文字对话",
    description: "随时记录想法，慢慢整理思绪",
    color: "from-blue-400 to-cyan-400",
  },
  {
    icon: Mic,
    title: "语音通话",
    description: "像和朋友聊天一样，倾诉更自然",
    color: "from-purple-400 to-pink-400",
  },
];

export const OnboardingStepHowToUse = () => {
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
          💬
        </motion.div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          如何开始一次对话？
        </h2>
        <p className="text-muted-foreground text-sm">
          想说什么就说什么，教练会引导你
        </p>
      </div>

      {/* Scenario Examples */}
      <div className="mb-5">
        <p className="text-sm text-muted-foreground mb-3">💡 你可以这样开始：</p>
        <div className="space-y-2">
          {SCENARIO_EXAMPLES.map((scenario, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl px-4 py-3 border border-purple-100/50"
            >
              <p className="text-sm text-foreground">
                <span className="mr-2">{scenario.emoji}</span>
                "{scenario.text}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Interaction Modes */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">🎙️ 两种对话方式：</p>
        <div className="grid grid-cols-2 gap-3">
          {INTERACTION_MODES.map((mode, index) => (
            <motion.div
              key={mode.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-muted/30 rounded-xl p-4 text-center"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${mode.color} flex items-center justify-center mx-auto mb-2`}>
                <mode.icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-foreground text-sm">{mode.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
