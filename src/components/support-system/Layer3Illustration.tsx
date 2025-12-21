import React from "react";
import { motion } from "framer-motion";

const Layer3Illustration: React.FC = () => {
  const bubbles = [
    { isUser: true, delay: 0, y: 0 },
    { isUser: false, delay: 0.4, y: 20 },
    { isUser: true, delay: 0.8, y: 40 },
    { isUser: false, delay: 1.2, y: 60 },
  ];

  return (
    <div className="relative h-32 flex items-center justify-center overflow-hidden">
      {/* 对话气泡容器 */}
      <div className="relative w-40 h-28">
        {bubbles.map((bubble, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8, x: bubble.isUser ? 20 : -20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0,
            }}
            transition={{
              delay: bubble.delay,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className={`absolute ${bubble.isUser ? 'right-0' : 'left-0'}`}
            style={{ top: bubble.y * 0.6 }}
          >
            <motion.div
              animate={{ 
                y: [0, -3, 0]
              }}
              transition={{
                duration: 2,
                delay: bubble.delay + 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`px-3 py-1.5 rounded-2xl text-xs ${
                bubble.isUser 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm' 
                  : 'bg-white shadow-md text-foreground rounded-bl-sm border'
              }`}
            >
              {bubble.isUser ? (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex gap-0.5"
                >
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full" />
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full" />
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full" />
                </motion.div>
              ) : (
                <div className="flex items-center gap-1">
                  <span>💭</span>
                  <motion.div 
                    className="flex gap-0.5"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span className="w-4 h-1 bg-purple-200 rounded-full" />
                    <span className="w-3 h-1 bg-purple-200 rounded-full" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* AI教练图标 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="absolute -left-2 top-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{ 
            boxShadow: [
              "0 0 0 0 rgba(168, 85, 247, 0.4)",
              "0 0 0 10px rgba(168, 85, 247, 0)",
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
        >
          <span className="text-white text-sm">🤍</span>
        </motion.div>
      </motion.div>

      {/* 背景光晕 */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-40 h-32 bg-purple-400/20 rounded-full blur-2xl"
      />
    </div>
  );
};

export default Layer3Illustration;
