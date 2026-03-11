// 有劲合伙人产品配置

// 体验包包含的 4 项内容
export interface ExperiencePackageItem {
  key: string;
  name: string;
  value: string;
  icon: string;
  description: string;
  features: string[];
  color_theme?: string;
  category?: 'assessment' | 'tool';
}

export const experiencePackageItems: ExperiencePackageItem[] = [
  { 
    key: 'ai_points', 
    name: '尝鲜会员', 
    value: '50点', 
    icon: '🎫',
    description: '体验有劲AI教练的入门权益，50点可与5位AI教练文字对话约50次',
    features: [
      '5位AI教练任选对话',
      '情绪觉醒、亲子、沟通等主题',
      '情绪🆘按钮即时支持',
      '20+成长工具免费使用'
    ],
    category: 'assessment',
  },
  { 
    key: 'emotion_health', 
    name: '情绪健康测评', 
    value: '1次', 
    icon: '💚',
    description: '56道专业题目评估您的情绪健康状态，生成个性化分析报告',
    features: [
      '56道专业测评题目',
      '5个维度情绪健康评估',
      '个性化改善建议',
      '专属成长路径推荐'
    ],
    category: 'assessment',
  },
  { 
    key: 'scl90', 
    name: 'SCL-90心理测评', 
    value: '1次', 
    icon: '📋',
    description: '国际通用的90题心理健康筛查量表，10个维度全面评估',
    features: [
      '90道标准化测评题',
      '10个心理因子分析',
      '雷达图可视化结果',
      '详细改善建议'
    ],
    category: 'assessment',
  },
  { 
    key: 'wealth_block', 
    name: '财富卡点测评', 
    value: '1次', 
    icon: '💰',
    description: '24道问题诊断财富认知卡点，揭示阻碍财富成长的深层原因',
    features: [
      '24道财富认知诊断',
      '4种财富卡点类型分析',
      'AI深度追问洞察',
      '专属突破建议'
    ],
    category: 'assessment',
  },
  {
    key: 'alive_check',
    name: '每日平安打卡',
    value: '永久',
    icon: '🫀',
    description: '每天1秒确认活着，唤醒生命热情',
    features: [
      '每天1秒确认活着',
      '唤醒生命热情',
      '连续打卡记录',
      '紧急联系人通知'
    ],
    category: 'tool',
  },
  {
    key: 'awakening_system',
    name: '觉察日记',
    value: '永久',
    icon: '📔',
    description: 'AI教练陪你写日记，看见情绪变化轨迹',
    features: [
      'AI教练陪你写日记',
      '看见情绪变化轨迹',
      '生成觉察卡片',
      '成长数据可视化'
    ],
    category: 'tool',
  },
  {
    key: 'emotion_button',
    name: '情绪SOS按钮',
    value: '永久',
    icon: '🆘',
    description: '崩溃时按一下就好，3分钟恢复平静',
    features: [
      '崩溃时按一下就好',
      '3分钟恢复平静',
      '多种呼吸练习',
      '即时情绪支持'
    ],
    category: 'tool',
  },
];

// 可分成产品（11款）
export interface CommissionableProduct {
  category: string;
  name: string;
  price: number;
  highlight?: boolean;
}

export const commissionableProducts: CommissionableProduct[] = [
  { category: '年度会员', name: '365会员', price: 365, highlight: true },
  { category: '训练营', name: '21天情绪日记训练营', price: 299 },
  { category: '训练营', name: '财富觉醒训练营', price: 299 },
  { category: '训练营', name: '21天青少年困境突破营', price: 299 },
  { category: '合伙人套餐', name: '初级合伙人', price: 792 },
  { category: '合伙人套餐', name: '高级合伙人', price: 3217 },
  { category: '合伙人套餐', name: '钻石合伙人', price: 4950 },
];

export const totalCommissionableCount = 7;
