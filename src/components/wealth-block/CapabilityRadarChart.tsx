import { useState, useEffect } from "react";
import { motion, animate, AnimatePresence } from "framer-motion";
import { Target, BarChart3, Brain, FileText } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const capabilityData = [
  { name: "精准定位", value: 95, desc: "识别行为、情绪、信念三层卡点", icon: Target, emoji: "🎯" },
  { name: "可视诊断", value: 90, desc: "四穷雷达图 + 觉醒指数仪表盘", icon: BarChart3, emoji: "📊" },
  { name: "AI追问", value: 88, desc: "根据回答动态生成深度追问", icon: Brain, emoji: "🧠" },
  { name: "专属报告", value: 92, desc: "人格故事解读 + 个性化突破建议", icon: FileText, emoji: "📄" },
];

const iconPositions = [
  { x: "50%", y: "8%", translateX: "-50%", translateY: "0" },   // 精准定位 - top
  { x: "92%", y: "50%", translateX: "-100%", translateY: "-50%" }, // 可视诊断 - right
  { x: "50%", y: "92%", translateX: "-50%", translateY: "-100%" }, // AI追问 - bottom
  { x: "8%", y: "50%", translateX: "0", translateY: "-50%" },    // 专属报告 - left
];

// Animated counter component
function AnimatedNumber({ value, delay }: { value: number; delay: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const controls = animate(0, value, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate: (v) => setDisplayValue(Math.round(v)),
      });
      return () => controls.stop();
    }, delay * 1000);
    
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return <span>{displayValue}</span>;
}

// Typing text animation
function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span className="inline-flex flex-wrap justify-center">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.03, duration: 0.2 }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export function CapabilityRadarChart() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-carousel every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const activeCapability = capabilityData[activeIndex];

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          background: [
            "linear-gradient(135deg, rgba(209,250,229,0.5) 0%, rgba(204,251,241,0.5) 100%)",
            "linear-gradient(135deg, rgba(204,251,241,0.5) 0%, rgba(167,243,208,0.5) 100%)",
            "linear-gradient(135deg, rgba(167,243,208,0.5) 0%, rgba(209,250,229,0.5) 100%)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Radar Chart Container */}
      <div className="relative h-[220px] flex items-center justify-center">
        {/* Center Ripples */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-emerald-300"
              initial={{ width: 20, height: 20, opacity: 0 }}
              animate={isLoaded ? {
                width: [20, 100],
                height: [20, 100],
                opacity: [0.6, 0],
              } : {}}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Radar Chart */}
        <motion.div
          className="w-full h-full"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={capabilityData} cx="50%" cy="50%" outerRadius="65%">
              <defs>
                <linearGradient id="capabilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
              <PolarGrid 
                stroke="#a7f3d0" 
                strokeWidth={1}
                gridType="polygon"
              />
              <PolarAngleAxis 
                dataKey="name" 
                tick={false}
              />
              <Radar
                name="能力"
                dataKey="value"
                stroke="url(#strokeGradient)"
                strokeWidth={2}
                fill="url(#capabilityGradient)"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Vertex Icons with Pulse Effect */}
        {capabilityData.map((item, index) => {
          const pos = iconPositions[index];
          const isActive = index === activeIndex;
          const IconComponent = item.icon;

          return (
            <motion.div
              key={item.name}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                transform: `translate(${pos.translateX}, ${pos.translateY})`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.6 + index * 0.1, type: "spring", stiffness: 200 }}
            >
              {/* Pulse Glow for Active */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-emerald-400"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ filter: "blur(8px)" }}
                  />
                )}
              </AnimatePresence>

              {/* Icon Container */}
              <motion.div
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors duration-300 ${
                  isActive 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                    : "bg-white text-emerald-600 border border-emerald-200"
                }`}
                animate={isActive ? {
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: isActive ? Infinity : 0,
                  ease: "easeInOut",
                }}
                onClick={() => setActiveIndex(index)}
              >
                <span className="text-lg">{item.emoji}</span>
              </motion.div>

              {/* Value Badge */}
              <motion.div
                className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive 
                    ? "bg-amber-400 text-amber-900" 
                    : "bg-slate-100 text-slate-600"
                }`}
                initial={{ scale: 0 }}
                animate={isLoaded ? { scale: 1 } : {}}
                transition={{ delay: 1 + index * 0.1 }}
              >
                <AnimatedNumber value={item.value} delay={1 + index * 0.1} />
              </motion.div>
            </motion.div>
          );
        })}

        {/* Center AI Badge */}
        <motion.div
          className="absolute flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
        >
          <motion.div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(16, 185, 129, 0.4)",
                "0 0 0 8px rgba(16, 185, 129, 0)",
                "0 0 0 0 rgba(16, 185, 129, 0.4)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="text-2xl">🤖</span>
          </motion.div>
        </motion.div>

        {/* Flowing Particles */}
        {isLoaded && [0, 1, 2, 3].map((lineIndex) => (
          <motion.div
            key={`particle-${lineIndex}`}
            className="absolute w-2 h-2 rounded-full bg-emerald-400"
            style={{
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [0, Math.cos((lineIndex * Math.PI) / 2) * 60],
              y: [0, Math.sin((lineIndex * Math.PI) / 2) * 60],
              opacity: [1, 0],
              scale: [1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: lineIndex * 0.5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Active Capability Description */}
      <motion.div
        className="relative mt-4 p-3 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-lg">{activeCapability.emoji}</span>
              <span className="font-bold text-emerald-700">{activeCapability.name}</span>
              <span className="text-amber-500 font-bold text-sm">
                <AnimatedNumber value={activeCapability.value} delay={0} />%
              </span>
            </div>
            <p className="text-xs text-slate-600">
              <TypingText text={activeCapability.desc} delay={0.1} />
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-3">
          {capabilityData.map((_, index) => (
            <motion.button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === activeIndex ? "bg-emerald-500" : "bg-emerald-200"
              }`}
              onClick={() => setActiveIndex(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
