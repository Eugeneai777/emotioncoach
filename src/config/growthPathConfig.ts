// 成长支持路径配置
export type GrowthStage = 'new_user' | 'assessed' | 'in_camp' | 'member365';

export interface GrowthNode {
  id: string;
  stage: GrowthStage;
  title: string;
  subtitle: string;
  emoji: string;
  price?: string;
  description: string;
  route: string;
  ctaText: string;
  gradient: string;
  borderColor: string;
}

export const growthNodes: GrowthNode[] = [
  {
    id: 'assessment',
    stage: 'new_user',
    title: '组合测评',
    subtitle: '觉察入口',
    emoji: '📋',
    price: '¥9.9',
    description: '了解你当前的情绪状态和反应模式',
    route: '/emotion-health',
    ctaText: '开始测评',
    gradient: 'from-violet-500/10 to-purple-500/10',
    borderColor: 'border-violet-200 dark:border-violet-800'
  },
  {
    id: 'ai_coach',
    stage: 'assessed',
    title: 'AI教练',
    subtitle: '即时陪伴',
    emoji: '🤖',
    description: '基于测评结果的AI情绪教练',
    route: '/assessment-coach',
    ctaText: '继续对话',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  {
    id: 'camp',
    stage: 'in_camp',
    title: '21天训练营',
    subtitle: '系统转化',
    emoji: '🏕️',
    price: '¥299',
    description: 'AI+真人陪跑，21天建立新习惯',
    route: '/camps',
    ctaText: '查看训练营',
    gradient: 'from-amber-500/10 to-orange-500/10',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  {
    id: 'member365',
    stage: 'member365',
    title: '365会员',
    subtitle: '长期陪伴',
    emoji: '👑',
    price: '¥365',
    description: '全年AI教练主题+月度成长回顾',
    route: '/packages',
    ctaText: '了解会员',
    gradient: 'from-rose-500/10 to-pink-500/10',
    borderColor: 'border-rose-200 dark:border-rose-800'
  }
];

export const stageLabels: Record<GrowthStage, string> = {
  new_user: '🌱 刚刚起步',
  assessed: '✅ 已完成测评',
  in_camp: '🏕️ 训练营进行中',
  member365: '👑 365会员'
};

export const stageCtas: Record<GrowthStage, { text: string; route: string }> = {
  new_user: { text: '开始测评，了解自己', route: '/emotion-health' },
  assessed: { text: '与AI教练对话', route: '/assessment-coach' },
  in_camp: { text: '继续今日打卡', route: '/camps' },
  member365: { text: '探索本周主题', route: '/coach-space' }
};
