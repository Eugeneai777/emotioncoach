import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const MamaEmotionCheck = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate("/emotion-button")}
      className="w-full p-3.5 rounded-2xl shadow-sm border border-[hsl(var(--mama-border))] flex items-center gap-3 text-left active:shadow-md transition-all min-h-[52px]"
      style={{ background: "linear-gradient(135deg, hsl(var(--mama-rose-light)) 0%, hsl(var(--mama-card-alt)) 100%)" }}
    >
      <span className="text-xl">🆘</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[hsl(var(--mama-heading))]">此刻，你还好吗？</p>
        <p className="text-[11px] text-[hsl(var(--mama-body))]">不需要坚强，这里可以放下所有</p>
      </div>
      <ArrowRight className="w-4 h-4 shrink-0 text-[hsl(var(--mama-rose))]" />
    </motion.button>
  );
};

export default MamaEmotionCheck;
