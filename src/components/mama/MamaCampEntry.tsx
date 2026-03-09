import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const MamaCampEntry = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35 }}
      className="p-3.5 rounded-2xl border border-[hsl(var(--mama-border-strong))] relative overflow-hidden shadow-sm"
      style={{
        background: "linear-gradient(135deg, hsl(var(--mama-card-alt)) 0%, hsl(25 100% 92%) 50%, hsl(var(--mama-rose-light)) 100%)",
      }}
    >
      <div className="relative z-10">
        <p className="text-sm font-semibold mb-0.5 text-[hsl(var(--mama-heading))]">🌈 21天，和孩子重新靠近</p>
        <p className="text-[11px] mb-1.5 text-[hsl(var(--mama-body))]">不是学技巧，而是找回你和孩子之间的温度</p>
        <div className="flex items-center gap-1.5 my-2 flex-wrap">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-[hsl(var(--mama-accent-hover))] bg-[hsl(var(--mama-accent)/0.12)]">专业教练</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-[hsl(152_42%_39%)] bg-[hsl(152_42%_49%/0.12)]">社群支持</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-[hsl(220_80%_55%)] bg-[hsl(220_80%_65%/0.12)]">每日打卡</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/parent-camp")}
          className="w-full py-2.5 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition-all min-h-[44px] active:opacity-90 bg-[hsl(var(--mama-accent))] hover:bg-[hsl(var(--mama-accent-hover))]"
        >
          我想试试 <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MamaCampEntry;
