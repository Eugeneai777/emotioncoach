import { motion } from "framer-motion";
import { Mic, Brain, Route, MessageCircle } from "lucide-react";

const values = [
  {
    icon: Brain,
    title: "深度解读",
    desc: "AI 逐条解析你的测评结果，告诉你「为什么卡住」",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Route,
    title: "个性建议",
    desc: "基于你的独特模式，给出定制突破路径",
    gradient: "from-pink-500 to-fuchsia-500",
  },
  {
    icon: Mic,
    title: "语音互动",
    desc: "像真人教练一样，用语音和你 1 对 1 对话",
    gradient: "from-fuchsia-500 to-violet-500",
  },
];

const chatBubbles = [
  { role: "coach" as const, text: "你刚才提到「不敢要高薪」，这背后可能藏着一个核心信念——「我不配」。我们一起来看看它是怎么形成的…" },
  { role: "user" as const, text: "好像确实是这样，小时候妈妈总说不要太贪心…" },
  { role: "coach" as const, text: "这就是你的「心穷」卡点来源。接下来我给你一个具体的突破练习，每天只需要 5 分钟…" },
];

export function VoiceCoachSection() {
  return (
    <section className="py-10">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 text-rose-600 text-xs font-medium mb-3">
          <Mic className="w-3.5 h-3.5" />
          完成测评后免费体验
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          测完不是结束，AI 教练帮你突破
        </h2>
        <p className="text-sm text-slate-500">
          不只告诉你「卡在哪」，更陪你「走出来」
        </p>
      </motion.div>

      {/* Value Cards */}
      <div className="space-y-3 mb-8">
        {values.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 shadow-md`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-800 mb-0.5">{item.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Simulated Chat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        className="rounded-2xl bg-gradient-to-b from-slate-50 to-rose-50 border border-slate-200 p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-medium text-slate-600">AI 教练对话示例</span>
        </div>
        <div className="space-y-3">
          {chatBubbles.map((bubble, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + idx * 0.15 }}
              className={`flex ${bubble.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  bubble.role === "coach"
                    ? "bg-white text-slate-700 border border-slate-200 rounded-tl-sm shadow-sm"
                    : "bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-tr-sm shadow-md"
                }`}
              >
                {bubble.text}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
