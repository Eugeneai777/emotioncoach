// Unified wealth styling configuration
// Shared across assessment report and journal dashboard

export const wealthLayerColors = {
  behavior: {
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
    bgDark: "dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    accent: "#f59e0b",
    emoji: "🎯",
    label: "行为",
  },
  emotion: {
    gradient: "from-pink-400 to-rose-500",
    bg: "bg-pink-50",
    bgDark: "dark:bg-pink-950/30",
    border: "border-pink-200 dark:border-pink-800",
    text: "text-pink-700 dark:text-pink-300",
    accent: "#ec4899",
    emoji: "💭",
    label: "情绪",
  },
  belief: {
    gradient: "from-violet-400 to-purple-500",
    bg: "bg-violet-50",
    bgDark: "dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    text: "text-violet-700 dark:text-violet-300",
    accent: "#8b5cf6",
    emoji: "💡",
    label: "信念",
  },
};

export const wealthScoreZones = [
  { range: [0, 40], label: "和谐健康", emoji: "🟢", color: "emerald", description: "与财富关系顺畅" },
  { range: [41, 70], label: "需要关注", emoji: "🟡", color: "amber", description: "存在一些卡点" },
  { range: [71, 85], label: "需要调整", emoji: "🟠", color: "orange", description: "建议系统调整" },
  { range: [86, 100], label: "高风险区", emoji: "🔴", color: "rose", description: "需要专业陪伴" },
];

export const getHealthZone = (score: number) => {
  return wealthScoreZones.find(zone => score >= zone.range[0] && score <= zone.range[1]) || wealthScoreZones[0];
};

export const getGaugeColor = (score: number) => {
  if (score <= 40) return "#10b981";
  if (score <= 70) return "#f59e0b";
  if (score <= 85) return "#f97316";
  return "#f43f5e";
};

export const getScoreColor = (score: number) => {
  if (score <= 40) return "text-emerald-500";
  if (score <= 70) return "text-amber-500";
  if (score <= 85) return "text-orange-500";
  return "text-rose-500";
};
