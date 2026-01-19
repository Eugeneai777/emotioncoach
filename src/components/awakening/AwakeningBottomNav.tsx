import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Settings, Sparkles, Info, Layers, Rocket } from "lucide-react";

const AwakeningBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const quickActions = [
    { id: 'intro', icon: Info, label: '六大入口', route: '/awakening-intro', color: 'from-amber-400 to-amber-500' },
    { id: 'flow', icon: Layers, label: '四层支持', route: '/transformation-flow', color: 'from-orange-400 to-orange-500' },
    { id: 'coach', icon: Rocket, label: '教练空间', route: '/coach-space', color: 'from-rose-400 to-rose-500' },
  ];

  const handleCenterClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleQuickAction = (route: string) => {
    setIsMenuOpen(false);
    navigate(route);
  };

  return (
    <>
      {/* 遮罩层 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 弹出式快速菜单 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0.01 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex gap-4">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.id}
                  initial={{ scale: 0, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0, y: 20, opacity: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => handleQuickAction(action.route)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br ${action.color} shadow-lg`}
                  whileTap={{ scale: 0.9 }}
                >
                  <action.icon className="w-6 h-6 text-white" />
                  <span className="text-xs text-white font-medium whitespace-nowrap">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        {/* 背景条 */}
        <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-8">
            {/* 左侧 - 觉察日记 */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/awakening-journal')}
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">日记</span>
            </motion.button>

            {/* 中间占位 */}
            <div className="w-16" />

            {/* 右侧 - 设置 */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/settings')}
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">设置</span>
            </motion.button>
          </div>
        </div>

        {/* 凸起中心按钮 */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7">
          {/* 光晕效果 */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/40 to-orange-500/40 blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* 主按钮 */}
          <motion.button
            onClick={handleCenterClick}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center
                       border-4 border-background shadow-lg
                       ${isMenuOpen 
                         ? 'bg-gradient-to-br from-rose-400 to-rose-500 shadow-rose-500/30' 
                         : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30'
                       }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isMenuOpen ? { rotate: 45 } : { rotate: 0, y: [0, -3, 0] }}
            transition={isMenuOpen 
              ? { type: 'spring', stiffness: 300 } 
              : { y: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }
            }
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </nav>
    </>
  );
};

export default AwakeningBottomNav;
