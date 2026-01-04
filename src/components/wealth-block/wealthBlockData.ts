// 四穷类型
export type FourPoorType = "mouth" | "hand" | "eye" | "heart";

// 情绪卡点类型
export type EmotionBlockType = "anxiety" | "scarcity" | "comparison" | "shame" | "guilt";

// 信念卡点类型
export type BeliefBlockType = "lack" | "linear" | "stigma" | "unworthy" | "relationship";

// 题目数据 - 行为层按四穷分类，情绪层和信念层按各自卡点分类
export const questions = [
  // 嘴穷（1-3）- 诅咒式表达
  { id: 1, layer: "behavior" as const, fourPoor: "mouth" as FourPoorType, text: "我经常不自觉地抱怨赚钱难、机会少、环境差" },
  { id: 2, layer: "behavior" as const, fourPoor: "mouth" as FourPoorType, text: "我习惯用否定性语言描述财务状况（如'我没钱'、'买不起'）" },
  { id: 3, layer: "behavior" as const, fourPoor: "mouth" as FourPoorType, text: "我很少对他人说鼓励祝福的话（如'太棒了'、'我相信你'）" },
  
  // 手穷（4-5）- 乞丐心态
  { id: 4, layer: "behavior" as const, fourPoor: "hand" as FourPoorType, text: "我很少主动请客、送礼物或帮助他人" },
  { id: 5, layer: "behavior" as const, fourPoor: "hand" as FourPoorType, text: "花钱时我总觉得是在损失，而非给予或交换价值" },
  
  // 眼穷（6-8）- 狭隘视角
  { id: 6, layer: "behavior" as const, fourPoor: "eye" as FourPoorType, text: "我很难看到他人的付出和价值（如家人支持、伴侣努力）" },
  { id: 7, layer: "behavior" as const, fourPoor: "eye" as FourPoorType, text: "我总是盯着问题和不足，而不是机会和美好" },
  { id: 8, layer: "behavior" as const, fourPoor: "eye" as FourPoorType, text: "我习惯控制他人，很少真心认可别人的贡献" },
  
  // 心穷（9-10）- 受害者思维
  { id: 9, layer: "behavior" as const, fourPoor: "heart" as FourPoorType, text: "遇到问题我第一反应是找别人的原因，觉得自己是受害者" },
  { id: 10, layer: "behavior" as const, fourPoor: "heart" as FourPoorType, text: "我很难对客户、家人、世界充满无条件的爱与祝福" },
  
  // 情绪层（11-20）- 5大情绪卡点
  { id: 11, layer: "emotion" as const, emotionBlock: "anxiety" as EmotionBlockType, text: "一想到钱，我就会感到紧张、焦虑或压力" },
  { id: 12, layer: "emotion" as const, emotionBlock: "scarcity" as EmotionBlockType, text: "我害怕失去已有的财富，经常担心哪天没了怎么办" },
  { id: 13, layer: "emotion" as const, emotionBlock: "comparison" as EmotionBlockType, text: "如果别人赚得比我多，我会感到嫉妒或自卑" },
  { id: 14, layer: "emotion" as const, emotionBlock: "shame" as EmotionBlockType, text: "我觉得谈钱是件很俗气或让人不舒服的事" },
  { id: 15, layer: "emotion" as const, emotionBlock: "guilt" as EmotionBlockType, text: "我对于自己能否真正实现财务自由，内心是怀疑的" },
  { id: 16, layer: "emotion" as const, emotionBlock: "guilt" as EmotionBlockType, text: "当我花钱买自己喜欢的东西时，会感到内疚" },
  { id: 17, layer: "emotion" as const, emotionBlock: "anxiety" as EmotionBlockType, text: "面对风险投资或理财决策，我通常会感到恐惧和不安" },
  { id: 18, layer: "emotion" as const, emotionBlock: "comparison" as EmotionBlockType, text: "我觉得别人成功是因为运气，而我没那么幸运" },
  { id: 19, layer: "emotion" as const, emotionBlock: "shame" as EmotionBlockType, text: "我讨厌跟人因为钱产生任何冲突或不愉快" },
  { id: 20, layer: "emotion" as const, emotionBlock: "scarcity" as EmotionBlockType, text: "在财务问题上，我时常感到无力和无望" },
  
  // 信念层（21-30）- 5大信念卡点
  { id: 21, layer: "belief" as const, beliefBlock: "stigma" as BeliefBlockType, text: "我觉得有钱人大多不是什么好人" },
  { id: 22, layer: "belief" as const, beliefBlock: "stigma" as BeliefBlockType, text: "我相信钱多了会让人变坏或者惹麻烦" },
  { id: 23, layer: "belief" as const, beliefBlock: "unworthy" as BeliefBlockType, text: "我觉得自己不配拥有很多钱" },
  { id: 24, layer: "belief" as const, beliefBlock: "linear" as BeliefBlockType, text: "我相信赚钱一定要很辛苦才行" },
  { id: 25, layer: "belief" as const, beliefBlock: "unworthy" as BeliefBlockType, text: "我觉得追求财富是一件自私或羞耻的事" },
  { id: 26, layer: "belief" as const, beliefBlock: "lack" as BeliefBlockType, text: "我内心深处觉得我们家注定不可能太有钱" },
  { id: 27, layer: "belief" as const, beliefBlock: "lack" as BeliefBlockType, text: "我觉得我不够聪明/不够有能力，赚大钱不适合我" },
  { id: 28, layer: "belief" as const, beliefBlock: "relationship" as BeliefBlockType, text: "我相信金钱会破坏亲情、友情、爱情" },
  { id: 29, layer: "belief" as const, beliefBlock: "relationship" as BeliefBlockType, text: "我觉得即使努力了，也很难改变自己的财务状况" },
  { id: 30, layer: "belief" as const, beliefBlock: "linear" as BeliefBlockType, text: "我认为够用就好，追求更多是贪心" },
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
  // 四穷得分
  mouthScore: number;
  handScore: number;
  eyeScore: number;
  heartScore: number;
  // 情绪卡点得分
  anxietyScore: number;
  scarcityScore: number;
  comparisonScore: number;
  shameScore: number;
  guiltScore: number;
  // 信念卡点得分
  lackScore: number;
  linearScore: number;
  stigmaScore: number;
  unworthyScore: number;
  relationshipScore: number;
  // 主导卡点
  dominantBlock: BlockLayer;
  dominantPoor: FourPoorType;
  dominantEmotionBlock: EmotionBlockType;
  dominantBeliefBlock: BeliefBlockType;
  reactionPattern: ReactionPattern;
}

// 四穷信息
export const fourPoorInfo = {
  mouth: {
    name: "嘴穷",
    emoji: "👄",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500",
    description: "诅咒式表达模式",
    detail: "你习惯用否定、抱怨的语言描述财务状况，经常说'我没钱'、'赚钱太难了'。这种语言模式会形成自我实现的预言，让财富远离你。",
    solution: "破除'诅咒式表达'，改用情感型正向语言（如'太棒了！''我相信你'），用积极话语吸引希望与能量。",
    suggestions: [
      "每天对自己说3句财富肯定语",
      "用'我正在变得富有'替代'我没钱'",
      "对他人多说鼓励和祝福的话",
      "记录每天说的积极话语"
    ]
  },
  hand: {
    name: "手穷",
    emoji: "✋",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500",
    description: "乞丐心态模式",
    detail: "你更倾向于获取而非付出，花钱时感到损失和心疼。这种匮乏感会形成'乞丐心态'，让你难以吸引财富。",
    solution: "拒绝'乞丐心态'，践行'舍即是得'理念：主动给予（物质/情感），因'我有'而分享，远离'匮乏感'圈层。",
    suggestions: [
      "每周主动请客或送小礼物一次",
      "花钱时心中默念'我在创造价值交换'",
      "建立'给予账户'，专门用于帮助他人",
      "体验'舍即是得'的丰盛感"
    ]
  },
  eye: {
    name: "眼穷",
    emoji: "👁️",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500",
    description: "狭隘视角模式",
    detail: "你习惯盯着问题和不足，很难看到他人的付出和价值。这种狭隘视角让你'目中无人'，难以建立互利关系。",
    solution: "放下控制欲与狭隘视角，看见他人价值与世界美好（如认可伴侣付出），破除'目中无人'的封闭状态。",
    suggestions: [
      "每天记录3件感恩的事",
      "主动表扬和认可身边人的付出",
      "遇事先看机会，再看问题",
      "练习欣赏他人的优点和成就"
    ]
  },
  heart: {
    name: "心穷",
    emoji: "💔",
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-rose-500",
    description: "受害者思维模式",
    detail: "你常感到被动、抱怨命运不公，遇到问题第一反应是归咎他人。这种受害者思维让你心中充满怨气，难以吸引正能量。",
    solution: "摒弃'受害者思维'，停止归咎他人，以'心中有光有爱'替代抱怨，修炼无条件和平、祝福、欢喜的心态。",
    suggestions: [
      "遇事先问'我能做什么'而非'谁该负责'",
      "每天发送3条祝福给他人",
      "练习无条件的爱与接纳",
      "将抱怨转化为感恩和行动"
    ]
  }
};

// 情绪卡点信息
export const emotionBlockInfo: Record<EmotionBlockType, {
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
  detail: string;
  solution: string;
  suggestions: string[];
}> = {
  anxiety: {
    name: "金钱焦虑",
    emoji: "😰",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-500",
    description: "想到钱就紧张，投资决策恐惧",
    detail: "你对金钱有强烈的焦虑反应，这种焦虑可能源于对未知的恐惧或过去的财务创伤。焦虑会让你逃避财务决策，错失机会。",
    solution: "建立「安全感账户」，用固定储蓄缓解焦虑",
    suggestions: [
      "每天做5分钟金钱冥想",
      "建立3-6个月的应急储蓄",
      "把大决策拆分成小步骤",
      "学习基础理财知识减少未知恐惧"
    ]
  },
  scarcity: {
    name: "匮乏恐惧",
    emoji: "😨",
    color: "from-gray-600 to-gray-800",
    bgColor: "bg-gray-600",
    description: "害怕失去，总觉得不够用",
    detail: "你内心深处有强烈的匮乏感，总担心钱会用光。这种恐惧让你过度节俭，无法享受当下，也阻碍了合理的投资。",
    solution: "记录「丰盛日记」，每天写3件财务上的好事",
    suggestions: [
      "列出你已经拥有的10项资源",
      "设定「快乐消费」预算",
      "练习对自己说「我已足够」",
      "关注你已获得的而非失去的"
    ]
  },
  comparison: {
    name: "比较自卑",
    emoji: "😔",
    color: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-500",
    description: "嫉妒他人成功，归因于运气",
    detail: "你容易与他人比较，看到别人成功会感到自卑和嫉妒。这种心态让你无法欣赏自己的进步，也阻碍了向成功者学习。",
    solution: "把嫉妒转化为学习动力，问「他是怎么做到的」",
    suggestions: [
      "写下3个你欣赏的成功者的品质",
      "记录你这个月的3个财务进步",
      "主动向比你成功的人请教",
      "庆祝他人成功，相信丰盛是无限的"
    ]
  },
  shame: {
    name: "羞耻厌恶",
    emoji: "😳",
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-rose-500",
    description: "觉得谈钱俗气，回避财务话题",
    detail: "你对金钱话题感到羞耻或厌恶，认为谈钱是俗气的表现。这种态度让你无法正视财务问题，也错失了很多学习机会。",
    solution: "认识到金钱是中性工具，谈论它是成熟的表现",
    suggestions: [
      "和信任的朋友聊一次财务话题",
      "写下「金钱是___」的10个正面定义",
      "阅读一本财商书籍",
      "参加一次理财交流活动"
    ]
  },
  guilt: {
    name: "消费内疚",
    emoji: "😣",
    color: "from-teal-500 to-green-500",
    bgColor: "bg-teal-500",
    description: "花钱就内疚，怀疑自己的决策",
    detail: "你在消费时容易产生内疚感，总是怀疑自己的财务决策。这种内疚让你无法享受劳动成果，也影响了正常的生活品质。",
    solution: "设立「无愧消费基金」，允许自己无负担地享受",
    suggestions: [
      "每月留出5%收入作为「快乐基金」",
      "消费后写下这笔钱带来的价值",
      "练习对自己说「我值得拥有美好」",
      "区分需要和想要，做有意识的选择"
    ]
  }
};

// 信念卡点信息
export const beliefBlockInfo: Record<BeliefBlockType, {
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
  detail: string;
  coreBeliefs: string[];
  solution: string;
  suggestions: string[];
}> = {
  lack: {
    name: "匮乏感",
    emoji: "🕳️",
    color: "from-stone-600 to-stone-800",
    bgColor: "bg-stone-600",
    description: "认为「花了就没了」，守财奴心态",
    detail: "你内心深处相信资源是有限的，花掉就真的没有了。这种匮乏感让你过度保守，无法进行必要的投资和消费。",
    coreBeliefs: ["我们家注定不会有钱", "我不够有能力赚钱"],
    solution: "从「我没有」转向「我正在创造」",
    suggestions: [
      "每天写下3个你创造价值的时刻",
      "研究一个白手起家的成功案例",
      "设定一个30天的收入增长小目标",
      "练习说「我可以创造我想要的」"
    ]
  },
  linear: {
    name: "线性思维",
    emoji: "📏",
    color: "from-blue-600 to-blue-800",
    bgColor: "bg-blue-600",
    description: "只靠体力赚钱，忽视杠杆价值",
    detail: "你相信只有辛苦工作才能赚钱，忽视了被动收入和杠杆的力量。这种思维限制了你的收入上限。",
    coreBeliefs: ["必须辛苦才能赚钱", "钱够用就好"],
    solution: "学习「让钱为你工作」的思维方式",
    suggestions: [
      "学习一种被动收入的方式",
      "列出5种不用自己时间赚钱的方法",
      "阅读《富爸爸穷爸爸》",
      "思考如何用杠杆放大你的价值"
    ]
  },
  stigma: {
    name: "金钱污名",
    emoji: "🚫",
    color: "from-red-600 to-red-800",
    bgColor: "bg-red-600",
    description: "觉得有钱人不好，钱会惹麻烦",
    detail: "你对金钱和有钱人有负面看法，认为钱是万恶之源。这种污名化让你潜意识里排斥财富。",
    coreBeliefs: ["有钱人大多不是好人", "钱会带来麻烦"],
    solution: "找到正面使用金钱的榜样",
    suggestions: [
      "列出5个用钱做好事的例子",
      "采访一位你尊敬的有钱人",
      "思考：如果有很多钱，你会做什么好事？",
      "了解慈善家的故事"
    ]
  },
  unworthy: {
    name: "不配得感",
    emoji: "🚷",
    color: "from-violet-600 to-violet-800",
    bgColor: "bg-violet-600",
    description: "觉得自己不配有钱",
    detail: "你内心深处不相信自己值得拥有财富，可能觉得追求财富是可耻的。这种不配得感会无意识地破坏你的财富积累。",
    coreBeliefs: ["我不配拥有很多钱", "追求财富是可耻的"],
    solution: "重建自我价值感，认可自己的贡献",
    suggestions: [
      "每天写下3件你做得好的事",
      "列出你为他人创造的价值",
      "练习接受赞美和礼物",
对自己说「我值得拥有丰盛」
    ]
  },
  relationship: {
    name: "关系恐惧",
    emoji: "💔",
    color: "from-pink-600 to-pink-800",
    bgColor: "bg-pink-600",
    description: "担心金钱破坏关系",
    detail: "你害怕有钱会改变人际关系，或者不相信努力能带来回报。这种恐惧让你不敢全力追求财富。",
    coreBeliefs: ["有钱会破坏关系", "努力也不一定成功"],
    solution: "学习如何用财富增进关系而非破坏",
    suggestions: [
      "列出5个钱能改善关系的方式",
      "和家人讨论财富对家庭的正面意义",
      "记录努力带来回报的小例子",
      "学习健康的金钱边界"
    ]
  }
};

export const blockInfo = {
  behavior: {
    name: "行为层卡点",
    color: "from-amber-500 to-orange-500",
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
    detail: "财富的本质是心理能量的流动。财富卡住=心理能量阻塞（如恐惧、匮乏、控制欲）。你对金钱有着复杂的情绪反应，可能是焦虑、恐惧、内疚或羞耻。这些情绪往往源于过去的经历，影响着你与金钱的关系。",
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
    detail: "离苦得乐的关键：直面内在障碍，让「爱与智慧」替代「焦虑与评判」，使财富随能量流动自然显化。你内心深处有着关于金钱的限制性信念，可能是匮乏感、线性思维或不配得感。这些信念往往来自原生家庭或早期经历，需要被觉察和重塑。",
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
  
  // 四穷得分
  let mouthScore = 0;
  let handScore = 0;
  let eyeScore = 0;
  let heartScore = 0;
  
  // 情绪卡点得分
  let anxietyScore = 0;
  let scarcityScore = 0;
  let comparisonScore = 0;
  let shameScore = 0;
  let guiltScore = 0;
  
  // 信念卡点得分
  let lackScore = 0;
  let linearScore = 0;
  let stigmaScore = 0;
  let unworthyScore = 0;
  let relationshipScore = 0;

  questions.forEach(q => {
    const score = answers[q.id] || 0;
    
    if (q.layer === 'behavior') {
      behaviorScore += score;
      const fourPoor = (q as { fourPoor?: FourPoorType }).fourPoor;
      if (fourPoor === 'mouth') mouthScore += score;
      else if (fourPoor === 'hand') handScore += score;
      else if (fourPoor === 'eye') eyeScore += score;
      else if (fourPoor === 'heart') heartScore += score;
    } else if (q.layer === 'emotion') {
      emotionScore += score;
      const emotionBlock = (q as { emotionBlock?: EmotionBlockType }).emotionBlock;
      if (emotionBlock === 'anxiety') anxietyScore += score;
      else if (emotionBlock === 'scarcity') scarcityScore += score;
      else if (emotionBlock === 'comparison') comparisonScore += score;
      else if (emotionBlock === 'shame') shameScore += score;
      else if (emotionBlock === 'guilt') guiltScore += score;
    } else {
      beliefScore += score;
      const beliefBlock = (q as { beliefBlock?: BeliefBlockType }).beliefBlock;
      if (beliefBlock === 'lack') lackScore += score;
      else if (beliefBlock === 'linear') linearScore += score;
      else if (beliefBlock === 'stigma') stigmaScore += score;
      else if (beliefBlock === 'unworthy') unworthyScore += score;
      else if (beliefBlock === 'relationship') relationshipScore += score;
    }
  });

  // 判断主导层级卡点
  const scores = [
    { layer: 'behavior' as const, score: behaviorScore },
    { layer: 'emotion' as const, score: emotionScore },
    { layer: 'belief' as const, score: beliefScore },
  ];
  
  scores.sort((a, b) => b.score - a.score);
  
  let dominantBlock = scores[0].layer;
  if (scores[0].score - scores[1].score <= 5) {
    const depthOrder = ['belief', 'emotion', 'behavior'];
    const topTwo = [scores[0].layer, scores[1].layer];
    for (const layer of depthOrder) {
      if (topTwo.includes(layer as BlockLayer)) {
        dominantBlock = layer as BlockLayer;
        break;
      }
    }
  }

  // 判断主导四穷类型
  const poorScores = [
    { type: 'mouth' as FourPoorType, score: mouthScore },
    { type: 'hand' as FourPoorType, score: handScore },
    { type: 'eye' as FourPoorType, score: eyeScore },
    { type: 'heart' as FourPoorType, score: heartScore },
  ];
  poorScores.sort((a, b) => b.score - a.score);
  const dominantPoor = poorScores[0].type;

  // 判断主导情绪卡点
  const emotionScores = [
    { type: 'anxiety' as EmotionBlockType, score: anxietyScore },
    { type: 'scarcity' as EmotionBlockType, score: scarcityScore },
    { type: 'comparison' as EmotionBlockType, score: comparisonScore },
    { type: 'shame' as EmotionBlockType, score: shameScore },
    { type: 'guilt' as EmotionBlockType, score: guiltScore },
  ];
  emotionScores.sort((a, b) => b.score - a.score);
  const dominantEmotionBlock = emotionScores[0].type;

  // 判断主导信念卡点
  const beliefScores = [
    { type: 'lack' as BeliefBlockType, score: lackScore },
    { type: 'linear' as BeliefBlockType, score: linearScore },
    { type: 'stigma' as BeliefBlockType, score: stigmaScore },
    { type: 'unworthy' as BeliefBlockType, score: unworthyScore },
    { type: 'relationship' as BeliefBlockType, score: relationshipScore },
  ];
  beliefScores.sort((a, b) => b.score - a.score);
  const dominantBeliefBlock = beliefScores[0].type;

  // 判断财富反应模式
  const avgScore = (behaviorScore + emotionScore + beliefScore) / 30;
  let reactionPattern: ReactionPattern;
  
  if (avgScore < 2.5) {
    reactionPattern = 'harmony';
  } else if (avgScore >= 4) {
    reactionPattern = 'trauma';
  } else {
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
    mouthScore,
    handScore,
    eyeScore,
    heartScore,
    anxietyScore,
    scarcityScore,
    comparisonScore,
    shameScore,
    guiltScore,
    lackScore,
    linearScore,
    stigmaScore,
    unworthyScore,
    relationshipScore,
    dominantBlock,
    dominantPoor,
    dominantEmotionBlock,
    dominantBeliefBlock,
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

export const getFourPoorTitle = (type: FourPoorType) => {
  return fourPoorInfo[type].name;
};

export const getEmotionBlockTitle = (type: EmotionBlockType) => {
  return emotionBlockInfo[type].name;
};

export const getBeliefBlockTitle = (type: BeliefBlockType) => {
  return beliefBlockInfo[type].name;
};
