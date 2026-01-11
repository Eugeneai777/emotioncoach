// Dynamic breakthrough suggestions based on reaction pattern and progress

export interface BreakthroughSuggestion {
  id: string;
  title: string;
  description: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  category: 'awareness' | 'action' | 'belief';
  targetLayer: 'behavior' | 'emotion' | 'belief';
}

export interface PatternBreakthroughs {
  lowProgress: BreakthroughSuggestion[];   // 0-30%
  midProgress: BreakthroughSuggestion[];   // 30-60%
  highProgress: BreakthroughSuggestion[];  // 60-100%
}

// Pattern-specific breakthrough suggestions
export const patternBreakthroughs: Record<string, PatternBreakthroughs> = {
  harmony: {
    lowProgress: [
      { id: 'h1', title: '觉察丰盛时刻', description: '今天记录3个你感到财富流动顺畅的时刻', emoji: '✨', difficulty: 'easy', points: 10, category: 'awareness', targetLayer: 'emotion' },
      { id: 'h2', title: '分享好运', description: '向一位朋友分享你最近的好消息或成就', emoji: '🎁', difficulty: 'easy', points: 15, category: 'action', targetLayer: 'behavior' },
    ],
    midProgress: [
      { id: 'h3', title: '建立丰盛仪式', description: '设计一个属于你的财富感恩仪式并执行', emoji: '🙏', difficulty: 'medium', points: 20, category: 'action', targetLayer: 'belief' },
      { id: 'h4', title: '复制成功模式', description: '回顾最近一次财务成功，总结可复制的要素', emoji: '📋', difficulty: 'medium', points: 25, category: 'awareness', targetLayer: 'behavior' },
    ],
    highProgress: [
      { id: 'h5', title: '成为丰盛导师', description: '帮助一位朋友转化他们的财富卡点', emoji: '🌟', difficulty: 'hard', points: 30, category: 'action', targetLayer: 'behavior' },
      { id: 'h6', title: '丰盛愿景板', description: '创建下个季度的财富愿景并每日观想', emoji: '🎯', difficulty: 'hard', points: 30, category: 'belief', targetLayer: 'belief' },
    ],
  },
  chase: {
    lowProgress: [
      { id: 'c1', title: '暂停追逐', description: '今天遇到"机会"时，先深呼吸3次再决定', emoji: '⏸️', difficulty: 'easy', points: 10, category: 'awareness', targetLayer: 'behavior' },
      { id: 'c2', title: '记录焦虑时刻', description: '当感到"必须抓住"的冲动时，写下当时的念头', emoji: '📝', difficulty: 'easy', points: 10, category: 'awareness', targetLayer: 'emotion' },
    ],
    midProgress: [
      { id: 'c3', title: '主动放手练习', description: '故意放弃一个"看起来很好"但让你焦虑的机会', emoji: '🎈', difficulty: 'medium', points: 20, category: 'action', targetLayer: 'behavior' },
      { id: 'c4', title: '从容消费挑战', description: '购物时不比价，选择第一直觉喜欢的', emoji: '🛍️', difficulty: 'medium', points: 20, category: 'action', targetLayer: 'emotion' },
    ],
    highProgress: [
      { id: 'c5', title: '接受"够了"', description: '设定今日财富目标，达到后停止追求更多', emoji: '✅', difficulty: 'hard', points: 30, category: 'belief', targetLayer: 'belief' },
      { id: 'c6', title: '无为财富日', description: '今天不主动追求任何金钱相关的事，观察发生什么', emoji: '🧘', difficulty: 'hard', points: 30, category: 'action', targetLayer: 'behavior' },
    ],
  },
  avoid: {
    lowProgress: [
      { id: 'a1', title: '看一眼账户', description: '今天打开银行APP，只是看一眼余额（不评判）', emoji: '👀', difficulty: 'easy', points: 10, category: 'awareness', targetLayer: 'behavior' },
      { id: 'a2', title: '命名回避感', description: '当想回避金钱话题时，说出"我现在感到想回避"', emoji: '💬', difficulty: 'easy', points: 10, category: 'awareness', targetLayer: 'emotion' },
    ],
    midProgress: [
      { id: 'a3', title: '小额主动谈钱', description: '主动和家人讨论一个小金额的支出决定', emoji: '💰', difficulty: 'medium', points: 20, category: 'action', targetLayer: 'behavior' },
      { id: 'a4', title: '钱=爱的证据', description: '写下3个金钱曾经帮助你表达爱的例子', emoji: '❤️', difficulty: 'medium', points: 20, category: 'belief', targetLayer: 'belief' },
    ],
    highProgress: [
      { id: 'a5', title: '迎接大额决定', description: '主动参与一个你通常会逃避的财务决策', emoji: '🤗', difficulty: 'hard', points: 30, category: 'action', targetLayer: 'behavior' },
      { id: 'a6', title: '财富安全宣言', description: '写下并每天朗读"我与金钱是安全的"', emoji: '🛡️', difficulty: 'hard', points: 30, category: 'belief', targetLayer: 'belief' },
    ],
  },
  trauma: {
    lowProgress: [
      { id: 't1', title: '安全容器呼吸', description: '看到账单时，做5次深腹式呼吸再处理', emoji: '🌬️', difficulty: 'easy', points: 10, category: 'awareness', targetLayer: 'emotion' },
      { id: 't2', title: '身体扫描', description: '想到钱时，感知身体哪里有紧绷，轻轻触碰那里', emoji: '🤲', difficulty: 'easy', points: 10, category: 'awareness', targetLayer: 'emotion' },
    ],
    midProgress: [
      { id: 't3', title: '创伤-安全分离', description: '区分"过去的金钱记忆"和"现在的财务现实"', emoji: '⏳', difficulty: 'medium', points: 20, category: 'awareness', targetLayer: 'belief' },
      { id: 't4', title: '小额安全体验', description: '用一个小金额做一件让自己开心的事', emoji: '🎁', difficulty: 'medium', points: 20, category: 'action', targetLayer: 'behavior' },
    ],
    highProgress: [
      { id: 't5', title: '重写财富故事', description: '写一封信给过去被金钱伤害的自己', emoji: '💚', difficulty: 'hard', points: 30, category: 'belief', targetLayer: 'belief' },
      { id: 't6', title: '财富疗愈仪式', description: '设计一个象征性的仪式，释放与金钱相关的旧伤', emoji: '🌿', difficulty: 'hard', points: 30, category: 'action', targetLayer: 'emotion' },
    ],
  },
};

// Default fallback for unknown patterns
const defaultBreakthroughs: PatternBreakthroughs = patternBreakthroughs.harmony;

/**
 * Get dynamic breakthrough suggestions based on pattern and progress
 */
export function getBreakthroughSuggestions(
  patternKey: string | null,
  transformationRate: number,
  completedIds: string[] = []
): BreakthroughSuggestion[] {
  const normalizedKey = patternKey || 'harmony';
  const patternData = patternBreakthroughs[normalizedKey] || defaultBreakthroughs;
  
  // Determine progress tier
  let suggestions: BreakthroughSuggestion[];
  if (transformationRate < 30) {
    suggestions = patternData.lowProgress;
  } else if (transformationRate < 60) {
    suggestions = patternData.midProgress;
  } else {
    suggestions = patternData.highProgress;
  }
  
  // Filter out completed ones
  return suggestions.filter(s => !completedIds.includes(s.id));
}

/**
 * Get next recommended breakthrough
 */
export function getNextBreakthrough(
  patternKey: string | null,
  transformationRate: number,
  completedIds: string[] = []
): BreakthroughSuggestion | null {
  const available = getBreakthroughSuggestions(patternKey, transformationRate, completedIds);
  return available[0] || null;
}

/**
 * Get all breakthroughs for a pattern (for history/stats)
 */
export function getAllPatternBreakthroughs(patternKey: string | null): BreakthroughSuggestion[] {
  const normalizedKey = patternKey || 'harmony';
  const patternData = patternBreakthroughs[normalizedKey] || defaultBreakthroughs;
  
  return [
    ...patternData.lowProgress,
    ...patternData.midProgress,
    ...patternData.highProgress,
  ];
}
