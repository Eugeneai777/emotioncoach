import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface MamaAssessmentEntryProps {
  onStart: () => void;
}

const proAssessments = [
  {
    emoji: "📋",
    title: "亲子沟通能力测评",
    desc: "3分钟 · 免费",
    route: "/assessment/communication_parent",
    accent: "#F4845F",
  },
  {
    emoji: "💛",
    title: "情绪健康自评",
    desc: "3分钟 · 免费",
    route: "/assessment/emotion_health",
    accent: "#E879A0",
  },
  {
    emoji: "✨",
    title: "女性竞争力测评",
    desc: "5分钟 · 免费",
    route: "/assessment/women_competitiveness",
    accent: "#5B8DEF",
  },
];

const MamaAssessmentEntry = ({ onStart }: MamaAssessmentEntryProps) => {
  const navigate = useNavigate();

  return (
    <div className="mx-3 space-y-3">
      {/* Fun assessment */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.4 }}
        className="p-4 bg-gradient-to-br from-[#FFF3EB] to-[#FFF0F5] rounded-xl border border-[#F5E6D3]"
      >
        <p className="text-base font-medium text-[#3D3028] mb-0.5">📊 妈妈能量测评</p>
        <p className="text-xs text-[#8B7355] mb-3">你是哪一种妈妈？5题快速测评</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="w-full py-2.5 bg-[#F4845F] text-white rounded-xl text-sm font-medium active:bg-[#E5734E] transition-all min-h-[44px]"
        >
          开始测评 →
        </motion.button>
      </motion.div>

      {/* Professional assessments */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <p className="text-base font-medium text-[#3D3028] mb-2">🔍 专业测评</p>
        <div className="space-y-2">
          {proAssessments.map((a) => (
            <motion.button
              key={a.route}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.route)}
              className="w-full flex items-center gap-2.5 p-3 bg-white rounded-xl border border-[#F5E6D3] active:shadow-sm transition-all text-left min-h-[52px]"
            >
              <span className="text-lg">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#3D3028]">{a.title}</p>
                <p className="text-[11px] text-[#A89580]">{a.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" style={{ color: a.accent }} />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default MamaAssessmentEntry;
