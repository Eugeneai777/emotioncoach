// 所有介绍页的分享配置
// 使用统一的域名: wechat.eugenewe.net

export const SHARE_DOMAIN = 'https://wechat.eugenewe.net';

export interface IntroShareConfig {
  pageKey: string;
  title: string;
  subtitle: string;
  targetUrl: string;      // 二维码跳转目标路径
  emoji: string;
  highlights: string[];   // 核心卖点 3-4 条
  gradient: string;       // 主题渐变 (inline style)
  category: 'coach' | 'camp' | 'partner' | 'tool';
}

export const introShareConfigs: Record<string, IntroShareConfig> = {
  vibrantLife: {
    pageKey: 'vibrantLife',
    title: 'AI生活教练',
    subtitle: '24小时智能陪伴',
    targetUrl: '/vibrant-life-intro',
    emoji: '🌟',
    highlights: [
      '5大生活场景智能适配',
      '情绪/睡眠/压力全覆盖',
      '每次对话自动生成洞察',
    ],
    gradient: 'linear-gradient(135deg, #6366f1, #a855f7)',
    category: 'coach'
  },
  parentCoach: {
    pageKey: 'parentCoach',
    title: '亲子情绪教练',
    subtitle: '读懂情绪，连结孩子',
    targetUrl: '/parent-coach-intro',
    emoji: '💜',
    highlights: [
      '亲子四部曲对话法',
      '情绪理解 + 连结修复',
      '每次对话生成育儿洞察',
    ],
    gradient: 'linear-gradient(135deg, #db2777, #ec4899)',
    category: 'coach'
  },
  parentTeen: {
    pageKey: 'parentTeen',
    title: '亲子双轨模式',
    subtitle: '小劲AI · 孩子的专属成长陪伴',
    targetUrl: '/parent-teen-intro',
    emoji: '👨‍👩‍👧',
    highlights: [
      '5大AI功能免费体验100点',
      '情绪/天赋/未来/语音全覆盖',
      '家长可看AI情绪周报',
    ],
    gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    category: 'coach'
  },
  wealthCoach: {
    pageKey: 'wealthCoach',
    title: '财富觉醒教练',
    subtitle: '看见卡点，突破限制',
    targetUrl: '/wealth-coach-intro',
    emoji: '💰',
    highlights: [
      'AI财富心理测评',
      '行为/情绪/信念三层分析',
      '7天财富觉醒训练营',
    ],
    gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
    category: 'coach'
  },
  coachSpace: {
    pageKey: 'coachSpace',
    title: 'AI教练空间',
    subtitle: '7位AI教练，随时待命',
    targetUrl: '/coach-space-intro',
    emoji: '🎯',
    highlights: [
      '情绪/亲子/财富/沟通多领域',
      '24小时专业级引导',
      '对话自动生成洞察报告',
    ],
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    category: 'coach'
  },
  energyStudio: {
    pageKey: 'energyStudio',
    title: '有劲生活馆',
    subtitle: '情绪梳理一站式入口',
    targetUrl: '/energy-studio-intro',
    emoji: '✨',
    highlights: [
      '情绪急救/感恩日记/宣言卡',
      'AI教练全覆盖',
      '训练营/合伙人入口',
    ],
    gradient: 'linear-gradient(135deg, #14b8a6, #10b981)',
    category: 'tool'
  },
  awakening: {
    pageKey: 'awakening',
    title: '觉察系统',
    subtitle: '6维深度觉察训练',
    targetUrl: '/awakening-intro',
    emoji: '🔮',
    highlights: [
      '情绪/感恩/行动/决策/关系/方向',
      'AI引导式自我探索',
      '游戏化成长记录',
    ],
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    category: 'tool'
  },
  storyCoach: {
    pageKey: 'storyCoach',
    title: '故事教练',
    subtitle: '把经历变成力量',
    targetUrl: '/story-coach-intro',
    emoji: '📖',
    highlights: [
      '4步结构化叙事引导',
      '挫折变成成长故事',
      '面试/演讲/自传素材',
    ],
    gradient: 'linear-gradient(135deg, #0891b2, #0284c7)',
    category: 'coach'
  },
  communicationCoach: {
    pageKey: 'communicationCoach',
    title: '沟通教练',
    subtitle: '化解冲突，高效表达',
    targetUrl: '/communication-intro',
    emoji: '💬',
    highlights: [
      '职场/家庭/亲密关系沟通',
      '非暴力沟通方法',
      'AI模拟对话练习',
    ],
    gradient: 'linear-gradient(135deg, #2563eb, #4f46e5)',
    category: 'coach'
  },
  introduction: {
    pageKey: 'introduction',
    title: '有劲AI - 每个人的生活教练',
    subtitle: '温暖陪伴 × 系统工具 × 成长社群',
    targetUrl: '/introduction',
    emoji: '🌟',
    highlights: [
      '7位AI教练24小时在线',
      '温暖陪伴持续成长',
      '系统工具科学提升',
    ],
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    category: 'tool'
  },
  partnerIntro: {
    pageKey: 'partnerIntro',
    title: '有劲合伙人',
    subtitle: '边成长边赚钱',
    targetUrl: '/partner-intro',
    emoji: '💪',
    highlights: [
      '推广即收益，长期分润',
      '专属推广素材支持',
      '零门槛开始',
    ],
    gradient: 'linear-gradient(135deg, #f59e0b, #dc2626)',
    category: 'partner'
  },
  youjinPartner: {
    pageKey: 'youjinPartner',
    title: '有劲合伙人计划',
    subtitle: '加入我们，共创未来',
    targetUrl: '/partner/youjin-intro',
    emoji: '🚀',
    highlights: [
      '高额佣金分成',
      '专属培训支持',
      '长期收益保障',
    ],
    gradient: 'linear-gradient(135deg, #ea580c, #dc2626)',
    category: 'partner'
  },
  promoGuide: {
    pageKey: 'promoGuide',
    title: '推广指南',
    subtitle: '简单高效，让每次分享都有收获',
    targetUrl: '/partner/promo-guide',
    emoji: '🚀',
    highlights: [
      '固定推广链接永久有效',
      '一键生成分享海报',
      '实时追踪推广效果',
    ],
    gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    category: 'partner'
  },
  aliveCheck: {
    pageKey: 'aliveCheck',
    title: '每日安全守护',
    subtitle: '让关心你的人安心',
    targetUrl: '/alive-check-intro',
    emoji: '💗',
    highlights: [
      '每日一键安全确认',
      '超时自动通知联系人',
      '最多5位紧急联系人',
    ],
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    category: 'tool'
  },
  platformIntro: {
    pageKey: 'platformIntro',
    title: '有劲AI · 每个人的生活教练',
    subtitle: '温暖陪伴 × 系统工具 × 成长社群',
    targetUrl: '/platform-intro',
    emoji: '🌟',
    highlights: [
      '7位AI教练24小时在线',
      '四层支持系统全覆盖',
      '合伙人持续收益',
    ],
    gradient: 'linear-gradient(135deg, #6366f1, #ec4899)',
    category: 'tool'
  },
  scl90: {
    pageKey: 'scl90',
    title: 'SCL-90 心理健康自评',
    subtitle: '专业测评，清楚了解自己的情绪状态',
    targetUrl: '/scl90',
    emoji: '🧠',
    highlights: [
      '90题专业量表·10大心理因子',
      '全球权威抑郁焦虑自测工具',
      'AI个性化解读与建议',
    ],
    gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    category: 'tool'
  },
  emotionHealth: {
    pageKey: 'emotionHealth',
    title: '情绪健康测评',
    subtitle: '32题三层诊断，找到你的情绪卡点',
    targetUrl: '/emotion-health',
    emoji: '❤️‍🩹',
    highlights: [
      '三层诊断·状态/模式/阻滞点',
      '对标PHQ-9/GAD-7/PSS-10权威量表',
      'AI教练个性化陪伴修复',
    ],
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    category: 'tool'
  },
  xiaojin: {
    pageKey: 'xiaojin',
    title: '小劲AI',
    subtitle: '青少年成长陪伴',
    targetUrl: '/xiaojin?from=parent',
    emoji: '✨',
    highlights: [
      '3分钟情绪探索',
      '发现天赋超能力',
      'AI语音随时聊',
    ],
    gradient: 'linear-gradient(135deg, #f97316, #f59e0b)',
    category: 'coach'
  },
  mama: {
    pageKey: 'mama',
    title: '妈妈AI助手',
    subtitle: '懂你的温暖陪伴',
    targetUrl: '/mama',
    emoji: '💖',
    highlights: [
      '情绪检测 · 能量评估',
      '感恩日记 · AI陪聊',
      '趣味亲子测评',
    ],
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    category: 'coach'
  },
  dajin: {
    pageKey: 'dajin',
    title: '大劲AI',
    subtitle: '长辈专属AI陪伴',
    targetUrl: '/elder-care?from=child',
    emoji: '🌿',
    highlights: [
      '温暖陪伴聊天',
      '每日暖心问候',
      '心情记录+提醒',
    ],
    gradient: 'linear-gradient(135deg, #f97316, #d97706)',
    category: 'coach'
  },
};

/**
 * 生成完整的分享URL（带合伙人追踪）
 */
export const getShareUrl = (targetUrl: string, partnerCode?: string): string => {
  const baseUrl = `${SHARE_DOMAIN}${targetUrl}`;
  if (partnerCode) {
    return `${baseUrl}?ref=${partnerCode}`;
  }
  return baseUrl;
};
