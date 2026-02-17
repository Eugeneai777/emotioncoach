import { motion } from "framer-motion";
import { CalendarCheck, MessageSquareHeart, Shield, Users, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: CalendarCheck,
    title: "7 天定制觉醒路径",
    desc: "根据你的测评结果，制定专属突破计划，每天一个小步骤",
    tag: "马上获得",
  },
  {
    icon: MessageSquareHeart,
    title: "1 对 1 随时觉醒对话",
    desc: "不限次数，随时向觉醒顾问倾诉困惑、获取指导",
    tag: "不限次数",
  },
];

export function AdvisorValueSection() {
  return (
    <section className="py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-amber-950 p-6 relative"
      >
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-400/10 rounded-full blur-2xl" />

        {/* Header */}
        <div className="relative z-10 text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-medium mb-3">
            <Sparkles className="w-3 h-3" />
            完成测评后即可免费领取
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            专属觉醒顾问，陪你走出卡点
          </h2>
          <p className="text-sm text-slate-400">
            不是冷冰冰的报告，而是有温度的陪伴
          </p>
        </div>

        {/* Benefits */}
        <div className="relative z-10 space-y-3 mb-6">
          {benefits.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + idx * 0.1 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-violet-500 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-white">{item.title}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-medium">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="relative z-10 flex items-center justify-center gap-4 pt-4 border-t border-white/10"
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-slate-300">
              <span className="text-amber-400 font-bold">3,291</span> 人已领取
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-300">隐私加密保护</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
