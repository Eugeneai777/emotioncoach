import { motion } from "framer-motion";

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
    <div className="space-y-2.5">
      <h3 className="text-xs font-medium text-stone-400 px-0.5">他们的真实体验</h3>
      <div className="space-y-2">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            className="p-3 rounded-xl bg-stone-800/30 ring-1 ring-stone-700/30"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <span className="inline-block px-1.5 py-0.5 rounded-full bg-amber-500/10 ring-1 ring-amber-500/15 text-[9px] text-amber-400 font-medium mb-1.5">
              {t.tag}
            </span>
            <p className="text-[11px] text-stone-400 leading-relaxed mb-2">"{t.quote}"</p>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">{t.name[0]}</span>
              </div>
              <div>
                <p className="text-[10px] text-stone-400 font-medium">{t.name}</p>
                <p className="text-[9px] text-stone-600">{t.identity}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsSection;
