import { motion } from "framer-motion";
import { useState } from "react";
import { Star, Heart, Eye, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

const cards = [
  { icon: Star, title: "赞美卡", desc: "说一句今天欣赏对方的地方", color: "text-amber-500", bg: "bg-amber-50" },
  { icon: Heart, title: "感恩卡", desc: "说一件今天感谢对方的事情", color: "text-rose-400", bg: "bg-rose-50" },
  { icon: Eye, title: "理解卡", desc: "分享今天的真实情绪", color: "text-sky-500", bg: "bg-sky-50" },
  { icon: Sparkles, title: "梦想卡", desc: "聊一个未来的小愿望", color: "text-violet-500", bg: "bg-violet-50" },
];

const UsAIDailyCard = () => {
  const [idx, setIdx] = useState(0);
  const card = cards[idx];
  const Icon = card.icon;

  return (
    <section className="px-5">
      <h2 className="text-lg font-bold text-usai-foreground mb-3 px-1">每日关系卡</h2>
      <p className="text-sm text-muted-foreground mb-4 px-1">每天一个小行动，关系慢慢变好。</p>

      <motion.div
        key={idx}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className={`rounded-2xl p-6 ${card.bg} border border-usai-primary/10 text-center`}
      >
        <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center mx-auto mb-3`}>
          <Icon className={`w-7 h-7 ${card.color}`} />
        </div>
        <h3 className="text-base font-bold text-usai-foreground mb-1">{card.title}</h3>
        <p className="text-sm text-muted-foreground">{card.desc}</p>
      </motion.div>

      <div className="flex items-center justify-center gap-4 mt-4">
        <button onClick={() => setIdx((idx - 1 + cards.length) % cards.length)} className="p-2 rounded-full bg-white border border-usai-primary/10">
          <ChevronLeft className="w-4 h-4 text-usai-foreground" />
        </button>
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === idx ? "bg-usai-primary" : "bg-usai-primary/20"}`} />
          ))}
        </div>
        <button onClick={() => setIdx((idx + 1) % cards.length)} className="p-2 rounded-full bg-white border border-usai-primary/10">
          <ChevronRight className="w-4 h-4 text-usai-foreground" />
        </button>
      </div>

      <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
        <span>🔥 连续记录 <strong className="text-usai-primary">0</strong> 天</span>
        <span>🌱 关系成长进度 <strong className="text-usai-primary">0%</strong></span>
      </div>
    </section>
  );
};

export default UsAIDailyCard;
