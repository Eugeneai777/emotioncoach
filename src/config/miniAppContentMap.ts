export type MiniAppSourceType = 'mini-scenes' | 'daily-tools' | 'assessments' | 'conversion';
export type MiniAppContentStyle = 'xiaohongshu' | 'douyin' | 'empathy' | 'assessment';

export interface MiniAppSeedItem {
  id: string;
  label: string;
  description: string;
  sourceType: MiniAppSourceType;
  route?: string;
  topicId?: string;
  productId?: string;
  productName?: string;
  giftDisplayName?: string;
  reportName?: string;
}

export const MINI_APP_SOURCE_OPTIONS: Array<{ id: MiniAppSourceType; label: string; description: string }> = [
  { id: 'mini-scenes', label: '/mini-app 场景', description: '深夜焦虑、财富卡点、情绪崩溃等入口场景' },
  { id: 'daily-tools', label: '日常工具', description: '情绪 SOS、呼吸练习、感恩日记等轻工具' },
  { id: 'assessments', label: '专业测评', description: '情绪健康、SCL-90、财富卡点等测评转化' },
  { id: 'conversion', label: '训练营/产品转化', description: '训练营、会员、真人教练、合伙人等产品选题' },
];

export const MINI_APP_STYLE_OPTIONS: Array<{ id: MiniAppContentStyle; label: string; description: string }> = [
  { id: 'xiaohongshu', label: '小红书种草', description: '标题更抓人，强调真实体验和收藏价值' },
  { id: 'douyin', label: '抖音口播', description: '开场冲突更强，适合 30 秒短视频' },
  { id: 'empathy', label: '情绪共鸣', description: '先共情后转化，适合高压人群' },
  { id: 'assessment', label: '测评转化', description: '突出测一测、报告解读和自我洞察' },
];


export const MINI_APP_CANONICAL_GIFTS: MiniAppSeedItem[] = [
  { id: 'gift-emotion-health', label: '情绪健康测评', description: '56道题评估情绪健康状态，生成个性化分析报告', sourceType: 'assessments', route: '/emotion-health', topicId: 'assess-emotion-health', productId: 'emotion_health_assessment', productName: '情绪健康测评', giftDisplayName: '限时赠送「情绪健康测评」', reportName: '情绪压力模式洞察报告' },
  { id: 'gift-scl90', label: 'SCL-90心理测评', description: '90题心理健康筛查量表，10个维度全面评估', sourceType: 'assessments', route: '/scl90', topicId: 'assess-scl90', productId: 'scl90_report', productName: 'SCL-90心理测评', giftDisplayName: '限时赠送「SCL-90心理测评」', reportName: '身心压力信号筛查报告' },
  { id: 'gift-wealth-block', label: '财富卡点测评', description: '24道问题定位财富认知卡点与深层原因', sourceType: 'assessments', route: '/wealth-block', topicId: 'assess-wealth', productId: 'wealth_block_assessment', productName: '财富卡点测评', giftDisplayName: '限时赠送「财富卡点测评」', reportName: '财富卡点深度定位报告' },
  { id: 'gift-midlife-awakening', label: '中场觉醒力测评', description: '6维扫描中场阶段的压力、方向与突破口', sourceType: 'assessments', route: '/midlife-awakening', topicId: 'assess-midlife', productId: 'midlife_awakening_assessment', productName: '中场觉醒力测评', giftDisplayName: '限时赠送「中场觉醒力测评」', reportName: '中场卡点与突破口评估报告' },
  { id: 'gift-women-competitiveness', label: '女性竞争力测评', description: '多维评估女性竞争力与成长优势', sourceType: 'assessments', route: '/women-competitiveness', topicId: 'assess-women', productId: 'women_competitiveness_assessment', productName: '女性竞争力测评', giftDisplayName: '限时赠送「女性竞争力测评」', reportName: '女性优势与竞争力定位报告' },
  { id: 'gift-alive-check', label: '每日安全守护', description: '每天1秒确认活着，唤醒生命热情', sourceType: 'daily-tools', route: '/alive-check', topicId: 'tool-alive-check', productId: 'alive_check', productName: '每日安全守护', giftDisplayName: '限时赠送「每日安全守护」', reportName: '生命能量状态觉察报告' },
  { id: 'gift-awakening-system', label: '觉察日记', description: 'AI教练陪你写日记，看见情绪变化轨迹', sourceType: 'daily-tools', route: '/awakening', topicId: 'tool-awakening', productId: 'awakening_system', productName: '觉察日记', giftDisplayName: '限时赠送「觉察日记」', reportName: '情绪变化轨迹洞察报告' },
  { id: 'gift-emotion-button', label: '情绪SOS按钮', description: '崩溃时按一下，获得即时情绪支持', sourceType: 'daily-tools', route: '/emotion-button', topicId: 'tool-emotion-sos', productId: 'emotion_button', productName: '情绪SOS按钮', giftDisplayName: '限时赠送「情绪SOS按钮」', reportName: '情绪崩溃触发点解析报告' },
  { id: 'gift-basic', label: '尝鲜会员', description: '50点AI教练体验权益，适合低门槛体验', sourceType: 'daily-tools', route: '/packages', topicId: 'member-trial', productId: 'basic', productName: '尝鲜会员', giftDisplayName: '限时赠送「尝鲜会员」', reportName: '个人成长阻力快速定位报告' },
];

export const MINI_APP_SCENE_SEEDS: MiniAppSeedItem[] = [
  { id: 'scene-anxiety', label: '深夜焦虑', description: '翻来覆去睡不着，脑子停不下来', sourceType: 'mini-scenes', route: '/life-coach-voice?topic=anxiety', topicId: 'ai-coach-anxiety', productId: 'emotion_health_assessment', productName: '情绪健康测评', giftDisplayName: '限时赠送「情绪健康测评」', reportName: '深夜焦虑模式解析报告' },
  { id: 'scene-career', label: '职场迷茫', description: '想换工作没勇气，不知道下一步去哪', sourceType: 'mini-scenes', route: '/life-coach-voice?topic=career', topicId: 'ai-coach-career', productId: 'midlife_awakening_assessment', productName: '中场觉醒力测评', giftDisplayName: '限时赠送「中场觉醒力测评」', reportName: '职场内耗根源分析报告' },
  { id: 'scene-relationship', label: '关系困扰', description: '刚和重要的人吵完架，不知道怎么修复', sourceType: 'mini-scenes', route: '/life-coach-voice?topic=relationship', topicId: 'ai-coach-relationship', productId: 'awakening_system', productName: '觉察日记', giftDisplayName: '限时赠送「觉察日记」', reportName: '关系沟通盲点洞察报告' },
  { id: 'scene-wealth', label: '财富卡点', description: '赚多少都存不下，收入上来又会自我破坏', sourceType: 'mini-scenes', route: '/wealth-block', topicId: 'assess-wealth', productId: 'cv-wealth-assess', productName: '财富卡点测评', giftDisplayName: '限时赠送「财富卡点测评」', reportName: '财富卡点深度定位报告' },
  { id: 'scene-sleep', label: '睡不着觉', description: '身体很累，但一闭眼就清醒', sourceType: 'mini-scenes', route: '/life-coach-voice?topic=sleep', topicId: 'tool-breathing', productId: 'emotion_button', productName: '情绪SOS按钮', giftDisplayName: '限时赠送「情绪SOS按钮」', reportName: '睡眠焦虑触发因素报告' },
  { id: 'scene-meltdown', label: '情绪崩溃', description: '突然想哭，什么都不想处理', sourceType: 'mini-scenes', route: '/emotion-button', topicId: 'tool-emotion-sos', productId: 'emotion_button', productName: '情绪SOS按钮', giftDisplayName: '限时赠送「情绪SOS按钮」', reportName: '情绪崩溃触发点解析报告' },
  { id: 'scene-exam', label: '考试焦虑', description: '越复习越慌，越想表现好越发挥不出来', sourceType: 'mini-scenes', route: '/xiaojin', topicId: 'tool-panic', productId: 'emotion_button', productName: '情绪SOS按钮', giftDisplayName: '限时赠送「情绪SOS按钮」', reportName: '考试焦虑压力模式报告' },
  { id: 'scene-social', label: '社交困扰', description: '不敢开口，害怕被评价和拒绝', sourceType: 'mini-scenes', route: '/life-coach-voice?topic=social', topicId: 'tool-values', productId: 'awakening_system', productName: '觉察日记', giftDisplayName: '限时赠送「觉察日记」', reportName: '社交回避内在需求洞察报告' },
];

export const MINI_APP_CONVERSION_SEEDS: MiniAppSeedItem[] = [
  { id: 'conv-synergy', label: '7天有劲训练营', description: '7 天解压训练、AI 教练、真人录音冥想', sourceType: 'conversion', route: '/promo/synergy', topicId: 'camp-emotion_stress_7', productId: 'cv-synergy-camp', productName: '情绪健康测评', giftDisplayName: '限时赠送「情绪健康测评」', reportName: '压力内耗恢复力评估报告' },
  { id: 'conv-identity-bloom', label: '身份绽放训练营', description: '重新定义我是谁，适合高价值深度转化', sourceType: 'conversion', route: '/promo/identity-bloom', topicId: 'bloom-camp', productId: 'cv-bloom-camp', productName: '中场觉醒力测评', giftDisplayName: '限时赠送「中场觉醒力测评」', reportName: '身份卡点与生命主线洞察报告' },
  { id: 'conv-member365', label: '365年度会员', description: '全年 AI 教练和工具使用权益', sourceType: 'conversion', route: '/packages', topicId: 'member-365', productId: 'cv-365', productName: '尝鲜会员', giftDisplayName: '限时赠送「尝鲜会员」', reportName: '年度成长卡点扫描报告' },
  { id: 'conv-trial', label: '尝鲜会员', description: '低门槛体验 50 点 AI 教练额度', sourceType: 'conversion', route: '/packages', topicId: 'member-trial', productId: 'cv-trial', productName: '尝鲜会员', giftDisplayName: '限时赠送「尝鲜会员」', reportName: '个人成长阻力快速定位报告' },
  { id: 'conv-wealth-camp', label: '财富觉醒训练营', description: '围绕财富信念和自我价值感做系统突破', sourceType: 'conversion', route: '/promo/wealth-synergy', topicId: 'assess-wealth', productId: 'cv-wealth-camp', productName: '财富卡点测评', giftDisplayName: '限时赠送「财富卡点测评」', reportName: '财富信念阻力深度解析报告' },
  { id: 'conv-coach', label: '真人教练1v1', description: '当 AI 洞察不够时，进入真人教练深度陪跑', sourceType: 'conversion', route: '/human-coaches', topicId: 'coach-1v1', productId: 'cv-coach-1v1', productName: 'SCL-90心理测评', giftDisplayName: '限时赠送「SCL-90心理测评」', reportName: '关键人生议题深度梳理报告' },
];
