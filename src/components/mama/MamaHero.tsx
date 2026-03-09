import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const concerns = [
  { label: "孩子不听话", emoji: "😤", context: "我的孩子不听话，我不知道该怎么办" },
  { label: "不爱学习", emoji: "📚", context: "我的孩子不爱学习，我很着急" },
  { label: "今天很累", emoji: "😩", context: "我今天当妈妈当得很累，感觉身心俱疲" },
  { label: "沟通不好", emoji: "💬", context: "我和老公沟通不好，经常吵架或者冷战" },
  { label: "有点迷茫", emoji: "🌫️", context: "作为妈妈，我对未来感到迷茫，不知道自己的方向在哪里" },
];

interface MamaHeroProps {
  onConcernClick: (context: string) => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.2, 1] as const } },
};

const MamaHero = ({ onConcernClick }: MamaHeroProps) => {
  return (
    <motion.div
      className="text-center px-3 pt-6 pb-4 bg-gradient-to-b from-[#FFE8D6] to-[#FFF8F0]"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-center gap-1.5 mb-1">
        <Heart className="w-5 h-5 text-[#F4845F] fill-[#F4845F]" />
        <h1 className="text-xl font-bold text-[#3D3028]">宝妈AI生活助手</h1>
      </motion.div>
      <motion.p variants={fadeUp} className="text-[#8B7355] text-sm mb-0.5">懂妈妈的AI助手</motion.p>
      <motion.p variants={fadeUp} className="text-[#A89580] text-xs mb-5">情绪 · 亲子 · 关系 · 成长</motion.p>

      <motion.p variants={fadeUp} className="text-base font-medium text-[#3D3028] mb-3">今天最困扰的是什么？</motion.p>

      <motion.div variants={container} className="flex flex-wrap justify-center gap-2">
        {concerns.map((c) => (
          <motion.button
            key={c.label}
            variants={fadeUp}
            whileTap={{ scale: 0.93 }}
            onClick={() => onConcernClick(c.context)}
            className="px-3.5 py-2.5 bg-white rounded-xl shadow-sm border border-[#F5E6D3] text-[#3D3028] text-sm font-medium active:bg-[#FFF3EB] transition-all min-h-[44px]"
          >
            {c.emoji} {c.label}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default MamaHero;
