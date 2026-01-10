// Unified wealth styling configuration
// Shared across assessment report and journal dashboard
// CRITICAL: All metrics use unified "Awakening Index" (0-100, higher = better)

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

// Awakening zones: higher score = more awakened (POSITIVE)
export const awakeningZones = [
  { range: [80, 100], label: "高度觉醒", emoji: "🟢", color: "emerald", description: "财富能量畅通" },
  { range: [60, 79], label: "稳步觉醒", emoji: "🟡", color: "amber", description: "持续突破中" },
  { range: [40, 59], label: "初步觉醒", emoji: "🟠", color: "orange", description: "开始看见改变" },
  { range: [0, 39], label: "觉醒起步", emoji: "🔴", color: "rose", description: "刚刚开始" },
];

// Legacy: Block score zones (for backward compatibility display)
// Higher score = more blockage (NEGATIVE) - used in assessment raw scores
export const wealthScoreZones = [
  { range: [0, 40], label: "和谐健康", emoji: "🟢", color: "emerald", description: "与财富关系顺畅" },
  { range: [41, 70], label: "需要关注", emoji: "🟡", color: "amber", description: "存在一些卡点" },
  { range: [71, 85], label: "需要调整", emoji: "🟠", color: "orange", description: "建议系统调整" },
  { range: [86, 100], label: "高风险区", emoji: "🔴", color: "rose", description: "需要专业陪伴" },
];

// ============================================
// UNIFIED CONVERSION FUNCTIONS
// ============================================

/**
 * Convert Day 0 assessment block score (0-100, higher = more blocked)
 * to awakening start point (0-100, higher = more awakened)
 */
export const blockScoreToAwakening = (blockScore: number): number => {
  return Math.round(100 - blockScore);
};

/**
 * Convert 1-5 star score to 0-100 awakening index
 * Used for daily journal entries
 */
export const starScoreToAwakening = (starAvg: number): number => {
  return Math.round(((starAvg - 1) / 4) * 100);
};

/**
 * Convert layer score (0-50 from assessment) to 1-5 stars
 * For unified display across assessment and journal
 */
export const layerScoreToStars = (layerScore: number, maxScore: number = 50): number => {
  // Convert 0-50 to 1-5 stars
  const normalized = (layerScore / maxScore) * 4 + 1;
  return Math.min(5, Math.max(1, Math.round(normalized * 10) / 10));
};

/**
 * Convert layer score (0-50) to awakening percentage (0-100)
 * Higher block score = lower awakening
 */
export const layerScoreToAwakeningPercent = (layerScore: number, maxScore: number = 50): number => {
  return Math.round(100 - (layerScore / maxScore) * 100);
};

// ============================================
// ZONE DETECTION FUNCTIONS
// ============================================

/**
 * Get awakening zone for a 0-100 awakening score (higher = better)
 */
export const getAwakeningZone = (awakeningScore: number) => {
  return awakeningZones.find(zone => 
    awakeningScore >= zone.range[0] && awakeningScore <= zone.range[1]
  ) || awakeningZones[3]; // Default to lowest zone
};

/**
 * Legacy: Get health zone for block score (higher = worse)
 */
export const getHealthZone = (score: number) => {
  return wealthScoreZones.find(zone => score >= zone.range[0] && score <= zone.range[1]) || wealthScoreZones[0];
};

// ============================================
// COLOR FUNCTIONS (Unified: higher = better = green)
// ============================================

/**
 * Get gauge color for awakening index (higher = better = green)
 */
export const getAwakeningColor = (awakeningScore: number): string => {
  if (awakeningScore >= 80) return "#10b981"; // emerald - high awakening
  if (awakeningScore >= 60) return "#f59e0b"; // amber - steady awakening
  if (awakeningScore >= 40) return "#f97316"; // orange - initial awakening
  return "#f43f5e"; // rose - starting awakening
};

/**
 * Legacy: Get gauge color for block score (higher = worse = red)
 */
export const getGaugeColor = (score: number) => {
  if (score <= 40) return "#10b981";
  if (score <= 70) return "#f59e0b";
  if (score <= 85) return "#f97316";
  return "#f43f5e";
};

/**
 * Get tailwind text color class for awakening score
 */
export const getAwakeningTextColor = (awakeningScore: number): string => {
  if (awakeningScore >= 80) return "text-emerald-500";
  if (awakeningScore >= 60) return "text-amber-500";
  if (awakeningScore >= 40) return "text-orange-500";
  return "text-rose-500";
};

/**
 * Legacy: Get score color for block score
 */
export const getScoreColor = (score: number) => {
  if (score <= 40) return "text-emerald-500";
  if (score <= 70) return "text-amber-500";
  if (score <= 85) return "text-orange-500";
  return "text-rose-500";
};
