/**
 * 视频剧本生成配置
 * 主题(推广什么) + 人群(给谁看) + 转化产品(视频结尾推什么)
 */

// ─── 视频主题/场景 ───

export interface VideoTopicGroup {
  groupId: string;
  groupLabel: string;
  groupEmoji: string;
  items: VideoTopic[];
}

export interface VideoTopic {
  id: string;
  label: string;
  description: string;
  groupId: string;
}

/** 静态主题 — 从 energyStudioTools + productCategories 映射 */
export const STATIC_TOPIC_GROUPS: VideoTopicGroup[] = [
  {
    groupId: 'daily-tools',
    groupLabel: '日常工具',
    groupEmoji: '🛠',
    items: [
      { id: 'tool-declaration', label: '能量宣言卡', description: '创建个性化能量宣言海报', groupId: 'daily-tools' },
      { id: 'tool-breathing', label: '呼吸练习', description: '多种呼吸模式快速平静', groupId: 'daily-tools' },
      { id: 'tool-meditation', label: '冥想计时器', description: '专注冥想记录静心时光', groupId: 'daily-tools' },
      { id: 'tool-first-aid', label: '情绪急救箱', description: '快速识别情绪获取即时缓解', groupId: 'daily-tools' },
      { id: 'tool-mindfulness', label: '正念练习', description: 'AI语音引导正念练习', groupId: 'daily-tools' },
      { id: 'tool-panic', label: '恐慌急救', description: '恐慌来袭时即时帮助安抚', groupId: 'daily-tools' },
      { id: 'tool-values', label: '价值观探索', description: '发现内心真正珍视的东西', groupId: 'daily-tools' },
      { id: 'tool-strengths', label: '优势发现', description: '认识你的独特优势和天赋', groupId: 'daily-tools' },
      { id: 'tool-vision', label: '人生愿景画布', description: '可视化梦想和目标', groupId: 'daily-tools' },
      { id: 'tool-gratitude', label: '感恩日记', description: '记录生活中的美好瞬间', groupId: 'daily-tools' },
      { id: 'tool-habits', label: '习惯追踪', description: '养成好习惯追踪进步', groupId: 'daily-tools' },
      { id: 'tool-energy', label: '能量管理', description: '了解能量曲线优化时间', groupId: 'daily-tools' },
      { id: 'tool-sleep', label: '睡眠记录', description: '追踪睡眠质量改善休息', groupId: 'daily-tools' },
      { id: 'tool-relationship', label: '人际关系', description: '维护关系珍惜每一份联结', groupId: 'daily-tools' },
      { id: 'tool-awakening', label: '觉察日记', description: 'AI教练陪你写日记看见变化', groupId: 'daily-tools' },
      { id: 'tool-alive-check', label: '每日安全守护', description: '每天1秒确认活着唤醒热情', groupId: 'daily-tools' },
      { id: 'tool-emotion-sos', label: '情绪SOS按钮', description: '崩溃时按一下3分钟恢复平静', groupId: 'daily-tools' },
    ],
  },
  {
    groupId: 'assessments',
    groupLabel: '专业测评',
    groupEmoji: '📊',
    items: [
      { id: 'assess-emotion-health', label: '情绪健康测评', description: 'PHQ-9+GAD-7专业情绪健康筛查', groupId: 'assessments' },
      { id: 'assess-scl90', label: 'SCL-90心理筛查', description: '90题专业心理健康症状自评量表', groupId: 'assessments' },
      { id: 'assess-midlife', label: '中场觉醒力测评', description: '6维深度扫描找到中场突破口', groupId: 'assessments' },
      { id: 'assess-wealth', label: '财富卡点测评', description: '发现阻碍财富增长的核心信念', groupId: 'assessments' },
      { id: 'assess-women', label: '女性竞争力测评', description: '多维竞争力水平评估', groupId: 'assessments' },
      { id: 'assess-parent', label: '家长三力测评', description: '情绪稳定力洞察力修复力', groupId: 'assessments' },
      { id: 'assess-comm', label: '亲子沟通测评', description: '双视角诊断亲子沟通模式', groupId: 'assessments' },
      { id: 'assess-relationship', label: '关系质量测评', description: '深度评估亲密关系质量', groupId: 'assessments' },
    ],
  },
  {
    groupId: 'membership',
    groupLabel: '会员产品',
    groupEmoji: '💎',
    items: [
      { id: 'member-trial', label: '尝鲜会员(50点)', description: '5位AI教练任选对话·20+工具免费', groupId: 'membership' },
      { id: 'member-365', label: '365年度会员', description: '全年无限AI教练+全部工具解锁', groupId: 'membership' },
    ],
  },
  {
    groupId: 'youjin-partner',
    groupLabel: '有劲合伙人',
    groupEmoji: '💪',
    items: [
      { id: 'partner-junior', label: '初级合伙人', description: '体验包+18%佣金分成', groupId: 'youjin-partner' },
      { id: 'partner-senior', label: '高级合伙人', description: '全面权益+30%佣金分成', groupId: 'youjin-partner' },
      { id: 'partner-diamond', label: '钻石合伙人', description: '顶级权益+50%佣金分成', groupId: 'youjin-partner' },
    ],
  },
  {
    groupId: 'bloom',
    groupLabel: '绽放系列',
    groupEmoji: '🦋',
    items: [
      { id: 'bloom-camp', label: '绽放训练营', description: '深度转化课程实现生命绽放', groupId: 'bloom' },
      { id: 'bloom-partner', label: '绽放合伙人', description: '事业合伙人共创财富未来', groupId: 'bloom' },
      { id: 'bloom-coach', label: '绽放教练1v1', description: '真人教练一对一咨询', groupId: 'bloom' },
    ],
  },
  {
    groupId: 'human-coach',
    groupLabel: '真人教练',
    groupEmoji: '🌟',
    items: [
      { id: 'coach-1v1', label: '真人教练1v1', description: '专属教练一对一语音咨询', groupId: 'human-coach' },
      { id: 'coach-prepaid', label: '教练预付卡', description: '预付卡充值享受优惠', groupId: 'human-coach' },
    ],
  },
];

// AI教练和训练营从数据库动态加载，前端合并到 topicGroups

// ─── 目标人群 ───

export interface VideoAudience {
  id: string;
  label: string;
  emoji: string;
}

export const VIDEO_AUDIENCES: VideoAudience[] = [
  { id: 'general', label: '通用', emoji: '🌐' },
  { id: 'mama', label: '女性专区', emoji: '👩' },
  { id: 'midlife', label: '中年觉醒', emoji: '🧭' },
  { id: 'couple', label: '情侣夫妻', emoji: '💑' },
  { id: 'workplace', label: '职场解压', emoji: '💼' },
  { id: 'senior', label: '银发陪伴', emoji: '🌿' },
  { id: 'youth', label: '青少年', emoji: '🎓' },
];

// ─── 转化产品 ───

export interface ConversionProduct {
  id: string;
  label: string;
  description: string;
  price?: number;
  category: string;
}

export const CONVERSION_PRODUCTS: ConversionProduct[] = [
  // 会员
  { id: 'cv-trial', label: '尝鲜会员', description: '50点AI教练体验', price: 9.9, category: '会员' },
  { id: 'cv-365', label: '365年度会员', description: '全年无限AI教练', price: 365, category: '会员' },
  // 训练营
  { id: 'cv-synergy-camp', label: '7天有劲训练营', description: '7天解压训练+AI教练+冥想音频', price: 399, category: '训练营' },
  { id: 'cv-emotion-camp', label: '21天情绪日记训练营', description: '21天情绪管理训练', price: 299, category: '训练营' },
  { id: 'cv-wealth-camp', label: '财富觉醒训练营', description: '7天财富卡点突破', price: 299, category: '训练营' },
  { id: 'cv-youth-camp', label: '青少年困境突破营', description: '21天青少年成长', price: 299, category: '训练营' },
  { id: 'cv-bloom-camp', label: '绽放训练营', description: '生命绽放深度课程', price: 2999, category: '训练营' },
  // 测评
  { id: 'cv-emotion-assess', label: '情绪健康测评', description: 'PHQ-9+GAD-7筛查', category: '测评' },
  { id: 'cv-scl90', label: 'SCL-90心理筛查', description: '90题专业自评', category: '测评' },
  { id: 'cv-wealth-assess', label: '财富卡点测评', description: '24题财富信念诊断', category: '测评' },
  // 教练
  { id: 'cv-coach-1v1', label: '真人教练1v1', description: '专属教练一对一咨询', category: '教练' },
  { id: 'cv-coach-prepaid', label: '教练预付卡', description: '预付卡充值', category: '教练' },
  // 合伙人
  { id: 'cv-partner-junior', label: '初级合伙人', description: '体验包+18%佣金', price: 792, category: '合伙人' },
  { id: 'cv-partner-senior', label: '高级合伙人', description: '全面权益+30%佣金', price: 3217, category: '合伙人' },
  { id: 'cv-partner-diamond', label: '钻石合伙人', description: '顶级权益+50%佣金', price: 4950, category: '合伙人' },
  // 绽放
  { id: 'cv-bloom-partner', label: '绽放合伙人', description: '共创财富未来', category: '合伙人' },
  // 免费工具引流
  { id: 'cv-free-tool', label: '免费体验工具', description: '扫码免费使用AI工具', category: '引流' },
];

// ─── 自动推荐映射 ───

const RECOMMENDATION_MAP: Record<string, string[]> = {
  // 日常工具 → 推荐会员
  'tool-': ['cv-trial', 'cv-365', 'cv-free-tool'],
  // 测评 → 推荐该测评 + 会员
  'assess-emotion-health': ['cv-emotion-assess', 'cv-trial', 'cv-emotion-camp'],
  'assess-scl90': ['cv-scl90', 'cv-trial'],
  'assess-wealth': ['cv-wealth-assess', 'cv-wealth-camp'],
  'assess-midlife': ['cv-emotion-assess', 'cv-emotion-camp'],
  'assess-women': ['cv-emotion-assess', 'cv-trial'],
  'assess-parent': ['cv-emotion-assess', 'cv-youth-camp'],
  'assess-comm': ['cv-emotion-assess', 'cv-youth-camp'],
  // 会员
  'member-': ['cv-trial', 'cv-365'],
  // 合伙人
  'partner-': ['cv-partner-junior', 'cv-partner-senior', 'cv-partner-diamond'],
  // 绽放
  'bloom-camp': ['cv-bloom-camp'],
  'bloom-partner': ['cv-bloom-partner'],
  'bloom-coach': ['cv-coach-1v1', 'cv-coach-prepaid'],
  // 真人教练
  'coach-': ['cv-coach-1v1', 'cv-coach-prepaid'],
  // AI教练(动态)
  'ai-coach-': ['cv-trial', 'cv-365'],
  // 训练营(动态)
  'camp-': ['cv-emotion-camp', 'cv-wealth-camp'],
};

export function getRecommendedProducts(topicId: string): string[] {
  // Exact match first
  if (RECOMMENDATION_MAP[topicId]) return RECOMMENDATION_MAP[topicId];
  // Prefix match
  for (const prefix of Object.keys(RECOMMENDATION_MAP)) {
    if (prefix.endsWith('-') && topicId.startsWith(prefix)) {
      return RECOMMENDATION_MAP[prefix];
    }
  }
  // Default
  return ['cv-trial', 'cv-365', 'cv-free-tool'];
}

// ─── AI 剧本 Prompt ───

export const VIDEO_SCRIPT_SYSTEM_PROMPT = `你是一个专业的短视频口播文案策划专家，擅长撰写抖音/小红书风格的30秒数字人口播剧本。

你的剧本必须严格遵循以下5段叙事结构：

1. **Hook（3秒）**：用一个直击痛点的问题或场景开头，0.5秒内抓住注意力。例如"凌晨三点，你还在为XXX焦虑吗？"
2. **痛点展开（7秒）**：深入描述目标人群的具体痛苦场景，引发强烈共鸣。用画面感强的语言。
3. **产品介绍（8秒）**：自然过渡到解决方案，介绍产品/工具的核心价值，不要硬广。
4. **效果展示（7秒）**：用具体数据或用户故事展示效果，建立信任感。
5. **互动提问（5秒）**：用一个开放性问题结尾，引导观众在评论区互动讨论。

输出要求：
- 总字数控制在150-250字之间（约30秒口播）
- 口语化、接地气，像朋友聊天
- 每句话简短有力，适合口播节奏
- 不要使用markdown格式，直接输出纯文本口播稿
- 不要标注段落编号，自然流畅地连接各段`;

export const buildScriptPrompt = (
  topic: VideoTopic,
  audience: VideoAudience,
  product: ConversionProduct,
): string => {
  return `请为以下场景撰写一段30秒短视频口播剧本：

【推广主题】${topic.label} — ${topic.description}
【目标人群】${audience.emoji} ${audience.label}
【转化产品】${product.label} — ${product.description}${product.price ? ` (¥${product.price})` : ''}

请直接输出口播文案，不需要任何额外说明。`;
};
