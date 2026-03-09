import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const tools = [
  {
    title: "亲子沟通教练",
    emoji: "👩‍👧",
    desc: "孩子不听话 · 情绪 · 教育",
    color: "bg-[#FFF3EB]",
    accent: "#F4845F",
    context: "我想咨询亲子沟通方面的问题，请帮我分析并给出建议",
    subLink: { label: "做个测评 →", route: "/assessment/communication_parent" },
  },
  {
    title: "情绪支持教练",
    emoji: "🫂",
    desc: "妈妈情绪 · 压力 · 焦虑",
    color: "bg-[#FFF0F5]",
    accent: "#E879A0",
    context: "我作为妈妈感到情绪上需要支持，请帮助我",
    subLink: { label: "情绪自评 →", route: "/assessment/emotion_health" },
  },
  {
    title: "关系沟通教练",
    emoji: "💑",
    desc: "夫妻沟通 · 家庭关系",
    color: "bg-[#F0FFF4]",
    accent: "#4CAF7D",
    context: "我想改善家庭关系和夫妻沟通，请给我建议",
    subLink: null,
  },
  {
    title: "妈妈成长教练",
    emoji: "🌱",
    desc: "人生方向 · 自我成长",
    color: "bg-[#F0F4FF]",
    accent: "#5B8DEF",
    context: "作为妈妈，我想在个人成长方面获得指导",
    subLink: { label: "竞争力测评 →", route: "/assessment/women_competitiveness" },
  },
];

interface MamaToolGridProps {
  onToolClick: (context: string) => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const MamaToolGrid = ({ onToolClick }: MamaToolGridProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="mx-4"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={container}
    >
      <p className="text-lg font-medium text-[#3D3028] mb-3">🛠️ 妈妈AI工具区</p>
      <div className="grid grid-cols-2 gap-3">
        {tools.map((t) => (
          <motion.div key={t.title} variants={item} className="flex flex-col">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onToolClick(t.context)}
              className={`${t.color} p-4 rounded-2xl text-left hover:shadow-md transition-all border border-transparent hover:border-[#F5E6D3] relative overflow-hidden flex-1`}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: t.accent }}
              />
              <span className="text-2xl">{t.emoji}</span>
              <p className="text-sm font-medium text-[#3D3028] mt-2">{t.title}</p>
              <p className="text-xs text-[#A89580] mt-1">{t.desc}</p>
            </motion.button>
            {t.subLink && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(t.subLink!.route);
                }}
                className="text-xs mt-1.5 text-center py-1"
                style={{ color: t.accent }}
              >
                {t.subLink.label}
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MamaToolGrid;
