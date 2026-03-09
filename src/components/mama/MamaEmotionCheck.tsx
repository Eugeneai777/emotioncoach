import { motion } from "framer-motion";

const emotions = [
  { label: "开心", emoji: "😊", context: "我今天心情很好，感觉很开心" },
  { label: "有点烦", emoji: "😒", context: "我今天有点烦躁，心里不太舒服" },
  { label: "很累", emoji: "😴", context: "我今天感觉很累很疲惫" },
  { label: "有压力", emoji: "😰", context: "我今天压力很大，感觉喘不过气" },
  { label: "很焦虑", emoji: "😟", context: "我今天很焦虑，一直在担心各种事情" },
];

interface MamaEmotionCheckProps {
  onEmotionClick: (context: string) => void;
}

const MamaEmotionCheck = ({ onEmotionClick }: MamaEmotionCheckProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="mx-4 p-5 bg-white rounded-2xl shadow-sm border border-[#F5E6D3]"
    >
      <p className="text-lg font-medium text-[#3D3028] mb-1">💛 妈妈今天的情绪</p>
      <p className="text-sm text-[#A89580] mb-4">30秒情绪释放，给自己一个拥抱</p>

      <div className="flex flex-wrap gap-2">
        {emotions.map((e) => (
          <motion.button
            key={e.label}
            whileTap={{ scale: 0.93 }}
            onClick={() => onEmotionClick(e.context)}
            className="px-4 py-2.5 bg-[#FFF0F5] rounded-xl text-[#3D3028] text-sm hover:bg-[#FFE0EB] transition-all"
          >
            {e.emoji} {e.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default MamaEmotionCheck;
