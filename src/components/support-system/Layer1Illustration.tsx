import React from "react";
import { motion } from "framer-motion";

const Layer1Illustration: React.FC = () => {
  const floatingCards = [
    { emoji: '🔥', x: -30, y: -20, delay: 0 },
    { emoji: '💛', x: 30, y: -35, delay: 0.2 },
    { emoji: '⚡', x: -40, y: 15, delay: 0.4 },
    { emoji: '🧩', x: 45, y: 10, delay: 0.6 },
    { emoji: '🤝', x: -25, y: 40, delay: 0.8 },
    { emoji: '🌟', x: 35, y: 45, delay: 1.0 },
  ];

  return (
    <div className="relative h-32 flex items-center justify-center overflow-hidden">
      {/* 中心笔记本图标 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative z-10 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg"
      >
        <span className="text-2xl">📝</span>
      </motion.div>

      {/* 浮动的入口卡片 */}
      {floatingCards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.01, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [card.y, card.y - 8, card.y],
          }}
          transition={{
            opacity: { delay: card.delay, duration: 0.3 },
            scale: { delay: card.delay, duration: 0.3 },
            y: { 
              delay: card.delay + 0.3,
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          style={{ x: card.x, transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          className="absolute w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-sm"
        >
          {card.emoji}
        </motion.div>
      ))}

      {/* 光晕效果 */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-24 h-24 bg-amber-300/30 rounded-full blur-xl"
      />
    </div>
  );
};

export default Layer1Illustration;
