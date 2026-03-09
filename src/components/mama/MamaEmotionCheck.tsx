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
      className="mx-4 w-[calc(100%-2rem)] p-3.5 rounded-2xl shadow-[0_2px_8px_hsl(340_60%_68%/0.12)] border border-[hsl(340_60%_90%)] flex items-center gap-3 text-left active:shadow-lg transition-all min-h-[52px]"
      style={{ background: "linear-gradient(135deg, hsl(340 60% 96%) 0%, hsl(25 100% 94%) 100%)" }}
    >
      <span className="text-xl">🆘</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "hsl(25 25% 17%)" }}>情绪急救站</p>
        <p className="text-[11px]" style={{ color: "hsl(30 20% 44%)" }}>30秒释放情绪，给自己一个拥抱</p>
      </div>
      <ArrowRight className="w-4 h-4 shrink-0" style={{ color: "hsl(340 60% 68%)" }} />
    </motion.button>
  );
};

export default MamaEmotionCheck;
