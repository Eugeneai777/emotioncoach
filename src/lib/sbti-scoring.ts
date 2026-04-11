/**
 * SBTI (Silly Big Personality Test) 评分策略
 * 
 * 15 维度 × 27 种人格类型
 * 匹配逻辑：维度归一化为 H/M/L，通过汉明距离匹配最近的人格模式
 */

import type { QuestionConfig, DimensionConfig, PatternConfig, ScoringResult, DimensionScore } from './scoring-engine';

// H/M/L levels
type Level = 'H' | 'M' | 'L';

// 27 personality type patterns (15 dimensions each: S1 S2 S3 E1 E2 E3 A1 A2 A3 Ac1 Ac2 Ac3 So1 So2 So3)
const SBTI_PATTERNS: Record<string, { pattern: Level[]; label: string; emoji: string; subtitle: string; description: string; traits: string[]; quote: string }> = {
  'CTRL': {
    pattern: ['H','H','H','H','M','H','H','M','H','H','H','H','H','M','H'],
    label: 'CTRL · 拿捏者', emoji: '🎯', subtitle: '全场最佳掌控者',
    description: '你是那种走到哪里都能成为中心的人。不是因为你多吵，而是因为你就是有那种"我来搞定"的气场。',
    traits: ['掌控全局', '自信爆棚', '天生领袖', '效率怪物'],
    quote: '别人在纠结的时候，你已经做完决定并开始执行了。'
  },
  'ATM-er': {
    pattern: ['M','M','H','H','H','L','M','M','H','M','L','M','H','L','M'],
    label: 'ATM-er · 送钱者', emoji: '💸', subtitle: '行走的人形ATM',
    description: '你对朋友比对自己还好，请客吃饭从不手软。不是你钱多，是你觉得感情比钱重要。',
    traits: ['慷慨大方', '重情重义', '社交达人', '有求必应'],
    quote: '钱没了可以再赚，朋友没了就真没了。'
  },
  'Dior-s': {
    pattern: ['L','L','L','M','M','M','L','M','L','L','M','L','M','M','L'],
    label: 'Dior-s · 屌丝', emoji: '🐸', subtitle: '快乐的底层生物',
    description: '你活得很通透——既然卷不过别人，不如躺平享受。你是朋友圈里最会自嘲的人。',
    traits: ['自嘲大师', '乐观主义', '随遇而安', '接地气'],
    quote: '人生已经很难了，何必为难自己。'
  },
  'BOSS': {
    pattern: ['H','H','H','M','M','H','H','H','H','H','H','H','M','H','H'],
    label: 'BOSS · 领导者', emoji: '👔', subtitle: '天生的指挥官',
    description: '你不仅自己强，还能带着一群人往前冲。团队有你在，效率翻倍，信心爆棚。',
    traits: ['决断力强', '责任感爆表', '战略思维', '说一不二'],
    quote: '格局打开，什么都不是问题。'
  },
  'THAN-K': {
    pattern: ['M','H','H','H','M','M','H','M','H','M','M','M','M','M','H'],
    label: 'THAN-K · 感恩者', emoji: '🙏', subtitle: '人间小太阳',
    description: '你总能看到生活中美好的一面，对身边的人充满感恩。你的正能量让人如沐春风。',
    traits: ['心态阳光', '感恩惜福', '温暖治愈', '知足常乐'],
    quote: '感谢每一天的到来，哪怕它不完美。'
  },
  'OH-NO': {
    pattern: ['L','M','M','L','H','L','L','L','M','L','M','L','M','L','M'],
    label: 'OH-NO · 哦不人', emoji: '😱', subtitle: '焦虑本焦',
    description: '你的人生主旋律就是"完了完了完了"。什么事还没发生你就已经开始担心了。',
    traits: ['预言家体质', '极度敏感', '忧患意识', '戏精本精'],
    quote: '还没出事我就已经想好了最坏的结果。'
  },
  'GOGO': {
    pattern: ['H','M','M','M','M','M','H','H','M','H','H','H','H','M','M'],
    label: 'GOGO · 行者', emoji: '🏃', subtitle: '永远在路上',
    description: '你是行动派中的行动派。想到什么立刻去做，哪怕前方是坑，跳了再说。',
    traits: ['说干就干', '闲不住', '探索欲强', '活力无限'],
    quote: '人生苦短，先干了再说！'
  },
  'SEXY': {
    pattern: ['H','H','M','M','H','M','M','H','M','M','M','M','H','M','H'],
    label: 'SEXY · 尤物', emoji: '✨', subtitle: '天生的魅力怪物',
    description: '你身上有种说不清的吸引力，走到哪儿都自带聚光灯。不是刻意的，就是天生的。',
    traits: ['魅力四射', '自信从容', '审美在线', '社交磁铁'],
    quote: '我不是故意吸引注意力的，是注意力自己跑过来的。'
  },
  'LOVE-R': {
    pattern: ['M','M','M','M','H','L','M','L','M','L','M','L','H','L','H'],
    label: 'LOVE-R · 多情者', emoji: '💕', subtitle: '恋爱脑代言人',
    description: '你对感情投入度极高，一旦爱上就全身心扑进去。你的世界里，爱情永远排第一。',
    traits: ['深情款款', '浪漫主义', '感性至上', '容易心动'],
    quote: '我知道恋爱脑不好，但我控制不住啊。'
  },
  'MUM': {
    pattern: ['M','H','H','H','H','M','H','M','H','M','M','M','H','M','M'],
    label: 'MUM · 妈妈', emoji: '🤱', subtitle: '团队里的老母亲',
    description: '你操心所有人的事，朋友有什么问题第一个找你。你就是那个什么都管的人。',
    traits: ['操心命', '照顾他人', '责任感强', '唠叨但暖'],
    quote: '你吃了吗？穿暖了吗？早点睡！'
  },
  'FAKE': {
    pattern: ['M','L','M','M','M','H','M','H','M','M','H','M','H','H','L'],
    label: 'FAKE · 伪人', emoji: '🎭', subtitle: '社交变色龙',
    description: '你在不同场合展现完全不同的自己，切换自如到可怕。但别担心，这也是一种生存智慧。',
    traits: ['见人说人话', '适应力强', '高情商', '保护色重'],
    quote: '不是我虚伪，是社会需要我百变。'
  },
  'OJBK': {
    pattern: ['M','M','M','M','M','M','M','M','M','M','M','M','M','M','M'],
    label: 'OJBK · 无所谓人', emoji: '😐', subtitle: '佛系本佛',
    description: '你对什么都无所谓，不争不抢不焦虑。别人觉得你没追求，你觉得自己活得最通透。',
    traits: ['佛系到底', '心态平和', '不争不抢', '随缘大师'],
    quote: '都行，可以，没关系。'
  },
  'MALO': {
    pattern: ['L','M','L','M','L','M','L','M','L','M','L','M','H','L','M'],
    label: 'MALO · 吗喽', emoji: '🐒', subtitle: '打工人的终极形态',
    description: '你就是那个每天被生活按在地上摩擦但还能爬起来继续干的人。社畜精神，永不磨灭。',
    traits: ['任劳任怨', '生命力顽强', '自嘲减压', '卑微但努力'],
    quote: '吗喽的命也是命！'
  },
  'JOKE-R': {
    pattern: ['M','M','L','L','M','M','L','H','L','M','L','M','H','M','H'],
    label: 'JOKE-R · 小丑', emoji: '🤡', subtitle: '快乐的源泉（别人的）',
    description: '你总是那个制造欢乐的人，用幽默化解一切尴尬。但偶尔，你也想有人来逗你笑。',
    traits: ['气氛担当', '幽默感爆棚', '外向开朗', '内心柔软'],
    quote: '我负责让全世界笑，谁来负责让我笑？'
  },
  'WOC!': {
    pattern: ['M','L','M','L','M','M','L','H','L','H','H','M','M','M','H'],
    label: 'WOC! · 握草人', emoji: '😮', subtitle: '永远在震惊',
    description: '你对世界充满好奇，什么都能让你"卧槽"。你的表情包里使用频率最高的就是震惊脸。',
    traits: ['大惊小怪', '好奇心强', '反应夸张', '真情实感'],
    quote: '卧槽卧槽卧槽！！！'
  },
  'THIN-K': {
    pattern: ['M','H','H','M','M','H','H','M','H','L','H','L','L','H','M'],
    label: 'THIN-K · 思考者', emoji: '🧠', subtitle: '脑子永远在转',
    description: '你是那种上厕所都在想人生哲理的人。别人在刷短视频的时候，你在思考宇宙的意义。',
    traits: ['深度思考', '逻辑怪', '爱分析', '哲学家气质'],
    quote: '这个事情的底层逻辑是什么？'
  },
  'SHIT': {
    pattern: ['M','M','H','L','L','H','L','M','M','M','H','M','L','H','H'],
    label: 'SHIT · 愤世者', emoji: '💢', subtitle: '看什么都不爽',
    description: '你对这个世界有很多不满，觉得到处都是问题。但正因如此，你也在推动改变。',
    traits: ['批判精神', '眼光毒辣', '正义感强', '嘴毒心善'],
    quote: '这世界烂透了，但我还没放弃它。'
  },
  'ZZZZ': {
    pattern: ['L','L','L','M','L','M','L','L','L','L','L','L','L','M','L'],
    label: 'ZZZZ · 装死者', emoji: '😴', subtitle: '人间蒸发专家',
    description: '你的人生信条就是能躺着绝不坐着。对你来说，床和被窝就是全世界。',
    traits: ['躺平大师', '宅家冠军', '低能耗模式', '消息免回'],
    quote: '别找我，我已经社会性死亡了。'
  },
  'POOR': {
    pattern: ['L','M','L','M','M','M','L','L','L','L','M','L','M','M','M'],
    label: 'POOR · 贫困者', emoji: '🪙', subtitle: '月光族的骄傲',
    description: '你不是不会赚钱，你只是花得比赚得快。每个月底都在吃土，但下个月发工资又好了。',
    traits: ['月光达人', '及时行乐', '不善理财', '花钱如流水'],
    quote: '钱是王八蛋，花完咱再赚。'
  },
  'MONK': {
    pattern: ['H','H','H','M','L','H','H','M','H','L','M','L','L','H','M'],
    label: 'MONK · 僧人', emoji: '🧘', subtitle: '出世的智者',
    description: '你已经看透了红尘，对物质欲望很低，追求精神世界的丰富。别人觉得你佛，你觉得自己清醒。',
    traits: ['看透红尘', '精神富足', '低物欲', '内心平静'],
    quote: '放下执念，万般自在。'
  },
  'IMSB': {
    pattern: ['L','L','L','H','M','L','L','L','L','L','L','L','H','L','H'],
    label: 'IMSB · 傻者', emoji: '🤪', subtitle: '快乐的傻瓜',
    description: '你活得简单纯粹，想什么说什么，不懂什么叫心机。有人说你傻，但你活得最开心。',
    traits: ['单纯天真', '没心没肺', '快乐源泉', '傻人有傻福'],
    quote: '想那么多干嘛，开心就完了！'
  },
  'SOLO': {
    pattern: ['M','H','M','L','L','H','M','M','M','M','M','M','L','H','L'],
    label: 'SOLO · 孤儿', emoji: '🌙', subtitle: '独行侠',
    description: '你享受独处，一个人吃饭、看电影、旅行完全不是问题。朋友不多，但每个都是真心的。',
    traits: ['独来独往', '享受孤独', '内心丰富', '社恐但稳'],
    quote: '一个人也可以活得很精彩。'
  },
  'FUCK': {
    pattern: ['H','M','H','L','M','H','L','H','M','H','H','H','M','H','H'],
    label: 'FUCK · 草者', emoji: '🔥', subtitle: '叛逆的灵魂',
    description: '你不按常理出牌，讨厌一切条条框框。你的字典里没有"听话"两个字。',
    traits: ['叛逆不羁', '打破规则', '我行我素', '敢说敢做'],
    quote: '规矩是用来打破的。'
  },
  'DEAD': {
    pattern: ['L','L','L','L','L','M','L','L','L','L','L','L','L','L','L'],
    label: 'DEAD · 死者', emoji: '💀', subtitle: '社会性死亡认证',
    description: '你已经对生活完全佛了，什么都提不起兴趣。但别担心，你只是需要一个重启按钮。',
    traits: ['心如死灰', '无欲无求', '面无表情', '灵魂出窍'],
    quote: '我已经是一具行走的躯壳了。'
  },
  'IMFW': {
    pattern: ['L','L','L','L','M','L','L','L','L','L','L','L','M','L','M'],
    label: 'IMFW · 废物', emoji: '🗑️', subtitle: '自我认知天花板',
    description: '你对自己的评价异常精准——就是个废物。但正因为你知道自己废，你反而活得最坦然。',
    traits: ['自我认知清晰', '坦然接受', '躺平哲学', '废而不丧'],
    quote: '我废我知道，但我废得心安理得。'
  },
  'HHHH': {
    pattern: ['H','H','H','H','H','H','H','H','H','H','H','H','H','H','H'],
    label: 'HHHH · 傻乐者', emoji: '😄', subtitle: '人生赢家（自认为）',
    description: '你觉得自己各方面都挺好的，生活也挺满意。虽然可能有点迷之自信，但快乐就完了。',
    traits: ['盲目乐观', '自我感觉良好', '快乐无忧', '正能量满满'],
    quote: '我觉得我挺好的啊，有什么问题吗？'
  },
  'DRUNK': {
    pattern: ['M','M','M','M','M','M','M','M','M','M','M','M','M','M','M'],
    label: 'DRUNK · 酒鬼', emoji: '🍺', subtitle: '隐藏结局',
    description: '恭喜你触发了隐藏结局！你选择了酒精作为解决方案，虽然不推荐，但至少你很诚实。',
    traits: ['真性情', '借酒消愁', '朋友圈酒鬼', '醉后吐真言'],
    quote: '人生苦短，不如喝酒。（温馨提示：适度饮酒）'
  },
};

// Dimension order for pattern matching
const DIMENSION_ORDER = ['S1','S2','S3','E1','E2','E3','A1','A2','A3','Ac1','Ac2','Ac3','So1','So2','So3'];

function normalizeToLevel(score: number, maxScore: number): Level {
  if (maxScore <= 0) return 'M';
  const ratio = score / maxScore;
  if (ratio > 0.66) return 'H';
  if (ratio >= 0.33) return 'M';
  return 'L';
}

function hammingDistance(a: Level[], b: Level[]): number {
  let dist = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

export function scoreSBTI(
  answers: Record<number, number>,
  questions: QuestionConfig[],
  dimensions: DimensionConfig[],
  patterns: PatternConfig[]
): ScoringResult {
  // 1. Calculate raw dimension scores
  const dimScores: Record<string, { total: number; count: number; maxPerQ: number }> = {};
  dimensions.forEach((d) => {
    dimScores[d.key] = { total: 0, count: 0, maxPerQ: 2 }; // A/B/C → 2/1/0
  });

  // Check for DRUNK trigger (question with dimension "DRUNK_TRIGGER")
  let drunkTriggered = false;

  questions.forEach((q, i) => {
    const ans = answers[i];
    if (ans === undefined) return;
    
    if (q.dimension === 'DRUNK_TRIGGER' || q.factor === 'DRUNK_TRIGGER') {
      if (ans === 0) drunkTriggered = true; // Option C (score=0) triggers DRUNK
      return;
    }
    
    const dimKey = q.factor || q.dimension;
    if (dimScores[dimKey]) {
      dimScores[dimKey].total += ans;
      dimScores[dimKey].count += 1;
    }
  });

  // 2. Build dimension scores array and H/M/L levels
  const userLevels: Level[] = [];
  const dimensionScoreResults: DimensionScore[] = [];

  DIMENSION_ORDER.forEach((key) => {
    const dim = dimensions.find(d => d.key === key);
    const raw = dimScores[key];
    if (!dim || !raw) {
      userLevels.push('M');
      return;
    }
    const maxScore = raw.count * raw.maxPerQ;
    const level = normalizeToLevel(raw.total, maxScore);
    userLevels.push(level);
    dimensionScoreResults.push({
      key,
      score: raw.total,
      maxScore,
      label: dim.label,
      emoji: dim.emoji,
      severity: level,
    });
  });

  // 3. Match personality type
  let matchedKey = 'HHHH'; // fallback
  let minDist = Infinity;

  if (drunkTriggered) {
    matchedKey = 'DRUNK';
  } else {
    for (const [pKey, pData] of Object.entries(SBTI_PATTERNS)) {
      if (pKey === 'DRUNK') continue;
      const dist = hammingDistance(userLevels, pData.pattern);
      if (dist < minDist) {
        minDist = dist;
        matchedKey = pKey;
      }
    }
  }

  const matched = SBTI_PATTERNS[matchedKey];
  const totalScore = dimensionScoreResults.reduce((s, d) => s + d.score, 0);
  const maxScore = dimensionScoreResults.reduce((s, d) => s + d.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 50;

  // Build primaryPattern compatible with existing PatternConfig
  const primaryPattern = {
    label: matched.label,
    emoji: matched.emoji,
    description: matched.description,
    traits: matched.traits,
    tips: [], // No tips for entertainment test
    scoreRange: { min: 0, max: 100 },
  };

  return {
    totalScore,
    maxScore,
    percentage,
    dimensionScores: dimensionScoreResults,
    primaryPattern,
    meta: {
      sbtiType: matchedKey,
      subtitle: matched.subtitle,
      quote: matched.quote,
      userLevels: Object.fromEntries(DIMENSION_ORDER.map((k, i) => [k, userLevels[i]])),
      matchDistance: drunkTriggered ? 0 : minDist,
      isDrunkTrigger: drunkTriggered,
    },
  };
}
