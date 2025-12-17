// 模型成本配置（每1K tokens，美元）
// OpenAI Realtime API 定价: gpt-4o-realtime $40/M input, $80/M output; mini $10/M input, $20/M output
export const MODEL_COSTS: Record<string, { input?: number; output?: number; image?: number; minute?: number }> = {
  'google/gemini-2.5-flash': { input: 0.0001, output: 0.0003 },
  'google/gemini-2.5-flash-lite': { input: 0.00005, output: 0.00015 },
  'google/gemini-2.5-pro': { input: 0.00025, output: 0.0005 },
  'google/gemini-3-pro-preview': { input: 0.0003, output: 0.0006 },
  'google/gemini-3-pro-image-preview': { image: 0.03 },
  // OpenAI Realtime API (audio tokens): $40/M input, $80/M output → per 1K: $0.04 input, $0.08 output
  'gpt-4o-realtime-preview-2024-12-17': { input: 0.04, output: 0.08 },
  // OpenAI Realtime Mini API (audio tokens): $10/M input, $20/M output → per 1K: $0.01 input, $0.02 output
  'gpt-4o-mini-realtime-preview-2024-12-17': { input: 0.01, output: 0.02 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.005, output: 0.015 },
};

// OpenAI Realtime API 每分钟估算 tokens (基于实际使用数据)
// 约 150 audio tokens/秒，1分钟 = ~9000 tokens，input/output 各约 4500
export const REALTIME_TOKENS_PER_MINUTE = {
  input: 4500,
  output: 4500,
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

// 套餐配额价值配置（每配额人民币）
export const PACKAGE_QUOTA_VALUE: Record<string, { price: number; quota: number; valuePerQuota: number }> = {
  basic: { price: 9.9, quota: 50, valuePerQuota: 9.9 / 50 },           // ¥0.198/配额
  member365: { price: 365, quota: 1000, valuePerQuota: 365 / 1000 },   // ¥0.365/配额
};

// 功能配额消耗配置（默认值，实际以 package_feature_settings 为准）
export const DEFAULT_FEATURE_QUOTA: Record<string, number> = {
  'emotion_coach': 1,
  'communication_coach': 1,
  'parent_coach': 1,
  'vibrant_life_coach': 1,
  'story_coach': 1,
  'emotion_review': 2,
  'pattern_analysis': 2,
  'image_generation': 5,
  'text_to_speech': 1,
  'voice_to_text': 1,
  'voice_clone': 10,
  'realtime_voice': 5,  // 每分钟
  'customer_support': 1,
};

// 利润率分析接口
export interface FeatureProfitability {
  featureKey: string;
  featureName: string;
  usageCount: number;
  totalCostCny: number;
  avgCostPerUse: number;
  quotaPerUse: number;
  revenuePerUseBasic: number;
  revenuePerUseMember: number;
  avgRevenuePerUse: number;  // 加权平均
  totalRevenueCny: number;
  profitCny: number;
  profitMargin: number;  // 百分比
  status: 'profitable' | 'break_even' | 'loss';
  suggestion?: string;
}

// 计算功能利润率
export function calculateFeatureProfitability(
  featureKey: string,
  featureName: string,
  usageCount: number,
  totalCostCny: number,
  quotaPerUse: number,
  memberRatio: number = 0.3  // 假设30%是365会员
): FeatureProfitability {
  const avgCostPerUse = usageCount > 0 ? totalCostCny / usageCount : 0;
  
  const revenuePerUseBasic = quotaPerUse * PACKAGE_QUOTA_VALUE.basic.valuePerQuota;
  const revenuePerUseMember = quotaPerUse * PACKAGE_QUOTA_VALUE.member365.valuePerQuota;
  
  // 加权平均收入（按会员比例）
  const avgRevenuePerUse = revenuePerUseBasic * (1 - memberRatio) + revenuePerUseMember * memberRatio;
  
  const totalRevenueCny = usageCount * avgRevenuePerUse;
  const profitCny = totalRevenueCny - totalCostCny;
  const profitMargin = totalRevenueCny > 0 ? (profitCny / totalRevenueCny) * 100 : 0;
  
  let status: 'profitable' | 'break_even' | 'loss' = 'profitable';
  let suggestion: string | undefined;
  
  if (profitMargin < -5) {
    status = 'loss';
    // 计算达到盈亏平衡所需的配额
    const breakEvenQuota = Math.ceil(avgCostPerUse / PACKAGE_QUOTA_VALUE.basic.valuePerQuota);
    suggestion = `建议将配额消耗从 ${quotaPerUse} 调整为 ${breakEvenQuota}`;
  } else if (profitMargin >= -5 && profitMargin <= 5) {
    status = 'break_even';
  }
  
  return {
    featureKey,
    featureName,
    usageCount,
    totalCostCny,
    avgCostPerUse,
    quotaPerUse,
    revenuePerUseBasic,
    revenuePerUseMember,
    avgRevenuePerUse,
    totalRevenueCny,
    profitCny,
    profitMargin,
    status,
    suggestion,
  };
}

// 获取利润状态颜色
export function getProfitStatusColor(status: FeatureProfitability['status']): string {
  switch (status) {
    case 'profitable': return 'text-green-600';
    case 'break_even': return 'text-amber-600';
    case 'loss': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

// 获取利润状态标签
export function getProfitStatusLabel(status: FeatureProfitability['status']): string {
  switch (status) {
    case 'profitable': return '盈利';
    case 'break_even': return '持平';
    case 'loss': return '亏损';
    default: return '未知';
  }
}

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

// 估算实时语音成本 (基于 token 定价)
export function estimateRealtimeCost(minutes: number, model: string = 'gpt-4o-realtime-preview-2024-12-17'): { usd: number; cny: number; inputTokens: number; outputTokens: number } {
  const costs = MODEL_COSTS[model] || MODEL_COSTS['gpt-4o-realtime-preview-2024-12-17'];
  const inputTokens = Math.round(minutes * REALTIME_TOKENS_PER_MINUTE.input);
  const outputTokens = Math.round(minutes * REALTIME_TOKENS_PER_MINUTE.output);
  
  // 使用 token 定价计算
  const usd = (inputTokens * (costs.input || 0.04) + outputTokens * (costs.output || 0.08)) / 1000;
  return { usd, cny: usd * USD_TO_CNY, inputTokens, outputTokens };
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
  
  // 实时语音 (基于 token 估算, 每分钟约 9000 tokens)
  'realtime_voice': { model: 'gpt-4o-realtime-preview-2024-12-17', avgTokens: { input: 4500, output: 4500 } },
};

// 功能名称映射
export const FEATURE_NAME_MAP: Record<string, string> = {
  'emotion_coach': '情绪教练',
  'emotion-coach': '情绪教练',
  'communication_coach': '沟通教练',
  'carnegie-coach': '沟通教练',
  'parent_coach': '亲子教练',
  'parent-emotion-coach': '亲子教练',
  'vibrant_life_coach': '有劲AI',
  'vibrant-life-sage-coach': '有劲AI',
  'story_coach': '故事教练',
  'generate-story-coach': '故事教练',
  'emotion_review': '情绪复盘',
  'generate-emotion-review': '情绪复盘',
  'generate-communication-review': '沟通复盘',
  'pattern_analysis': '模式分析',
  'analyze-emotion-patterns': '情绪模式分析',
  'analyze-communication-patterns': '沟通模式分析',
  'image_generation': '图片生成',
  'generate-checkin-image': '打卡图片生成',
  'text_to_speech': '文字转语音',
  'text-to-speech': '文字转语音',
  'voice_to_text': '语音转文字',
  'voice-to-text': '语音转文字',
  'voice_clone': '语音克隆',
  'create-voice-clone': '语音克隆',
  'realtime_voice': '实时语音',
  'realtime-token': '实时语音',
  'customer_support': '智能客服',
  'customer-support': '智能客服',
  'recommend-courses': '课程推荐',
  'recommend-music': '音乐推荐',
  'suggest-goals': '目标建议',
  'suggest-smart-goals': '智能目标建议',
  'generate-smart-notification': '智能通知',
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
