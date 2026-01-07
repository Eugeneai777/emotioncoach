export interface ReactionPatternConfig {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
  color: string;
  bgColor: string;
  textColor: string;
  darkTextColor: string;
  description: string;
  trainingFocus: string;
  transformation: {
    from: string;
    to: string;
    toName: string;
    toEmoji: string;
  };
}

export const reactionPatternConfig: Record<string, ReactionPatternConfig> = {
  harmony: {
    key: 'harmony',
    name: '和谐型',
    emoji: '🟢',
    tagline: '人与财富双向靠近',
    color: 'emerald',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700',
    darkTextColor: 'dark:text-emerald-300',
    description: '你与财富的关系相对顺畅',
    trainingFocus: '巩固与复制状态',
    transformation: { from: '和谐型', to: '丰盛型', toName: '丰盛', toEmoji: '✨' }
  },
  chase: {
    key: 'chase',
    name: '追逐型',
    emoji: '🟡',
    tagline: '人追钱，钱后退',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700',
    darkTextColor: 'dark:text-amber-300',
    description: '长期处在「用力过猛」的状态',
    trainingFocus: '行为校准 + 情绪稳定',
    transformation: { from: '追逐型', to: '从容型', toName: '从容', toEmoji: '🧘' }
  },
  avoid: {
    key: 'avoid',
    name: '逃避型',
    emoji: '🔵',
    tagline: '钱靠近，你退缩',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700',
    darkTextColor: 'dark:text-blue-300',
    description: '内在对财富存在防御',
    trainingFocus: '安全感重建 + 渐进式暴露',
    transformation: { from: '逃避型', to: '迎接型', toName: '迎接', toEmoji: '🤗' }
  },
  trauma: {
    key: 'trauma',
    name: '创伤型',
    emoji: '🔴',
    tagline: '钱触发强烈身心反应',
    color: 'rose',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    textColor: 'text-rose-700',
    darkTextColor: 'dark:text-rose-300',
    description: '神经系统的自我保护反应',
    trainingFocus: '神经系统调节 + 安全容器',
    transformation: { from: '创伤型', to: '疗愈型', toName: '疗愈', toEmoji: '💚' }
  }
};

// Map old key names to new standardized keys
export const patternKeyMapping: Record<string, string> = {
  chasing: 'chase',
  avoiding: 'avoid',
  freezing: 'trauma',
  pleasing: 'chase',
  // Also support direct keys
  harmony: 'harmony',
  chase: 'chase',
  avoid: 'avoid',
  trauma: 'trauma',
};

export const getPatternConfig = (patternKey: string | null | undefined): ReactionPatternConfig | null => {
  if (!patternKey) return null;
  const normalizedKey = patternKeyMapping[patternKey] || patternKey;
  return reactionPatternConfig[normalizedKey] || null;
};
