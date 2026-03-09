import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface MamaAssessmentEntryProps {
  onStartFunAssessment: () => void;
}

const proAssessments = [
  {
    emoji: "📋",
    title: "亲子沟通能力测评",
    desc: "3分钟 · 免费",
    route: "/assessment/communication_parent",
    accent: "hsl(16 86% 68%)",
    bg: "hsl(16 86% 68% / 0.06)",
  },
  {
    emoji: "💛",
    title: "情绪健康自评",
    desc: "3分钟 · 免费",
    route: "/assessment/emotion_health",
    accent: "hsl(340 60% 68%)",
    bg: "hsl(340 60% 68% / 0.06)",
  },
  {
    emoji: "✨",
    title: "女性竞争力测评",
    desc: "5分钟 · 免费",
    route: "/assessment/women_competitiveness",
    accent: "hsl(220 80% 65%)",
    bg: "hsl(220 80% 65% / 0.06)",
  },
];

const MamaAssessmentEntry = ({ onStartFunAssessment }: MamaAssessmentEntryProps) => {
  const navigate = useNavigate();

  return (
    <div className="mx-4 space-y-2.5">
      <p className="text-sm font-semibold" style={{ color: "hsl(25 25% 17%)" }}>📊 测评 & 工具</p>

      {/* Fun assessment */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.35 }}
        className="p-3.5 rounded-2xl border border-[hsl(30_50%_90%)] shadow-[0_2px_8px_hsl(16_86%_68%/0.08)]"
        style={{ background: "linear-gradient(135deg, hsl(25 100% 96%) 0%, hsl(340 60% 97%) 100%)" }}
      >
        <p className="text-sm font-medium mb-0.5" style={{ color: "hsl(25 25% 17%)" }}>🔋 今日能量检测</p>
        <p className="text-[11px] mb-2.5" style={{ color: "hsl(30 20% 44%)" }}>5维度打分，追踪每日状态变化</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onStartFunAssessment}
          className="w-full py-2.5 text-white rounded-xl text-sm font-medium transition-all min-h-[44px] active:opacity-90"
          style={{ background: "hsl(16 86% 68%)" }}
        >
          开始测评 →
        </motion.button>
      </motion.div>

      {/* Professional assessments */}
      <div className="space-y-1.5">
        {proAssessments.map((a) => (
          <motion.button
            key={a.route}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(a.route)}
            className="w-full flex items-center gap-2.5 p-3 bg-white rounded-xl border border-[hsl(30_50%_90%)] shadow-[0_1px_3px_hsl(30_30%_70%/0.08)] active:shadow-md transition-all text-left min-h-[48px]"
          >
            <span className="text-base w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: a.bg }}>{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium" style={{ color: "hsl(25 25% 17%)" }}>{a.title}</p>
              <p className="text-[10px]" style={{ color: "hsl(30 15% 56%)" }}>{a.desc}</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: a.accent }} />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MamaAssessmentEntry;
