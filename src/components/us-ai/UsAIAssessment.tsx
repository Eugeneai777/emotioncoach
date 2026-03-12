import { motion } from "framer-motion";
import { ClipboardCheck } from "lucide-react";

const types = ["伙伴型关系", "成长型关系", "守护型关系", "激情型关系", "磨合型关系"];

interface Props {
  onStart: () => void;
}

const UsAIAssessment = ({ onStart }: Props) => (
  <section className="px-5">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl bg-gradient-to-br from-usai-light to-white p-5 border border-usai-primary/10"
    >
      <div className="flex items-center gap-2 mb-1">
        <ClipboardCheck className="w-5 h-5 text-usai-primary" />
        <h2 className="text-lg font-bold text-usai-foreground">3分钟关系测评</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">看看你们属于哪种关系模式</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {types.map((t) => (
          <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-usai-primary/10 text-usai-primary font-medium">
            {t}
          </span>
        ))}
      </div>

      <div className="text-xs text-muted-foreground mb-4 space-y-1">
        <p>📊 AI测评报告包括：</p>
        <p className="pl-4">关系优势 · 冲突模式 · 改善建议</p>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="w-full py-3 rounded-xl bg-usai-primary text-white font-semibold text-sm"
      >
        开始测评
      </motion.button>
    </motion.div>
  </section>
);

export default UsAIAssessment;
