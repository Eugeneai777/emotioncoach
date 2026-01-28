// 有劲合伙人产品配置

// 体验包包含的 4 项内容
export interface ExperiencePackageItem {
  key: string;
  name: string;
  value: string;
  icon: string;
  description: string;
  features: string[];
}

export const experiencePackageItems: ExperiencePackageItem[] = [
  { 
    key: 'ai_points', 
    name: '尝鲜会员', 
    value: '50点', 
    icon: '🎫',
    description: '体验有劲AI教练的入门权益，50点可与5位AI教练对话约50次',
    features: [
      '5位AI教练任选对话',
      '情绪觉醒、亲子、沟通等主题',
      '情绪🆘按钮即时支持',
      '20+成长工具免费使用'
    ]
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
    ]
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
    ]
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
    ]
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
  { category: '基础产品', name: '尝鲜会员', price: 9.9 },
  { category: '测评服务', name: '情绪健康测评', price: 9.9 },
  { category: '测评服务', name: 'SCL-90心理测评', price: 9.9 },
  { category: '测评服务', name: '财富卡点测评', price: 9.9 },
  { category: '年度会员', name: '365会员', price: 365, highlight: true },
  { category: '训练营', name: '21天情绪日记训练营', price: 299 },
  { category: '训练营', name: '财富觉醒训练营', price: 299 },
  { category: '训练营', name: '21天青少年困境突破营', price: 299 },
  { category: '合伙人套餐', name: '初级合伙人', price: 792 },
  { category: '合伙人套餐', name: '高级合伙人', price: 3217 },
  { category: '合伙人套餐', name: '钻石合伙人', price: 4950 },
];

export const totalCommissionableCount = 11;
