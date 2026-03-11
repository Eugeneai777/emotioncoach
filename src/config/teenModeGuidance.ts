// 双轨模式话术和时机配置

export interface InvitationScript {
  scenario: string;
  script: string;
  tips: string;
  icon: string;
}

export interface TimingSuggestion {
  timing: string;
  reason: string;
  icon: string;
}

export const INVITATION_SCRIPTS: InvitationScript[] = [
  {
    scenario: "孩子心情不好时",
    script: "我知道你可能不想跟我说，但我最近发现了一个AI朋友，它挺懂年轻人的想法。你有什么烦心事可以跟它聊聊，它不会说教，也不会告诉我你聊了什么。要不要试试？",
    tips: "语气轻松，不要强迫，只是提供一个选项",
    icon: "😔"
  },
  {
    scenario: "亲子对话卡住时",
    script: "我感觉咱们现在聊不太下去...我不想逼你说，但我真的关心你。这个AI朋友可能更能理解你，你愿意试试跟它聊聊吗？也许它能帮你理清思路。",
    tips: "承认沟通困难，表达真诚关心",
    icon: "🤝"
  },
  {
    scenario: "孩子说'你不懂'时",
    script: "也许我真的不懂你现在的处境...我在努力学习怎么更好地理解你。这个AI是专门帮助年轻人的，它见过很多类似的情况，说不定能给你一些新角度？",
    tips: "接纳孩子的感受，不要辩解",
    icon: "💭"
  },
  {
    scenario: "日常轻松时刻",
    script: "对了，我最近用了一个AI情绪教练，觉得挺有意思的。他们也有专门给年轻人用的版本，你要是有什么想聊的可以试试，完全私密的。",
    tips: "在氛围好的时候自然提起，降低压力感",
    icon: "☀️"
  },
  {
    scenario: "发现孩子有困扰时",
    script: "我注意到你最近好像有些心事...不想跟我说也没关系，但我希望你有个地方可以倾诉。这个AI很懂倾听，而且绝对保密，我看不到你聊的任何内容。",
    tips: "表达观察而非质问，强调尊重隐私",
    icon: "👀"
  }
];

export const BEST_TIMING: TimingSuggestion[] = [
  {
    timing: "孩子主动提起烦恼但不愿深聊时",
    reason: "孩子已经有倾诉欲，只是对象不对",
    icon: "💬"
  },
  {
    timing: "亲子对话陷入僵局时",
    reason: "第三方介入可以缓解紧张氛围",
    icon: "🔄"
  },
  {
    timing: "孩子表示'你不懂'时",
    reason: "孩子需要被理解，AI可以先建立连接",
    icon: "🎯"
  },
  {
    timing: "孩子遇到学业/社交压力时",
    reason: "这些话题孩子往往不愿跟家长说",
    icon: "📚"
  },
  {
    timing: "家庭氛围轻松的周末时光",
    reason: "低压环境下更容易接受新事物",
    icon: "🌈"
  }
];

export interface XiaojinFeature {
  title: string;
  description: string;
  icon: string;
  tag?: string;
}

export const XIAOJIN_FEATURES: XiaojinFeature[] = [
  {
    title: "今天心情",
    description: "3分钟情绪探索，AI温暖倾听，帮孩子理清感受",
    icon: "🙂",
    tag: "情绪"
  },
  {
    title: "我的天赋",
    description: "发现隐藏超能力，看见自己的独特闪光点",
    icon: "🧠",
    tag: "成长"
  },
  {
    title: "未来方向",
    description: "AI帮你看未来，探索无限可能的自己",
    icon: "🚀",
    tag: "探索"
  },
  {
    title: "随时聊",
    description: "语音对话，像朋友一样倾听，24小时在线",
    icon: "📞",
    tag: "语音"
  },
  {
    title: "成长100天",
    description: "每天一个问题，遇见更好的自己",
    icon: "🔥",
    tag: "挑战"
  }
];

export const FREE_QUOTA_INFO = {
  totalPoints: 100,
  description: "每位孩子免费获得100点体验额度",
  rules: [
    { label: "文字对话", cost: "1点/次", approx: "≈100次" },
    { label: "语音对话", cost: "8点/分钟", approx: "≈12分钟" },
  ],
  upgradeNote: "用完后可升级365天套餐，持续成长"
};

export const DUAL_TRACK_BENEFITS = [
  {
    title: "隐性桥梁",
    description: "你和亲子教练的对话洞察，会帮助AI更好地理解孩子的家庭背景",
    icon: "🌉"
  },
  {
    title: "情绪周报",
    description: "家长可在亲子教练页查看AI生成的孩子情绪趋势摘要，了解状态不窥探隐私",
    icon: "📊"
  },
  {
    title: "绝对隐私",
    description: "孩子的对话内容完全保密，你只能看到使用频率和心情趋势",
    icon: "🔐"
  },
  {
    title: "双向成长",
    description: "各自在安全空间中成长，亲子关系自然会改善",
    icon: "🌱"
  },
  {
    title: "专业陪伴",
    description: "AI会根据青少年心理特点，提供更懂TA的倾听和引导",
    icon: "🎓"
  }
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "生成邀请卡片",
    description: "一键生成专属邀请链接，包含你的家长标识",
    icon: "🔗"
  },
  {
    step: 2,
    title: "分享给孩子",
    description: "孩子打开链接即可使用小劲AI，无需注册",
    icon: "💌"
  },
  {
    step: 3,
    title: "查看情绪周报",
    description: "在亲子教练页查看AI生成的孩子情绪趋势，了解状态",
    icon: "📊"
  }
];

export const PRIVACY_COMMITMENTS = [
  "孩子的对话内容100%保密，家长无法查看",
  "家长只能看到孩子的使用频率和心情趋势图",
  "AI不会向任何一方透露对方的对话内容",
  "这是建立信任的基础，也是孩子愿意使用的前提"
];
