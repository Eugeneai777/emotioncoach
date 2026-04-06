/**
 * 视频剧本生成配置
 * 人群 → 工具场景 → 转化产品 三级联动
 */

export interface VideoAudience {
  id: string;
  label: string;
  emoji: string;
  tools: VideoTool[];
  products: VideoProduct[];
}

export interface VideoTool {
  id: string;
  label: string;
  description: string;
}

export interface VideoProduct {
  id: string;
  label: string;
  description: string;
}

export const VIDEO_AUDIENCES: VideoAudience[] = [
  {
    id: 'mama',
    label: '女性专区',
    emoji: '👩',
    tools: [
      { id: 'career', label: '职场跃迁', description: '35+女性职场竞争力提升' },
      { id: 'balance', label: '生活平衡', description: '家庭与事业的智慧平衡' },
      { id: 'emotion', label: '情绪疏导', description: '压力释放与情绪管理' },
      { id: 'side_hustle', label: '副业增收', description: '第二曲线与收入增长' },
    ],
    products: [
      { id: 'camp_emotion', label: '情绪训练营', description: '21天情绪管理训练' },
      { id: 'assessment', label: '竞争力测评', description: '35+女性竞争力专项测评' },
      { id: 'coach_1v1', label: '1v1教练', description: '专属教练一对一咨询' },
    ],
  },
  {
    id: 'midlife',
    label: '中年觉醒',
    emoji: '🧭',
    tools: [
      { id: 'career_transition', label: '职场转型', description: '中年职业第二春' },
      { id: 'meaning', label: '意义重建', description: '人生下半场的方向感' },
      { id: 'health', label: '身心健康', description: '精力管理与压力应对' },
      { id: 'relationship', label: '关系修复', description: '亲密关系与家庭沟通' },
    ],
    products: [
      { id: 'camp_identity', label: '身份训练营', description: '21天身份觉醒训练' },
      { id: 'camp_life', label: '生命训练营', description: '21天生命意义探索' },
      { id: 'coach_1v1', label: '1v1教练', description: '专属教练一对一咨询' },
    ],
  },
  {
    id: 'couple',
    label: '情侣夫妻',
    emoji: '💑',
    tools: [
      { id: 'communication', label: '沟通翻译', description: 'AI情绪翻译·化解冲突' },
      { id: 'intimacy', label: '亲密修复', description: '重建亲密关系连接' },
      { id: 'conflict', label: '冲突化解', description: '非暴力沟通实践' },
    ],
    products: [
      { id: 'camp_emotion', label: '情绪训练营', description: '21天情绪管理训练' },
      { id: 'coach_1v1', label: '1v1教练', description: '婚姻家庭咨询师' },
    ],
  },
  {
    id: 'workplace',
    label: '职场解压',
    emoji: '💼',
    tools: [
      { id: 'burnout', label: '倦怠恢复', description: '职业倦怠快速恢复' },
      { id: 'anxiety', label: '焦虑缓解', description: '工作焦虑情绪管理' },
      { id: 'leadership', label: '领导力', description: '管理者情商提升' },
    ],
    products: [
      { id: 'camp_emotion', label: '情绪训练营', description: '21天情绪管理训练' },
      { id: 'assessment', label: '压力测评', description: '职场压力与倦怠测评' },
      { id: 'coach_1v1', label: '1v1教练', description: '职场教练咨询' },
    ],
  },
  {
    id: 'senior',
    label: '银发陪伴',
    emoji: '🌿',
    tools: [
      { id: 'companion', label: '日常陪伴', description: 'AI暖心对话·排解孤独' },
      { id: 'memory', label: '记忆训练', description: '认知训练·大脑活力' },
      { id: 'health_guide', label: '健康指导', description: '养生知识与健康建议' },
    ],
    products: [
      { id: 'subscription', label: '陪伴会员', description: '银发AI陪伴月度会员' },
    ],
  },
  {
    id: 'youth',
    label: '青少年',
    emoji: '🎓',
    tools: [
      { id: 'study', label: '学业压力', description: '考试焦虑与学习动力' },
      { id: 'confidence', label: '自信建设', description: '青少年自我认同提升' },
      { id: 'social', label: '社交困扰', description: '同伴关系与社交焦虑' },
    ],
    products: [
      { id: 'camp_emotion', label: '情绪训练营', description: '青少年情绪管理训练' },
      { id: 'coach_1v1', label: '1v1教练', description: '青少年心理咨询' },
    ],
  },
];

/**
 * AI剧本生成的 system prompt
 */
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

/**
 * 构建用户 prompt
 */
export const buildScriptPrompt = (
  audience: VideoAudience,
  tool: VideoTool,
  product: VideoProduct,
): string => {
  return `请为以下场景撰写一段30秒短视频口播剧本：

【目标人群】${audience.emoji} ${audience.label}
【工具场景】${tool.label} — ${tool.description}
【转化产品】${product.label} — ${product.description}

请直接输出口播文案，不需要任何额外说明。`;
};
