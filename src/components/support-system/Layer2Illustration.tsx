import React from "react";
import { motion } from "framer-motion";

const Layer2Illustration: React.FC = () => {
  const insightLines = [
    { width: 60, delay: 0 },
    { width: 80, delay: 0.15 },
    { width: 50, delay: 0.3 },
    { width: 70, delay: 0.45 },
    { width: 55, delay: 0.6 },
  ];

  return (
    <div className="relative h-32 flex items-center justify-center overflow-hidden">
      {/* 镜子框架 */}
      <motion.div
        initial={{ scale: 0, rotateY: 90 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="relative z-10"
      >
        {/* 镜面 */}
        <div className="w-20 h-24 bg-gradient-to-br from-blue-100 via-cyan-50 to-blue-100 rounded-xl border-4 border-blue-300 shadow-lg overflow-hidden">
          {/* 反射光效 */}
          <motion.div
            animate={{ 
              x: [-40, 80],
              opacity: [0, 0.6, 0]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              repeatDelay: 1.5,
              ease: "easeInOut"
            }}
            className="absolute w-8 h-32 bg-gradient-to-r from-transparent via-white to-transparent rotate-12 -top-4"
          />
          
          {/* 洞察文字线条 */}
          <div className="p-2 space-y-1.5 mt-2">
            {insightLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: `${line.width}%`, opacity: 1 }}
                transition={{ delay: 0.5 + line.delay, duration: 0.4 }}
                className="h-1.5 bg-blue-300 rounded-full"
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* 发散的洞察光点 */}
      {[...Array(6)].map((_, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const x = Math.cos(angle) * 50;
        const y = Math.sin(angle) * 40;
        
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0.01, scale: 0 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
              x: [0, x],
              y: [0, y]
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: 1
            }}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full"
          />
        );
      })}

      {/* 背景光晕 */}
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-32 h-32 bg-blue-300/20 rounded-full blur-2xl"
      />
    </div>
  );
};

export default Layer2Illustration;
