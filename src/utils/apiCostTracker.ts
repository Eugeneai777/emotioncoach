// 模型成本配置（每1K tokens，美元）
export const MODEL_COSTS: Record<string, { input?: number; output?: number; image?: number; minute?: number }> = {
  'google/gemini-2.5-flash': { input: 0.0001, output: 0.0003 },
  'google/gemini-2.5-flash-lite': { input: 0.00005, output: 0.00015 },
  'google/gemini-2.5-pro': { input: 0.00025, output: 0.0005 },
  'google/gemini-3-pro-preview': { input: 0.0003, output: 0.0006 },
  'google/gemini-3-pro-image-preview': { image: 0.03 },
  'gpt-4o-realtime-preview-2024-12-17': { minute: 0.06 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.005, output: 0.015 },
};

// ElevenLabs 成本
export const ELEVENLABS_COSTS = {
  tts_per_char: 0.00003,        // $0.03/1000字符
  voice_clone: 0.30,            // $0.30/次
};

// OpenAI Whisper 成本
export const WHISPER_COST_PER_MINUTE = 0.006;

// 汇率
export const USD_TO_CNY = 7.2;

// 估算 token 成本
export function estimateTokenCost(
  model: string, 
  inputTokens: number, 
  outputTokens: number
): { usd: number; cny: number } {
  const costs = MODEL_COSTS[model];
  if (!costs || !costs.input || !costs.output) {
    return { usd: 0, cny: 0 };
  }
  
  const usd = (inputTokens * costs.input + outputTokens * costs.output) / 1000;
  return { usd, cny: usd * USD_TO_CNY };
}

// 估算图片生成成本
export function estimateImageCost(model: string): { usd: number; cny: number } {
  const costs = MODEL_COSTS[model];
  if (!costs?.image) {
    return { usd: 0.03, cny: 0.03 * USD_TO_CNY }; // 默认图片成本
  }
  return { usd: costs.image, cny: costs.image * USD_TO_CNY };
}

// 估算语音成本
export function estimateVoiceCost(
  type: 'tts' | 'stt' | 'clone',
  charCount?: number,
  minutes?: number
): { usd: number; cny: number } {
  let usd = 0;
  
  switch (type) {
    case 'tts':
      usd = (charCount || 0) * ELEVENLABS_COSTS.tts_per_char;
      break;
    case 'stt':
      usd = (minutes || 0) * WHISPER_COST_PER_MINUTE;
      break;
    case 'clone':
      usd = ELEVENLABS_COSTS.voice_clone;
      break;
  }
  
  return { usd, cny: usd * USD_TO_CNY };
}

// 估算实时语音成本
export function estimateRealtimeCost(minutes: number): { usd: number; cny: number } {
  const costs = MODEL_COSTS['gpt-4o-realtime-preview-2024-12-17'];
  const usd = (costs?.minute || 0.06) * minutes;
  return { usd, cny: usd * USD_TO_CNY };
}

// 功能成本映射
export const FEATURE_COST_ESTIMATES: Record<string, { model: string; avgTokens?: { input: number; output: number }; fixedCost?: number }> = {
  // AI 教练对话
  'emotion_coach': { model: 'google/gemini-2.5-flash', avgTokens: { input: 2000, output: 500 } },
  'communication_coach': { model: 'google/gemini-2.5-flash', avgTokens: { input: 2000, output: 500 } },
  'parent_coach': { model: 'google/gemini-2.5-flash', avgTokens: { input: 2000, output: 500 } },
  'vibrant_life_coach': { model: 'google/gemini-2.5-flash', avgTokens: { input: 2000, output: 500 } },
  'story_coach': { model: 'google/gemini-2.5-flash', avgTokens: { input: 1500, output: 800 } },
  
  // AI 分析
  'emotion_review': { model: 'google/gemini-2.5-flash', avgTokens: { input: 3000, output: 1000 } },
  'pattern_analysis': { model: 'google/gemini-2.5-flash', avgTokens: { input: 2500, output: 800 } },
  
  // AI 生成
  'image_generation': { model: 'google/gemini-3-pro-image-preview', fixedCost: 0.03 },
  
  // 语音
  'text_to_speech': { model: 'elevenlabs_tts', fixedCost: 0.002 },
  'voice_to_text': { model: 'whisper', fixedCost: 0.006 },
  'voice_clone': { model: 'elevenlabs_clone', fixedCost: 0.30 },
  
  // 实时语音
  'realtime_voice': { model: 'gpt-4o-realtime-preview-2024-12-17', fixedCost: 0.06 }, // per minute
};

// 获取功能的预估成本
export function getFeatureEstimatedCost(featureKey: string): { usd: number; cny: number } {
  const config = FEATURE_COST_ESTIMATES[featureKey];
  if (!config) {
    return { usd: 0.01, cny: 0.07 }; // 默认成本
  }
  
  if (config.fixedCost) {
    return { usd: config.fixedCost, cny: config.fixedCost * USD_TO_CNY };
  }
  
  if (config.avgTokens) {
    return estimateTokenCost(config.model, config.avgTokens.input, config.avgTokens.output);
  }
  
  return { usd: 0.01, cny: 0.07 };
}
