/**
 * 统一OG配置管理工具
 * 数据库 og_configurations 为唯一配置来源
 * 本文件仅提供类型定义、常量和最终兜底配置
 */

export interface OGConfig {
  title: string;           // 页面标题 (用于 <title>)
  ogTitle: string;         // OG标题 (用于 og:title)
  description: string;     // 描述 (30字符以内，避免微信截断)
  image: string;           // OG图片URL
  url: string;             // 页面URL
  siteName?: string;       // 站点名称 (默认: 有劲AI)
  imageWidth?: number;     // OG图片宽度 (默认: 1200)
  imageHeight?: number;    // OG图片高度 (默认: 630)
  locale?: string;         // 语言 (默认: zh_CN)
  twitterCard?: 'summary' | 'summary_large_image';  // Twitter卡片类型
}

// 基础URL配置
export const OG_BASE_URL = 'https://wechat.eugenewe.net';
export const OG_SITE_NAME = '有劲AI';

// OG 缓存版本号 - 用于强制微信刷新缓存
export const OG_CACHE_VERSION = 'v20260116b';

/**
 * 全局默认 OG 配置
 * 仅作为数据库无数据时的最终兜底
 */
export const DEFAULT_OG_CONFIG: OGConfig = {
  title: '有劲AI - 每个人的生活教练',
  ogTitle: '每个人的生活教练',
  description: '温暖陪伴 × 系统工具 × 成长社群，陪你持续向前',
  image: `${OG_BASE_URL}/og-youjin-ai.png?v=20260116`,
  url: `${OG_BASE_URL}/`,
  siteName: OG_SITE_NAME,
  imageWidth: 1200,
  imageHeight: 630,
  locale: 'zh_CN',
  twitterCard: 'summary_large_image',
};

/**
 * 页面 OG 配置
 * 仅保留 home 作为代码层兜底，所有其他页面配置由数据库管理
 */
export const PAGE_OG_CONFIGS: Record<string, OGConfig> = {
  home: DEFAULT_OG_CONFIG,
};

/**
 * 获取页面OG配置 (仅代码层使用)
 * 推荐使用 usePageOG hook 从数据库获取
 */
export function getOGConfig(pageKey: string): OGConfig {
  return PAGE_OG_CONFIGS[pageKey] || DEFAULT_OG_CONFIG;
}

/**
 * 生成完整的meta标签数据
 */
export function generateOGMeta(config: OGConfig) {
  return {
    title: config.title,
    meta: [
      { name: 'description', content: config.description },
      { property: 'og:title', content: config.ogTitle },
      { property: 'og:description', content: config.description },
      { property: 'og:image', content: config.image },
      { property: 'og:url', content: config.url },
      { property: 'og:site_name', content: config.siteName || OG_SITE_NAME },
      { property: 'og:type', content: 'website' },
    ],
  };
}

/**
 * 路径到页面 key 的映射
 * 用于 DynamicOGMeta 自动识别当前页面
 */
export const pathToKeyMap: Record<string, string> = {
  '/': 'home',
  '/wealth-coach-intro': 'wealthCoach',
  '/wealth-block': 'wealthBlock',
  '/wealth-camp-intro': 'wealthCamp',
  '/wealth-camp-checkin': 'wealthCampCheckIn',
  '/wealth-journal': 'wealthJournal',
  '/wealth-awakening-archive': 'wealthArchive',
  '/emotion-button': 'emotionButton',
  '/emotion-coach': 'emotionCoach',
  '/history': 'emotionHistory',
  '/parent-coach': 'parentCoach',
  '/parent-coach-intro': 'parentCoachIntro',
  '/parent-teen-intro': 'parentTeenIntro',
  '/teen-coach': 'teenCoach',
  '/teen-bind': 'teenBind',
  '/coach-space': 'coachSpace',
  '/coach-space-intro': 'coachSpaceIntro',
  '/vibrant-life-intro': 'vibrantLife',
  '/vibrant-life-history': 'vibrantLifeHistory',
  '/energy-studio': 'energyStudio',
  '/alive-check': 'aliveCheck',
  '/alive-check-intro': 'aliveCheckIntro',
  '/gratitude-journal-intro': 'gratitudeJournal',
  '/gratitude-journal': 'gratitudeHistory',
  '/coach/wealth_coach_4_questions': 'coach_wealth_coach_4_questions',
  '/coach/vibrant_life_sage': 'coach_vibrant_life_sage',
  '/coach/emotion': 'coach_emotion',
  '/coach/emotion_coach': 'coach_emotion_coach',
  '/coach/parent': 'coach_parent',
  '/coach/parent_coach': 'coach_parent_coach',
  '/coach/teen': 'coach_teen',
  '/coach/gratitude_coach': 'coach_gratitude_coach',
  '/coach/communication': 'coach_communication',
  '/coach/story': 'coach_story',
  '/gratitude-history': 'gratitudeHistory',
  '/communication-coach': 'communicationCoach',
  '/communication-history': 'communicationHistory',
  '/communication-intro': 'communicationCoachIntro',
  '/story-coach-intro': 'storyCoach',
  '/awakening': 'awakening',
  '/awakening-intro': 'awakeningIntro',
  '/awakening-journal': 'awakeningJournal',
  '/partner': 'partner',
  '/youjin-partner-intro': 'youjinPartnerIntro',
  '/youjin-partner-plan': 'youjinPartnerPlan',
  '/partner-intro': 'partnerIntro',
  '/partner-benefits': 'partnerBenefits',
  '/partner/youjin-intro': 'youjinPartnerIntro',
  '/partner/youjin-plan': 'youjinPartnerPlan',
  '/partner/benefits': 'partnerBenefits',
  '/partner/type': 'partnerTypeSelector',
  '/partner/promo-guide': 'promoGuide',
  '/partner/graduate': 'campGraduate',
  '/camps': 'campIntro',
  '/camp-checkin': 'campCheckIn',
  '/courses': 'courses',
  '/community': 'community',
  '/my-posts': 'myPosts',
  '/packages': 'packages',
  '/pay': 'payEntry',
  '/pay-entry': 'payEntry',
  '/profile': 'profile',
  '/settings': 'settings',
  '/auth': 'auth',
  '/share-invite': 'shareInvite',
  '/my-appointments': 'myAppointments',
  '/become-coach': 'becomeCoach',
  '/introduction': 'introduction',
  '/emotion-button-intro': 'emotionButtonIntro',
  '/energy-studio-intro': 'energyStudioIntro',
  '/transformation-flow': 'transformationFlow',
  '/wealth-awakening-progress': 'wealthAwakeningProgress',
  '/human-coaches': 'humanCoaches',
  '/poster-center': 'posterCenter',
  '/customer-support': 'customerSupport',
  '/my-stories': 'myStories',
  '/panic-history': 'panicHistory',
  '/parent-diary': 'parentChildDiary',
  '/parent/intake': 'parentIntake',
  '/parent-camp': 'parentCampLanding',
};

/**
 * 根据路径获取页面 key
 */
export function getPageKeyByPath(pathname: string): string {
  return pathToKeyMap[pathname] || 'home';
}
