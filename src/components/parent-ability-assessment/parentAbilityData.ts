// 三力测评：情绪稳定力、情绪洞察力、关系修复力
// 24题（每力8题），4级评分，含正向/反向题混合

export type Dimension = 'stability' | 'insight' | 'repair';
export type SubDimension =
  | 'self_awareness' | 'emotion_isolation' | 'stress_tolerance' | 'self_regulation'
  | 'behavior_decoding' | 'need_recognition' | 'emotion_naming' | 'development_understanding'
  | 'active_repair' | 'nonviolent_communication' | 'trust_rebuilding' | 'flexible_response';

export interface Question {
  id: number;
  text: string;
  dimension: Dimension;
  subDimension: SubDimension;
  isReversed: boolean; // 反向计分
}

export interface ScoreLabel {
  value: number;
  label: string;
  shortLabel: string;
}

export const scoreLabels: ScoreLabel[] = [
  { value: 1, label: '很不符合', shortLabel: '很不符' },
  { value: 2, label: '不太符合', shortLabel: '不太符' },
  { value: 3, label: '比较符合', shortLabel: '比较符' },
  { value: 4, label: '非常符合', shortLabel: '非常符' },
];

export const dimensionMeta: Record<Dimension, { label: string; icon: string; color: string }> = {
  stability: { label: '情绪稳定力', icon: '🛡️', color: 'emerald' },
  insight: { label: '情绪洞察力', icon: '👁️', color: 'sky' },
  repair: { label: '关系修复力', icon: '🤝', color: 'violet' },
};

export const subDimensionLabels: Record<SubDimension, string> = {
  self_awareness: '自我觉察',
  emotion_isolation: '情绪隔离',
  stress_tolerance: '压力承受',
  self_regulation: '自我调节',
  behavior_decoding: '行为解码',
  need_recognition: '需求识别',
  emotion_naming: '情绪命名',
  development_understanding: '发展理解',
  active_repair: '主动修复',
  nonviolent_communication: '非暴力沟通',
  trust_rebuilding: '信任重建',
  flexible_response: '柔性回应',
};

// 24道题目（打乱维度顺序）
export const questions: Question[] = [
  // === 情绪稳定力 ===
  // 自我觉察
  { id: 1, text: '当孩子顶嘴时，我能觉察到自己正在变得愤怒', dimension: 'stability', subDimension: 'self_awareness', isReversed: false },
  { id: 2, text: '我经常在发火之后才意识到自己情绪失控了', dimension: 'stability', subDimension: 'self_awareness', isReversed: true },
  // 情绪隔离
  { id: 3, text: '孩子的坏情绪不会轻易传染给我', dimension: 'stability', subDimension: 'emotion_isolation', isReversed: false },
  { id: 4, text: '孩子哭闹时，我常常比TA更崩溃', dimension: 'stability', subDimension: 'emotion_isolation', isReversed: true },
  // 压力承受
  { id: 5, text: '即使孩子连续几天情绪不好，我也能保持耐心', dimension: 'stability', subDimension: 'stress_tolerance', isReversed: false },
  { id: 6, text: '孩子反复出现同样的问题时，我会忍不住爆发', dimension: 'stability', subDimension: 'stress_tolerance', isReversed: true },
  // 自我调节
  { id: 7, text: '感到快要发火时，我有自己的方法让自己冷静下来', dimension: 'stability', subDimension: 'self_regulation', isReversed: false },
  { id: 8, text: '和孩子争吵后，我需要很长时间才能平复心情', dimension: 'stability', subDimension: 'self_regulation', isReversed: true },

  // === 情绪洞察力 ===
  // 行为解码
  { id: 9, text: '我能看出孩子"不想上学"背后的真实原因', dimension: 'insight', subDimension: 'behavior_decoding', isReversed: false },
  { id: 10, text: '我觉得孩子很多行为就是"故意作对"', dimension: 'insight', subDimension: 'behavior_decoding', isReversed: true },
  // 需求识别
  { id: 11, text: '孩子发脾气时，我能感受到TA其实在求助', dimension: 'insight', subDimension: 'need_recognition', isReversed: false },
  { id: 12, text: '我不太理解孩子为什么会为一点小事大发雷霆', dimension: 'insight', subDimension: 'need_recognition', isReversed: true },
  // 情绪命名
  { id: 13, text: '我能帮孩子用准确的词语描述TA的感受', dimension: 'insight', subDimension: 'emotion_naming', isReversed: false },
  { id: 14, text: '面对孩子复杂的情绪，我常常不知道TA到底怎么了', dimension: 'insight', subDimension: 'emotion_naming', isReversed: true },
  // 发展理解
  { id: 15, text: '我了解青春期孩子的情绪波动是正常的发展现象', dimension: 'insight', subDimension: 'development_understanding', isReversed: false },
  { id: 16, text: '我觉得孩子到了这个年龄不应该还这么情绪化', dimension: 'insight', subDimension: 'development_understanding', isReversed: true },

  // === 关系修复力 ===
  // 主动修复
  { id: 17, text: '吵架后，我会主动找合适的时机和孩子聊聊', dimension: 'repair', subDimension: 'active_repair', isReversed: false },
  { id: 18, text: '冲突后，我倾向于等孩子先来主动示好', dimension: 'repair', subDimension: 'active_repair', isReversed: true },
  // 非暴力沟通
  { id: 19, text: '我能用"我感到..."的方式表达自己的感受，而不是指责', dimension: 'repair', subDimension: 'nonviolent_communication', isReversed: false },
  { id: 20, text: '讨论问题时，我容易不自觉地说出"你总是..."这样的话', dimension: 'repair', subDimension: 'nonviolent_communication', isReversed: true },
  // 信任重建
  { id: 21, text: '即使关系紧张，我也相信通过努力可以修复和孩子的关系', dimension: 'repair', subDimension: 'trust_rebuilding', isReversed: false },
  { id: 22, text: '有时候我觉得和孩子之间的隔阂已经无法消除', dimension: 'repair', subDimension: 'trust_rebuilding', isReversed: true },
  // 柔性回应
  { id: 23, text: '当孩子说出伤人的话，我能理解那不是TA的本意', dimension: 'repair', subDimension: 'flexible_response', isReversed: false },
  { id: 24, text: '孩子态度不好时，我很难控制自己不"以牙还牙"', dimension: 'repair', subDimension: 'flexible_response', isReversed: true },
];

// 打乱题目顺序（固定随机）避免模式化作答
export const shuffledQuestions: Question[] = [
  questions[0],   // 1 - stability
  questions[8],   // 9 - insight
  questions[16],  // 17 - repair
  questions[3],   // 4 - stability
  questions[11],  // 12 - insight
  questions[19],  // 20 - repair
  questions[4],   // 5 - stability
  questions[9],   // 10 - insight
  questions[20],  // 21 - repair
  questions[1],   // 2 - stability
  questions[12],  // 13 - insight
  questions[17],  // 18 - repair
  questions[6],   // 7 - stability
  questions[13],  // 14 - insight
  questions[22],  // 23 - repair
  questions[2],   // 3 - stability
  questions[10],  // 11 - insight
  questions[21],  // 22 - repair
  questions[7],   // 8 - stability
  questions[14],  // 15 - insight
  questions[18],  // 19 - repair
  questions[5],   // 6 - stability
  questions[15],  // 16 - insight
  questions[23],  // 24 - repair
];

// ========== 计算逻辑 ==========

export function getScore(questionId: number, rawScore: number): number {
  const q = questions.find(q => q.id === questionId);
  if (!q) return rawScore;
  return q.isReversed ? (5 - rawScore) : rawScore;
}

export interface DimensionScore {
  dimension: Dimension;
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface SubDimensionScore {
  subDimension: SubDimension;
  label: string;
  dimension: Dimension;
  score: number;
  maxScore: number;
}

export function calculateDimensionScores(answers: Record<number, number>): DimensionScore[] {
  const dims: Dimension[] = ['stability', 'insight', 'repair'];
  return dims.map(dim => {
    const dimQuestions = questions.filter(q => q.dimension === dim);
    const score = dimQuestions.reduce((sum, q) => sum + getScore(q.id, answers[q.id] || 0), 0);
    const maxScore = dimQuestions.length * 4;
    return {
      dimension: dim,
      label: dimensionMeta[dim].label,
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
    };
  });
}

export function calculateSubDimensionScores(answers: Record<number, number>): SubDimensionScore[] {
  const subDims = Object.keys(subDimensionLabels) as SubDimension[];
  return subDims.map(sub => {
    const subQuestions = questions.filter(q => q.subDimension === sub);
    const score = subQuestions.reduce((sum, q) => sum + getScore(q.id, answers[q.id] || 0), 0);
    return {
      subDimension: sub,
      label: subDimensionLabels[sub],
      dimension: subQuestions[0].dimension,
      score,
      maxScore: subQuestions.length * 4,
    };
  });
}

// ========== 结果分型 ==========

export type ResultType = 'stable_guide' | 'emotion_involved' | 'cognitive_blind' | 'disconnect_avoid' | 'willing_but_unable' | 'potential_awakening';

export interface ResultTypeInfo {
  type: ResultType;
  title: string;
  emoji: string;
  description: string;
  advice: string;
}

export const resultTypes: Record<ResultType, ResultTypeInfo> = {
  stable_guide: {
    type: 'stable_guide',
    title: '稳定引航型',
    emoji: '⛵',
    description: '三力均衡，情绪稳定，既能看懂孩子也能修复关系。你是孩子情绪的"安全港湾"。',
    advice: '继续保持，可以将你的经验分享给其他家长。训练营可以帮你更上层楼。',
  },
  emotion_involved: {
    type: 'emotion_involved',
    title: '情绪卷入型',
    emoji: '🌊',
    description: '你的洞察力和修复力都不错，但稳定力偏弱——容易被孩子的情绪"带着走"。',
    advice: '优先练习"情绪隔离"，学会先稳住自己。你看得懂孩子，只差一个稳定的内核。',
  },
  cognitive_blind: {
    type: 'cognitive_blind',
    title: '认知盲区型',
    emoji: '🔍',
    description: '你情绪稳定，也愿意修复关系，但常误读孩子的行为——把求助看成叛逆。',
    advice: '重点学习"行为解码"和"需求识别"，理解青春期孩子的心理发展规律。',
  },
  disconnect_avoid: {
    type: 'disconnect_avoid',
    title: '断裂回避型',
    emoji: '🧊',
    description: '你能看懂也能稳住，但冲突后倾向于回避或冷战，关系裂痕在不知不觉中加深。',
    advice: '练习"主动修复"和"非暴力沟通"，学会在冲突后迈出第一步。',
  },
  willing_but_unable: {
    type: 'willing_but_unable',
    title: '心有余力不足型',
    emoji: '💪',
    description: '你很理解孩子，但在面对情绪时容易失控，冲突后也不知如何修复。',
    advice: '洞察力是你的优势，现在需要系统提升稳定力和修复力的"技能"。',
  },
  potential_awakening: {
    type: 'potential_awakening',
    title: '潜力觉醒型',
    emoji: '🌱',
    description: '三力都有较大提升空间，说明你还没有找到系统的方法。好消息是——提升空间就是成长空间。',
    advice: '系统训练效果最明显的就是你这种类型。21天训练营将帮你全面提升三力。',
  },
};

export function determineResultType(dimScores: DimensionScore[]): ResultType {
  const stability = dimScores.find(d => d.dimension === 'stability')!;
  const insight = dimScores.find(d => d.dimension === 'insight')!;
  const repair = dimScores.find(d => d.dimension === 'repair')!;

  const totalPercentage = (stability.percentage + insight.percentage + repair.percentage) / 3;
  const highThreshold = 70;
  const lowThreshold = 50;

  // 三力均衡且高
  if (stability.percentage >= highThreshold && insight.percentage >= highThreshold && repair.percentage >= highThreshold) {
    return 'stable_guide';
  }

  // 整体中等偏低
  if (totalPercentage < lowThreshold) {
    return 'potential_awakening';
  }

  // 洞察高但稳定+修复低
  if (insight.percentage >= highThreshold && stability.percentage < lowThreshold + 10 && repair.percentage < lowThreshold + 10) {
    return 'willing_but_unable';
  }

  // 找最弱维度
  const min = Math.min(stability.percentage, insight.percentage, repair.percentage);
  const gap = Math.max(stability.percentage, insight.percentage, repair.percentage) - min;

  if (gap >= 15) {
    if (min === stability.percentage) return 'emotion_involved';
    if (min === insight.percentage) return 'cognitive_blind';
    if (min === repair.percentage) return 'disconnect_avoid';
  }

  // 没有明显短板但整体不高
  if (totalPercentage < highThreshold) {
    return 'potential_awakening';
  }

  return 'stable_guide';
}

// AI追问触发逻辑
export function shouldTriggerFollowUp(
  answers: Record<number, number>,
  currentQuestionIndex: number,
  followUpCount: number,
): { shouldTrigger: boolean; subDimension?: SubDimension; dimension?: Dimension } {
  if (followUpCount >= 3) return { shouldTrigger: false };

  const currentQ = shuffledQuestions[currentQuestionIndex];
  // 每完成一个子维度的2题后检查
  const sameSubQuestions = shuffledQuestions
    .slice(0, currentQuestionIndex + 1)
    .filter(q => q.subDimension === currentQ.subDimension);

  if (sameSubQuestions.length < 2) return { shouldTrigger: false };

  // 两道题都已回答
  const scores = sameSubQuestions.map(q => getScore(q.id, answers[q.id] || 0));
  const allLow = scores.every(s => s <= 2);

  if (allLow) {
    return { shouldTrigger: true, subDimension: currentQ.subDimension, dimension: currentQ.dimension };
  }

  return { shouldTrigger: false };
}
