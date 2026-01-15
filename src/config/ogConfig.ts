/**
 * 统一OG配置管理工具
 * 集中管理所有页面的标题、描述和图片配置
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

// 图片资源映射
export const OG_IMAGES = {
  default: `${OG_BASE_URL}/og-image.png`,
  wealthCoach: `${OG_BASE_URL}/og-wealth-coach.png`,
  wealthCamp: `${OG_BASE_URL}/og-wealth-camp.png`,
  wealthBlock: `${OG_BASE_URL}/og-wealth-block.png`,
  partner: `${OG_BASE_URL}/og-partner.png`,
  emotionCoach: `${OG_BASE_URL}/og-emotion-coach.png`,
  parentCoach: `${OG_BASE_URL}/og-parent-coach.png`,
  coachSpace: `${OG_BASE_URL}/og-coach-space.png`,
  gratitude: `${OG_BASE_URL}/og-gratitude.png`,
  energyStudio: `${OG_BASE_URL}/og-energy-studio.png`,
} as const;

// 页面OG配置
export const PAGE_OG_CONFIGS: Record<string, OGConfig> = {
  // ========== 首页与核心入口 ==========
  home: {
    title: '有劲AI - 情绪四部曲',
    ogTitle: '有劲AI • 情绪四部曲',
    description: '情绪四部曲，找回情绪里的力量',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/`,
  },
  
  // ========== 财富教练产品线 ==========
  wealthCoach: {
    title: '财富教练 - 有劲AI',
    ogTitle: '有劲AI • 财富教练',
    description: '3步突破5层同频，财富从内而外流动',
    image: OG_IMAGES.wealthCoach,
    url: `${OG_BASE_URL}/wealth-coach-intro`,
  },
  wealthBlock: {
    title: '财富卡点测评 - 有劲AI',
    ogTitle: '有劲AI • 财富卡点测评',
    description: '3分钟找到阻碍你财富增长的隐形卡点',
    image: OG_IMAGES.wealthBlock,
    url: `${OG_BASE_URL}/wealth-block`,
  },
  wealthCamp: {
    title: '财富觉醒训练营 - 有劲AI',
    ogTitle: '有劲AI • 财富觉醒训练营',
    description: '7天看见财富卡点，开启觉醒之旅',
    image: OG_IMAGES.wealthCamp,
    url: `${OG_BASE_URL}/wealth-camp-intro`,
  },
  wealthCampCheckIn: {
    title: '训练营打卡 - 有劲AI',
    ogTitle: '有劲AI • 训练营打卡',
    description: '每天15分钟，觉察财富卡点',
    image: OG_IMAGES.wealthCamp,
    url: `${OG_BASE_URL}/wealth-camp-checkin`,
  },
  wealthJournal: {
    title: '财富日记 - 有劲AI',
    ogTitle: '有劲AI • 财富日记',
    description: '记录财富觉醒，见证成长轨迹',
    image: OG_IMAGES.wealthCoach,
    url: `${OG_BASE_URL}/wealth-journal`,
  },
  wealthArchive: {
    title: '觉醒档案 - 有劲AI',
    ogTitle: '有劲AI • 觉醒档案',
    description: '见证你的财富觉醒之旅',
    image: OG_IMAGES.wealthCoach,
    url: `${OG_BASE_URL}/wealth-awakening-archive`,
  },

  // ========== 情绪教练产品线 ==========
  emotionCoach: {
    title: '情绪教练 - 有劲AI',
    ogTitle: '有劲AI • 情绪教练',
    description: '情绪四部曲，找回情绪里的力量',
    image: OG_IMAGES.emotionCoach,
    url: `${OG_BASE_URL}/coach/emotion_coach`,
  },
  emotionButton: {
    title: '情绪急救 - 有劲AI',
    ogTitle: '有劲AI • 情绪急救',
    description: '情绪来袭时，这里有你的安全角落',
    image: OG_IMAGES.emotionCoach,
    url: `${OG_BASE_URL}/emotion-button`,
  },
  emotionHistory: {
    title: '情绪记录 - 有劲AI',
    ogTitle: '有劲AI • 情绪记录',
    description: '情绪四部曲记录，见证你的成长轨迹',
    image: OG_IMAGES.emotionCoach,
    url: `${OG_BASE_URL}/history`,
  },

  // ========== 亲子教练产品线 ==========
  parentCoach: {
    title: '亲子教练 - 有劲AI',
    ogTitle: '有劲AI • 亲子教练',
    description: '父母先稳，孩子才愿意走向你',
    image: OG_IMAGES.parentCoach,
    url: `${OG_BASE_URL}/parent-coach`,
  },
  parentCoachIntro: {
    title: '亲子教练介绍 - 有劲AI',
    ogTitle: '有劲AI • 亲子教练',
    description: '父母先稳，孩子才愿意走向你',
    image: OG_IMAGES.parentCoach,
    url: `${OG_BASE_URL}/parent-coach-intro`,
  },
  parentTeenIntro: {
    title: '亲子陪伴 - 有劲AI',
    ogTitle: '有劲AI • 亲子陪伴',
    description: '家长和孩子各有专属AI，安全成长',
    image: OG_IMAGES.parentCoach,
    url: `${OG_BASE_URL}/parent-teen-intro`,
  },
  teenCoach: {
    title: '青少年教练 - 有劲AI',
    ogTitle: '有劲AI • 青少年教练',
    description: '安全私密的倾诉空间，24h陪伴成长',
    image: OG_IMAGES.parentCoach,
    url: `${OG_BASE_URL}/teen-coach`,
  },
  teenBind: {
    title: '绑定青少年 - 有劲AI',
    ogTitle: '有劲AI • 青少年绑定',
    description: '输入家长的绑定码，开启专属AI朋友',
    image: OG_IMAGES.parentCoach,
    url: `${OG_BASE_URL}/teen-bind`,
  },

  // ========== 教练空间 ==========
  coachSpace: {
    title: '教练空间 - 有劲AI',
    ogTitle: '有劲AI • 教练空间',
    description: '7位专业AI教练，24小时陪伴你成长',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/coach-space`,
  },

  // ========== 教练对话页（动态路由）==========
  coach_wealth_coach_4_questions: {
    title: '财富教练 - 有劲AI',
    ogTitle: '有劲AI • 财富教练',
    description: '3步突破5层同频，财富从内而外流动',
    image: OG_IMAGES.wealthCoach,
    url: `${OG_BASE_URL}/coach/wealth_coach_4_questions`,
  },
  coach_vibrant_life_sage: {
    title: '有劲生活教练 - 有劲AI',
    ogTitle: '有劲AI • 生活教练',
    description: '7位AI教练24小时在线，陪你成长',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/coach/vibrant_life_sage`,
  },
  coach_emotion: {
    title: '情绪教练 - 有劲AI',
    ogTitle: '有劲AI • 情绪教练',
    description: '情绪四部曲，找回情绪里的力量',
    image: OG_IMAGES.emotionCoach,
    url: `${OG_BASE_URL}/coach/emotion`,
  },
  coach_emotion_coach: {
    title: '情绪教练 - 有劲AI',
    ogTitle: '有劲AI • 情绪教练',
    description: '情绪四部曲，找回情绪里的力量',
    image: OG_IMAGES.emotionCoach,
    url: `${OG_BASE_URL}/coach/emotion_coach`,
  },
  coach_parent: {
    title: '亲子教练 - 有劲AI',
    ogTitle: '有劲AI • 亲子教练',
    description: '父母先稳，孩子才愿意走向你',
    image: OG_IMAGES.parentCoach,
    url: `${OG_BASE_URL}/coach/parent`,
  },
  coach_parent_coach: {
    title: '亲子教练 - 有劲AI',
    ogTitle: '有劲AI • 亲子教练',
    description: '父母先稳，孩子才愿意走向你',
    image: OG_IMAGES.parentCoach,
    url: `${OG_BASE_URL}/coach/parent_coach`,
  },
  coach_teen: {
    title: '青少年教练 - 有劲AI',
    ogTitle: '有劲AI • 青少年教练',
    description: '安全私密的倾诉空间，24h陪伴成长',
    image: OG_IMAGES.parentCoach,
    url: `${OG_BASE_URL}/coach/teen`,
  },
  coach_gratitude_coach: {
    title: '感恩教练 - 有劲AI',
    ogTitle: '有劲AI • 感恩教练',
    description: '每天1分钟，科学提升幸福感',
    image: OG_IMAGES.gratitude,
    url: `${OG_BASE_URL}/coach/gratitude_coach`,
  },
  coach_communication: {
    title: '沟通教练 - 有劲AI',
    ogTitle: '有劲AI • 沟通教练',
    description: '四步沟通模型，让关系更顺畅',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/coach/communication`,
  },
  coach_story: {
    title: '故事教练 - 有劲AI',
    ogTitle: '有劲AI • 故事教练',
    description: '用科学方法，让你的故事打动人心',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/coach/story`,
  },
  coachSpaceIntro: {
    title: '教练空间介绍 - 有劲AI',
    ogTitle: '有劲AI • 教练空间',
    description: '7位AI教练24小时在线，专业陪伴你成长',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/coach-space-intro`,
  },
  vibrantLife: {
    title: '有劲生活 - 有劲AI',
    ogTitle: '有劲AI • 有劲生活',
    description: '7位AI教练24小时在线，陪你成长',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/vibrant-life-intro`,
  },
  vibrantLifeHistory: {
    title: '生活记录 - 有劲AI',
    ogTitle: '有劲AI • 生活记录',
    description: 'AI陪你记录生活，见证成长轨迹',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/vibrant-life-history`,
  },

  // ========== 有劲生活馆 ==========
  energyStudio: {
    title: '有劲生活馆 - 有劲AI',
    ogTitle: '有劲AI • 有劲生活馆',
    description: '多种成长工具，随时调节你的能量',
    image: OG_IMAGES.energyStudio,
    url: `${OG_BASE_URL}/energy-studio`,
  },
  aliveCheck: {
    title: '死了吗 - 有劲AI',
    ogTitle: '有劲AI • 死了吗',
    description: '每日安全打卡，让关心你的人安心',
    image: OG_IMAGES.energyStudio,
    url: `${OG_BASE_URL}/alive-check`,
  },
  aliveCheckIntro: {
    title: '安全打卡 - 有劲AI',
    ogTitle: '有劲AI • 安全打卡',
    description: '让关心你的人安心，让你关心的人放心',
    image: OG_IMAGES.energyStudio,
    url: `${OG_BASE_URL}/alive-check-intro`,
  },
  gratitudeJournal: {
    title: '感恩日记 - 有劲AI',
    ogTitle: '有劲AI • 感恩日记',
    description: '每天1分钟，科学提升幸福感25%',
    image: OG_IMAGES.gratitude,
    url: `${OG_BASE_URL}/gratitude-journal-intro`,
  },
  gratitudeHistory: {
    title: '感恩记录 - 有劲AI',
    ogTitle: '有劲AI • 感恩记录',
    description: '7维度AI幸福分析，见证幸福成长',
    image: OG_IMAGES.gratitude,
    url: `${OG_BASE_URL}/gratitude-history`,
  },

  // ========== 沟通教练 ==========
  communicationCoach: {
    title: '沟通教练 - 有劲AI',
    ogTitle: '有劲AI • 沟通教练',
    description: '四步沟通模型，让关系更顺畅',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/communication-coach`,
  },
  communicationHistory: {
    title: '沟通记录 - 有劲AI',
    ogTitle: '有劲AI • 沟通记录',
    description: '沟通练习记录，见证成长轨迹',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/communication-history`,
  },

  // ========== 故事教练 ==========
  storyCoach: {
    title: '故事教练 - 有劲AI',
    ogTitle: '有劲AI • 故事教练',
    description: '用科学方法，让你的故事打动人心',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/story-coach-intro`,
  },

  // ========== 觉察功能 ==========
  awakening: {
    title: '觉察 - 有劲AI',
    ogTitle: '有劲AI • 觉察',
    description: '看见自己，成为自己',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/awakening`,
  },
  awakeningIntro: {
    title: '觉察入门 - 有劲AI',
    ogTitle: '有劲AI • 觉察入门',
    description: '6维度觉察，看见真实的自己',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/awakening-intro`,
  },
  awakeningJournal: {
    title: '觉察日记 - 有劲AI',
    ogTitle: '有劲AI • 觉察日记',
    description: '记录每一个觉察时刻',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/awakening-journal`,
  },

  // ========== 合伙人产品线 ==========
  partner: {
    title: '合伙人 - 有劲AI',
    ogTitle: '有劲AI • 合伙人',
    description: '推广有劲AI，获得持续分成收入',
    image: OG_IMAGES.partner,
    url: `${OG_BASE_URL}/partner`,
  },
  youjinPartnerIntro: {
    title: '有劲合伙人 - 有劲AI',
    ogTitle: '有劲AI • 有劲合伙人',
    description: '分发体验包，获得持续分成收入',
    image: OG_IMAGES.partner,
    url: `${OG_BASE_URL}/youjin-partner-intro`,
  },
  youjinPartnerPlan: {
    title: '合伙人计划 - 有劲AI',
    ogTitle: '有劲AI • 合伙人计划',
    description: 'AI时代最佳副业，分享故事创造价值',
    image: OG_IMAGES.partner,
    url: `${OG_BASE_URL}/youjin-partner-plan`,
  },
  partnerIntro: {
    title: '合伙人介绍 - 有劲AI',
    ogTitle: '有劲AI • 合伙人介绍',
    description: '直推30%+二级10%，获得持续收益',
    image: OG_IMAGES.partner,
    url: `${OG_BASE_URL}/partner-intro`,
  },
  partnerBenefits: {
    title: '合伙人权益 - 有劲AI',
    ogTitle: '有劲AI • 合伙人权益',
    description: '了解合伙人专属权益和收益',
    image: OG_IMAGES.partner,
    url: `${OG_BASE_URL}/partner-benefits`,
  },
  partnerTypeSelector: {
    title: '选择合伙人类型 - 有劲AI',
    ogTitle: '有劲AI • 合伙人类型',
    description: '选择适合你的合伙人路径',
    image: OG_IMAGES.partner,
    url: `${OG_BASE_URL}/partner/type`,
  },
  promoGuide: {
    title: '推广指南 - 有劲AI',
    ogTitle: '有劲AI • 推广指南',
    description: '固定推广链接，简单高效',
    image: OG_IMAGES.partner,
    url: `${OG_BASE_URL}/partner/promo-guide`,
  },

  // ========== 训练营通用 ==========
  campIntro: {
    title: '训练营 - 有劲AI',
    ogTitle: '有劲AI • 训练营',
    description: '系统训练，科学成长，见证蜕变',
    image: OG_IMAGES.wealthCamp,
    url: `${OG_BASE_URL}/camps`,
  },
  campCheckIn: {
    title: '训练营打卡 - 有劲AI',
    ogTitle: '有劲AI • 训练营打卡',
    description: '每日打卡，记录成长',
    image: OG_IMAGES.wealthCamp,
    url: `${OG_BASE_URL}/camp-checkin`,
  },

  // ========== 课程与学习 ==========
  courses: {
    title: '学习课程 - 有劲AI',
    ogTitle: '有劲AI • 学习课程',
    description: '系统化学习，提升成长能力',
    image: OG_IMAGES.energyStudio,
    url: `${OG_BASE_URL}/courses`,
  },

  // ========== 社区 ==========
  community: {
    title: '成长社区 - 有劲AI',
    ogTitle: '有劲AI • 成长社区',
    description: '分享成长故事，见证彼此蜕变',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/community`,
  },
  myPosts: {
    title: '我的帖子 - 有劲AI',
    ogTitle: '有劲AI • 我的帖子',
    description: '记录成长，分享感悟',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/my-posts`,
  },

  // ========== 套餐与支付 ==========
  packages: {
    title: '产品中心 - 有劲AI',
    ogTitle: '有劲AI • 产品中心',
    description: '多种套餐选择，满足不同需求',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/packages`,
  },
  payEntry: {
    title: '支付 - 有劲AI',
    ogTitle: '有劲AI • 支付',
    description: '安全便捷的支付体验',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/pay`,
  },

  // ========== 用户相关 ==========
  profile: {
    title: '个人中心 - 有劲AI',
    ogTitle: '有劲AI • 个人中心',
    description: '管理你的账户和成长记录',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/profile`,
  },
  settings: {
    title: '设置 - 有劲AI',
    ogTitle: '有劲AI • 设置',
    description: '个性化设置你的使用体验',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/settings`,
  },
  auth: {
    title: '登录 - 有劲AI',
    ogTitle: '有劲AI • 登录',
    description: '登录开启你的成长之旅',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/auth`,
  },

  // ========== 分享与邀请 ==========
  shareInvite: {
    title: '分享邀请 - 有劲AI',
    ogTitle: '有劲AI • 分享邀请',
    description: '邀请好友一起成长',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/share-invite`,
  },

  // ========== 预约与咨询 ==========
  myAppointments: {
    title: '我的预约 - 有劲AI',
    ogTitle: '有劲AI • 我的预约',
    description: '一对一真人教练咨询预约管理',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/my-appointments`,
  },
  becomeCoach: {
    title: '成为教练 - 有劲AI',
    ogTitle: '有劲AI • 成为教练',
    description: '加入有劲AI教练团队',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/become-coach`,
  },

  // ========== 补齐缺失的页面配置 ==========
  humanCoaches: {
    title: '真人教练 - 有劲AI',
    ogTitle: '有劲AI • 真人教练',
    description: '专业教练一对一指导，陪伴深度成长',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/human-coaches`,
  },
  campGraduate: {
    title: '训练营毕业 - 有劲AI',
    ogTitle: '有劲AI • 训练营毕业',
    description: '恭喜完成训练营，开启持续成长',
    image: OG_IMAGES.wealthCamp,
    url: `${OG_BASE_URL}/camp-graduate`,
  },
  transformationFlow: {
    title: '蜕变流程 - 有劲AI',
    ogTitle: '有劲AI • 蜕变流程',
    description: '财富蜕变之旅，见证内在成长',
    image: OG_IMAGES.wealthCoach,
    url: `${OG_BASE_URL}/transformation-flow`,
  },
  parentIntake: {
    title: '亲子教练入门 - 有劲AI',
    ogTitle: '有劲AI • 亲子教练入门',
    description: '开启亲子关系改善之旅',
    image: OG_IMAGES.parentCoach,
    url: `${OG_BASE_URL}/parent-intake`,
  },
  customerSupport: {
    title: '客服中心 - 有劲AI',
    ogTitle: '有劲AI • 客服中心',
    description: '有问题？AI客服随时为你解答',
    image: OG_IMAGES.default,
    url: `${OG_BASE_URL}/customer-support`,
  },
  wealthCampIntro: {
    title: '财富觉醒训练营 - 有劲AI',
    ogTitle: '有劲AI • 财富觉醒训练营',
    description: '7天重塑财富信念，开启丰盛人生',
    image: OG_IMAGES.wealthCamp,
    url: `${OG_BASE_URL}/wealth-camp-intro`,
  },
  myStories: {
    title: '我的故事 - 有劲AI',
    ogTitle: '有劲AI • 我的故事',
    description: '用故事记录成长，用文字见证蜕变',
    image: OG_IMAGES.coachSpace,
    url: `${OG_BASE_URL}/my-stories`,
  },
  panicHistory: {
    title: '紧急支援记录 - 有劲AI',
    ogTitle: '有劲AI • 紧急支援记录',
    description: '查看你的情绪支援历史',
    image: OG_IMAGES.emotionCoach,
    url: `${OG_BASE_URL}/panic-history`,
  },
  wealthAwakeningProgress: {
    title: '觉醒进度 - 有劲AI',
    ogTitle: '有劲AI • 觉醒进度',
    description: '追踪你的财富觉醒成长轨迹',
    image: OG_IMAGES.wealthCoach,
    url: `${OG_BASE_URL}/wealth-awakening-progress`,
  },
  wealthJournalDetail: {
    title: '财富日记详情 - 有劲AI',
    ogTitle: '有劲AI • 财富日记详情',
    description: '查看财富觉醒日记记录',
    image: OG_IMAGES.wealthCoach,
    url: `${OG_BASE_URL}/wealth-journal-detail`,
  },
  posterCenter: {
    title: '海报中心 - 有劲AI',
    ogTitle: '有劲AI • 海报中心',
    description: '生成精美分享海报，传递成长力量',
    image: OG_IMAGES.partner,
    url: `${OG_BASE_URL}/poster-center`,
  },
  parentCampLanding: {
    title: '亲子训练营 - 有劲AI',
    ogTitle: '有劲AI • 亲子训练营',
    description: '陪伴式亲子关系成长训练',
    image: OG_IMAGES.parentCoach,
    url: `${OG_BASE_URL}/parent-camp-landing`,
  },
};

/**
 * 获取页面OG配置
 * @param pageKey 页面key
 * @returns OGConfig
 */
export function getOGConfig(pageKey: keyof typeof PAGE_OG_CONFIGS): OGConfig {
  return PAGE_OG_CONFIGS[pageKey] || PAGE_OG_CONFIGS.home;
}

/**
 * 生成完整的meta标签数据
 * @param config OG配置
 * @returns 用于Helmet的meta标签数组
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
 * 根据路径自动匹配OG配置
 * @param pathname 当前路径
 * @returns OGConfig
 */
export function getOGConfigByPath(pathname: string): OGConfig {
  const pathToKeyMap: Record<string, keyof typeof PAGE_OG_CONFIGS> = {
    '/': 'home',
    '/wealth-coach-intro': 'wealthCoach',
    '/wealth-block': 'wealthBlock',
    '/wealth-camp-intro': 'wealthCamp',
    '/wealth-camp-checkin': 'wealthCampCheckIn',
    '/wealth-journal': 'wealthJournal',
    '/wealth-awakening-archive': 'wealthArchive',
    '/emotion-button': 'emotionButton',
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
    // 教练对话页动态路由
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
    '/story-coach-intro': 'storyCoach',
    '/awakening': 'awakening',
    '/awakening-intro': 'awakeningIntro',
    '/awakening-journal': 'awakeningJournal',
    '/partner': 'partner',
    '/youjin-partner-intro': 'youjinPartnerIntro',
    '/youjin-partner-plan': 'youjinPartnerPlan',
    '/partner-intro': 'partnerIntro',
    '/partner-benefits': 'partnerBenefits',
    '/partner/type': 'partnerTypeSelector',
    '/partner/promo-guide': 'promoGuide',
    '/camps': 'campIntro',
    '/camp-checkin': 'campCheckIn',
    '/courses': 'courses',
    '/community': 'community',
    '/my-posts': 'myPosts',
    '/packages': 'packages',
    '/pay': 'payEntry',
    '/profile': 'profile',
    '/settings': 'settings',
    '/auth': 'auth',
    '/share-invite': 'shareInvite',
    '/my-appointments': 'myAppointments',
    '/become-coach': 'becomeCoach',
  };

  const key = pathToKeyMap[pathname];
  return key ? PAGE_OG_CONFIGS[key] : PAGE_OG_CONFIGS.home;
}
