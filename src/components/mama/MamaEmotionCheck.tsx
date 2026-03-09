import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const MamaEmotionCheck = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate("/emotion-button")}
      className="mx-3 w-[calc(100%-1.5rem)] p-4 bg-gradient-to-r from-[#FFF0F5] to-[#FFE8D6] rounded-2xl shadow-sm border border-[#F5E6D3] flex items-center gap-3 text-left active:shadow-md transition-all min-h-[56px]"
    >
      <span className="text-2xl">🆘</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#3D3028]">情绪急救站</p>
        <p className="text-xs text-[#8B7355]">30秒释放情绪，给自己一个拥抱</p>
      </div>
      <ArrowRight className="w-4 h-4 text-[#E879A0] shrink-0" />
    </motion.button>
  );
};

export default MamaEmotionCheck;
