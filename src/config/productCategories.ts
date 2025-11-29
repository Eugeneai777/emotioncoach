export interface ProductCategory {
  id: 'youjin' | 'bloom';
  name: string;
  emoji: string;
  gradient: string;
  description: string;
  tagline: string;
  buttonGradient: string;
}

export const productCategories: ProductCategory[] = [
  {
    id: 'youjin',
    name: '有劲产品',
    emoji: '💪',
    gradient: 'from-orange-500 to-amber-500',
    description: '日常成长必备，性价比之选',
    tagline: '每天进步一点点',
    buttonGradient: 'from-orange-500/20 to-amber-500/20'
  },
  {
    id: 'bloom',
    name: '绽放产品',
    emoji: '🦋',
    gradient: 'from-purple-500 to-pink-500',
    description: '深度转化课程，实现生命绽放',
    tagline: '遇见更好的自己',
    buttonGradient: 'from-purple-500/20 to-pink-500/20'
  }
];
