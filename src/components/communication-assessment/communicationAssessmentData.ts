// ============= 亲子沟通模式测评 - 数据配置 =============

export type Perspective = 'parent' | 'teen';
export type PatternType = 'controlling' | 'dismissive' | 'anxious' | 'democratic';
export type DimensionKey = 'listening' | 'empathy' | 'boundary' | 'expression' | 'conflict' | 'understanding';

export interface CommQuestion {
  id: number;
  dimension: DimensionKey;
  parentText: string;
  teenText: string;
  /** true = 正向题(得分越高越好), false = 反向题(需反转) */
  positive: boolean;
}

export interface PatternConfig {
  type: PatternType;
  label: string;
  emoji: string;
  color: string;
  description: string;
  traits: string[];
  improveTips: string[];
}

export interface DimensionConfig {
  key: DimensionKey;
  label: string;
  emoji: string;
  description: string;
  maxScore: number;
}

// ============= 维度定义 =============
export const dimensions: DimensionConfig[] = [
  { key: 'listening', label: '倾听能力', emoji: '👂', description: '是否真正听到对方的声音', maxScore: 12 },
  { key: 'empathy', label: '情感回应', emoji: '💗', description: '对对方情绪的回应质量', maxScore: 12 },
  { key: 'boundary', label: '边界设定', emoji: '🛡️', description: '规则与自由的平衡', maxScore: 12 },
  { key: 'expression', label: '表达方式', emoji: '💬', description: '沟通中的语言和态度', maxScore: 12 },
  { key: 'conflict', label: '冲突处理', emoji: '⚡', description: '分歧时的应对方式', maxScore: 12 },
  { key: 'understanding', label: '共情理解', emoji: '🤝', description: '站在对方角度理解的能力', maxScore: 12 },
];

// ============= 模式配置 =============
export const patternConfigs: Record<PatternType, PatternConfig> = {
  controlling: {
    type: 'controlling',
    label: '控制指令型',
    emoji: '🎯',
    color: 'text-red-600',
    description: '高要求、低回应，习惯用命令和说教的方式沟通，往往忽视孩子的感受和需求。',
    traits: ['习惯用"你应该""你必须"开头', '很少询问孩子的想法', '决策时较少考虑孩子意见', '倾向于用权威压制分歧'],
    improveTips: ['尝试用"你觉得呢？"代替"你应该"', '每天至少花10分钟纯倾听', '在非原则问题上给孩子选择权'],
  },
  dismissive: {
    type: 'dismissive',
    label: '忽视回避型',
    emoji: '🌫️',
    color: 'text-slate-600',
    description: '低参与、情感疏离，回避冲突和深层沟通，亲子间缺乏情感连接。',
    traits: ['较少主动与孩子交流', '面对冲突倾向于沉默或离开', '不太关注孩子的情绪变化', '认为"孩子大了自然就好了"'],
    improveTips: ['每天设定一个"亲子对话时间"', '学习识别和回应孩子的情绪信号', '分享自己的感受，建立双向沟通'],
  },
  anxious: {
    type: 'anxious',
    label: '焦虑过度型',
    emoji: '😰',
    color: 'text-amber-600',
    description: '高焦虑、过度保护，边界模糊，常把自己的焦虑投射到孩子身上。',
    traits: ['总担心孩子做不好或受伤', '反复叮嘱同一件事', '孩子的情绪波动会严重影响自己', '难以放手让孩子独立尝试'],
    improveTips: ['区分"我的焦虑"和"孩子的需要"', '练习"说一次就够了"', '培养孩子自主解决问题的信心'],
  },
  democratic: {
    type: 'democratic',
    label: '民主共情型',
    emoji: '🌟',
    color: 'text-emerald-600',
    description: '高回应、高引导，尊重孩子的感受和想法，在理解的基础上设定合理边界。',
    traits: ['善于倾听和确认孩子的感受', '在尊重中设定清晰边界', '鼓励孩子表达不同意见', '冲突时先处理情绪再解决问题'],
    improveTips: ['继续保持开放的沟通态度', '关注自己的情绪管理', '在坚持原则的同时保持灵活性'],
  },
};

// ============= 评分选项 =============
export const scoreLabels = [
  { value: 0, label: '从不', shortLabel: '从不' },
  { value: 1, label: '偶尔', shortLabel: '偶尔' },
  { value: 2, label: '经常', shortLabel: '经常' },
  { value: 3, label: '总是', shortLabel: '总是' },
];

// ============= 题库（24题，每维度4题） =============
export const questions: CommQuestion[] = [
  // 倾听能力 (4题)
  { id: 1, dimension: 'listening', positive: true, parentText: '当孩子说话时，我会放下手机认真听', teenText: '当我说话时，爸妈会放下手机认真听' },
  { id: 2, dimension: 'listening', positive: true, parentText: '我会耐心听完孩子的话，而不是中途打断', teenText: '爸妈会耐心听完我的话，而不是中途打断' },
  { id: 3, dimension: 'listening', positive: false, parentText: '孩子说的话我经常左耳进右耳出', teenText: '我觉得爸妈经常没在真正听我说话' },
  { id: 4, dimension: 'listening', positive: true, parentText: '我能复述出孩子刚才表达的核心意思', teenText: '爸妈能理解我真正想表达的意思' },

  // 情感回应 (4题)
  { id: 5, dimension: 'empathy', positive: true, parentText: '孩子难过时，我会先安慰再讨论解决办法', teenText: '我难过时，爸妈会先安慰我' },
  { id: 6, dimension: 'empathy', positive: false, parentText: '我觉得孩子太敏感，很多事不值得哭', teenText: '爸妈觉得我太敏感，经常说"这有什么好哭的"' },
  { id: 7, dimension: 'empathy', positive: true, parentText: '我能感受到孩子情绪的变化', teenText: '爸妈能察觉到我情绪的变化' },
  { id: 8, dimension: 'empathy', positive: true, parentText: '孩子开心时，我会真心为TA高兴', teenText: '我开心时，爸妈会真心为我高兴' },

  // 边界设定 (4题)
  { id: 9, dimension: 'boundary', positive: true, parentText: '我会和孩子一起商量家里的规则', teenText: '爸妈会和我一起商量家里的规则' },
  { id: 10, dimension: 'boundary', positive: false, parentText: '我经常翻看孩子的手机或日记', teenText: '爸妈经常翻看我的手机或日记' },
  { id: 11, dimension: 'boundary', positive: true, parentText: '在非原则问题上，我会给孩子自主选择权', teenText: '在非原则问题上，爸妈会让我自己做决定' },
  { id: 12, dimension: 'boundary', positive: true, parentText: '我能分清"孩子的事"和"我的事"', teenText: '爸妈能分清哪些是我自己的事' },

  // 表达方式 (4题)
  { id: 13, dimension: 'expression', positive: true, parentText: '我会用"我感到..."来表达自己的感受', teenText: '爸妈会温和地告诉我他们的感受' },
  { id: 14, dimension: 'expression', positive: false, parentText: '我生气时会说出伤害孩子的话', teenText: '爸妈生气时会说出伤害我的话' },
  { id: 15, dimension: 'expression', positive: true, parentText: '我会具体地表扬孩子做得好的地方', teenText: '爸妈会具体地表扬我做得好的地方' },
  { id: 16, dimension: 'expression', positive: false, parentText: '我习惯用"你怎么总是..."这样的句式', teenText: '爸妈经常用"你怎么总是..."来说我' },

  // 冲突处理 (4题)
  { id: 17, dimension: 'conflict', positive: true, parentText: '和孩子意见不同时，我愿意先冷静下来再谈', teenText: '和爸妈意见不同时，他们愿意先冷静下来再谈' },
  { id: 18, dimension: 'conflict', positive: false, parentText: '争吵时，我倾向于用"我说了算"来结束对话', teenText: '争吵时，爸妈倾向于用"我说了算"来结束对话' },
  { id: 19, dimension: 'conflict', positive: true, parentText: '冲突后，我会主动和孩子修复关系', teenText: '冲突后，爸妈会主动和我和好' },
  { id: 20, dimension: 'conflict', positive: false, parentText: '我会在孩子面前翻旧账', teenText: '爸妈会在吵架时翻旧账' },

  // 共情理解 (4题)
  { id: 21, dimension: 'understanding', positive: true, parentText: '我能理解孩子这个年龄的压力和困惑', teenText: '爸妈能理解我这个年龄的压力和困惑' },
  { id: 22, dimension: 'understanding', positive: true, parentText: '我会试着从孩子的角度看问题', teenText: '爸妈会试着从我的角度看问题' },
  { id: 23, dimension: 'understanding', positive: false, parentText: '我觉得"我吃的盐比你吃的米多"，所以应该听我的', teenText: '爸妈总觉得他们的经验一定是对的' },
  { id: 24, dimension: 'understanding', positive: true, parentText: '我尊重孩子和我不同的想法', teenText: '爸妈尊重我和他们不同的想法' },
];

// ============= 计算逻辑 =============

export interface DimensionScore {
  key: DimensionKey;
  label: string;
  emoji: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface CommAssessmentResult {
  dimensionScores: DimensionScore[];
  totalScore: number;
  maxTotalScore: number;
  primaryPattern: PatternType;
  secondaryPattern: PatternType | null;
  perspective: Perspective;
}

export function calculateResult(
  answers: Record<number, number>,
  perspective: Perspective
): CommAssessmentResult {
  // 按维度计算得分
  const dimScores: Record<DimensionKey, number> = {
    listening: 0, empathy: 0, boundary: 0,
    expression: 0, conflict: 0, understanding: 0,
  };

  questions.forEach((q) => {
    const raw = answers[q.id] ?? 0;
    const score = q.positive ? raw : (3 - raw); // 反向题反转
    dimScores[q.dimension] += score;
  });

  const dimensionScores: DimensionScore[] = dimensions.map((d) => ({
    key: d.key,
    label: d.label,
    emoji: d.emoji,
    score: dimScores[d.key],
    maxScore: d.maxScore,
    percentage: Math.round((dimScores[d.key] / d.maxScore) * 100),
  }));

  const totalScore = Object.values(dimScores).reduce((a, b) => a + b, 0);
  const maxTotalScore = 72; // 24 * 3

  // 模式识别逻辑
  const pattern = identifyPattern(dimScores);

  return {
    dimensionScores,
    totalScore,
    maxTotalScore,
    primaryPattern: pattern.primary,
    secondaryPattern: pattern.secondary,
    perspective,
  };
}

function identifyPattern(scores: Record<DimensionKey, number>): {
  primary: PatternType;
  secondary: PatternType | null;
} {
  // 每个模式的特征权重打分
  const patternScores: Record<PatternType, number> = {
    controlling: 0, dismissive: 0, anxious: 0, democratic: 0,
  };

  const { listening, empathy, boundary, expression, conflict, understanding } = scores;
  const avg = (listening + empathy + boundary + expression + conflict + understanding) / 6;

  // 控制型：低倾听+低边界+低冲突处理
  patternScores.controlling += (12 - listening) * 1.5 + (12 - boundary) * 1.2 + (12 - conflict) * 1.3 + (12 - expression) * 1.0;
  // 忽视型：低共情+低倾听+低情感回应
  patternScores.dismissive += (12 - empathy) * 1.5 + (12 - listening) * 1.3 + (12 - understanding) * 1.2;
  // 焦虑型：低边界+高情感回应（过度）+低冲突处理
  patternScores.anxious += (12 - boundary) * 1.5 + (12 - conflict) * 1.2 + Math.abs(empathy - 6) * 0.8;
  // 民主型：各维度均高
  patternScores.democratic += listening + empathy + boundary + expression + conflict + understanding;

  // 如果整体得分很高，民主型加权
  if (avg >= 8) patternScores.democratic *= 1.5;

  // 排序
  const sorted = Object.entries(patternScores).sort(([, a], [, b]) => b - a) as [PatternType, number][];

  return {
    primary: sorted[0][0],
    secondary: sorted[1][0] !== sorted[0][0] ? sorted[1][0] : null,
  };
}

// 生成6位邀请码
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
