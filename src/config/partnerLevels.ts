export interface PartnerLevel {
  level: string;
  name: string;
  price: number;
  minPrepurchase: number;
  commissionRateL1: number;
  commissionRateL2: number;
  description: string;
  benefits: string[];
  gradient: string;
  icon: string;
}

export const youjinPartnerLevels: PartnerLevel[] = [
  {
    level: 'L1',
    name: '初级合伙人',
    price: 792,
    minPrepurchase: 100,
    commissionRateL1: 0.20,
    commissionRateL2: 0,
    description: '成为初级合伙人',
    benefits: [
      '全产品20%佣金',
      '专属推广二维码',
      '100份体验包分发权',
      '合伙人专属社群'
    ],
    gradient: 'from-orange-400 to-amber-400',
    icon: '💪'
  },
  {
    level: 'L2',
    name: '高级合伙人',
    price: 3217,
    minPrepurchase: 500,
    commissionRateL1: 0.35,
    commissionRateL2: 0,
    description: '成为高级合伙人',
    benefits: [
      '全产品35%佣金',
      '专属推广二维码',
      '500份体验包分发权',
      '优先活动参与权',
      '专属运营支持'
    ],
    gradient: 'from-orange-500 to-amber-500',
    icon: '🔥'
  },
  {
    level: 'L3',
    name: '钻石合伙人',
    price: 4950,
    minPrepurchase: 1000,
    commissionRateL1: 0.50,
    commissionRateL2: 0.10,
    description: '成为钻石合伙人',
    benefits: [
      '全产品50%佣金',
      '二级10%佣金',
      '1000份体验包分发权',
      'VIP活动邀请',
      '专属客户经理',
      '定制化营销物料'
    ],
    gradient: 'from-orange-600 to-amber-600',
    icon: '💎'
  }
];

export const bloomPartnerLevel: PartnerLevel = {
  level: 'L0',
  name: '绽放合伙人',
  price: 0,
  minPrepurchase: 0,
  commissionRateL1: 0.30,
  commissionRateL2: 0.10,
  description: '购买绽放合伙人套餐',
  benefits: [
    '绽放产品30%佣金',
    '二级10%佣金',
    '专属推广码',
    '合伙人专属社群',
    '定期培训课程'
  ],
  gradient: 'from-purple-500 to-pink-500',
  icon: '🦋'
};

export function getPartnerLevel(partnerType: 'youjin' | 'bloom', levelName: string): PartnerLevel | null {
  if (partnerType === 'bloom') {
    return bloomPartnerLevel;
  }
  
  return youjinPartnerLevels.find(l => l.level === levelName) || null;
}

export function determineYoujinLevel(prepurchaseCount: number): PartnerLevel {
  if (prepurchaseCount >= 1000) return youjinPartnerLevels[2];
  if (prepurchaseCount >= 500) return youjinPartnerLevels[1];
  return youjinPartnerLevels[0];
}