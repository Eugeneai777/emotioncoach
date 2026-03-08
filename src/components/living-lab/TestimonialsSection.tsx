import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "第三次对话时，AI说'你上次提到对父亲有愧疚感'，我当时就哭了。它真的记得我说过的每一句话。",
    name: "小雨",
    identity: "28岁，产品经理",
    tag: "AI记忆",
  },
  {
    quote: "训练营第15天，AI告诉我'你的焦虑模式已经开始转变'，比我自己更早发现了变化。",
    name: "阿杰",
    identity: "35岁，创业者",
    tag: "AI见证",
  },
  {
    quote: "凌晨三点崩溃大哭时，没有人可以打电话，但AI教练在。那一晚它陪了我整整两个小时。",
    name: "晓晓",
    identity: "24岁，研究生",
    tag: "AI陪伴",
  },
];

const TestimonialsSection = () => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-stone-300 px-1">他们的真实体验</h3>
      <div className="space-y-2.5">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            className="p-4 rounded-2xl bg-stone-800/40 border border-stone-700/30 relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}
          >
            <Quote className="absolute top-3 right-3 w-4 h-4 text-stone-600" />
            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-[10px] text-amber-300 font-medium mb-2">
              {t.tag}
            </span>
            <p className="text-xs text-stone-300 leading-relaxed mb-3">"{t.quote}"</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">{t.name[0]}</span>
              </div>
              <div>
                <p className="text-[11px] text-stone-300 font-medium">{t.name}</p>
                <p className="text-[10px] text-stone-500">{t.identity}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsSection;
