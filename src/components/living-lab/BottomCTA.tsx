import { motion } from "framer-motion";
import { Mic } from "lucide-react";

interface BottomCTAProps {
  onVoiceClick: () => void;
}

const BottomCTA = ({ onVoiceClick }: BottomCTAProps) => {
  return (
    <motion.div
      className="text-center py-5 space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <p className="text-xs text-stone-500">准备好了吗？</p>
      <button
        onClick={onVoiceClick}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-400 to-fuchsia-500 text-white text-xs font-medium active:scale-95 transition-transform duration-200 shadow-md shadow-pink-500/20"
      >
        <Mic className="w-3.5 h-3.5" />
        开始和AI生活教练对话
      </button>
      <p className="text-[10px] text-stone-600">免费体验 · 无需预约 · 24小时在线</p>
    </motion.div>
  );
};

export default BottomCTA;
