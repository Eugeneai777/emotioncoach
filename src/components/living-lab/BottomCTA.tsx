import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";

interface BottomCTAProps {
  onVoiceClick: () => void;
}

const BottomCTA = ({ onVoiceClick }: BottomCTAProps) => {
  return (
    <motion.div
      className="text-center py-6 space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <p className="text-sm text-stone-400">准备好了吗？</p>
      <button
        onClick={onVoiceClick}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500/80 to-amber-500/80 text-white text-sm font-medium hover:scale-105 active:scale-95 transition-transform duration-200 shadow-lg shadow-rose-500/20"
      >
        <Mic className="w-4 h-4" />
        开始和AI生活教练对话
      </button>
      <p className="text-[11px] text-stone-500">免费体验 · 无需预约 · 24小时在线</p>
    </motion.div>
  );
};

export default BottomCTA;
