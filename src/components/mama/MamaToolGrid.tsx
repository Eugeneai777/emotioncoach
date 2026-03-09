import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const tools = [
  {
    title: "亲子沟通",
    emoji: "👩‍👧",
    desc: "不听话 · 教育",
    color: "bg-[#FFF3EB]",
    accent: "#F4845F",
    context: "我想咨询亲子沟通方面的问题，请帮我分析并给出建议",
    subLink: { label: "测评 →", route: "/assessment/communication_parent" },
  },
  {
    title: "情绪支持",
    emoji: "🫂",
    desc: "压力 · 焦虑",
    color: "bg-[#FFF0F5]",
    accent: "#E879A0",
    context: "我作为妈妈感到情绪上需要支持，请帮助我",
    subLink: { label: "自评 →", route: "/assessment/emotion_health" },
  },
  {
    title: "关系沟通",
    emoji: "💑",
    desc: "夫妻 · 家庭",
    color: "bg-[#F0FFF4]",
    accent: "#4CAF7D",
    context: "我想改善家庭关系和夫妻沟通，请给我建议",
    subLink: null,
  },
  {
    title: "妈妈成长",
    emoji: "🌱",
    desc: "方向 · 自我",
    color: "bg-[#F0F4FF]",
    accent: "#5B8DEF",
    context: "作为妈妈，我想在个人成长方面获得指导",
    subLink: { label: "测评 →", route: "/assessment/women_competitiveness" },
  },
];

interface MamaToolGridProps {
  onToolClick: (context: string) => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const MamaToolGrid = ({ onToolClick }: MamaToolGridProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="mx-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-30px" }}
      variants={container}
    >
      <p className="text-base font-medium text-[#3D3028] mb-2">🛠️ AI工具区</p>
      <div className="grid grid-cols-2 gap-2.5">
        {tools.map((t) => (
          <motion.div key={t.title} variants={item} className="flex flex-col">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onToolClick(t.context)}
              className={`${t.color} p-3 rounded-xl text-left active:shadow-md transition-all border border-transparent active:border-[#F5E6D3] relative overflow-hidden flex-1 min-h-[80px]`}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{ backgroundColor: t.accent }}
              />
              <span className="text-xl">{t.emoji}</span>
              <p className="text-sm font-medium text-[#3D3028] mt-1.5">{t.title}</p>
              <p className="text-[11px] text-[#A89580] mt-0.5">{t.desc}</p>
            </motion.button>
            {t.subLink && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(t.subLink!.route);
                }}
                className="text-[11px] mt-1 text-center py-0.5 min-h-[28px]"
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
