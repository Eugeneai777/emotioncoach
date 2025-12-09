export interface ComparisonFeature {
  name: string;
  category: '基础信息' | '教练空间' | '成长工具' | '学习课程' | '训练营';
  tooltip?: string;
}

export interface YoujinFeature extends ComparisonFeature {
  basic: boolean | string;              // 尝鲜会员
  premium: boolean | string;            // 365会员
}

export interface BloomFeature extends ComparisonFeature {
  identityCamp: boolean | string;  // 身份绽放训练营
  emotionCamp: boolean | string;   // 情感绽放训练营
}

// 有劲产品对比数据 - 简化为2列
export const youjinFeatures: YoujinFeature[] = [
  // 基础信息
  { name: "价格", category: "基础信息", basic: "¥9.9", premium: "¥365" },
  { name: "点数额度", category: "基础信息", basic: "50点", premium: "1000点" },
  { name: "有效期", category: "基础信息", basic: "365天", premium: "365天" },
  { name: "购买限制", category: "基础信息", basic: "限购1次", premium: "无限制" },
  
  // 教练空间
  { name: "情绪觉醒教练", category: "教练空间", basic: true, premium: true, tooltip: "基础情绪觉醒和陪伴功能" },
  { name: "家长情绪教练", category: "教练空间", basic: true, premium: true, tooltip: "针对家长的亲子关系情绪教练" },
  { name: "沟通教练", category: "教练空间", basic: true, premium: true, tooltip: "人际沟通技巧指导" },
  { name: "有劲生活教练", category: "教练空间", basic: true, premium: true, tooltip: "全方位生活指导和规划" },
  
  // 成长工具
  { name: "情绪按钮 (9种情绪)", category: "成长工具", basic: true, premium: true, tooltip: "9种情绪场景，288条认知提醒" },
  { name: "情绪工具 (5个)", category: "成长工具", basic: true, premium: true, tooltip: "能量宣言卡、呼吸练习、冥想计时器等" },
  { name: "自我探索工具", category: "成长工具", basic: true, premium: true, tooltip: "价值观探索、优势发现、愿景画布等" },
  { name: "生活管理工具", category: "成长工具", basic: true, premium: true, tooltip: "习惯追踪、能量管理、睡眠记录等" },
  
  // 学习课程
  { name: "公开课程", category: "学习课程", basic: true, premium: true, tooltip: "情绪/沟通/亲子/领导力/生活主题的公开视频课程" },
  { name: "AI视频推荐", category: "学习课程", basic: true, premium: true, tooltip: "根据简报内容智能推荐对应教练主题（情绪/沟通/亲子/领导力/生活）的视频课程" },
  { name: "简报生成", category: "学习课程", basic: true, premium: true, tooltip: "情绪/沟通/亲子/领导力/生活教练对话后自动生成简报" },
  
  // 训练营
  { name: "21天情绪日记训练营", category: "训练营", basic: true, premium: true, tooltip: "系统化21天情绪管理训练" },
  { name: "21天青少年困境突破营", category: "训练营", basic: true, premium: true, tooltip: "针对青少年的心理成长训练" },
];

// 绽放产品对比数据 - 只保留两个训练营
export const bloomFeatures: BloomFeature[] = [
  // 基础信息
  { name: "价格", category: "基础信息", identityCamp: "¥2,980", emotionCamp: "¥3,980" },
  { name: "有效期", category: "基础信息", identityCamp: "3周+永久复训", emotionCamp: "3周+永久复训" },
  { name: "AI对话次数", category: "基础信息", identityCamp: "包含", emotionCamp: "包含" },
  { name: "训练营主题", category: "基础信息", identityCamp: "认识真实自我", emotionCamp: "体验内在情绪" },
  
  // 教练空间
  { name: "情绪觉醒教练", category: "教练空间", identityCamp: true, emotionCamp: true, tooltip: "全功能情绪觉醒教练" },
  { name: "家长情绪教练", category: "教练空间", identityCamp: false, emotionCamp: true, tooltip: "家庭关系情绪教练" },
  { name: "AI生活教练", category: "教练空间", identityCamp: true, emotionCamp: true, tooltip: "生活全方位指导" },
  
  // 成长工具
  { name: "情绪按钮系统", category: "成长工具", identityCamp: true, emotionCamp: true, tooltip: "9种情绪，288条认知提醒" },
  { name: "全部情绪工具", category: "成长工具", identityCamp: true, emotionCamp: true, tooltip: "全套情绪管理工具" },
  { name: "全部自我探索", category: "成长工具", identityCamp: true, emotionCamp: true, tooltip: "完整自我探索工具集" },
  { name: "全部生活管理", category: "成长工具", identityCamp: true, emotionCamp: true, tooltip: "完整生活管理工具集" },
  
  // 学习课程
  { name: "公开课程", category: "学习课程", identityCamp: true, emotionCamp: true, tooltip: "全部公开课程" },
  { name: "专属音频课", category: "学习课程", identityCamp: "21节", emotionCamp: "21节", tooltip: "系统化音频课程体系" },
  { name: "教练直播课", category: "学习课程", identityCamp: true, emotionCamp: true, tooltip: "定期教练直播互动" },
  
  // 训练营
  { name: "每日打卡陪伴", category: "训练营", identityCamp: true, emotionCamp: true, tooltip: "深度陪伴" },
  { name: "社群支持", category: "训练营", identityCamp: true, emotionCamp: true, tooltip: "专属成长社群" },
  { name: "VIP客服", category: "训练营", identityCamp: true, emotionCamp: true, tooltip: "专属客服支持" },
];
