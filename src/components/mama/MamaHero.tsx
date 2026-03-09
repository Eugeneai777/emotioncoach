import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const concerns = [
  { label: "孩子不听话", emoji: "😤", context: "我的孩子不听话，我不知道该怎么办" },
  { label: "孩子不爱学习", emoji: "📚", context: "我的孩子不爱学习，我很着急" },
  { label: "我今天很累", emoji: "😩", context: "我今天当妈妈当得很累，感觉身心俱疲" },
  { label: "和老公沟通不好", emoji: "💬", context: "我和老公沟通不好，经常吵架或者冷战" },
  { label: "我有点迷茫", emoji: "🌫️", context: "作为妈妈，我对未来感到迷茫，不知道自己的方向在哪里" },
];

interface MamaHeroProps {
  onConcernClick: (context: string) => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const MamaHero = ({ onConcernClick }: MamaHeroProps) => {
  return (
    <motion.div
      className="text-center px-4 pt-8 pb-6 bg-gradient-to-b from-[#FFE8D6] to-[#FFF8F0]"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-2">
        <Heart className="w-6 h-6 text-[#F4845F] fill-[#F4845F]" />
        <h1 className="text-2xl font-bold text-[#3D3028]">宝妈AI生活助手</h1>
      </motion.div>
      <motion.p variants={fadeUp} className="text-[#8B7355] text-base mb-1">懂妈妈的AI助手</motion.p>
      <motion.p variants={fadeUp} className="text-[#A89580] text-sm mb-8">情绪 · 亲子 · 关系 · 成长</motion.p>

      <motion.p variants={fadeUp} className="text-lg font-medium text-[#3D3028] mb-4">今天妈妈最困扰的是什么？</motion.p>

      <motion.div variants={container} className="flex flex-wrap justify-center gap-3">
        {concerns.map((c) => (
          <motion.button
            key={c.label}
            variants={fadeUp}
            whileTap={{ scale: 0.93 }}
            onClick={() => onConcernClick(c.context)}
            className="px-4 py-3 bg-white rounded-2xl shadow-sm border border-[#F5E6D3] text-[#3D3028] text-sm font-medium hover:shadow-md hover:border-[#F4845F]/40 transition-all"
          >
            {c.emoji} {c.label}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default MamaHero;
