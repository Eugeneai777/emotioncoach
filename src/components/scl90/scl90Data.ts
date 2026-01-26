/**
 * SCL-90 心理健康自评量表
 * 90题标准版 + 10因子定义 + 计分逻辑
 */

// 10个症状因子类型
export type SCL90Factor = 
  | 'somatization'     // 躯体化
  | 'obsessive'        // 强迫
  | 'interpersonal'    // 人际敏感
  | 'depression'       // 抑郁
  | 'anxiety'          // 焦虑
  | 'hostility'        // 敌对
  | 'phobic'           // 恐怖
  | 'paranoid'         // 偏执
  | 'psychoticism'     // 精神病性
  | 'other';           // 其他

// 严重程度等级
export type SeverityLevel = 'normal' | 'mild' | 'moderate' | 'severe';

// 题目结构
export interface SCL90Question {
  id: number;
  text: string;
  factor: SCL90Factor;
}

// 测评结果
export interface SCL90Result {
  factorScores: Record<SCL90Factor, number>;
  totalScore: number;
  positiveCount: number;
  positiveScoreAvg: number;
  gsi: number;
  severityLevel: SeverityLevel;
  primarySymptom: SCL90Factor | null;
  secondarySymptom: SCL90Factor | null;
}

// 因子信息配置
export const scl90FactorInfo: Record<SCL90Factor, {
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  questionIds: number[];
  description: string;
  normalRange: string;
}> = {
  somatization: {
    name: '躯体化',
    emoji: '🫀',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-500',
    questionIds: [1, 4, 12, 27, 40, 42, 48, 49, 52, 53, 56, 58],
    description: '身体不适感，如头痛、胸闷、肌肉酸痛等',
    normalRange: '1.0-1.5'
  },
  obsessive: {
    name: '强迫症状',
    emoji: '🔄',
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-500',
    questionIds: [3, 9, 10, 28, 38, 45, 46, 51, 55, 65],
    description: '反复检查、无法摆脱的想法或行为',
    normalRange: '1.0-1.6'
  },
  interpersonal: {
    name: '人际敏感',
    emoji: '👥',
    color: 'from-pink-500 to-rose-400',
    bgColor: 'bg-pink-500',
    questionIds: [6, 21, 34, 36, 37, 41, 61, 69, 73],
    description: '自卑、过分在意他人评价',
    normalRange: '1.0-1.6'
  },
  depression: {
    name: '抑郁',
    emoji: '😢',
    color: 'from-blue-600 to-indigo-500',
    bgColor: 'bg-blue-600',
    questionIds: [5, 14, 15, 20, 22, 26, 29, 30, 31, 32, 54, 71, 79],
    description: '情绪低落、兴趣减退、悲观绝望',
    normalRange: '1.0-1.5'
  },
  anxiety: {
    name: '焦虑',
    emoji: '😰',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-500',
    questionIds: [2, 17, 23, 33, 39, 57, 72, 78, 80, 86],
    description: '紧张、担忧、恐惧、坐立不安',
    normalRange: '1.0-1.4'
  },
  hostility: {
    name: '敌对',
    emoji: '😤',
    color: 'from-red-600 to-red-500',
    bgColor: 'bg-red-600',
    questionIds: [11, 24, 63, 67, 74, 81],
    description: '易怒、冲动、摔东西、争吵',
    normalRange: '1.0-1.5'
  },
  phobic: {
    name: '恐怖',
    emoji: '😨',
    color: 'from-purple-600 to-violet-500',
    bgColor: 'bg-purple-600',
    questionIds: [13, 25, 47, 50, 70, 75, 82],
    description: '对特定事物或场所的害怕回避',
    normalRange: '1.0-1.3'
  },
  paranoid: {
    name: '偏执',
    emoji: '🤔',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-500',
    questionIds: [8, 18, 43, 68, 76, 83],
    description: '多疑、被害感、关系妄想',
    normalRange: '1.0-1.4'
  },
  psychoticism: {
    name: '精神病性',
    emoji: '🌀',
    color: 'from-slate-600 to-gray-500',
    bgColor: 'bg-slate-600',
    questionIds: [7, 16, 35, 62, 77, 84, 85, 87, 88, 90],
    description: '思维控制感、幻觉、社交退缩',
    normalRange: '1.0-1.3'
  },
  other: {
    name: '其他',
    emoji: '💤',
    color: 'from-gray-500 to-slate-400',
    bgColor: 'bg-gray-500',
    questionIds: [19, 44, 59, 60, 64, 66, 89],
    description: '睡眠、饮食等问题',
    normalRange: '1.0-1.5'
  }
};

// 评分选项
export const scl90ScoreLabels = [
  { value: 1, label: '没有', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 2, label: '很轻', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 3, label: '中等', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 4, label: '偏重', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 5, label: '严重', color: 'bg-red-100 text-red-700 border-red-300' },
];

// 严重程度配置
export const severityConfig: Record<SeverityLevel, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
}> = {
  normal: {
    label: '心理状态良好',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
    description: '您的心理健康状况整体良好，继续保持积极的生活方式。'
  },
  mild: {
    label: '轻度心理困扰',
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    description: '您可能存在一些轻微的心理困扰，建议关注自我调节。'
  },
  moderate: {
    label: '中度心理困扰',
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-600',
    description: '建议您寻求心理咨询或与信任的人倾诉。'
  },
  severe: {
    label: '需要专业关注',
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-500',
    textColor: 'text-red-600',
    description: '强烈建议您尽快寻求专业心理咨询或医疗帮助。'
  }
};

// 90题题库（标准SCL-90中文版）
const questionsData: Array<{ id: number; factor: SCL90Factor; text: string }> = [
  // 躯体化因子 (12题)
  { id: 1, factor: 'somatization' as const, text: '头痛' },
  { id: 4, factor: 'somatization' as const, text: '头昏或昏倒' },
  { id: 12, factor: 'somatization' as const, text: '胸痛' },
  { id: 27, factor: 'somatization' as const, text: '腰痛' },
  { id: 40, factor: 'somatization' as const, text: '恶心或胃部不舒服' },
  { id: 42, factor: 'somatization' as const, text: '肌肉酸痛' },
  { id: 48, factor: 'somatization' as const, text: '呼吸有困难' },
  { id: 49, factor: 'somatization' as const, text: '一阵阵发冷或发热' },
  { id: 52, factor: 'somatization' as const, text: '身体发麻或刺痛' },
  { id: 53, factor: 'somatization' as const, text: '喉咙有梗塞感' },
  { id: 56, factor: 'somatization' as const, text: '感到身体的某一部分软弱无力' },
  { id: 58, factor: 'somatization' as const, text: '感到手脚发重' },
  
  // 强迫症状因子 (10题)
  { id: 3, factor: 'obsessive' as const, text: '头脑中有不必要的想法或字句盘旋' },
  { id: 9, factor: 'obsessive' as const, text: '忘记性大' },
  { id: 10, factor: 'obsessive' as const, text: '担心自己的衣饰整齐及仪态的端正' },
  { id: 28, factor: 'obsessive' as const, text: '感到难以完成任务' },
  { id: 38, factor: 'obsessive' as const, text: '做事必须做得很慢以保证做得正确' },
  { id: 45, factor: 'obsessive' as const, text: '必须反复洗手、点数' },
  { id: 46, factor: 'obsessive' as const, text: '做事必须反复检查' },
  { id: 51, factor: 'obsessive' as const, text: '脑子变空了' },
  { id: 55, factor: 'obsessive' as const, text: '难以做出决定' },
  { id: 65, factor: 'obsessive' as const, text: '必须反复做某些动作如摸、数' },
  
  // 人际敏感因子 (9题)
  { id: 6, factor: 'interpersonal' as const, text: '对旁人责备求全' },
  { id: 21, factor: 'interpersonal' as const, text: '同异性相处时感到害羞不自在' },
  { id: 34, factor: 'interpersonal' as const, text: '感情容易受到伤害' },
  { id: 36, factor: 'interpersonal' as const, text: '感到别人不理解您、不同情您' },
  { id: 37, factor: 'interpersonal' as const, text: '感到人们对您不友好，不喜欢您' },
  { id: 41, factor: 'interpersonal' as const, text: '感到比不上他人' },
  { id: 61, factor: 'interpersonal' as const, text: '当别人看着您或谈论您时感到不自在' },
  { id: 69, factor: 'interpersonal' as const, text: '在人群中感到不自在' },
  { id: 73, factor: 'interpersonal' as const, text: '在公共场合吃东西感到不自在' },
  
  // 抑郁因子 (13题)
  { id: 5, factor: 'depression' as const, text: '对异性的兴趣减退' },
  { id: 14, factor: 'depression' as const, text: '感到精力不足，活动减慢' },
  { id: 15, factor: 'depression' as const, text: '想结束自己的生命' },
  { id: 20, factor: 'depression' as const, text: '容易哭泣' },
  { id: 22, factor: 'depression' as const, text: '感到受骗、中了圈套或有人想抓您' },
  { id: 26, factor: 'depression' as const, text: '为一些事自己责备自己' },
  { id: 29, factor: 'depression' as const, text: '感到孤独' },
  { id: 30, factor: 'depression' as const, text: '感到苦闷' },
  { id: 31, factor: 'depression' as const, text: '过分担忧' },
  { id: 32, factor: 'depression' as const, text: '对事物不感兴趣' },
  { id: 54, factor: 'depression' as const, text: '感到前途没有希望' },
  { id: 71, factor: 'depression' as const, text: '感到一切都很费力' },
  { id: 79, factor: 'depression' as const, text: '感到自己没有什么价值' },
  
  // 焦虑因子 (10题)
  { id: 2, factor: 'anxiety' as const, text: '神经过敏，心中不踏实' },
  { id: 17, factor: 'anxiety' as const, text: '颤抖' },
  { id: 23, factor: 'anxiety' as const, text: '无缘无故地突然感到害怕' },
  { id: 33, factor: 'anxiety' as const, text: '感到害怕' },
  { id: 39, factor: 'anxiety' as const, text: '心跳得很厉害' },
  { id: 57, factor: 'anxiety' as const, text: '感到紧张或容易紧张' },
  { id: 72, factor: 'anxiety' as const, text: '一阵阵恐惧或惊恐' },
  { id: 78, factor: 'anxiety' as const, text: '坐立不安心神不定' },
  { id: 80, factor: 'anxiety' as const, text: '有会发生可怕事情的感觉' },
  { id: 86, factor: 'anxiety' as const, text: '令人害怕的想法和影象' },
  
  // 敌对因子 (6题)
  { id: 11, factor: 'hostility' as const, text: '容易烦恼和激动' },
  { id: 24, factor: 'hostility' as const, text: '忍不住要发脾气' },
  { id: 63, factor: 'hostility' as const, text: '有想打人或伤害他人的冲动' },
  { id: 67, factor: 'hostility' as const, text: '有想摔坏或破坏东西的想法' },
  { id: 74, factor: 'hostility' as const, text: '经常与人争论' },
  { id: 81, factor: 'hostility' as const, text: '大叫或摔东西' },
  
  // 恐怖因子 (7题)
  { id: 13, factor: 'phobic' as const, text: '害怕空旷的场所或街道' },
  { id: 25, factor: 'phobic' as const, text: '怕出门' },
  { id: 47, factor: 'phobic' as const, text: '乘电车、公共汽车、地铁感到害怕' },
  { id: 50, factor: 'phobic' as const, text: '因为感到害怕而避开某些事物、场合或活动' },
  { id: 70, factor: 'phobic' as const, text: '在商店或电影院感到不自在' },
  { id: 75, factor: 'phobic' as const, text: '单独一人时神经很紧张' },
  { id: 82, factor: 'phobic' as const, text: '害怕会在公共场合昏倒' },
  
  // 偏执因子 (6题)
  { id: 8, factor: 'paranoid' as const, text: '怪罪别人制造麻烦' },
  { id: 18, factor: 'paranoid' as const, text: '感到大多数人都不可信任' },
  { id: 43, factor: 'paranoid' as const, text: '感到别人在监视您、谈论您' },
  { id: 68, factor: 'paranoid' as const, text: '有一些别人没有的想法' },
  { id: 76, factor: 'paranoid' as const, text: '别人对您的成绩没有作出恰当的评价' },
  { id: 83, factor: 'paranoid' as const, text: '感到别人想占您的便宜' },
  
  // 精神病性因子 (10题)
  { id: 7, factor: 'psychoticism' as const, text: '感到别人能控制您的思想' },
  { id: 16, factor: 'psychoticism' as const, text: '听到旁人听不到的声音' },
  { id: 35, factor: 'psychoticism' as const, text: '感到别人能知道您的私下想法' },
  { id: 62, factor: 'psychoticism' as const, text: '脑子里出现不属于您自己的想法' },
  { id: 77, factor: 'psychoticism' as const, text: '即使和别人在一起也感到孤独' },
  { id: 84, factor: 'psychoticism' as const, text: '有关性方面使您很苦恼的想法' },
  { id: 85, factor: 'psychoticism' as const, text: '您应该因为自己的过错而受到惩罚的想法' },
  { id: 87, factor: 'psychoticism' as const, text: '您的身体有严重问题的想法' },
  { id: 88, factor: 'psychoticism' as const, text: '从未感到和另一个人很亲近' },
  { id: 90, factor: 'psychoticism' as const, text: '感到自己的脑子有毛病' },
  
  // 其他因子 (7题)
  { id: 19, factor: 'other' as const, text: '胃口不好' },
  { id: 44, factor: 'other' as const, text: '睡得不稳不深' },
  { id: 59, factor: 'other' as const, text: '想到死亡的事' },
  { id: 60, factor: 'other' as const, text: '吃得太多' },
  { id: 64, factor: 'other' as const, text: '醒得太早' },
  { id: 66, factor: 'other' as const, text: '睡眠不好' },
  { id: 89, factor: 'other' as const, text: '感到内疚' },
];

// 按题号排序导出
export const scl90Questions: SCL90Question[] = questionsData.sort((a, b) => a.id - b.id);

/**
 * 计算 SCL-90 测评结果
 */
export function calculateSCL90Result(answers: Record<number, number>): SCL90Result {
  // 1. 计算各因子均分
  const factorScores: Record<SCL90Factor, number> = {} as Record<SCL90Factor, number>;
  
  for (const [factor, info] of Object.entries(scl90FactorInfo)) {
    const ids = info.questionIds;
    const sum = ids.reduce((acc, id) => acc + (answers[id] || 1), 0);
    factorScores[factor as SCL90Factor] = Number((sum / ids.length).toFixed(2));
  }
  
  // 2. 计算总体指标
  const allScores = Object.values(answers);
  const totalScore = allScores.reduce((a, b) => a + b, 0);
  const gsi = Number((totalScore / 90).toFixed(2));
  
  // 3. 阳性项目（≥2分）
  const positiveItems = allScores.filter(s => s >= 2);
  const positiveCount = positiveItems.length;
  const positiveScoreAvg = positiveCount > 0 
    ? Number((positiveItems.reduce((a, b) => a + b, 0) / positiveCount).toFixed(2))
    : 0;
  
  // 4. 判断严重程度（综合GSI和阳性项目数）
  let severityLevel: SeverityLevel;
  if (totalScore < 160 && positiveCount < 43) {
    severityLevel = 'normal';
  } else if (gsi < 2.0) {
    severityLevel = 'mild';
  } else if (gsi < 3.0) {
    severityLevel = 'moderate';
  } else {
    severityLevel = 'severe';
  }
  
  // 5. 找出主要/次要症状因子（排除 'other'，得分 ≥2.0）
  const sortedFactors = Object.entries(factorScores)
    .filter(([f]) => f !== 'other')
    .sort(([,a], [,b]) => b - a);
  
  const primarySymptom = sortedFactors[0]?.[1] >= 2.0 
    ? sortedFactors[0][0] as SCL90Factor 
    : null;
  const secondarySymptom = sortedFactors[1]?.[1] >= 2.0 
    ? sortedFactors[1][0] as SCL90Factor 
    : null;
  
  return {
    factorScores,
    totalScore,
    positiveCount,
    positiveScoreAvg,
    gsi,
    severityLevel,
    primarySymptom,
    secondarySymptom
  };
}

/**
 * 获取因子等级描述
 */
export function getFactorLevel(score: number): {
  level: string;
  color: string;
} {
  if (score < 1.5) return { level: '正常', color: 'text-green-600' };
  if (score < 2.0) return { level: '偏高', color: 'text-yellow-600' };
  if (score < 3.0) return { level: '较高', color: 'text-orange-600' };
  return { level: '很高', color: 'text-red-600' };
}
