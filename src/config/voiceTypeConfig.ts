/**
 * ElevenLabs 语音音色配置
 * 
 * 定义情绪教练可用的 AI 声音选项
 */

export interface VoiceTypeOption {
  id: string;
  name: string;
  voice_type: string;
  /** 对应 OpenAI Realtime 的 voice 名称 */
  openai_voice: string;
  description: string;
  gender: 'male' | 'female';
  emoji: string;
}

/**
 * ElevenLabs 音色配置
 * 使用 eleven_multilingual_v2 模型，支持中文
 */
export const VOICE_TYPE_OPTIONS: VoiceTypeOption[] = [
  {
    id: 'brian',
    name: '温暖男声',
    voice_type: 'nPczCjzI2devNBz1zQrb', // Brian (ElevenLabs)
    openai_voice: 'echo',                // OpenAI Realtime 对应音色
    description: '温暖稳重的男声',
    gender: 'male',
    emoji: '👨'
  },
  {
    id: 'george',
    name: '沉稳长者',
    voice_type: 'JBFqnCBsd6RMkjVDRZzb', // George (ElevenLabs)
    openai_voice: 'ash',                 // OpenAI Realtime 对应音色
    description: '沉稳睿智的男声',
    gender: 'male',
    emoji: '👴'
  },
  {
    id: 'sarah',
    name: '温柔女声',
    voice_type: 'EXAVITQu4vr4xnSDxMaL', // Sarah (ElevenLabs)
    openai_voice: 'shimmer',             // OpenAI Realtime 对应音色
    description: '温柔亲切的女声',
    gender: 'female',
    emoji: '👩'
  },
  {
    id: 'lily',
    name: '清新女声',
    voice_type: 'pFZP5JQG7iQjIQuC4Bku', // Lily (ElevenLabs)
    openai_voice: 'coral',              // OpenAI Realtime 对应音色
    description: '清新自然的女声',
    gender: 'female',
    emoji: '👧'
  }
];

export const DEFAULT_VOICE_TYPE = 'nPczCjzI2devNBz1zQrb'; // Brian 温暖男声

export const VOICE_TYPE_STORAGE_KEY = 'emotion_coach_voice_type';

/**
 * 获取用户保存的音色偏好
 * 自动迁移旧版豆包音色ID到ElevenLabs
 */
export const getSavedVoiceType = (): string => {
  try {
    const saved = localStorage.getItem(VOICE_TYPE_STORAGE_KEY);
    if (!saved) return DEFAULT_VOICE_TYPE;
    
    // 迁移旧版豆包音色ID
    if (saved.includes('bigtts') || saved.includes('streaming') || saved.includes('zh_')) {
      console.log('[VoiceTypeConfig] 🔄 Migrating legacy Doubao voice ID to ElevenLabs default');
      localStorage.setItem(VOICE_TYPE_STORAGE_KEY, DEFAULT_VOICE_TYPE);
      return DEFAULT_VOICE_TYPE;
    }
    
    // 验证是否是当前有效的 voice_type
    const isValidVoiceType = VOICE_TYPE_OPTIONS.some(opt => opt.voice_type === saved);
    if (!isValidVoiceType) {
      console.warn('[VoiceTypeConfig] ⚠️ Invalid saved voice type:', saved, '- resetting to default');
      localStorage.setItem(VOICE_TYPE_STORAGE_KEY, DEFAULT_VOICE_TYPE);
      return DEFAULT_VOICE_TYPE;
    }
    
    return saved;
  } catch {
    return DEFAULT_VOICE_TYPE;
  }
};

/**
 * 保存用户音色偏好
 */
export const saveVoiceType = (voiceType: string): void => {
  try {
    localStorage.setItem(VOICE_TYPE_STORAGE_KEY, voiceType);
  } catch (e) {
    console.warn('Failed to save voice type preference:', e);
  }
};

/**
 * 根据 voice_type 获取音色配置
 */
export const getVoiceTypeOption = (voiceType: string): VoiceTypeOption | undefined => {
  return VOICE_TYPE_OPTIONS.find(opt => opt.voice_type === voiceType);
};

/**
 * 将 ElevenLabs voice_type 转为 OpenAI Realtime voice 名称
 * 用于 OpenAI Realtime API 的 voice 参数
 */
export const getOpenAIVoiceName = (voiceType: string): string => {
  const option = VOICE_TYPE_OPTIONS.find(opt => opt.voice_type === voiceType);
  return option?.openai_voice || 'echo'; // 默认 echo
};
