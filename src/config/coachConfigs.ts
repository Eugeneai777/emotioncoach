interface Step {
  id: number;
  emoji?: string;
  name: string;
  subtitle: string;
  description: string;
  details?: string;
}

export interface CoachConfig {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  primaryColor: string;
  steps: Step[];
  stepsTitle: string;
  stepsEmoji: string;
  moreInfoRoute?: string;
  historyRoute: string;
  historyLabel: string;
  placeholder: string;
}

export const coachConfigs: Record<string, CoachConfig> = {
  emotion: {
    id: "emotion",
    emoji: "💚",
    title: "情绪觉醒教练 - 情绪日记",
    subtitle: "日常情绪觉察与记录",
    description: "劲老师陪着你，一步步梳理情绪，重新找到情绪里的力量",
    gradient: "from-primary via-emerald-500 to-teal-500",
    primaryColor: "green",
    steps: [
      {
        id: 1,
        name: "觉察",
        subtitle: "Feel it",
        description: "暂停活动，感受此刻情绪",
        details: "暂停活动，给自己空间感受此刻情绪"
      },
      {
        id: 2,
        name: "理解",
        subtitle: "Name it",
        description: "探索情绪背后的需求",
        details: "探索情绪背后的需求和意义"
      },
      {
        id: 3,
        name: "反应",
        subtitle: "React it",
        description: "选择有意识的回应方式",
        details: "选择有意识的回应方式"
      },
      {
        id: 4,
        name: "转化",
        subtitle: "Transform it",
        description: "将情绪转化为成长",
        details: "将情绪转化为成长的力量"
      }
    ],
    stepsTitle: "情绪四部曲",
    stepsEmoji: "🌱",
    moreInfoRoute: "/introduction",
    historyRoute: "/history",
    historyLabel: "我的情绪日记",
    placeholder: "分享你的情绪..."
  },
  
  communication: {
    id: "communication",
    emoji: "💙",
    title: "卡内基沟通教练 - 沟通日记",
    subtitle: "温暖表达，有效影响",
    description: "让每一个人都能更轻松地说出想说的话，并让对方愿意听 🎯",
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    primaryColor: "blue",
    steps: [
      {
        id: 1,
        emoji: "1️⃣",
        name: "看见",
        subtitle: "See",
        description: "把沟通问题变清晰",
        details: "从混乱 → 清晰可操作。我会帮你拆解沟通场景、对话对象、真正诉求和卡点。"
      },
      {
        id: 2,
        emoji: "2️⃣",
        name: "读懂",
        subtitle: "Understand",
        description: "读懂对方的感受与动机",
        details: "一瞬间懂对方，解除情绪误解。从对方的角度看，理解他真正担心什么、需要什么。"
      },
      {
        id: 3,
        emoji: "3️⃣",
        name: "影响",
        subtitle: "Influence",
        description: "给一句对方愿意听的话",
        details: "最小阻力沟通路径。提供可复制的开场话术、表达需求的方式、避坑话术和最佳策略。"
      },
      {
        id: 4,
        emoji: "4️⃣",
        name: "行动",
        subtitle: "Act",
        description: "今天就能做的沟通微行动",
        details: "30秒能做、明天就能复制、让关系比现在好一点的具体行动。"
      }
    ],
    stepsTitle: "卡内基沟通四步曲",
    stepsEmoji: "🎯",
    historyRoute: "/communication-history",
    historyLabel: "我的沟通日记",
    placeholder: "分享你的沟通困境..."
  },
  
  parent: {
    id: "parent",
    emoji: "💜",
    title: "亲子教练",
    subtitle: "亲子情绪四部曲",
    description: "Feel · See · Sense · Transform",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    primaryColor: "purple",
    steps: [
      {
        id: 1,
        name: "感受它",
        subtitle: "Feel it",
        description: "觉察自己此刻的情绪",
        details: "暂停，感受作为家长此刻的真实情绪"
      },
      {
        id: 2,
        name: "看见它",
        subtitle: "See it",
        description: "看见孩子行为背后的需求",
        details: "从孩子的视角，理解行为背后的需求和动机"
      },
      {
        id: 3,
        name: "觉察它",
        subtitle: "Sense it",
        description: "觉察亲子互动的模式",
        details: "识别重复出现的互动模式和触发点"
      },
      {
        id: 4,
        name: "转化它",
        subtitle: "Transform it",
        description: "转化为积极的亲子关系",
        details: "将觉察转化为积极的养育行动"
      }
    ],
    stepsTitle: "亲子情绪四部曲",
    stepsEmoji: "💜",
    historyRoute: "/parent-diary",
    historyLabel: "我的亲子日记",
    placeholder: "分享你的亲子困境..."
  }
};
