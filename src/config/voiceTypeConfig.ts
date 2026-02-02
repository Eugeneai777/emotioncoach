/**
 * 豆包语音音色配置
 * 
 * 定义情绪教练可用的 AI 声音选项
 */

export interface VoiceTypeOption {
  id: string;
  name: string;
  voice_type: string;
  description: string;
  gender: 'male' | 'female';
  emoji: string;
}

/**
 * 豆包语音大模型 2.0 音色配置
 * 
 * 注意：doubao-speech-vision-pro-250515 模型需要使用长格式音色 ID
 * 旧版短 ID (BV158_streaming 等) 在新模型中不生效
 */
export const VOICE_TYPE_OPTIONS: VoiceTypeOption[] = [
  {
    id: 'wise_elder',
    name: '智慧长者',
    // ✅ 新版模型需要使用长格式 ID（旧版 BV158_streaming 已不支持）
    voice_type: 'zh_male_M392_conversation_wvae_bigtts',
    description: '年长男声，沉稳睿智',
    gender: 'male',
    emoji: '👴'
  },
  {
    id: 'wise_uncle',
    name: '渊博小叔',
    voice_type: 'zh_male_yuanboxiaoshu_moon_bigtts',
    description: '成熟男声，儒雅博学',
    gender: 'male',
    emoji: '👨'
  },
  {
    id: 'warm_female',
    name: '心灵鸡汤',
    voice_type: 'zh_female_xinlingjitang_moon_bigtts',
    description: '温暖女声，治愈心灵',
    gender: 'female',
    emoji: '👩'
  },
  {
    id: 'gentle_lady',
    name: '温柔淑女',
    voice_type: 'zh_female_wenroushunv_mars_bigtts',
    description: '柔和女声，亲切温婉',
    gender: 'female',
    emoji: '👧'
  }
];

// ✅ 使用新版长格式 ID 作为默认音色
export const DEFAULT_VOICE_TYPE = 'zh_male_M392_conversation_wvae_bigtts'; // 智慧长者

export const VOICE_TYPE_STORAGE_KEY = 'emotion_coach_voice_type';

/**
 * 获取用户保存的音色偏好
 * 🔧 兼容旧版短格式 ID，自动迁移到新版长格式
 */
export const getSavedVoiceType = (): string => {
  try {
    const saved = localStorage.getItem(VOICE_TYPE_STORAGE_KEY);
    if (!saved) return DEFAULT_VOICE_TYPE;
    
    // 🔧 检查是否是已废弃的旧版短格式 ID
    const legacyIdMapping: Record<string, string> = {
      'BV158_streaming': 'zh_male_M392_conversation_wvae_bigtts',  // 智慧长者
      'BV123_streaming': 'zh_male_yuanboxiaoshu_moon_bigtts',       // 渊博小叔 (假设)
      'BV503_streaming': 'zh_female_xinlingjitang_moon_bigtts',     // 心灵鸡汤 (假设)
      'BV504_streaming': 'zh_female_wenroushunv_mars_bigtts',       // 温柔淑女 (假设)
    };
    
    if (legacyIdMapping[saved]) {
      console.log('[VoiceTypeConfig] 🔄 Migrating legacy voice ID:', saved, '→', legacyIdMapping[saved]);
      const newId = legacyIdMapping[saved];
      // 自动迁移存储
      localStorage.setItem(VOICE_TYPE_STORAGE_KEY, newId);
      return newId;
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
