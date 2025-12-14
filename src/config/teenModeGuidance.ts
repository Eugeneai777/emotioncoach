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

export const DUAL_TRACK_BENEFITS = [
  {
    title: "隐性桥梁",
    description: "你和亲子教练的对话洞察，会帮助AI更好地理解孩子的家庭背景",
    icon: "🌉"
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
    title: "生成绑定码",
    description: "在亲子教练页面生成专属6位绑定码",
    icon: "🔗"
  },
  {
    step: 2,
    title: "分享给孩子",
    description: "用合适的话术，在恰当时机告诉孩子",
    icon: "💌"
  },
  {
    step: 3,
    title: "孩子输入绑定码",
    description: "孩子访问青少年入口，输入绑定码完成连接",
    icon: "✅"
  },
  {
    step: 4,
    title: "各自开始对话",
    description: "你继续使用亲子教练，孩子拥有专属青少年教练",
    icon: "💬"
  }
];

export const PRIVACY_COMMITMENTS = [
  "孩子的对话内容100%保密，家长无法查看",
  "家长只能看到孩子的使用频率和心情趋势图",
  "AI不会向任何一方透露对方的对话内容",
  "这是建立信任的基础，也是孩子愿意使用的前提"
];
