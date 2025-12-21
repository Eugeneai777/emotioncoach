// 觉察记录入口配置 - 6大觉察维度
export type AwakeningType = 'emotion' | 'gratitude' | 'action' | 'decision' | 'relation' | 'direction';

export interface AwakeningDimension {
  id: AwakeningType;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  primaryColor: string;
  template: string;
  templateParts: {
    prefix: string;
    placeholder1: string;
    middle?: string;
    placeholder2?: string;
    suffix?: string;
  };
  quickWords: string[];
  coachRoute: string;
  toolRoute?: string;
  historyRoute?: string;
}

export const awakeningDimensions: AwakeningDimension[] = [
  {
    id: 'emotion',
    title: '情绪',
    subtitle: '盲点',
    emoji: '🔥',
    gradient: 'from-red-500 to-orange-400',
    primaryColor: 'red',
    template: '我现在有点___，因为___。',
    templateParts: {
      prefix: '我现在有点',
      placeholder1: '焦虑、烦躁、低落...',
      middle: '，因为',
      placeholder2: '工作压力、人际关系...',
      suffix: '。'
    },
    quickWords: ['焦虑', '烦躁', '低落', '愤怒', '委屈', '迷茫', '压力大', '不安', '沮丧', '疲惫'],
    coachRoute: '/',
    toolRoute: '/emotion-button',
    historyRoute: '/history'
  },
  {
    id: 'gratitude',
    title: '感恩',
    subtitle: '滋养',
    emoji: '💛',
    gradient: 'from-amber-500 to-yellow-400',
    primaryColor: 'amber',
    template: '今天我感谢___，因为___。',
    templateParts: {
      prefix: '今天我感谢',
      placeholder1: '某人、某事、某物...',
      middle: '，因为',
      placeholder2: 'TA/它给我带来了...',
      suffix: '。'
    },
    quickWords: ['家人', '朋友', '同事', '健康', '美食', '阳光', '好运', '成长', '支持', '机会'],
    coachRoute: '/coach/gratitude',
    toolRoute: '/gratitude-journal',
    historyRoute: '/gratitude-history'
  },
  {
    id: 'action',
    title: '行动',
    subtitle: '驱动',
    emoji: '⚡',
    gradient: 'from-blue-500 to-cyan-400',
    primaryColor: 'blue',
    template: '我最想完成___，但卡在___。',
    templateParts: {
      prefix: '我最想完成',
      placeholder1: '某件事、某个目标...',
      middle: '，但卡在',
      placeholder2: '时间、精力、不知道怎么开始...',
      suffix: '。'
    },
    quickWords: ['工作任务', '学习计划', '运动健身', '整理房间', '重要电话', '项目推进', '看书', '早起', '戒掉坏习惯', '开始新习惯'],
    coachRoute: '/goals',
    toolRoute: '/goals',
    historyRoute: '/goals'
  },
  {
    id: 'decision',
    title: '选择',
    subtitle: '潜意识',
    emoji: '🧩',
    gradient: 'from-purple-500 to-pink-400',
    primaryColor: 'purple',
    template: '我在纠结___ vs ___，我担心___。',
    templateParts: {
      prefix: '我在纠结',
      placeholder1: '选项A',
      middle: ' vs ',
      placeholder2: '选项B，我担心...',
      suffix: '。'
    },
    quickWords: ['工作选择', '关系抉择', '投资决定', '去留问题', '要不要说', '接受/拒绝', '坚持/放弃', '现在/以后', '自己/他人', '理想/现实'],
    coachRoute: '/coach/decision',
    toolRoute: '/coach/decision',
    historyRoute: '/history'
  },
  {
    id: 'relation',
    title: '关系',
    subtitle: '连结',
    emoji: '🤝',
    gradient: 'from-pink-500 to-rose-400',
    primaryColor: 'pink',
    template: '我想对TA说___，但怕___。',
    templateParts: {
      prefix: '我想对TA说',
      placeholder1: '我的真实想法...',
      middle: '，但怕',
      placeholder2: 'TA会误解、生气、受伤...',
      suffix: '。'
    },
    quickWords: ['想说谢谢', '想道歉', '想表达爱', '想说不', '想问清楚', '想说真话', '想求助', '想和解', '想告别', '想靠近'],
    coachRoute: '/communication-coach',
    toolRoute: '/communication-coach',
    historyRoute: '/communication-history'
  },
  {
    id: 'direction',
    title: '方向',
    subtitle: '启发',
    emoji: '🌟',
    gradient: 'from-teal-500 to-emerald-400',
    primaryColor: 'teal',
    template: '我最近想要___，但不确定___。',
    templateParts: {
      prefix: '我最近想要',
      placeholder1: '某个目标、改变、尝试...',
      middle: '，但不确定',
      placeholder2: '是否正确、如何开始、能否成功...',
      suffix: '。'
    },
    quickWords: ['换工作', '学新技能', '改变生活', '找到使命', '更健康', '更有钱', '更自由', '更有意义', '找到方向', '认识自己'],
    coachRoute: '/story-coach',
    toolRoute: '/story-coach',
    historyRoute: '/my-stories'
  }
];

export const getAwakeningDimension = (id: AwakeningType): AwakeningDimension | undefined => {
  return awakeningDimensions.find(d => d.id === id);
};

// 输入模式配置
export type InputMode = 'quick' | 'template' | 'detailed';

export interface InputModeConfig {
  id: InputMode;
  label: string;
  time: string;
  description: string;
}

export const inputModes: InputModeConfig[] = [
  {
    id: 'quick',
    label: '30秒',
    time: '30秒',
    description: '点选关键词'
  },
  {
    id: 'template',
    label: '60秒',
    time: '60秒',
    description: '一句话'
  },
  {
    id: 'detailed',
    label: '3分钟',
    time: '3分钟',
    description: '详细描述'
  }
];

// 生命卡片结构
export interface LifeCard {
  seeing: string;       // A. 看见 - 核心状态
  encourage: string;    // B. 鼓励 - 正常化+支持
  blindSpot: string;    // C. 盲点 - 可能忽略的
  insight: string;      // D. 启发 - 小转念
  microAction: string;  // E. 微行动 - 2分钟内可完成
  reminder?: {          // F. 智能提醒（可选）
    time: string;
    action: string;
  };
  recommendedCoach: string;  // 推荐的教练路由
  recommendedTool?: string;  // 推荐的工具路由
}
