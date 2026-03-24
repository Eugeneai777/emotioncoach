import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, BookOpen } from "lucide-react";
import logoImage from "@/assets/youjin-ai-logo.png";

const AwakeningBottomNav: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-8">
          {/* 左侧 - 我的 */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/my-page')}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors motion-fallback"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">我的</span>
          </motion.button>

          {/* 中间占位 */}
          <div className="w-16" />

          {/* 右侧 - 学习 */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/camps')}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors motion-fallback"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">学习</span>
          </motion.button>
        </div>
      </div>

      {/* 凸起中心按钮 - 文字AI对话入口 */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-7 flex flex-col items-center">
        {/* 光晕效果 */}
        <motion.div
          className="absolute inset-0 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400/40 to-orange-500/40 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* 主按钮 */}
        <motion.button
          onClick={() => navigate('/youjin-life/chat')}
          className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden
                     border-0 shadow-lg shadow-orange-500/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ y: [0, -3, 0] }}
          transition={{ y: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
        >
          <img src={logoImage} alt="有劲AI" className="w-[115%] h-[115%] object-cover" />
        </motion.button>
        <span className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap">开始对话</span>
      </div>
    </nav>
  );
};

export default AwakeningBottomNav;
