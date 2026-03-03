// 中场觉醒力测评 3.0 — 数据层
// 6个维度，每维度5题，共30题，5分制

// ===== 类型定义 =====
export type MidlifeDimension = 
  | 'internalFriction'   // 内耗循环
  | 'selfWorth'          // 自我价值松动
  | 'actionStagnation'   // 行动停滞
  | 'supportSystem'      // 支持系统温度
  | 'regretRisk'         // 后悔风险
  | 'missionClarity';    // 使命清晰

export type MidlifePersonalityType = 
  | 'mistBound'          // 迷雾困兽型
  | 'suppressed'         // 责任压抑型
  | 'stableAnxiety'      // 稳定焦虑型
  | 'awakening';         // 觉醒转型型

export interface MidlifeQuestion {
  id: number;
  dimension: MidlifeDimension;
  text: string;
  isReversed: boolean;
}

export interface MidlifeDimensionScore {
  dimension: MidlifeDimension;
  score: number;       // 0-100 标准化
  rawScore: number;    // 5-25 原始分
}

export interface MidlifeResult {
  dimensions: MidlifeDimensionScore[];
  personalityType: MidlifePersonalityType;
  internalFrictionRisk: number;   // 内耗风险 0-100
  actionPower: number;            // 行动力 0-100
  missionClarity: number;         // 使命清晰度 0-100
  regretRisk: number;             // 后悔风险 0-100
  supportWarmth: number;          // 支持系统温度 0-100 (反向：高=缺乏支持)
}

// ===== 维度配置 =====
export const dimensionConfig: Record<MidlifeDimension, {
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  internalFriction: {
    name: '内耗循环指数',
    shortName: '内耗循环',
    description: '衡量心理消耗与思维反刍程度',
    icon: '🌀',
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  selfWorth: {
    name: '自我价值松动指数',
    shortName: '价值松动',
    description: '衡量自我认同与价值感稳定度',
    icon: '💎',
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  actionStagnation: {
    name: '行动停滞指数',
    shortName: '行动停滞',
    description: '衡量行动力与目标执行能力',
    icon: '⚡',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  supportSystem: {
    name: '支持系统温度',
    shortName: '支持系统',
    description: '衡量社会支持与情感联结强度',
    icon: '🤝',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  regretRisk: {
    name: '后悔风险指数',
    shortName: '后悔风险',
    description: '衡量人生遗憾与真实自我偏离度',
    icon: '⏳',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  missionClarity: {
    name: '使命清晰指数',
    shortName: '使命清晰',
    description: '衡量人生方向感与意义感清晰度',
    icon: '🧭',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
  },
};

// ===== 维度间过渡配置 =====
export type DimensionTransitionKey = 
  | 'friction-worth' 
  | 'worth-action' 
  | 'action-support' 
  | 'support-regret' 
  | 'regret-mission';

export const dimensionTransitionConfig: Record<DimensionTransitionKey, {
  emoji: string;
  text: string;
  subtext: string;
  color: string;
}> = {
  'friction-worth': {
    emoji: '✅',
    text: '内耗循环扫描完成',
    subtext: '接下来，我们来看看你的自我价值感是否稳固',
    color: 'from-red-500 to-amber-500',
  },
  'worth-action': {
    emoji: '💡',
    text: '价值松动评估完成',
    subtext: '现在让我们测一测你的行动力状态',
    color: 'from-amber-500 to-blue-500',
  },
  'action-support': {
    emoji: '🎯',
    text: '行动停滞诊断完成',
    subtext: '接下来了解你身边的支持系统',
    color: 'from-blue-500 to-green-500',
  },
  'support-regret': {
    emoji: '🤝',
    text: '支持系统温度已测',
    subtext: '现在我们来看看你的后悔风险有多高',
    color: 'from-green-500 to-purple-500',
  },
  'regret-mission': {
    emoji: '⏳',
    text: '后悔风险已评估',
    subtext: '最后一步，让我们看看你的人生使命清晰度',
    color: 'from-purple-500 to-rose-500',
  },
};

// ===== 5分制评分选项 =====
export const midlifeScoreLabels = [
  { value: 1, label: '非常不同意', color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' },
  { value: 2, label: '不太同意', color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' },
  { value: 3, label: '不确定', color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700' },
  { value: 4, label: '比较同意', color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' },
  { value: 5, label: '非常同意', color: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700' },
];

// ===== 30题题库 =====
// 反向计分题 ID: 10, 13, 15, 16, 20, 26, 27, 29, 30
export const midlifeQuestions: MidlifeQuestion[] = [
  // 第一维度：内耗循环指数（5题）
  { id: 1, dimension: 'internalFriction', text: '我常常觉得很累，却说不清原因。', isReversed: false },
  { id: 2, dimension: 'internalFriction', text: '我脑中经常反复思考，却没有结论。', isReversed: false },
  { id: 3, dimension: 'internalFriction', text: '我害怕做错决定而迟迟不行动。', isReversed: false },
  { id: 4, dimension: 'internalFriction', text: '面对未来的不确定，我容易焦虑。', isReversed: false },
  { id: 5, dimension: 'internalFriction', text: '即使一切稳定，我内心仍然不安。', isReversed: false },

  // 第二维度：自我价值松动指数（5题）
  { id: 6, dimension: 'selfWorth', text: '我常觉得自己还不够好。', isReversed: false },
  { id: 7, dimension: 'selfWorth', text: '我对自己的成就很难真正满意。', isReversed: false },
  { id: 8, dimension: 'selfWorth', text: '我容易和别人比较。', isReversed: false },
  { id: 9, dimension: 'selfWorth', text: '别人的否定会影响我很久。', isReversed: false },
  { id: 10, dimension: 'selfWorth', text: '我清楚知道自己的优势。', isReversed: true },

  // 第三维度：行动停滞指数（5题）
  { id: 11, dimension: 'actionStagnation', text: '我有很多想法，但迟迟没有开始。', isReversed: false },
  { id: 12, dimension: 'actionStagnation', text: '我担心失败，所以宁可不尝试。', isReversed: false },
  { id: 13, dimension: 'actionStagnation', text: '我知道如何把目标拆解成小步骤。', isReversed: true },
  { id: 14, dimension: 'actionStagnation', text: '当机会出现时，我常犹豫。', isReversed: false },
  { id: 15, dimension: 'actionStagnation', text: '我能够为自己设定清晰目标。', isReversed: true },

  // 第四维度：支持系统温度（5题）
  { id: 16, dimension: 'supportSystem', text: '当我低落时，有人真正理解我。', isReversed: true },
  { id: 17, dimension: 'supportSystem', text: '我习惯自己扛一切。', isReversed: false },
  { id: 18, dimension: 'supportSystem', text: '我不太表达真实感受。', isReversed: false },
  { id: 19, dimension: 'supportSystem', text: '我和朋友的联系变少了。', isReversed: false },
  { id: 20, dimension: 'supportSystem', text: '在家庭中我能自在做自己。', isReversed: true },

  // 第五维度：后悔风险指数（5题）
  { id: 21, dimension: 'regretRisk', text: '我的人生更多是在满足别人的期待。', isReversed: false },
  { id: 22, dimension: 'regretRisk', text: '我很少把时间留给重要的人。', isReversed: false },
  { id: 23, dimension: 'regretRisk', text: '我压抑真实感受。', isReversed: false },
  { id: 24, dimension: 'regretRisk', text: '我已经很久没有单纯开心。', isReversed: false },
  { id: 25, dimension: 'regretRisk', text: '如果现在回头看，我会有遗憾。', isReversed: false },

  // 第六维度：使命清晰指数（5题）
  { id: 26, dimension: 'missionClarity', text: '我知道自己人生真正重要的方向。', isReversed: true },
  { id: 27, dimension: 'missionClarity', text: '我对未来五年有清晰愿景。', isReversed: true },
  { id: 28, dimension: 'missionClarity', text: '我常思考自己是否活出价值。', isReversed: false },
  { id: 29, dimension: 'missionClarity', text: '我感觉自己走在属于自己的路上。', isReversed: true },
  { id: 30, dimension: 'missionClarity', text: '我知道自己想成为什么样的人。', isReversed: true },
];

// ===== 四种人格类型配置 =====
export const personalityTypeConfig: Record<MidlifePersonalityType, {
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  feature: string;
  coreDilemma: string;
  breakthrough: string;
  color: string;
  bgColor: string;
  gradient: string;
}> = {
  mistBound: {
    name: '迷雾困兽型',
    emoji: '🌫️',
    tagline: '你不是懒，是耗尽。',
    description: '高内耗低行动，想很多做很少，能量被思维反刍消耗殆尽。',
    feature: '高内耗 + 低行动',
    coreDilemma: '想很多做很少',
    breakthrough: '微行动',
    color: 'from-slate-600 to-gray-700',
    bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    gradient: 'bg-gradient-to-br from-slate-500 to-gray-600',
  },
  suppressed: {
    name: '责任压抑型',
    emoji: '🎭',
    tagline: '你不是无能，是太负责。',
    description: '高后悔风险，长期活在他人期待中，压抑真实自我。',
    feature: '高后悔风险 + 低表达',
    coreDilemma: '活在期待里',
    breakthrough: '表达训练',
    color: 'from-violet-600 to-purple-700',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
  },
  stableAnxiety: {
    name: '稳定焦虑型',
    emoji: '🏛️',
    tagline: '你不是失败，是失去意义。',
    description: '外表稳定内心空，一切看似正常但已失去方向感。',
    feature: '表面正常 + 内心空',
    coreDilemma: '失去意义感',
    breakthrough: '使命重建',
    color: 'from-teal-600 to-cyan-700',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    gradient: 'bg-gradient-to-br from-teal-500 to-cyan-600',
  },
  awakening: {
    name: '觉醒转型型',
    emoji: '🦋',
    tagline: '你不是迷惘，你准备升级。',
    description: '使命感已苏醒，但行动力尚待跟上，处于突破前夜。',
    feature: '高使命 + 低内耗',
    coreDilemma: '准备跃迁',
    breakthrough: '系统规划',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
  },
};

// ===== 维度得分计算 =====
const dimensionQuestionIds: Record<MidlifeDimension, number[]> = {
  internalFriction: [1, 2, 3, 4, 5],
  selfWorth: [6, 7, 8, 9, 10],
  actionStagnation: [11, 12, 13, 14, 15],
  supportSystem: [16, 17, 18, 19, 20],
  regretRisk: [21, 22, 23, 24, 25],
  missionClarity: [26, 27, 28, 29, 30],
};

const reverseIds = new Set([10, 13, 15, 16, 20, 26, 27, 29, 30]);

function calculateDimensionScore(answers: Record<number, number>, questionIds: number[]): { score: number; rawScore: number } {
  let rawScore = 0;
  for (const id of questionIds) {
    const val = answers[id] ?? 3; // default neutral
    rawScore += reverseIds.has(id) ? (6 - val) : val;
  }
  // rawScore range: 5-25, normalize to 0-100
  const score = Math.round(((rawScore - 5) / 20) * 100);
  return { score: Math.max(0, Math.min(100, score)), rawScore };
}

// ===== 人格类型判定 =====
function determinePersonalityType(
  internalFriction: number,
  actionPower: number,
  missionClarity: number,
  regretRisk: number,
  supportWarmth: number,
): MidlifePersonalityType {
  // 迷雾困兽：高内耗 + 低行动
  if (internalFriction >= 60 && actionPower <= 40) return 'mistBound';
  // 责任压抑：高后悔 + 低支持(高支持缺失)
  if (regretRisk >= 60 && supportWarmth >= 60) return 'suppressed';
  // 稳定焦虑：低内耗 + 低使命
  if (internalFriction < 50 && missionClarity <= 40) return 'stableAnxiety';
  // 觉醒转型：其余
  return 'awakening';
}

// ===== 主计算函数 =====
export function calculateMidlifeResult(answers: Record<number, number>): MidlifeResult {
  const dimensions: MidlifeDimensionScore[] = (Object.keys(dimensionQuestionIds) as MidlifeDimension[]).map(dim => {
    const { score, rawScore } = calculateDimensionScore(answers, dimensionQuestionIds[dim]);
    return { dimension: dim, score, rawScore };
  });

  const getScore = (dim: MidlifeDimension) => dimensions.find(d => d.dimension === dim)!.score;

  const internalFrictionRisk = getScore('internalFriction');
  const actionStagnationScore = getScore('actionStagnation');
  const actionPower = 100 - actionStagnationScore; // 行动力 = 100 - 停滞分
  const missionClarityRaw = getScore('missionClarity');
  // 使命清晰维度大部分是反向题，高分=不清晰，所以反转
  const missionClarity = 100 - missionClarityRaw;
  const regretRisk = getScore('regretRisk');
  const supportWarmth = getScore('supportSystem'); // 高分=缺乏支持

  const personalityType = determinePersonalityType(
    internalFrictionRisk, actionPower, missionClarity, regretRisk, supportWarmth
  );

  return {
    dimensions,
    personalityType,
    internalFrictionRisk,
    actionPower,
    missionClarity,
    regretRisk,
    supportWarmth,
  };
}

// ===== 辅助函数 =====
export function getDimensionProgress(questionId: number): {
  currentDimension: MidlifeDimension;
  isDimensionTransition: boolean;
  transitionKey: DimensionTransitionKey | null;
} {
  const question = midlifeQuestions.find(q => q.id === questionId);
  const currentDimension = question?.dimension || 'internalFriction';

  // 检查是否是维度首题（需要过渡）
  const transitionMap: Record<number, DimensionTransitionKey> = {
    6: 'friction-worth',
    11: 'worth-action',
    16: 'action-support',
    21: 'support-regret',
    26: 'regret-mission',
  };

  const isDimensionTransition = questionId in transitionMap;
  const transitionKey = transitionMap[questionId] || null;

  return { currentDimension, isDimensionTransition, transitionKey };
}

// ===== 得分等级 =====
export function getMidlifeScoreLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

export function getMidlifeScoreLevelLabel(score: number): string {
  const level = getMidlifeScoreLevel(score);
  switch (level) {
    case 'low': return '健康';
    case 'medium': return '一般';
    case 'high': return '偏高';
    case 'critical': return '需关注';
  }
}

export function getMidlifeScoreLevelColor(score: number): string {
  const level = getMidlifeScoreLevel(score);
  switch (level) {
    case 'low': return 'text-emerald-600 dark:text-emerald-400';
    case 'medium': return 'text-amber-600 dark:text-amber-400';
    case 'high': return 'text-orange-600 dark:text-orange-400';
    case 'critical': return 'text-rose-600 dark:text-rose-400';
  }
}

export function getMidlifeBarColor(score: number): string {
  const level = getMidlifeScoreLevel(score);
  switch (level) {
    case 'low': return 'bg-emerald-500';
    case 'medium': return 'bg-amber-500';
    case 'high': return 'bg-orange-500';
    case 'critical': return 'bg-rose-500';
  }
}

// ===== 结果页配置 =====
export const resultSectionTitles = {
  radarChart: { title: '六维全景扫描', subtitle: '你的中场觉醒力画像' },
  personalityType: { title: '你的中场人格', subtitle: '基于三大核心指标整合分析' },
  dimensions: { title: '维度详情', subtitle: '六大维度逐项解读' },
  aiCoach: { title: 'AI觉醒教练', subtitle: '针对你的类型，开启个性化对话引导' },
};

// ===== 推荐映射 =====
export const personalityRecommendations: Record<MidlifePersonalityType, {
  coach: string;
  tool: string;
  campType: string;
}> = {
  mistBound: { coach: '情绪教练', tool: '觉察记录', campType: 'emotion' },
  suppressed: { coach: '沟通教练', tool: '表达训练', campType: 'identity' },
  stableAnxiety: { coach: '生命故事教练', tool: '使命探索', campType: 'life_story' },
  awakening: { coach: '目标教练', tool: '行动规划', campType: 'wealth' },
};
