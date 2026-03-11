// 分享卡片统一注册表
// 整合 IntroShareConfig (介绍页) + 结果类卡片

import { introShareConfigs, IntroShareConfig } from './introShareConfig';

export type ShareCardCategory = 'coach' | 'tool' | 'partner' | 'result';
export type ShareCardType = 'intro' | 'result';

export interface ShareCardRegistryItem {
  id: string;
  title: string;
  category: ShareCardCategory;
  emoji: string;
  type: ShareCardType;
  // For intro cards
  introConfig?: IntroShareConfig;
  // For result cards
  componentName?: string;
  description?: string;
}

// 结果类卡片注册
const resultCards: ShareCardRegistryItem[] = [
  {
    id: 'scl90-result',
    title: 'SCL-90 测评结果',
    category: 'result',
    emoji: '🧠',
    type: 'result',
    componentName: 'SCL90ShareCard',
    description: '心理健康测评结果分享卡',
  },
  {
    id: 'block-reveal',
    title: '财富盲点揭示',
    category: 'result',
    emoji: '💰',
    type: 'result',
    componentName: 'BlockRevealShareCard',
    description: '财富心理盲点测试结果',
  },
  {
    id: 'achievement',
    title: '成就墙展示',
    category: 'result',
    emoji: '🏆',
    type: 'result',
    componentName: 'AchievementShareCard',
    description: '训练营成就解锁分享',
  },
  {
    id: 'graduation',
    title: '训练营毕业',
    category: 'result',
    emoji: '🎓',
    type: 'result',
    componentName: 'GraduationShareCard',
    description: '训练营完成毕业证书',
  },
  {
    id: 'wealth-journal',
    title: '财富简报',
    category: 'result',
    emoji: '📔',
    type: 'result',
    componentName: 'WealthJournalShareCard',
    description: '财富觉察简报分享',
  },
  {
    id: 'emotion-button',
    title: '情绪按钮急救',
    category: 'result',
    emoji: '🆘',
    type: 'result',
    componentName: 'EmotionButtonShareCard',
    description: '情绪急救使用统计',
  },
  {
    id: 'alive-check',
     title: '每日安全守护状态',
     category: 'result',
     emoji: '💗',
     type: 'result',
     componentName: 'AliveCheckShareCard',
     description: '安全守护连续天数',
  },
  {
    id: 'community-post',
    title: '社区帖子分享',
    category: 'result',
    emoji: '💬',
    type: 'result',
    componentName: 'ShareCard',
    description: '社区内容分享卡',
  },
  {
    id: 'emotion-health-result',
    title: '情绪健康测评结果',
    category: 'result',
    emoji: '❤️‍🩹',
    type: 'result',
    componentName: 'EmotionHealthShareCard',
    description: '三层诊断情绪卡点分享',
  },
  // === 新增：审计发现的未注册卡片 ===
  {
    id: 'partner-plan',
    title: '有劲合伙人计划',
    category: 'partner',
    emoji: '🚀',
    type: 'result',
    componentName: 'PartnerPlanShareCard',
    description: '合伙人计划分享海报',
  },
  {
    id: 'teen-invite',
    title: '青少年邀请卡',
    category: 'tool',
    emoji: '👨‍👩‍👧',
    type: 'result',
    componentName: 'TeenInviteShareDialog',
    description: '亲子双轨模式邀请分享',
  },
  {
    id: 'poster-center',
    title: 'AI海报生成器',
    category: 'tool',
    emoji: '🎨',
    type: 'result',
    componentName: 'PosterGenerator',
    description: '自定义推广海报',
  },
  {
    id: 'energy-declaration',
    title: '能量宣言卡',
    category: 'tool',
    emoji: '⚡',
    type: 'result',
    componentName: 'EnergyDeclaration',
    description: '每日能量宣言分享',
  },
  {
    id: 'weekly-tag-report',
    title: '周报统计导出',
    category: 'tool',
    emoji: '📊',
    type: 'result',
    componentName: 'WeeklyTagReport',
    description: '情绪标签周报PDF导出',
  },
  // === 训练营/日记/打卡类分享 ===
  {
    id: 'camp-checkin',
    title: '训练营打卡分享',
    category: 'result',
    emoji: '🏕️',
    type: 'result',
    componentName: 'CampShareDialog',
    description: '训练营每日打卡分享到社区',
  },
  {
    id: 'briefing-share',
    title: '教练简报分享',
    category: 'result',
    emoji: '📋',
    type: 'result',
    componentName: 'BriefingShareDialog',
    description: '教练对话简报分享到社区',
  },
  {
    id: 'gratitude-journal',
    title: '感恩日记分享',
    category: 'tool',
    emoji: '📔',
    type: 'result',
    componentName: 'GratitudeJournalShareDialog',
    description: '感恩日记推广海报',
  },
  {
    id: 'emotion-button-share',
    title: '情绪急救分享',
    category: 'tool',
    emoji: '🆘',
    type: 'result',
    componentName: 'EmotionButtonShareDialog',
    description: '情绪急救工具分享',
  },
  {
    id: 'alive-check-share',
     title: '每日平安打卡分享',
     category: 'tool',
     emoji: '💗',
     type: 'result',
     componentName: 'AliveCheckShareDialog',
     description: '每日平安打卡功能分享',
  },
  {
    id: 'wealth-journal-share',
    title: '财富简报分享',
    category: 'result',
    emoji: '💰',
    type: 'result',
    componentName: 'WealthJournalShareDialog',
    description: '财富觉察简报分享',
  },
];

// 合并 introShareConfigs + 结果卡片为统一注册表
export const shareCardsRegistry: ShareCardRegistryItem[] = [
  // Intro cards from config
  ...Object.values(introShareConfigs).map(config => ({
    id: config.pageKey,
    title: config.title,
    category: config.category as ShareCardCategory,
    emoji: config.emoji,
    type: 'intro' as const,
    introConfig: config,
  })),
  // Result cards
  ...resultCards,
];

// 获取分类统计
export const getCategoryStats = () => {
  const stats: Record<ShareCardCategory, number> = {
    coach: 0,
    tool: 0,
    partner: 0,
    result: 0,
  };
  
  shareCardsRegistry.forEach(item => {
    stats[item.category]++;
  });
  
  return stats;
};

// 分类中文名称
export const CATEGORY_LABELS: Record<ShareCardCategory, string> = {
  coach: '教练',
  tool: '工具',
  partner: '合伙人',
  result: '结果',
};

// 按分类筛选
export const filterByCategory = (category: ShareCardCategory | 'all') => {
  if (category === 'all') return shareCardsRegistry;
  return shareCardsRegistry.filter(item => item.category === category);
};

// 搜索卡片
export const searchCards = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return shareCardsRegistry.filter(item => 
    item.title.toLowerCase().includes(lowerQuery) ||
    item.id.toLowerCase().includes(lowerQuery) ||
    (item.description?.toLowerCase().includes(lowerQuery))
  );
};
