// 情绪-频率映射配置
export interface FrequencyConfig {
  frequency: number;
  name: string;
  chineseName: string;
  effect: string;
  color: string;
  gradient: string;
}

export const HEALING_FREQUENCIES: Record<string, FrequencyConfig> = {
  '432': {
    frequency: 432,
    name: 'Universal Frequency',
    chineseName: '宇宙频率',
    effect: '深度放松，与自然和谐共振',
    color: 'hsl(var(--frequency-432))',
    gradient: 'from-teal-400 to-cyan-500',
  },
  '528': {
    frequency: 528,
    name: 'Love Frequency',
    chineseName: '爱的频率',
    effect: '治愈心灵，恢复内在平衡',
    color: 'hsl(var(--frequency-528))',
    gradient: 'from-emerald-400 to-green-500',
  },
  '396': {
    frequency: 396,
    name: 'Liberation Frequency',
    chineseName: '解放频率',
    effect: '释放恐惧和负面情绪',
    color: 'hsl(var(--frequency-396))',
    gradient: 'from-red-400 to-orange-500',
  },
  '285': {
    frequency: 285,
    name: 'Restoration Frequency',
    chineseName: '修复频率',
    effect: '能量场修复，重建安全感',
    color: 'hsl(var(--frequency-285))',
    gradient: 'from-violet-400 to-purple-500',
  },
  '417': {
    frequency: 417,
    name: 'Change Frequency',
    chineseName: '转变频率',
    effect: '促进积极改变，清除阻碍',
    color: 'hsl(var(--frequency-417))',
    gradient: 'from-amber-400 to-yellow-500',
  },
  '639': {
    frequency: 639,
    name: 'Connection Frequency',
    chineseName: '连接频率',
    effect: '恢复人际和谐，增强连接感',
    color: 'hsl(var(--frequency-639))',
    gradient: 'from-pink-400 to-rose-500',
  },
  '741': {
    frequency: 741,
    name: 'Expression Frequency',
    chineseName: '表达频率',
    effect: '增强表达能力，激发创造力',
    color: 'hsl(var(--frequency-741))',
    gradient: 'from-blue-400 to-indigo-500',
  },
  '852': {
    frequency: 852,
    name: 'Awakening Frequency',
    chineseName: '觉醒频率',
    effect: '提升直觉，灵性觉醒',
    color: 'hsl(var(--frequency-852))',
    gradient: 'from-indigo-400 to-violet-500',
  },
};

// 情绪主题到推荐频率的映射
export const EMOTION_TO_FREQUENCY: Record<string, string[]> = {
  // 负面情绪
  '焦虑': ['432', '528'],
  '恐慌': ['432', '285'],
  '担心': ['432', '639'],
  '恐惧': ['285', '396'],
  '害怕': ['285', '396'],
  '愤怒': ['396', '417'],
  '烦躁': ['396', '432'],
  '生气': ['396', '417'],
  '压力': ['417', '432'],
  '紧张': ['432', '528'],
  '无力': ['639', '528'],
  '疲惫': ['528', '639'],
  '崩溃': ['852', '528'],
  '绝望': ['528', '852'],
  '失落': ['528', '639'],
  '悲伤': ['528', '639'],
  '难过': ['528', '639'],
  '孤独': ['639', '528'],
  '委屈': ['528', '396'],
  '内疚': ['396', '528'],
  '羞耻': ['396', '285'],
  '自责': ['528', '396'],
  
  // 积极情绪
  '平静': ['432', '528'],
  '感恩': ['741', '528'],
  '喜悦': ['741', '639'],
  '希望': ['417', '528'],
  '自信': ['741', '852'],
  '勇气': ['396', '417'],
  
  // 默认
  'default': ['432', '528'],
};

// 根据情绪主题获取推荐频率
export function getRecommendedFrequencies(emotionTheme: string): FrequencyConfig[] {
  // 查找匹配的情绪关键词
  let matchedKeys: string[] = EMOTION_TO_FREQUENCY['default'];
  
  for (const [emotion, frequencies] of Object.entries(EMOTION_TO_FREQUENCY)) {
    if (emotionTheme.includes(emotion)) {
      matchedKeys = frequencies;
      break;
    }
  }
  
  return matchedKeys.map(key => HEALING_FREQUENCIES[key]).filter(Boolean);
}

// 所有可用频率列表
export const ALL_FREQUENCIES = Object.values(HEALING_FREQUENCIES);
