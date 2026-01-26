// 情绪健康测评 - 三层诊断系统
// 第一层：状态筛查（12题）  第二层：反应模式（16题）  第三层：行动阻滞（4题）

// ===== 类型定义 =====
export type QuestionLayer = 'screening' | 'pattern' | 'blockage';
export type IndexType = 'energy' | 'anxiety' | 'stress';
export type PatternType = 'exhaustion' | 'tension' | 'suppression' | 'avoidance';
export type BlockedDimension = 'action' | 'emotion' | 'belief' | 'giving';

export interface EmotionHealthQuestion {
  id: number;
  layer: QuestionLayer;
  text: string;
  indexType?: IndexType;      // 第一层用
  patternType?: PatternType;  // 第二层用
  blockageType?: BlockedDimension; // 第三层用
}

export interface EmotionHealthResult {
  energyIndex: number;
  anxietyIndex: number;
  stressIndex: number;
  exhaustionScore: number;
  tensionScore: number;
  suppressionScore: number;
  avoidanceScore: number;
  primaryPattern: PatternType;
  secondaryPattern: PatternType | null;
  blockedDimension: BlockedDimension;
  recommendedPath: string;
}

// ===== 层级配置 =====
export const layerConfig = {
  screening: {
    name: '状态筛查',
    description: '科学背书层',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    questions: { start: 1, end: 12 }
  },
  pattern: {
    name: '反应模式',
    description: '卡点诊断层',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    questions: { start: 13, end: 28 }
  },
  blockage: {
    name: '行动阻滞',
    description: '转化承接层',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    questions: { start: 29, end: 32 }
  }
};

// ===== 层间过渡配置 =====
export const layerTransitionConfig = {
  'screening-pattern': {
    emoji: '✅',
    text: '状态扫描完成',
    subtext: '接下来，我们来识别你的情绪自动反应模式',
    color: 'from-blue-500 to-purple-500'
  },
  'pattern-blockage': {
    emoji: '🎯',
    text: '反应模式已识别',
    subtext: '最后，让我们找到你当前最需要突破的阻滞点',
    color: 'from-purple-500 to-rose-500'
  }
};

// ===== 评分选项 =====
export const emotionHealthScoreLabels = [
  { value: 0, label: '几乎没有', color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' },
  { value: 1, label: '有时如此', color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' },
  { value: 2, label: '经常如此', color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' },
  { value: 3, label: '几乎每天', color: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700' },
];

// ===== 32题题库 =====
export const emotionHealthQuestions: EmotionHealthQuestion[] = [
  // ========== 第一层：状态筛查（12题）==========
  // === 情绪能量指数 E（对标 PHQ-9 简化）4题 ===
  { id: 1, layer: 'screening', text: "最近两周，我对很多事情提不起兴趣", indexType: 'energy' },
  { id: 2, layer: 'screening', text: "即使休息了，也很难感觉真正恢复过来", indexType: 'energy' },
  { id: 3, layer: 'screening', text: "常常觉得自己没什么动力开始新的事情", indexType: 'energy' },
  { id: 4, layer: 'screening', text: "对未来常有一种无力感或淡淡的悲观", indexType: 'energy' },
  
  // === 焦虑张力指数 A（对标 GAD-7 简化）4题 ===
  { id: 5, layer: 'screening', text: "我常提前担心可能出问题的情况", indexType: 'anxiety' },
  { id: 6, layer: 'screening', text: "即使什么事都没发生，也很难真正放松", indexType: 'anxiety' },
  { id: 7, layer: 'screening', text: "脑子经常停不下来，一直在想各种事情", indexType: 'anxiety' },
  { id: 8, layer: 'screening', text: "因为担心失败或做不好，迟迟不敢开始", indexType: 'anxiety' },
  
  // === 压力负载指数 S（对标 PSS-10 简化）4题 ===
  { id: 9, layer: 'screening', text: "最近的责任或任务让我感觉被压着走", indexType: 'stress' },
  { id: 10, layer: 'screening', text: "常觉得事情太多，自己顾不过来", indexType: 'stress' },
  { id: 11, layer: 'screening', text: "即使很努力了，也觉得自己做得不够好", indexType: 'stress' },
  { id: 12, layer: 'screening', text: "感觉自己必须撑住，绝对不能倒下", indexType: 'stress' },

  // ========== 第二层：反应模式（16题，每类4题）==========
  // === 能量耗竭型 C（宝妈/护理者/管理者画像）===
  { id: 13, layer: 'pattern', text: "遇到压力我通常会继续硬撑，很少主动休息", patternType: 'exhaustion' },
  { id: 14, layer: 'pattern', text: "我习惯先满足别人的需要，再顾自己", patternType: 'exhaustion' },
  { id: 15, layer: 'pattern', text: "即使身体已经发出不适信号，我也会选择忽略", patternType: 'exhaustion' },
  { id: 16, layer: 'pattern', text: "我很久没有真正为自己做一件放松的事了", patternType: 'exhaustion' },
  
  // === 高度紧绷型 T（职场骨干/完美主义画像）===
  { id: 17, layer: 'pattern', text: "我对结果和细节有很强的控制欲", patternType: 'tension' },
  { id: 18, layer: 'pattern', text: "出现问题时，我会先怪自己没做好", patternType: 'tension' },
  { id: 19, layer: 'pattern', text: "即使没人在催，我也会给自己很大压力", patternType: 'tension' },
  { id: 20, layer: 'pattern', text: "我很难真正放松，即使在休息也在想事情", patternType: 'tension' },
  
  // === 情绪压抑型 R（关系型人格画像）===
  { id: 21, layer: 'pattern', text: "不开心时，我更倾向自己消化，不说出来", patternType: 'suppression' },
  { id: 22, layer: 'pattern', text: "为了关系和谐，我常压下自己真实的感受", patternType: 'suppression' },
  { id: 23, layer: 'pattern', text: "我不太习惯表达真实的不满或需要", patternType: 'suppression' },
  { id: 24, layer: 'pattern', text: "偶尔会突然情绪爆发，或者出现身体不适", patternType: 'suppression' },
  
  // === 逃避延迟型 P（自由职业/学生画像）===
  { id: 25, layer: 'pattern', text: "事情越重要，我越容易拖延不去做", patternType: 'avoidance' },
  { id: 26, layer: 'pattern', text: "面对压力，我会转去做别的事情来逃离", patternType: 'avoidance' },
  { id: 27, layer: 'pattern', text: "我常因为没有行动而自责，却还是动不起来", patternType: 'avoidance' },
  { id: 28, layer: 'pattern', text: "一想到要开始，就觉得心理负担很重", patternType: 'avoidance' },

  // ========== 第三层：行动阻滞点（4题）==========
  { id: 29, layer: 'blockage', text: "你是否知道该做什么，但就是启动不了？", blockageType: 'action' },
  { id: 30, layer: 'blockage', text: "你的情绪是否经常会淹没你，让你难以思考？", blockageType: 'emotion' },
  { id: 31, layer: 'blockage', text: "你是否经常觉得自己不够好，或不值得？", blockageType: 'belief' },
  { id: 32, layer: 'blockage', text: "你是否长期只在消耗能量，很少被滋养？", blockageType: 'giving' },
];

// ===== 科学背书数据 =====
export const scientificStats = [
  { stat: '60%', description: '全球约60%人存在未被识别的情绪健康问题', source: 'WHO 2023' },
  { stat: '80%', description: '80%情绪困扰源于自动化反应模式', source: '心理学研究' },
  { stat: '3层', description: '表面症状→反应模式→根本阻滞', source: '行为科学' },
];

// ===== 核心痛点共鸣 =====
export const painPoints = [
  { emoji: '😔', text: '明明没什么大事，就是提不起劲' },
  { emoji: '🤯', text: '道理都懂，但就是做不到' },
  { emoji: '🌊', text: '情绪一来就被淹没，事后又后悔' },
  { emoji: '😮‍💨', text: '总觉得很累，但又说不清哪里累' },
];

// ===== 四大反应模式配置 =====
export const patternConfig: Record<PatternType, {
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  tagline: string;
  description: string;
  targetAudience: string;
  symptoms: string[];
  mechanism: string;
  need: string;
  aiOpening: string;
  recommendedCoach: string;
  recommendedCamp: string;
  firstStepTitle: string;
  firstStepDescription: string;
}> = {
  exhaustion: {
    name: '能量耗竭型',
    emoji: '🔋',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    tagline: '长期在撑，已经很久没有真正被补充过能量',
    description: '你不是不努力，而是已经很久没有真正被补充过能量了。',
    targetAudience: '宝妈 / 护理者 / 管理者',
    symptoms: [
      '每天都在应付事情，很少有"恢复感"',
      '对原本在乎的事提不起劲',
      '明明没做很多事，却总是很累',
      '常把"再坚持一下"当成习惯'
    ],
    mechanism: '你习惯把责任放在第一位，却不断推迟照顾自己的时间。身体和情绪已经在提醒你：不是再努力一点，而是需要先恢复。',
    need: '恢复安全感、找回身体节律、重新感受到被支持',
    aiOpening: '我看到你现在处在比较明显的"能量透支"状态。这通常不是因为你不努力，而是因为你已经撑了很久。在继续往前之前，我想先确认一件事：最近让你最累的，是哪一件事或哪一种角色？',
    recommendedCoach: 'emotion_recovery',
    recommendedCamp: 'emotion',
    firstStepTitle: '3分钟能量回收',
    firstStepDescription: '闭上眼睛，把注意力放在呼吸上。深吸一口气，感受气息进入身体；缓缓呼出，感受肩膀慢慢放松。重复10次，不需要任何思考。'
  },
  tension: {
    name: '高度紧绷型',
    emoji: '🎯',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    tagline: '一直在顶，几乎不给自己犯错的空间',
    description: '你对自己要求很高，但也几乎不给自己犯错的空间。',
    targetAudience: '职场骨干 / 完美主义者',
    symptoms: [
      '做事前反复预演最坏结果',
      '很难真正放松，即使在休息也在想事',
      '对他人不放心，习惯自己扛',
      '害怕一旦松懈就会出问题'
    ],
    mechanism: '你把安全感建立在"我必须控制住一切"上，但长期紧绷会让大脑一直处在警报状态，反而更容易疲惫、失控和自责。',
    need: '从"控制"转向"信任"，练习放下过度预期，允许事情不完美',
    aiOpening: '你的测评显示，你现在很可能一直处在"必须撑住"的状态。很多人会以为这是责任感强，其实这对大脑是极大的负担。最近有没有一件事，让你特别不敢出错？',
    recommendedCoach: 'anxiety_release',
    recommendedCamp: 'emotion',
    firstStepTitle: '放松实验',
    firstStepDescription: '今天选一件不那么重要的小事，允许它只做到70分，而不是完美。观察一下，世界会因此崩塌吗？你的焦虑有变化吗？'
  },
  suppression: {
    name: '情绪压抑型',
    emoji: '🤐',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    tagline: '习惯忍，很少给自己添麻烦',
    description: '你很少给自己添麻烦，却常常在心里一个人消化所有情绪。',
    targetAudience: '关系型人格 / 照顾者',
    symptoms: [
      '不太习惯表达真实不满',
      '更容易照顾别人感受',
      '情绪常常憋在心里',
      '偶尔会突然情绪爆发或身体不适'
    ],
    mechanism: '你学会了"体贴"和"懂事"，却慢慢失去了为自己争取空间的能力。被压下去的情绪不会消失，只会转成内耗。',
    need: '学会安全地表达自己，识别真实感受，建立边界感',
    aiOpening: '从你的结果来看，你很习惯把情绪留给自己消化。你可能不想给别人添麻烦，但这其实会让你很辛苦。最近有没有一件事，让你其实挺委屈，却没说出口？',
    recommendedCoach: 'emotion_expression',
    recommendedCamp: 'emotion',
    firstStepTitle: '情绪命名练习',
    firstStepDescription: '用这句话补全："当___发生时，我其实很___。" 你可以先只对自己说，或者写在笔记里。说出来，是释放的第一步。'
  },
  avoidance: {
    name: '逃避延迟型',
    emoji: '🐢',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    tagline: '卡在开始，每次一想到要开始就先被情绪拖住',
    description: '你不是没能力，而是每次一想到要开始就先被情绪拖住了。',
    targetAudience: '自由职业者 / 学生',
    symptoms: [
      '事情越重要越容易拖延',
      '常用刷手机、忙别的事逃离压力',
      '对自己不行动很自责',
      '但又不知道怎么启动'
    ],
    mechanism: '你的大脑把"开始"误判成了威胁，于是本能选择回避来保护自己。拖延其实是情绪系统在接管行为系统。',
    need: '降低启动门槛，把任务拆到极小，重建行动成功感',
    aiOpening: '你的结果显示，你并不是不想行动，而是每次一想到要开始，情绪就先卡住你。最近有没有一件你一直拖着却又很在意的事？',
    recommendedCoach: 'action_coach',
    recommendedCamp: 'emotion',
    firstStepTitle: '5分钟微启动',
    firstStepDescription: '选一件你一直拖着的事，现在只做5分钟内能完成的最小步骤。比如：打开文件、写一句话、发一条信息。完成后，告诉自己"我已经开始了"。'
  }
};

// ===== 卡住维度配置 =====
export const blockedDimensionConfig: Record<BlockedDimension, {
  name: string;
  description: string;
  recommendedCoach: string;
  recommendedCamp: string;
}> = {
  action: {
    name: '行动启动',
    description: '你的系统还在等待一个"绝对安全"的信号才敢开始，但这个信号可能永远不会来。我们需要帮你的大脑重新学会：不完美地开始，也是可以的。',
    recommendedCoach: '行动教练AI',
    recommendedCamp: '执行力训练营'
  },
  emotion: {
    name: '情绪稳定',
    description: '你的情绪系统已经超载了，但你可能还在硬撑。在做任何改变之前，先让情绪有个出口，才能真正轻装上阵。',
    recommendedCoach: '情绪教练AI',
    recommendedCamp: '情绪日记训练营'
  },
  belief: {
    name: '自我价值',
    description: '你对自己的要求太高，却很少真正肯定自己。这种"永远不够好"的感觉，会持续消耗你的能量和动力。',
    recommendedCoach: '自我价值重建AI',
    recommendedCamp: '信念重塑训练营'
  },
  giving: {
    name: '能量补给',
    description: '你一直在付出，却很少给自己真正的滋养。如果不先修复能量系统，任何改变都会很快耗尽。',
    recommendedCoach: '能量恢复AI',
    recommendedCamp: '能量滋养训练营'
  }
};

// ===== 评分计算逻辑 =====
export function calculateEmotionHealthResult(answers: Record<number, number>): EmotionHealthResult {
  // 1. 计算三大指数（0-100标准化）- 第一层 12 题
  const indexQuestions = {
    energy: [1, 2, 3, 4],
    anxiety: [5, 6, 7, 8],
    stress: [9, 10, 11, 12]
  };
  
  const calcIndex = (ids: number[]) => {
    const sum = ids.reduce((acc, id) => acc + (answers[id] ?? 0), 0);
    return Math.round((sum / (ids.length * 3)) * 100);
  };
  
  const energyIndex = calcIndex(indexQuestions.energy);
  const anxietyIndex = calcIndex(indexQuestions.anxiety);
  const stressIndex = calcIndex(indexQuestions.stress);
  
  // 2. 计算四大模式得分 - 第二层 16 题
  const patternQuestions = {
    exhaustion: [13, 14, 15, 16],
    tension: [17, 18, 19, 20],
    suppression: [21, 22, 23, 24],
    avoidance: [25, 26, 27, 28]
  };
  
  const calcPattern = (ids: number[]) => 
    ids.reduce((acc, id) => acc + (answers[id] ?? 0), 0);
  
  const exhaustionScore = calcPattern(patternQuestions.exhaustion);
  const tensionScore = calcPattern(patternQuestions.tension);
  const suppressionScore = calcPattern(patternQuestions.suppression);
  const avoidanceScore = calcPattern(patternQuestions.avoidance);
  
  // 3. 判定主副模式
  const scores: Array<{ type: PatternType; score: number }> = [
    { type: 'exhaustion' as PatternType, score: exhaustionScore },
    { type: 'tension' as PatternType, score: tensionScore },
    { type: 'suppression' as PatternType, score: suppressionScore },
    { type: 'avoidance' as PatternType, score: avoidanceScore }
  ].sort((a, b) => b.score - a.score);
  
  const primaryPattern = scores[0].type;
  const secondaryPattern = scores[1].score > 0 ? scores[1].type : null;
  
  // 4. 第三层：直接投票机制 - 4 题分别对应 4 个维度
  const blockageQuestions = {
    action: 29,
    emotion: 30,
    belief: 31,
    giving: 32
  };
  
  const blockageScores: Array<{ type: BlockedDimension; score: number }> = [
    { type: 'action' as BlockedDimension, score: answers[blockageQuestions.action] ?? 0 },
    { type: 'emotion' as BlockedDimension, score: answers[blockageQuestions.emotion] ?? 0 },
    { type: 'belief' as BlockedDimension, score: answers[blockageQuestions.belief] ?? 0 },
    { type: 'giving' as BlockedDimension, score: answers[blockageQuestions.giving] ?? 0 }
  ].sort((a, b) => b.score - a.score);
  
  const blockedDimension = blockageScores[0].type;
  
  // 5. 生成推荐路径
  const config = blockedDimensionConfig[blockedDimension];
  const recommendedPath = `${config.recommendedCoach} + ${config.recommendedCamp}`;
  
  return {
    energyIndex,
    anxietyIndex,
    stressIndex,
    exhaustionScore,
    tensionScore,
    suppressionScore,
    avoidanceScore,
    primaryPattern,
    secondaryPattern,
    blockedDimension,
    recommendedPath
  };
}

// ===== 工具函数 =====
export function getQuestionLayer(questionId: number): QuestionLayer {
  if (questionId >= 1 && questionId <= 12) return 'screening';
  if (questionId >= 13 && questionId <= 28) return 'pattern';
  return 'blockage';
}

export function getLayerProgress(currentQuestionId: number): {
  currentLayer: QuestionLayer;
  layerIndex: number;
  isLayerTransition: boolean;
  transitionKey?: 'screening-pattern' | 'pattern-blockage';
} {
  const layer = getQuestionLayer(currentQuestionId);
  const layerIndex = layer === 'screening' ? 1 : layer === 'pattern' ? 2 : 3;
  
  // 检查是否是层间过渡点
  let isLayerTransition = false;
  let transitionKey: 'screening-pattern' | 'pattern-blockage' | undefined;
  
  if (currentQuestionId === 13) {
    isLayerTransition = true;
    transitionKey = 'screening-pattern';
  } else if (currentQuestionId === 29) {
    isLayerTransition = true;
    transitionKey = 'pattern-blockage';
  }
  
  return { currentLayer: layer, layerIndex, isLayerTransition, transitionKey };
}

// ===== 指数等级判断 =====
export function getIndexLevel(value: number): 'low' | 'medium' | 'high' {
  if (value < 40) return 'low';
  if (value < 70) return 'medium';
  return 'high';
}

export function getIndexLevelLabel(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low': return '良好';
    case 'medium': return '中等';
    case 'high': return '偏高';
  }
}

export function getIndexLevelColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low': return 'text-emerald-600 dark:text-emerald-400';
    case 'medium': return 'text-amber-600 dark:text-amber-400';
    case 'high': return 'text-rose-600 dark:text-rose-400';
  }
}

export function getIndexBarColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low': return 'bg-emerald-500';
    case 'medium': return 'bg-amber-500';
    case 'high': return 'bg-rose-500';
  }
}

// ===== 评分机制说明配置 =====
export const scoringMechanismConfig = {
  layer1: {
    name: '指数型评分',
    type: '连续值 0-100',
    icon: '📊',
    dimensions: ['情绪能量', '焦虑张力', '压力负载'],
    usage: ['报告可视化', '趋势追踪']
  },
  layer2: {
    name: '模式型评分',
    type: '分类',
    icon: '🧩',
    output: '主模式 + 副模式',
    description: '每题绑定一个反应模式，统计后得分最高为主模式，第二高为副模式',
    usage: ['人格化报告', '故事型文案']
  },
  layer3: {
    name: '路径推荐',
    type: '决策树',
    icon: '🎯',
    logic: '模式类型 + 最弱维度',
    output: '自动匹配AI教练 + 训练营',
    usage: ['商业转化发动机']
  }
};

// ===== AI教练联动示例 =====
export const aiCoachOpeningExamples = [
  {
    pattern: '高度紧绷 + 行动卡住',
    state: '【高度紧绷 + 行动卡住】',
    message: '我看到你现在处在【高度紧绷 + 行动卡住】的状态，这通常意味着你对自己要求很高，但身体和情绪已经在发出求救信号。\n\n我想先陪你看看：\n最近一周，哪件事让你最累？'
  },
  {
    pattern: '能量耗竭 + 情绪阻滞',
    state: '【能量耗竭 + 情绪阻滞】',
    message: '我看到你现在处在【能量耗竭 + 情绪阻滞】的状态，这意味着你已经付出了很多，但很少有机会真正被滋养和照顾。\n\n在继续往前之前，我想先问你：\n最近什么时候真正为自己做过一件事？'
  },
  {
    pattern: '情绪压抑 + 信念阻滞',
    state: '【情绪压抑 + 信念阻滞】',
    message: '我看到你现在处在【情绪压抑 + 信念阻滞】的状态，这通常意味着你习惯把感受留给自己消化，也很少觉得自己足够好。\n\n最近有没有一件事，让你其实挺委屈，却没说出口？'
  }
];

// ===== 与传统量表对比 =====
export const comparisonWithTraditional = [
  { traditional: '只输出分数', ours: '输出人格化故事', oursHighlight: true },
  { traditional: '结果孤立', ours: '连接AI教练对话', oursHighlight: true },
  { traditional: '静态诊断', ours: '动态路径推荐', oursHighlight: true },
  { traditional: '看完就完', ours: '开启持续陪伴', oursHighlight: true }
];
