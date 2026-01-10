import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { Target, Eye, MessageCircle, FileText } from "lucide-react";

const capabilityData = [
  { name: "精准定位", value: 95, desc: "三层卡点识别", icon: Target },
  { name: "可视诊断", value: 90, desc: "雷达图+仪表盘", icon: Eye },
  { name: "AI追问", value: 88, desc: "动态深度挖掘", icon: MessageCircle },
  { name: "专属报告", value: 92, desc: "个性化突破建议", icon: FileText },
];

export function CapabilityRadarChart() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % capabilityData.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const CustomTick = ({ x, y, payload, index }: any) => {
    const item = capabilityData[index];
    const Icon = item?.icon;
    const isActive = index === activeIndex;
    
    // Adjust position based on angle
    const offsetX = index === 0 ? 0 : index === 1 ? 12 : index === 2 ? 0 : -12;
    const offsetY = index === 0 ? -8 : index === 2 ? 8 : 0;

    return (
      <g transform={`translate(${x + offsetX},${y + offsetY})`}>
        <motion.g
          animate={{
            scale: isActive ? 1.2 : 1,
            opacity: isActive ? 1 : 0.7,
          }}
          transition={{ duration: 0.3 }}
        >
          {Icon && (
            <foreignObject x="-10" y="-10" width="20" height="20">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full ${
                isActive ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
              } transition-colors duration-300`}>
                <Icon className="w-3 h-3" />
              </div>
            </foreignObject>
          )}
        </motion.g>
      </g>
    );
  };

  return (
    <div className="relative">
      {/* Radar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={capabilityData} cx="50%" cy="50%" outerRadius="70%">
            <defs>
              <linearGradient id="emeraldGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <PolarGrid 
              stroke="#e2e8f0" 
              strokeDasharray="3 3"
            />
            <PolarAngleAxis 
              dataKey="name" 
              tick={CustomTick}
              tickLine={false}
            />
            <Radar
              name="能力"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#emeraldGradient)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Center AI Icon */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.4, type: "spring" }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
          <span className="text-white text-lg font-bold">AI</span>
        </div>
      </motion.div>

      {/* Dynamic Description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-2 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            {(() => {
              const Icon = capabilityData[activeIndex].icon;
              return <Icon className="w-4 h-4 text-emerald-600" />;
            })()}
            <span className="font-medium text-sm text-emerald-700">
              {capabilityData[activeIndex].name}
            </span>
            <span className="text-xs text-emerald-600">
              {capabilityData[activeIndex].desc}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {capabilityData.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              index === activeIndex ? "bg-emerald-500" : "bg-slate-300"
            }`}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
    </div>
  );
}
