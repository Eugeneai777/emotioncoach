import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const scenarios = [
  { label: "又跟孩子吵了", emoji: "😤", route: "/coach/parent_emotion_coach", color: "from-[hsl(16,86%,68%)]/10 to-[hsl(16,86%,68%)]/5" },
  { label: "催作业催崩了", emoji: "📚", route: "/assessment/communication_parent", color: "from-[hsl(220,80%,65%)]/10 to-[hsl(220,80%,65%)]/5" },
  { label: "好累，想躺平", emoji: "😩", route: "/emotion-button", color: "from-[hsl(340,60%,68%)]/10 to-[hsl(340,60%,68%)]/5" },
  { label: "说什么都没用", emoji: "💬", route: "/coach/parent_emotion_coach", color: "from-[hsl(152,42%,49%)]/10 to-[hsl(152,42%,49%)]/5" },
  { label: "不知道为了什么", emoji: "🌫️", route: "/assessment/women_competitiveness", color: "from-[hsl(35,38%,56%)]/10 to-[hsl(35,38%,56%)]/5" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const } },
};

const MamaHero = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="text-center px-4 pt-5 pb-3"
      style={{ background: "linear-gradient(180deg, hsl(25 100% 92%) 0%, hsl(30 100% 97%) 100%)" }}
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-center gap-1.5 mb-0.5">
        <Heart className="w-4 h-4 fill-[hsl(16,86%,68%)] text-[hsl(16,86%,68%)]" />
        <h1 className="text-lg font-bold" style={{ color: "hsl(25 25% 17%)" }}>嘿，妈妈</h1>
      </motion.div>
      <motion.p variants={fadeUp} className="text-xs mb-4" style={{ color: "hsl(30 20% 44%)" }}>
        今天辛苦了，我在这里陪你 💛
      </motion.p>

      <motion.p variants={fadeUp} className="text-sm font-medium mb-2.5" style={{ color: "hsl(25 25% 17%)" }}>
        此刻最想说的是？
      </motion.p>

      <motion.div variants={container} className="flex flex-wrap justify-center gap-2">
        {scenarios.map((s) => (
          <motion.button
            key={s.label}
            variants={fadeUp}
            whileTap={{ scale: 0.93 }}
            onClick={() => navigate(s.route)}
            className={`px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-[0_1px_3px_hsl(25_30%_70%/0.15)] border border-[hsl(30_50%_90%)] text-sm font-medium active:bg-white transition-all min-h-[44px]`}
            style={{ color: "hsl(25 25% 17%)" }}
          >
            {s.emoji} {s.label}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default MamaHero;
