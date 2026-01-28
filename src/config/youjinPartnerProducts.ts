// 有劲合伙人产品配置

// 体验包包含的 4 项内容
export const experiencePackageItems = [
  { key: 'ai_points', name: '尝鲜会员', value: '50点', icon: '🎫' },
  { key: 'emotion_health', name: '情绪健康测评', value: '1次', icon: '💚' },
  { key: 'scl90', name: 'SCL-90心理测评', value: '1次', icon: '📋' },
  { key: 'wealth_block', name: '财富卡点测评', value: '1次', icon: '💰' },
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
