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
    <div className="mx-4 space-y-4">
      {/* Fun assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="p-5 bg-gradient-to-br from-[#FFF3EB] to-[#FFF0F5] rounded-2xl border border-[#F5E6D3]"
      >
        <p className="text-lg font-medium text-[#3D3028] mb-1">📊 妈妈能量测评</p>
        <p className="text-sm text-[#8B7355] mb-4">你是哪一种妈妈？5题快速测评</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="w-full py-3 bg-[#F4845F] text-white rounded-xl font-medium hover:bg-[#E5734E] transition-all"
        >
          开始测评 →
        </motion.button>
      </motion.div>

      {/* Professional assessments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <p className="text-lg font-medium text-[#3D3028] mb-3">🔍 专业测评</p>
        <div className="space-y-2.5">
          {proAssessments.map((a) => (
            <motion.button
              key={a.route}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.route)}
              className="w-full flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#F5E6D3] hover:shadow-sm transition-all text-left"
            >
              <span className="text-xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#3D3028]">{a.title}</p>
                <p className="text-xs text-[#A89580]">{a.desc}</p>
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
