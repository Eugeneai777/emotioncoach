export interface ComparisonFeature {
  name: string;
  category: '基础信息' | '教练空间' | '成长工具' | '学习课程' | '专属服务' | '合伙人权益';
  tooltip?: string;
}

export interface YoujinFeature extends ComparisonFeature {
  basic: boolean | string;      // 尝鲜会员
  premium: boolean | string;    // 365会员
  camp: boolean | string;       // 有劲训练营
}

export interface BloomFeature extends ComparisonFeature {
  identityCamp: boolean | string;  // 身份绽放训练营
  emotionCamp: boolean | string;   // 情感绽放训练营
  partner: boolean | string;       // 绽放合伙人
}

// 有劲产品对比数据
export const youjinFeatures: YoujinFeature[] = [
  // 基础信息
  { name: "价格", category: "基础信息", basic: "¥9.9", premium: "¥365", camp: "免费" },
  { name: "AI对话次数", category: "基础信息", basic: "50次", premium: "1000次", camp: "—" },
  { name: "有效期", category: "基础信息", basic: "365天", premium: "365天", camp: "永久" },
  { name: "购买限制", category: "基础信息", basic: "限购1次", premium: "无限制", camp: "无限制" },
  
  // 教练空间
  { name: "情绪觉醒教练", category: "教练空间", basic: true, premium: true, camp: true, tooltip: "基础情绪觉醒和陪伴功能" },
  { name: "家长情绪教练", category: "教练空间", basic: false, premium: true, camp: true, tooltip: "针对家长的亲子关系情绪教练" },
  { name: "AI生活教练", category: "教练空间", basic: false, premium: true, camp: false, tooltip: "全方位生活指导和规划" },
  { name: "AI健康教练", category: "教练空间", basic: false, premium: true, camp: false, tooltip: "身心健康管理和建议" },
  
  // 成长工具
  { name: "情绪工具 (5个)", category: "成长工具", basic: "3个", premium: "全部", camp: "2个", tooltip: "能量宣言卡、呼吸练习、冥想计时器、情绪急救箱、正念练习" },
  { name: "自我探索 (5个)", category: "成长工具", basic: "2个", premium: "全部", camp: "—", tooltip: "价值观探索、优势发现、人生愿景画布、感恩日记、人际关系" },
  { name: "生活管理 (6个)", category: "成长工具", basic: "3个", premium: "全部", camp: "—", tooltip: "习惯追踪、能量管理、睡眠记录、运动打卡、财务管理、时间管理" },
  
  // 学习课程
  { name: "公开课程", category: "学习课程", basic: true, premium: true, camp: true, tooltip: "免费公开的情绪管理课程" },
  { name: "训练营专属课程", category: "学习课程", basic: false, premium: false, camp: true, tooltip: "21天系统化训练营课程" },
  { name: "进阶音频课", category: "学习课程", basic: false, premium: true, camp: false, tooltip: "深度情绪管理音频课程" },
  { name: "直播互动课", category: "学习课程", basic: false, premium: "部分", camp: false, tooltip: "与教练实时互动的直播课程" },
  
  // 专属服务
  { name: "每日打卡陪伴", category: "专属服务", basic: false, premium: false, camp: true, tooltip: "每天的情绪记录引导和陪伴" },
  { name: "社群支持", category: "专属服务", basic: false, premium: true, camp: true, tooltip: "加入专属成长社群" },
  { name: "VIP客服", category: "专属服务", basic: false, premium: true, camp: false, tooltip: "专属客服1对1支持" },
  { name: "数据导出", category: "专属服务", basic: "有限", premium: "无限", camp: "—", tooltip: "导出情绪记录和分析数据" },
  { name: "简报生成", category: "专属服务", basic: true, premium: true, camp: false, tooltip: "AI自动生成情绪简报" },
  { name: "深度分析", category: "专属服务", basic: false, premium: true, camp: false, tooltip: "情绪模式深度分析报告" },
];

// 绽放产品对比数据
export const bloomFeatures: BloomFeature[] = [
  // 基础信息
  { name: "价格", category: "基础信息", identityCamp: "¥2,980", emotionCamp: "¥3,980", partner: "¥19,800" },
  { name: "有效期", category: "基础信息", identityCamp: "21天+永久复训", emotionCamp: "28天+永久复训", partner: "永久" },
  { name: "AI对话次数", category: "基础信息", identityCamp: "包含", emotionCamp: "包含", partner: "无限次" },
  { name: "训练营主题", category: "基础信息", identityCamp: "认识真实自我", emotionCamp: "体验内在情绪", partner: "全部主题" },
  
  // 教练空间
  { name: "情绪觉醒教练", category: "教练空间", identityCamp: true, emotionCamp: true, partner: true, tooltip: "全功能情绪觉醒教练" },
  { name: "家长情绪教练", category: "教练空间", identityCamp: false, emotionCamp: true, partner: true, tooltip: "家庭关系情绪教练" },
  { name: "AI生活教练", category: "教练空间", identityCamp: true, emotionCamp: true, partner: true, tooltip: "生活全方位指导" },
  { name: "AI健康教练", category: "教练空间", identityCamp: true, emotionCamp: true, partner: true, tooltip: "健康管理教练" },
  { name: "1对1真人教练", category: "教练空间", identityCamp: false, emotionCamp: false, partner: true, tooltip: "专业教练1对1指导" },
  
  // 成长工具
  { name: "全部情绪工具 (5个)", category: "成长工具", identityCamp: true, emotionCamp: true, partner: true, tooltip: "全套情绪管理工具" },
  { name: "全部自我探索 (5个)", category: "成长工具", identityCamp: true, emotionCamp: true, partner: true, tooltip: "完整自我探索工具集" },
  { name: "全部生活管理 (6个)", category: "成长工具", identityCamp: true, emotionCamp: true, partner: true, tooltip: "完整生活管理工具集" },
  
  // 学习课程
  { name: "公开课程", category: "学习课程", identityCamp: true, emotionCamp: true, partner: true, tooltip: "全部公开课程" },
  { name: "专属音频课", category: "学习课程", identityCamp: "21节", emotionCamp: "28节", partner: "全部", tooltip: "系统化音频课程体系" },
  { name: "教练直播课", category: "学习课程", identityCamp: true, emotionCamp: true, partner: true, tooltip: "定期教练直播互动" },
  { name: "全部高级课程", category: "学习课程", identityCamp: false, emotionCamp: false, partner: true, tooltip: "所有高级进阶课程" },
  
  // 专属服务
  { name: "每日打卡陪伴", category: "专属服务", identityCamp: true, emotionCamp: true, partner: true, tooltip: "深度陪伴" },
  { name: "社群支持", category: "专属服务", identityCamp: true, emotionCamp: true, partner: "VIP专属", tooltip: "专属成长社群" },
  { name: "VIP客服", category: "专属服务", identityCamp: true, emotionCamp: true, partner: "专属管家", tooltip: "专属客服支持" },
  { name: "数据导出", category: "专属服务", identityCamp: "无限", emotionCamp: "无限", partner: "无限", tooltip: "无限制数据导出" },
  { name: "深度分析", category: "专属服务", identityCamp: true, emotionCamp: true, partner: true, tooltip: "专业深度分析报告" },
  
  // 合伙人权益
  { name: "分销佣金", category: "合伙人权益", identityCamp: false, emotionCamp: false, partner: "30%+10%", tooltip: "一级30%、二级10%佣金" },
  { name: "推广二维码", category: "合伙人权益", identityCamp: false, emotionCamp: false, partner: true, tooltip: "专属推广二维码" },
  { name: "团队管理权限", category: "合伙人权益", identityCamp: false, emotionCamp: false, partner: true, tooltip: "查看和管理推广团队" },
  { name: "专属培训", category: "合伙人权益", identityCamp: false, emotionCamp: false, partner: true, tooltip: "合伙人专属培训课程" },
  { name: "优先活动权", category: "合伙人权益", identityCamp: false, emotionCamp: false, partner: true, tooltip: "优先参与品牌活动" },
];
