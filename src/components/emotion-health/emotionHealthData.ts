// 情绪健康测评 - 题库、评分逻辑和类型定义

// ===== 类型定义 =====
export type IndexType = 'energy' | 'anxiety' | 'stress';
export type PatternType = 'exhaustion' | 'tension' | 'suppression' | 'avoidance';
export type BlockedDimension = 'action' | 'emotion' | 'belief' | 'giving';

export interface EmotionHealthQuestion {
  id: number;
  text: string;
  indexType: IndexType;
  patternType: PatternType;
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

// ===== 评分选项 =====
export const emotionHealthScoreLabels = [
  { value: 0, label: '几乎没有', color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' },
  { value: 1, label: '有时如此', color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' },
  { value: 2, label: '经常如此', color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' },
  { value: 3, label: '几乎每天', color: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700' },
];

// ===== 25题题库 =====
export const emotionHealthQuestions: EmotionHealthQuestion[] = [
  // ===== 情绪能量指数 E（对标 PHQ-9 简化）=====
  { id: 1, text: "最近两周，我对很多事提不起兴趣", indexType: 'energy', patternType: 'exhaustion' },
  { id: 2, text: "即使休息了，也很难感觉恢复", indexType: 'energy', patternType: 'exhaustion' },
  { id: 3, text: "常觉得自己没什么动力开始新事", indexType: 'energy', patternType: 'avoidance' },
  { id: 4, text: "对未来常有无力或悲观感", indexType: 'energy', patternType: 'suppression' },

  // ===== 焦虑张力指数 A（对标 GAD-7 简化）=====
  { id: 5, text: "我常提前担心可能出问题的情况", indexType: 'anxiety', patternType: 'tension' },
  { id: 6, text: "即使没事发生，也很难真正放松", indexType: 'anxiety', patternType: 'tension' },
  { id: 7, text: "脑子经常停不下来在想事情", indexType: 'anxiety', patternType: 'tension' },
  { id: 8, text: "因为担心失败而迟迟不开始", indexType: 'anxiety', patternType: 'avoidance' },

  // ===== 压力负载指数 S（对标 PSS 简化）=====
  { id: 9, text: "最近责任或任务让我感觉被压着走", indexType: 'stress', patternType: 'exhaustion' },
  { id: 10, text: "常觉得事情太多，顾不过来", indexType: 'stress', patternType: 'exhaustion' },
  { id: 11, text: "即使很努力，也觉得不够好", indexType: 'stress', patternType: 'suppression' },
  { id: 12, text: "感觉自己必须撑住，不能倒", indexType: 'stress', patternType: 'tension' },

  // ===== 能量耗竭型 C =====
  { id: 13, text: "我习惯先满足别人的需要再顾自己", indexType: 'stress', patternType: 'exhaustion' },
  { id: 14, text: "即使很累，也很难真正停下来休息", indexType: 'energy', patternType: 'exhaustion' },
  { id: 15, text: "我常忽略身体发出的不适信号", indexType: 'stress', patternType: 'exhaustion' },

  // ===== 高度紧绷型 T =====
  { id: 16, text: "我对结果和细节有很强控制欲", indexType: 'anxiety', patternType: 'tension' },
  { id: 17, text: "出现问题时，我会先怪自己没做好", indexType: 'anxiety', patternType: 'tension' },
  { id: 18, text: "即使没人在催，我也会给自己很大压力", indexType: 'stress', patternType: 'tension' },

  // ===== 情绪压抑型 R =====
  { id: 19, text: "不开心时，我更倾向自己消化", indexType: 'energy', patternType: 'suppression' },
  { id: 20, text: "我不太习惯表达真实不满", indexType: 'stress', patternType: 'suppression' },
  { id: 21, text: "为了关系和谐，我常压下真实感受", indexType: 'anxiety', patternType: 'suppression' },

  // ===== 逃避延迟型 P =====
  { id: 22, text: "事情越重要，我越容易拖延", indexType: 'anxiety', patternType: 'avoidance' },
  { id: 23, text: "面对压力，我会转去做别的事逃离", indexType: 'stress', patternType: 'avoidance' },
  { id: 24, text: "常因为没行动而自责，却还是动不起来", indexType: 'energy', patternType: 'avoidance' },
  { id: 25, text: "一想到开始就觉得心理负担很重", indexType: 'anxiety', patternType: 'avoidance' },
];

// ===== 四大反应模式配置 =====
export const patternConfig: Record<PatternType, {
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  tagline: string;
  description: string;
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
}> = {
  action: {
    name: '行动启动',
    description: '你的系统还在等待一个"绝对安全"的信号才敢开始，但这个信号可能永远不会来。我们需要帮你的大脑重新学会：不完美地开始，也是可以的。'
  },
  emotion: {
    name: '情绪稳定',
    description: '你的情绪系统已经超载了，但你可能还在硬撑。在做任何改变之前，先让情绪有个出口，才能真正轻装上阵。'
  },
  belief: {
    name: '自我价值',
    description: '你对自己的要求太高，却很少真正肯定自己。这种"永远不够好"的感觉，会持续消耗你的能量和动力。'
  },
  giving: {
    name: '能量补给',
    description: '你一直在付出，却很少给自己真正的滋养。如果不先修复能量系统，任何改变都会很快耗尽。'
  }
};

// ===== 评分计算逻辑 =====
export function calculateEmotionHealthResult(answers: Record<number, number>): EmotionHealthResult {
  // 1. 计算三大指数（0-100标准化）
  const indexQuestions = {
    energy: [1, 2, 3, 4, 14, 19, 24],
    anxiety: [5, 6, 7, 8, 16, 17, 21, 22, 25],
    stress: [9, 10, 11, 12, 13, 15, 18, 20, 23]
  };
  
  const calcIndex = (ids: number[]) => {
    const sum = ids.reduce((acc, id) => acc + (answers[id] ?? 0), 0);
    return Math.round((sum / (ids.length * 3)) * 100);
  };
  
  const energyIndex = calcIndex(indexQuestions.energy);
  const anxietyIndex = calcIndex(indexQuestions.anxiety);
  const stressIndex = calcIndex(indexQuestions.stress);
  
  // 2. 计算四大模式得分
  const patternQuestions = {
    exhaustion: [1, 2, 9, 10, 13, 14, 15],
    tension: [5, 6, 7, 12, 16, 17, 18],
    suppression: [4, 11, 19, 20, 21],
    avoidance: [3, 8, 22, 23, 24, 25]
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
  
  // 4. 推荐路径（决策树）
  const { blockedDimension, recommendedPath } = getRecommendedPath(
    primaryPattern, 
    energyIndex, 
    anxietyIndex, 
    stressIndex
  );
  
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

function getRecommendedPath(
  pattern: PatternType, 
  energy: number, 
  anxiety: number, 
  stress: number
): { blockedDimension: BlockedDimension; recommendedPath: string } {
  if (pattern === 'exhaustion') {
    if (stress >= 70 || energy >= 70) {
      return { blockedDimension: 'giving', recommendedPath: '情绪修复AI + 能量恢复营' };
    }
  }
  if (pattern === 'tension') {
    if (anxiety >= 70) {
      return { blockedDimension: 'action', recommendedPath: '焦虑释放AI + 行动启动营' };
    }
  }
  if (pattern === 'suppression') {
    if (stress >= 60 || energy >= 60) {
      return { blockedDimension: 'emotion', recommendedPath: '情绪表达AI + 关系修复营' };
    }
  }
  if (pattern === 'avoidance') {
    if (anxiety >= 60 || energy >= 60) {
      return { blockedDimension: 'action', recommendedPath: '行动教练AI + 执行力营' };
    }
  }
  
  // 默认
  return { blockedDimension: 'emotion', recommendedPath: '情绪教练AI + 情绪日记营' };
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
