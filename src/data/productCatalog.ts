// 产品手册目录数据 - 所有产品/功能模块的结构化信息

export interface ProductModule {
  id: string;
  category: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  highlights: string[];
  targetAudience: string[];
  route?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  emoji: string;
  modules: ProductModule[];
}

export const productCatalog: ProductCategory[] = [
  {
    id: 'assessments',
    name: 'AI 测评诊断',
    emoji: '📋',
    modules: [
      {
        id: 'emotion-health',
        category: 'AI 测评诊断',
        name: '情绪健康测评',
        emoji: '💚',
        tagline: '56道专业题目，5维情绪健康评估',
        description: '基于心理学研究的情绪健康指数测评，通过56道精心设计的题目，从情绪稳定性、压力应对、自我认知、人际关系、生活满意度五个维度全面评估您的情绪健康状态，生成个性化分析报告和改善建议。',
        highlights: [
          '56道专业测评题目',
          '5个维度情绪健康评估',
          '个性化改善建议',
          '专属成长路径推荐',
        ],
        targetAudience: ['关注自身情绪健康的人群', '想要了解自己情绪状态的用户', '希望获得科学情绪管理建议的人'],
        route: '/emotion-health',
      },
      {
        id: 'scl90',
        category: 'AI 测评诊断',
        name: 'SCL-90 心理健康测评',
        emoji: '📋',
        tagline: '国际通用90题心理健康筛查量表',
        description: '国际通用的症状自评量表（SCL-90），通过90道标准化题目，从躯体化、强迫症状、人际敏感、抑郁、焦虑等10个因子全面评估心理健康状态，生成雷达图可视化结果和详细改善建议。',
        highlights: [
          '90道标准化测评题',
          '10个心理因子分析',
          '雷达图可视化结果',
          '详细改善建议',
        ],
        targetAudience: ['需要全面心理健康筛查的用户', '关注自身心理状态的人群', '希望获得专业心理评估的人'],
        route: '/scl90',
      },
      {
        id: 'wealth-block',
        category: 'AI 测评诊断',
        name: '财富卡点测评',
        emoji: '💰',
        tagline: '24道问题诊断财富认知卡点',
        description: '通过24道精心设计的问题，诊断您在财富认知方面的深层卡点，揭示阻碍财富成长的根本原因。结合AI深度追问技术，帮助您发现潜意识中的限制性信念，并提供专属突破建议。',
        highlights: [
          '24道财富认知诊断',
          '4种财富卡点类型分析',
          'AI深度追问洞察',
          '专属突破建议',
        ],
        targetAudience: ['希望提升财富认知的用户', '感觉赚钱有无形阻力的人', '想要突破财富瓶颈的创业者'],
        route: '/wealth-assessment',
      },
      {
        id: 'communication-assessment',
        category: 'AI 测评诊断',
        name: '沟通能力测评',
        emoji: '💬',
        tagline: '多维度评估沟通模式与能力',
        description: '全面评估您的沟通风格和能力水平，涵盖倾听能力、表达能力、非暴力沟通、冲突处理等多个维度，帮助您了解自己的沟通优势和提升方向。',
        highlights: [
          '多维度沟通能力评估',
          '个人沟通风格分析',
          '针对性提升建议',
          'AI教练跟进辅导',
        ],
        targetAudience: ['希望改善人际关系的人', '职场沟通有困难的用户', '想提升表达能力的人群'],
        route: '/communication-assessment',
      },
      {
        id: 'parent-ability',
        category: 'AI 测评诊断',
        name: '家长应对能力测评',
        emoji: '🛡️',
        tagline: '基于父母三力模型，发现优势和提升方向',
        description: '基于"父母三力模型"（情绪稳定力、情绪洞察力、关系修复力），通过24道专业量表，帮助家长全面了解自己在面对孩子情绪时的应对能力，发现优势和需要提升的方向。',
        highlights: [
          '24道专业量表',
          '情绪稳定力评估',
          '情绪洞察力评估',
          '关系修复力评估',
        ],
        targetAudience: ['有学龄儿童的家长', '亲子关系有困惑的父母', '希望提升育儿能力的家长'],
        route: '/parent-ability-assessment',
      },
      {
        id: 'midlife-awakening',
        category: 'AI 测评诊断',
        name: '中年觉醒测评',
        emoji: '🌅',
        tagline: '探索人生下半场的方向与力量',
        description: '专为35-55岁人群设计的生命觉醒测评，帮助您在人生中场重新审视价值观、生活方式和内心需求，找到下半场的方向与力量。',
        highlights: [
          '专为中年人群设计',
          '多维度生命觉醒评估',
          '个性化转型建议',
          'AI教练深度陪伴',
        ],
        targetAudience: ['35-55岁的中年人群', '经历人生转折期的用户', '渴望重新定义人生意义的人'],
        route: '/midlife-awakening',
      },
    ],
  },
  {
    id: 'ai-coaches',
    name: 'AI 教练空间',
    emoji: '🤖',
    modules: [
      {
        id: 'emotion-coach',
        category: 'AI 教练空间',
        name: '情绪教练',
        emoji: '💚',
        tagline: '温暖陪伴，看见你的情绪与需要',
        description: '专业的AI情绪教练，运用心理学原理和共情技术，帮助您识别、理解和管理情绪。无论是焦虑、压力还是情绪低落，都能在对话中找到出口和方向。',
        highlights: [
          '24/7全天候陪伴',
          '专业心理学方法论',
          '情绪识别与梳理',
          '个性化应对策略',
        ],
        targetAudience: ['情绪困扰的用户', '需要倾诉的人群', '想学习情绪管理的用户'],
        route: '/coach/emotion',
      },
      {
        id: 'parent-coach',
        category: 'AI 教练空间',
        name: '亲子教练',
        emoji: '👨‍👩‍👧',
        tagline: '科学育儿，建立温暖亲子关系',
        description: '基于积极心理学和发展心理学的AI亲子教练，帮助父母理解孩子行为背后的需求，掌握有效沟通技巧，建立健康的亲子互动模式。',
        highlights: [
          '科学育儿方法指导',
          '亲子冲突化解技巧',
          '孩子行为解读',
          '家庭氛围改善建议',
        ],
        targetAudience: ['各年龄段孩子的父母', '亲子关系紧张的家庭', '新手父母'],
        route: '/parent-coach',
      },
      {
        id: 'communication-coach',
        category: 'AI 教练空间',
        name: '沟通教练',
        emoji: '💬',
        tagline: '提升表达力，化解人际困境',
        description: '专注于人际沟通能力提升的AI教练，帮助您掌握非暴力沟通、积极倾听、有效表达等核心技能，轻松应对职场沟通、家庭对话和社交场景。',
        highlights: [
          '非暴力沟通训练',
          '职场沟通场景模拟',
          '冲突化解策略',
          '表达力系统提升',
        ],
        targetAudience: ['职场沟通有困难的人', '人际关系需要改善的用户', '想提升表达能力的人群'],
        route: '/communication-coach',
      },
      {
        id: 'story-coach',
        category: 'AI 教练空间',
        name: '故事教练',
        emoji: '📖',
        tagline: '用故事的力量重写人生叙事',
        description: '通过叙事疗法的方式，AI故事教练帮助您重新审视人生故事，发现被忽略的力量和资源，重新书写更有力量的生命叙事。',
        highlights: [
          '叙事疗法方法论',
          '人生故事重构',
          '发现内在力量',
          '生成专属生命故事',
        ],
        targetAudience: ['想要自我探索的用户', '经历人生转折的人', '渴望找到人生意义的人群'],
        route: '/story-coach',
      },
      {
        id: 'vibrant-life',
        category: 'AI 教练空间',
        name: '有劲生活教练',
        emoji: '❤️',
        tagline: '日常问题，综合陪伴',
        description: '您的全能AI生活教练，涵盖日常生活中的各种问题和挑战。无论是生活规划、习惯养成还是个人成长，都能给您贴心的陪伴和实用的建议。',
        highlights: [
          '日常生活全方位支持',
          '习惯养成指导',
          '生活规划建议',
          '综合问题解答',
        ],
        targetAudience: ['需要日常生活指导的用户', '想要提升生活质量的人', '各类问题需要咨询的人群'],
        route: '/coach/vibrant_life_sage',
      },
      {
        id: 'wealth-coach',
        category: 'AI 教练空间',
        name: '财富教练',
        emoji: '💰',
        tagline: '突破财富卡点，开启丰盛之路',
        description: '专注于财富认知和理财心态的AI教练，帮助您识别并突破财富认知中的限制性信念，建立健康的金钱关系，制定切实可行的财富成长计划。',
        highlights: [
          '财富信念重塑',
          '理财心态调整',
          '财富目标规划',
          '突破限制性信念',
        ],
        targetAudience: ['想改善财务状况的用户', '有财务焦虑的人群', '希望建立健康金钱观的人'],
        route: '/coach/wealth_coach_4_questions',
      },
      {
        id: 'gratitude-coach',
        category: 'AI 教练空间',
        name: '感恩教练',
        emoji: '🌸',
        tagline: '培养感恩心态，提升幸福感',
        description: '基于积极心理学的感恩练习教练，通过每日感恩引导、正念练习和幸福感提升训练，帮助您培养感恩的生活态度，显著提升整体幸福感和生活满意度。',
        highlights: [
          '每日感恩引导',
          '正念练习指导',
          '幸福感提升训练',
          '感恩日记生成',
        ],
        targetAudience: ['想提升幸福感的用户', '对生活感到倦怠的人', '希望培养正向心态的人群'],
        route: '/gratitude-journal-intro',
      },
    ],
  },
  {
    id: 'tools',
    name: '成长工具箱',
    emoji: '🧰',
    modules: [
      {
        id: 'awakening-diary',
        category: '成长工具箱',
        name: '觉察日记',
        emoji: '📔',
        tagline: 'AI教练陪你写日记，看见情绪变化轨迹',
        description: '六维觉察系统（情绪/感恩/行动/选择/关系/方向），AI教练实时陪伴您的日记写作过程，帮助您看见内心的情绪波动和成长轨迹，生成精美的觉察卡片。',
        highlights: [
          '6大觉醒维度引导',
          'AI教练实时陪伴',
          '情绪变化轨迹追踪',
          '生成觉察卡片',
        ],
        targetAudience: ['想要自我觉察的用户', '有写日记习惯的人', '希望看见内心变化的人群'],
        route: '/awakening-intro',
      },
      {
        id: 'emotion-button',
        category: '成长工具箱',
        name: '情绪SOS按钮',
        emoji: '🆘',
        tagline: '崩溃时按一下就好，3分钟恢复平静',
        description: '当情绪崩溃或焦虑袭来时，一键启动紧急情绪支持。包含多种科学呼吸练习、正念引导和即时情绪疏导，帮助您在3分钟内从混乱恢复到平静。',
        highlights: [
          '一键紧急情绪支持',
          '多种呼吸练习模式',
          '3分钟快速恢复',
          '即时情绪疏导',
        ],
        targetAudience: ['经常感到焦虑的用户', '情绪容易波动的人', '需要即时情绪支持的人群'],
        route: '/emotion-button-intro',
      },
      {
        id: 'alive-check',
        category: '成长工具箱',
        name: '死了吗打卡',
        emoji: '🫀',
        tagline: '每天1秒确认活着，唤醒生命热情',
        description: '每天用1秒钟确认"我还活着"，用最简单的方式唤醒对生命的感知和热情。支持连续打卡记录和紧急联系人通知功能，让每一天都充满觉知。',
        highlights: [
          '每天1秒确认活着',
          '唤醒生命热情',
          '连续打卡记录',
          '紧急联系人通知',
        ],
        targetAudience: ['感觉生活麻木的用户', '想要活在当下的人', '需要每日仪式感的人群'],
        route: '/alive-check-intro',
      },
    ],
  },
  {
    id: 'camps',
    name: '训练营体系',
    emoji: '🏕️',
    modules: [
      {
        id: 'emotion-camp',
        category: '训练营体系',
        name: '21天情绪日记训练营',
        emoji: '📝',
        tagline: '21天建立情绪觉察习惯',
        description: '通过21天系统化的情绪日记练习，结合AI教练每日陪伴和真人教练定期辅导，帮助您建立稳定的情绪觉察习惯，实现从内在觉醒到外在行动的转化。',
        highlights: [
          '21天系统化练习',
          'AI教练每日陪伴',
          '真人教练辅导',
          '社群支持与共创',
        ],
        targetAudience: ['想建立情绪管理习惯的人', '希望系统性成长的用户', '喜欢被陪伴式学习的人群'],
        route: '/camp-intro/emotion_diary',
      },
      {
        id: 'wealth-camp',
        category: '训练营体系',
        name: '财富觉醒训练营',
        emoji: '💰',
        tagline: '突破财富卡点，开启丰盛之路',
        description: '结合财富卡点测评和深度教练对话，在训练营的结构化环境中，系统性地识别和突破您的财富限制性信念，建立全新的财富认知框架。',
        highlights: [
          '财富卡点深度诊断',
          '系统性信念重塑',
          '行动计划制定',
          '教练全程陪伴',
        ],
        targetAudience: ['想突破财务瓶颈的人', '有财富焦虑的用户', '渴望财务自由的创业者'],
        route: '/camp-intro/wealth_awakening',
      },
      {
        id: 'teen-camp',
        category: '训练营体系',
        name: '21天青少年困境突破营',
        emoji: '🌱',
        tagline: '帮助青少年走出困境，找到方向',
        description: '专为青少年设计的21天成长训练营，通过AI教练和真人教练的双重支持，帮助青少年建立自信、管理情绪、改善人际关系，找到自己的成长方向。',
        highlights: [
          '专为青少年设计',
          '双重教练支持',
          '自信心建立',
          '成长方向引导',
        ],
        targetAudience: ['12-18岁青少年', '青少年的家长', '关注青少年成长的教育工作者'],
        route: '/parent-camp',
      },
    ],
  },
  {
    id: 'bloom',
    name: '绽放系列',
    emoji: '🦋',
    modules: [
      {
        id: 'bloom-camp',
        category: '绽放系列',
        name: '绽放训练营',
        emoji: '🦋',
        tagline: '深度转化课程，实现生命绽放',
        description: '三阶深度转化课程体系（情绪篇、身份篇、生命篇），由真人教练1对1深度陪伴，帮助您从情绪疗愈到身份重建，最终实现生命的全面绽放。',
        highlights: [
          '三阶深度课程体系',
          '真人教练1对1陪伴',
          '从疗愈到绽放的完整路径',
          '社群支持与见证',
        ],
        targetAudience: ['渴望深度自我转化的用户', '希望实现生命绽放的人', '愿意投入长期成长的人群'],
        route: '/camp-intro/bloom',
      },
      {
        id: 'bloom-coach',
        category: '绽放系列',
        name: '绽放教练（真人1对1）',
        emoji: '🌟',
        tagline: '真人教练1对1咨询，深度陪伴成长',
        description: '经过专业培训的真人绽放教练，提供1对1深度咨询服务。通过预付卡充值模式，灵活预约教练时间，在生命的重要节点获得专业而温暖的深度陪伴。',
        highlights: [
          '真人教练专业陪伴',
          '1对1深度咨询',
          '灵活预约制度',
          '预付卡充值模式',
        ],
        targetAudience: ['需要真人陪伴的用户', '面对重大人生抉择的人', '希望获得深度指导的人群'],
        route: '/coaching-intro',
      },
    ],
  },
  {
    id: 'partner',
    name: '合伙人计划',
    emoji: '🤝',
    modules: [
      {
        id: 'youjin-partner',
        category: '合伙人计划',
        name: '有劲合伙人',
        emoji: '💪',
        tagline: '预购体验包，长期分成',
        description: '加入有劲合伙人计划，获得体验包权益（50点AI教练、三大测评、日常工具），同时享受推广7款产品的长期分成收益。一次购买，持续收益。',
        highlights: [
          '50点AI教练体验',
          '三大专业测评',
          '日常工具永久使用',
          '7款产品推广分成',
        ],
        targetAudience: ['对平台产品感兴趣的用户', '想要额外收入的人', '认可平台理念的推广者'],
        route: '/partner/youjin-intro',
      },
      {
        id: 'bloom-partner',
        category: '合伙人计划',
        name: '绽放合伙人',
        emoji: '👑',
        tagline: '事业合伙人，共创财富未来',
        description: '绽放系列的深度合伙人计划，参与绽放训练营和教练体系的推广，享受更高比例的分成收益和更多专属权益。与平台共同成长，共创财富未来。',
        highlights: [
          '高比例分成收益',
          '专属合伙人权益',
          '深度参与平台发展',
          '共创财富未来',
        ],
        targetAudience: ['认可绽放理念的用户', '有推广资源的合伙人', '渴望事业新方向的人群'],
        route: '/bloom-partner-intro',
      },
    ],
  },
];

// 获取所有产品模块的扁平列表
export function getAllModules(): ProductModule[] {
  return productCatalog.flatMap(cat => cat.modules);
}

// 根据ID获取产品模块
export function getModuleById(id: string): ProductModule | undefined {
  return getAllModules().find(m => m.id === id);
}
