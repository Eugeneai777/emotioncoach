export interface PoorRichConfig {
  poorName: string;
  richName: string;
  poorEmoji: string;
  richEmoji: string;
  poorDesc: string;
  richDesc: string;
  color: string;
  bgColor: string;
  gradient: string;
  transformation: string;
  suggestion: string;
}

export const fourPoorRichConfig: Record<string, PoorRichConfig> = {
  mouth: {
    poorName: '嘴穷',
    richName: '嘴富',
    poorEmoji: '👄',
    richEmoji: '💬',
    poorDesc: '诅咒式表达',
    richDesc: '祝福式表达',
    color: 'hsl(var(--warning))',
    bgColor: 'hsl(var(--warning) / 0.1)',
    gradient: 'from-amber-500 to-orange-500',
    transformation: '从"我没钱"到"我正在丰盛"',
    suggestion: '每天对3个人说祝福的话',
  },
  hand: {
    poorName: '手穷',
    richName: '手富',
    poorEmoji: '✋',
    richEmoji: '🤲',
    poorDesc: '乞丐心态',
    richDesc: '给予心态',
    color: 'hsl(var(--success))',
    bgColor: 'hsl(var(--success) / 0.1)',
    gradient: 'from-emerald-500 to-teal-500',
    transformation: '从"占便宜"到"主动给予"',
    suggestion: '每周主动请客或送小礼物一次',
  },
  eye: {
    poorName: '眼穷',
    richName: '眼富',
    poorEmoji: '👁️',
    richEmoji: '👀',
    poorDesc: '狭隘视角',
    richDesc: '感恩视角',
    color: 'hsl(var(--info))',
    bgColor: 'hsl(var(--info) / 0.1)',
    gradient: 'from-blue-500 to-cyan-500',
    transformation: '从"目中无人"到"看见他人价值"',
    suggestion: '每天认可身边1个人的付出',
  },
  heart: {
    poorName: '心穷',
    richName: '心富',
    poorEmoji: '💔',
    richEmoji: '💖',
    poorDesc: '受害者思维',
    richDesc: '创造者思维',
    color: 'hsl(var(--pink-500))',
    bgColor: 'hsl(346 77% 50% / 0.1)',
    gradient: 'from-rose-500 to-pink-500',
    transformation: '从"都是TA的错"到"我能做什么"',
    suggestion: '遇事先问"我可以做什么"',
  },
};

export const poorTypeKeys = ['mouth', 'hand', 'eye', 'heart'] as const;
export type PoorTypeKey = (typeof poorTypeKeys)[number];
