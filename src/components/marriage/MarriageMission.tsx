import React from "react";
import { motion } from "framer-motion";
import { Target, Eye, Flag, Sparkles } from "lucide-react";

const items = [
  { icon: Target, label: "使命", text: "让每一对夫妻享受婚姻之旅，助力幸福中国", color: "bg-purple-100 text-marriage-primary" },
  { icon: Eye, label: "愿景", text: "最值得信赖的婚姻服务平台", color: "bg-pink-100 text-pink-600" },
  { icon: Flag, label: "五年目标", text: "让100万个家庭婚姻更幸福", color: "bg-amber-100 text-amber-600" },
  { icon: Sparkles, label: "价值观", text: "成长与爱", color: "bg-emerald-100 text-emerald-600" },
];

export const MarriageMission: React.FC = () => {
  return (
    <section className="px-5 py-8">
      <div className="max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-foreground text-center mb-5">
          使命与愿景
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-xl p-4 border border-marriage-border shadow-sm text-center"
            >
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
              <p className="text-xs font-medium text-foreground leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
