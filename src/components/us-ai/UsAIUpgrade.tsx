import { motion } from "framer-motion";
import { Crown, MessageCircle, Wrench, Heart } from "lucide-react";

const features = [
  { icon: MessageCircle, text: "每日关系对话" },
  { icon: Heart, text: "AI关系教练" },
  { icon: Wrench, text: "冲突修复工具" },
];

const UsAIUpgrade = () => (
  <section className="px-5">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-gradient-to-br from-usai-primary/5 to-usai-beige p-5 border border-usai-primary/15"
    >
      <div className="flex items-center gap-2 mb-2">
        <Crown className="w-5 h-5 text-usai-primary" />
        <h3 className="text-base font-bold text-usai-foreground">7天情侣AI陪伴计划</h3>
      </div>

      <div className="space-y-2 mb-4">
        {features.map((f) => (
          <div key={f.text} className="flex items-center gap-2 text-sm text-muted-foreground">
            <f.icon className="w-4 h-4 text-usai-primary" />
            <span>{f.text}</span>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-1 mb-4">
        <span className="text-2xl font-bold text-usai-primary">¥9.9</span>
        <span className="text-xs text-muted-foreground line-through mb-0.5">¥29.9</span>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        className="w-full py-3 rounded-xl bg-usai-primary text-white font-semibold text-sm"
      >
        立即体验
      </motion.button>
    </motion.div>
  </section>
);

export default UsAIUpgrade;
