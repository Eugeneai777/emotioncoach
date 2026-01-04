// 题目数据
export const questions = [
  // 行为层（1-10）
  { id: 1, layer: "behavior" as const, text: "我经常不自觉地抱怨赚钱难、环境差、机会少" },
  { id: 2, layer: "behavior" as const, text: "我习惯先看到问题，而不是可能性" },
  { id: 3, layer: "behavior" as const, text: "我对财务数字（收入、支出、资产）不太愿意主动了解" },
  { id: 4, layer: "behavior" as const, text: "我时常拖延那些可能带来财富的行动（如学习理财、投资、开拓副业）" },
  { id: 5, layer: "behavior" as const, text: "我不太敢开口谈钱（谈薪资、报价、收费）" },
  { id: 6, layer: "behavior" as const, text: "当有机会出现时，我往往犹豫不决，错失时机" },
  { id: 7, layer: "behavior" as const, text: "我经常买一些当时看着便宜但其实用不上的东西" },
  { id: 8, layer: "behavior" as const, text: "我习惯性地把钱看得太紧或太松，很少在中间态度" },
  { id: 9, layer: "behavior" as const, text: "我会因为怕麻烦而放弃一些可以带来额外收入的事" },
  { id: 10, layer: "behavior" as const, text: "面对财务决策时，我容易冲动消费或完全逃避" },
  // 情绪层（11-20）
  { id: 11, layer: "emotion" as const, text: "一想到钱，我就会感到紧张、焦虑或压力" },
  { id: 12, layer: "emotion" as const, text: "我害怕失去已有的财富，经常担心哪天没了怎么办" },
  { id: 13, layer: "emotion" as const, text: "如果别人赚得比我多，我会感到嫉妒或自卑" },
  { id: 14, layer: "emotion" as const, text: "我觉得谈钱是件很俗气或让人不舒服的事" },
  { id: 15, layer: "emotion" as const, text: "我对于自己能否真正实现财务自由，内心是怀疑的" },
  { id: 16, layer: "emotion" as const, text: "当我花钱买自己喜欢的东西时，会感到内疚" },
  { id: 17, layer: "emotion" as const, text: "面对风险投资或理财决策，我通常会感到恐惧和不安" },
  { id: 18, layer: "emotion" as const, text: "我觉得别人成功是因为运气，而我没那么幸运" },
  { id: 19, layer: "emotion" as const, text: "我讨厌跟人因为钱产生任何冲突或不愉快" },
  { id: 20, layer: "emotion" as const, text: "在财务问题上，我时常感到无力和无望" },
  // 信念层（21-30）
  { id: 21, layer: "belief" as const, text: "我觉得有钱人大多不是什么好人" },
  { id: 22, layer: "belief" as const, text: "我相信钱多了会让人变坏或者惹麻烦" },
  { id: 23, layer: "belief" as const, text: "我觉得自己不配拥有很多钱" },
  { id: 24, layer: "belief" as const, text: "我相信赚钱一定要很辛苦才行" },
  { id: 25, layer: "belief" as const, text: "我觉得追求财富是一件自私或羞耻的事" },
  { id: 26, layer: "belief" as const, text: "我内心深处觉得我们家注定不可能太有钱" },
  { id: 27, layer: "belief" as const, text: "我觉得我不够聪明/不够有能力，赚大钱不适合我" },
  { id: 28, layer: "belief" as const, text: "我相信金钱会破坏亲情、友情、爱情" },
  { id: 29, layer: "belief" as const, text: "我觉得即使努力了，也很难改变自己的财务状况" },
  { id: 30, layer: "belief" as const, text: "我认为够用就好，追求更多是贪心" },
];

export const scoreLabels = [
  { value: 1, label: "非常不符合" },
  { value: 2, label: "不太符合" },
  { value: 3, label: "一般" },
  { value: 4, label: "比较符合" },
  { value: 5, label: "非常符合" },
];

export type BlockLayer = "behavior" | "emotion" | "belief";
export type ReactionPattern = "harmony" | "chase" | "avoid" | "trauma";

export interface AssessmentResult {
  behaviorScore: number;
  emotionScore: number;
  beliefScore: number;
  dominantBlock: BlockLayer;
  reactionPattern: ReactionPattern;
}

export const blockInfo = {
  behavior: {
    name: "行为层卡点",
    color: "from-blue-500 to-cyan-500",
    emoji: "🎯",
    description: "你的财富卡点主要表现在行为层面",
    detail: "你的财富阻碍主要体现在日常行为习惯上。可能表现为：习惯性抱怨、缺乏行动力、看不到机会或缺乏格局。这些行为模式往往是自动化的，需要有意识地觉察和调整。",
    suggestions: [
      "每天记录3件财富机会，训练发现机会的眼睛",
      "设定一个小额投资或储蓄目标，立即行动",
      "用感恩替代抱怨，重塑语言习惯",
      "学习一项可以增加收入的新技能"
    ]
  },
  emotion: {
    name: "情绪层卡点",
    color: "from-pink-500 to-rose-500",
    emoji: "💗",
    description: "你的财富卡点藏在情绪深处",
    detail: "你对金钱有着复杂的情绪反应。可能是焦虑（总担心钱不够）、恐惧（害怕失去或冒险）、控制欲（过度紧抓或回避）。这些情绪往往源于过去的经历，影响着你与金钱的关系。",
    suggestions: [
      "每次花钱时觉察自己的情绪，不评判地观察",
      "写下你最早关于金钱的3个记忆",
      "练习对金钱说：我可以拥有你",
      "建立一个安心账户，定期存入小额资金"
    ]
  },
  belief: {
    name: "信念层卡点",
    color: "from-purple-500 to-violet-500",
    emoji: "🧠",
    description: "你的财富卡点根植于深层信念",
    detail: "你内心深处有着关于金钱的限制性信念。可能是我不配有钱、钱是万恶之源、有钱人都不好等。这些信念往往来自原生家庭或早期经历，需要被觉察和重塑。",
    suggestions: [
      "列出你从小听到的关于钱的话，识别限制性信念",
      "找到3个你敬佩的、财富与品格兼备的榜样",
      "每天对自己说：我值得拥有丰盛",
      "重新定义金钱：金钱是能量，是帮助他人的工具"
    ]
  }
};

export const patternInfo = {
  harmony: {
    name: "和谐型",
    emoji: "☯️",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "你与金钱的关系相对健康和谐，三层卡点都较轻。继续保持觉察，可以追求更高层次的财富意识。"
  },
  chase: {
    name: "追逐型",
    emoji: "🏃",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    description: "你对金钱有强烈的追逐欲望，可能表现为过度工作、急于求成。需要学会放松与金钱的关系，相信丰盛会自然流向你。"
  },
  avoid: {
    name: "逃避型",
    emoji: "🙈",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    description: "你倾向于回避与金钱相关的事务和话题。这种回避可能让你错失机会。需要温和地面对金钱话题，一步步建立信心。"
  },
  trauma: {
    name: "创伤型",
    emoji: "💔",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    description: "你可能有与金钱相关的创伤经历，导致深层的恐惧或焦虑。建议寻求专业支持，温柔地疗愈与金钱的关系。"
  }
};

export const calculateResult = (answers: Record<number, number>): AssessmentResult => {
  let behaviorScore = 0;
  let emotionScore = 0;
  let beliefScore = 0;

  questions.forEach(q => {
    const score = answers[q.id] || 0;
    if (q.layer === 'behavior') behaviorScore += score;
    else if (q.layer === 'emotion') emotionScore += score;
    else beliefScore += score;
  });

  // 判断主导卡点
  const scores = [
    { layer: 'behavior' as const, score: behaviorScore },
    { layer: 'emotion' as const, score: emotionScore },
    { layer: 'belief' as const, score: beliefScore },
  ];
  
  scores.sort((a, b) => b.score - a.score);
  
  // 如果差值<=5，选择更深层
  let dominantBlock = scores[0].layer;
  if (scores[0].score - scores[1].score <= 5) {
    // 深层优先：belief > emotion > behavior
    const depthOrder = ['belief', 'emotion', 'behavior'];
    const topTwo = [scores[0].layer, scores[1].layer];
    for (const layer of depthOrder) {
      if (topTwo.includes(layer as BlockLayer)) {
        dominantBlock = layer as BlockLayer;
        break;
      }
    }
  }

  // 判断财富反应模式
  const avgScore = (behaviorScore + emotionScore + beliefScore) / 30;
  let reactionPattern: ReactionPattern;
  
  if (avgScore < 2.5) {
    reactionPattern = 'harmony';
  } else if (avgScore >= 4) {
    reactionPattern = 'trauma';
  } else {
    // 根据行为层特征判断
    const behaviorAvg = behaviorScore / 10;
    if (behaviorAvg >= 3.5) {
      reactionPattern = 'chase';
    } else if (emotionScore / 10 >= 3.5) {
      reactionPattern = 'avoid';
    } else {
      reactionPattern = 'chase';
    }
  }

  return {
    behaviorScore,
    emotionScore,
    beliefScore,
    dominantBlock,
    reactionPattern
  };
};

export const getLayerTitle = (layer: string) => {
  switch (layer) {
    case 'behavior': return '行为层';
    case 'emotion': return '情绪层';
    case 'belief': return '信念层';
    default: return '';
  }
};
