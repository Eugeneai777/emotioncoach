export type BrandId = 'youjin' | 'bloom';

export interface BrandGroup {
  id: BrandId;
  name: string;
  emoji: string;
}

export const brandGroups: BrandGroup[] = [
  { id: 'youjin', name: '有劲系列', emoji: '🔥' },
  { id: 'bloom', name: '绽放系列', emoji: '🦋' }
];

export interface ProductCategory {
  id: 'youjin-member' | 'tools-99' | 'youjin-camp' | 'youjin-partner' | 'bloom-camp' | 'bloom-partner' | 'bloom-coach';
  name: string;
  shortName: string;
  emoji: string;
  brand: BrandId;
  gradient: string;
  description: string;
  tagline: string;
  buttonGradient: string;
}

export const productCategories: ProductCategory[] = [
  {
    id: 'youjin-member',
    name: '有劲会员',
    shortName: '会员',
    emoji: '💎',
    brand: 'youjin',
    gradient: 'from-orange-500 to-amber-500',
    description: '日常成长必备，性价比之选',
    tagline: '解锁全部AI功能',
    buttonGradient: 'from-orange-500/20 to-amber-500/20'
  },
  {
    id: 'tools-99',
    name: '有劲小工具',
    shortName: '工具',
    emoji: '🧰',
    brand: 'youjin',
    gradient: 'from-cyan-500 to-blue-500',
    description: '测评诊断 · 日常工具',
    tagline: '测评诊断 · 日常工具',
    buttonGradient: 'from-cyan-500/20 to-blue-500/20'
  },
  {
    id: 'youjin-camp',
    name: '有劲训练营',
    shortName: '训练营',
    emoji: '🔥',
    brand: 'youjin',
    gradient: 'from-amber-500 to-orange-500',
    description: '财富觉醒7天营',
    tagline: '突破财富卡点',
    buttonGradient: 'from-amber-500/20 to-orange-500/20'
  },
  {
    id: 'youjin-partner',
    name: '有劲合伙人',
    shortName: '合伙人',
    emoji: '💪',
    brand: 'youjin',
    gradient: 'from-orange-600 to-amber-600',
    description: '预购体验包，长期分成',
    tagline: '开启事业新路径',
    buttonGradient: 'from-orange-600/20 to-amber-600/20'
  },
  {
    id: 'bloom-camp',
    name: '绽放训练营',
    shortName: '训练营',
    emoji: '🦋',
    brand: 'bloom',
    gradient: 'from-purple-500 to-pink-500',
    description: '深度转化课程，实现生命绽放',
    tagline: '遇见更好的自己',
    buttonGradient: 'from-purple-500/20 to-pink-500/20'
  },
  {
    id: 'bloom-partner',
    name: '绽放合伙人',
    shortName: '合伙人',
    emoji: '👑',
    brand: 'bloom',
    gradient: 'from-pink-500 to-purple-500',
    description: '事业合伙人，共创财富未来',
    tagline: '共创财富未来',
    buttonGradient: 'from-pink-500/20 to-purple-500/20'
  },
  {
    id: 'bloom-coach',
    name: '绽放教练',
    shortName: '教练',
    emoji: '🌟',
    brand: 'bloom',
    gradient: 'from-emerald-500 to-teal-500',
    description: '真人教练1对1咨询',
    tagline: '预付卡充值',
    buttonGradient: 'from-emerald-500/20 to-teal-500/20'
  }
];
