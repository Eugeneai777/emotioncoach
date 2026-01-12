import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const capabilityData = [
  { name: "精准定位", value: 95, desc: "识别行为、情绪、信念三层卡点", emoji: "🎯" },
  { name: "可视诊断", value: 90, desc: "四穷雷达图 + 觉醒指数仪表盘", emoji: "📊" },
  { name: "AI追问", value: 88, desc: "根据回答动态生成深度追问", emoji: "🧠" },
  { name: "专属报告", value: 92, desc: "人格故事解读 + 个性化突破建议", emoji: "📄" },
];

const iconPositions = [
  { x: "50%", y: "8%", translateX: "-50%", translateY: "0" },
  { x: "92%", y: "50%", translateX: "-100%", translateY: "-50%" },
  { x: "50%", y: "92%", translateX: "-50%", translateY: "-100%" },
  { x: "8%", y: "50%", translateX: "0", translateY: "-50%" },
];

export function CapabilityRadarChart() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCapability = capabilityData[activeIndex];

  return (
    <div className="relative">
      {/* Static Background */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50" />

      {/* Radar Chart Container */}
      <div className="relative h-[200px] flex items-center justify-center">
        {/* Radar Chart */}
        <div className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={capabilityData} cx="50%" cy="50%" outerRadius="60%">
              <defs>
                <linearGradient id="capabilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.4} />
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
                stroke="#059669"
                strokeWidth={2}
                fill="url(#capabilityGradient)"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Static Vertex Icons */}
        {capabilityData.map((item, index) => {
          const pos = iconPositions[index];
          const isActive = index === activeIndex;

          return (
            <div
              key={item.name}
              className="absolute cursor-pointer"
              style={{
                left: pos.x,
                top: pos.y,
                transform: `translate(${pos.translateX}, ${pos.translateY})`,
              }}
              onClick={() => setActiveIndex(index)}
            >
              {/* Icon Container */}
              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  isActive 
                    ? "bg-emerald-500 text-white shadow-md" 
                    : "bg-white text-emerald-600 border border-emerald-200"
                }`}
              >
                <span className="text-base">{item.emoji}</span>
              </div>

              {/* Value Badge */}
              <div
                className={`absolute -bottom-1 -right-1 px-1 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive 
                    ? "bg-amber-400 text-amber-900" 
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {item.value}
              </div>
            </div>
          );
        })}

        {/* Static Center AI Badge */}
        <div className="absolute flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
            <span className="text-xl">🤖</span>
          </div>
        </div>
      </div>

      {/* Active Capability Description */}
      <div className="relative mt-3 p-3 rounded-lg bg-white/90 border border-emerald-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-base">{activeCapability.emoji}</span>
            <span className="font-bold text-emerald-700">{activeCapability.name}</span>
            <span className="text-amber-500 font-bold text-sm">{activeCapability.value}%</span>
          </div>
          <p className="text-xs text-slate-600">{activeCapability.desc}</p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-2">
          {capabilityData.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === activeIndex ? "bg-emerald-500" : "bg-emerald-200"
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
