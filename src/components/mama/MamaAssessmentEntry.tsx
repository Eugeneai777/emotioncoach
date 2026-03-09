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
  },
  {
    emoji: "💛",
    title: "情绪健康自评",
    desc: "3分钟 · 免费",
    route: "/assessment/emotion_health",
  },
  {
    emoji: "✨",
    title: "女性竞争力测评",
    desc: "5分钟 · 免费",
    route: "/assessment/women_competitiveness",
  },
];

const MamaAssessmentEntry = ({ onStartFunAssessment }: MamaAssessmentEntryProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold text-[hsl(var(--mama-heading))]">📊 测评 & 工具</p>

      {/* Energy assessment - main CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.35 }}
        className="p-4 rounded-2xl border border-[hsl(var(--mama-border))] shadow-sm overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, hsl(var(--mama-card-alt)) 0%, hsl(var(--mama-rose-light)) 100%)" }}
      >
        <div className="absolute right-3 top-3 text-3xl opacity-15 select-none">🔋</div>

        <p className="text-sm font-semibold mb-1 text-[hsl(var(--mama-heading))]">🔋 今天的你，能量还够吗？</p>
        <p className="text-[11px] leading-relaxed mb-2 text-[hsl(var(--mama-body))]">
          1分钟了解自己的状态，找到最需要的支持
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { emoji: "💪", label: "体力" },
            { emoji: "💛", label: "情绪" },
            { emoji: "🧘", label: "耐心" },
            { emoji: "🤝", label: "连接" },
            { emoji: "🌸", label: "自我" },
          ].map((d) => (
            <span
              key={d.label}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[hsl(var(--mama-card))] text-[hsl(var(--mama-body))] border border-[hsl(var(--mama-border))]"
            >
              {d.emoji} {d.label}
            </span>
          ))}
        </div>

        <p className="text-[10px] mb-3 text-[hsl(var(--mama-muted))]">
          测完后会推荐最适合你的工具和支持 💛
        </p>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onStartFunAssessment}
          className="w-full py-2.5 text-white rounded-xl text-sm font-medium transition-all min-h-[44px] active:opacity-90 bg-[hsl(var(--mama-accent))] hover:bg-[hsl(var(--mama-accent-hover))]"
        >
          看看我的能量 →
        </motion.button>
      </motion.div>

      {/* Professional assessments - horizontal scroll */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {proAssessments.map((a) => (
          <motion.button
            key={a.route}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(a.route)}
            className="flex-shrink-0 w-[140px] flex flex-col items-start gap-1.5 p-3 bg-[hsl(var(--mama-card))] rounded-xl border border-[hsl(var(--mama-border))] shadow-sm active:shadow-md transition-all text-left min-h-[80px]"
          >
            <span className="text-lg">{a.emoji}</span>
            <p className="text-[12px] font-medium text-[hsl(var(--mama-heading))] leading-tight">{a.title}</p>
            <p className="text-[10px] text-[hsl(var(--mama-muted))]">{a.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MamaAssessmentEntry;
