import React from "react";
import { motion } from "framer-motion";

const Layer4Illustration: React.FC = () => {
  const participants = [
    { x: -35, y: -15, emoji: '👤', delay: 0 },
    { x: 0, y: -25, emoji: '👤', delay: 0.1 },
    { x: 35, y: -15, emoji: '👤', delay: 0.2 },
    { x: -25, y: 20, emoji: '👤', delay: 0.3 },
    { x: 25, y: 20, emoji: '👤', delay: 0.4 },
  ];

  return (
    <div className="relative h-32 flex items-center justify-center overflow-hidden">
      {/* 中心教练 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative z-10"
      >
        <motion.div
          animate={{ 
            boxShadow: [
              "0 0 0 0 rgba(20, 184, 166, 0.4)",
              "0 0 0 15px rgba(20, 184, 166, 0)",
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <span className="text-2xl">🧑‍🏫</span>
        </motion.div>
      </motion.div>

      {/* 参与者围绕 */}
      {participants.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + p.delay, type: "spring" }}
          style={{ x: p.x, y: p.y }}
          className="absolute"
        >
          <motion.div
            animate={{ 
              y: [0, -4, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }}
            className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-teal-200"
          >
            <span className="text-sm opacity-70">{p.emoji}</span>
          </motion.div>
        </motion.div>
      ))}

      {/* 连接线 */}
      {participants.map((p, i) => (
        <motion.div
          key={`line-${i}`}
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: 0.3, pathLength: 1 }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
          className="absolute"
          style={{
            width: Math.sqrt(p.x * p.x + p.y * p.y),
            height: 2,
            background: 'linear-gradient(90deg, rgba(20, 184, 166, 0.5), rgba(20, 184, 166, 0.1))',
            transform: `rotate(${Math.atan2(p.y, p.x) * 180 / Math.PI}deg)`,
            transformOrigin: '0 50%',
          }}
        />
      ))}

      {/* 21天进度环 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute -right-4 -top-2"
      >
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#e5e7eb"
              strokeWidth="3"
              fill="none"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              stroke="url(#gradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 0.7 }}
              transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
              style={{ 
                strokeDasharray: "126",
                strokeDashoffset: "0"
              }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-teal-600">21天</span>
          </div>
        </div>
      </motion.div>

      {/* 背景光晕 */}
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-40 h-32 bg-teal-400/20 rounded-full blur-2xl"
      />
    </div>
  );
};

export default Layer4Illustration;
