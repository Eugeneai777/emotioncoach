// 工具配置数据结构
export interface ToolConfig {
  id: string;
  title: string;
  description: string;           // 简短描述（用于卡片）
  detailedDescription: string;   // 详细介绍（用于介绍页）
  iconName: string;              // 图标名称，如 "Wind", "Timer"
  category: "emotion" | "exploration" | "management";
  gradient: string;              // 渐变配色
  usageScenarios: string[];      // 使用场景
  available: boolean;
}

// 分类配置
export interface CategoryConfig {
  id: "emotion" | "exploration" | "management";
  name: string;
  description: string;
  emoji: string;
  tabGradient: string;
}

export const categories: CategoryConfig[] = [
  {
    id: "emotion",
    name: "情绪工具",
    description: "帮助你调节情绪、找回平静",
    emoji: "💜",
    tabGradient: "from-purple-500 to-pink-500"
  },
  {
    id: "exploration",
    name: "自我探索",
    description: "深入了解自己，发现内在力量",
    emoji: "💚",
    tabGradient: "from-teal-500 to-emerald-500"
  },
  {
    id: "management",
    name: "生活管理",
    description: "优化生活习惯，提升生活质量",
    emoji: "🧡",
    tabGradient: "from-orange-500 to-yellow-500"
  }
];

export const tools: ToolConfig[] = [
  // 情绪工具
  {
    id: "declaration",
    title: "能量宣言卡",
    description: "创建个性化能量宣言海报，开启有劲的一天",
    detailedDescription: "选择精美主题模板，输入或AI生成专属能量宣言，一键生成精美海报卡片，支持下载保存和分享到社交媒体。让每一天都从满满的正能量开始。",
    iconName: "Megaphone",
    category: "emotion",
    gradient: "from-purple-500 to-pink-500",
    usageScenarios: ["早晨开启元气满满的一天", "需要自我激励时", "分享正能量给朋友"],
    available: true
  },
  {
    id: "breathing",
    title: "呼吸练习",
    description: "多种呼吸模式，帮助你快速平静下来",
    detailedDescription: "提供4-7-8呼吸法、箱式呼吸、深度呼吸三种科学呼吸模式，配合动画引导和计时提醒，帮助你在几分钟内快速调节情绪状态。",
    iconName: "Wind",
    category: "emotion",
    gradient: "from-cyan-500 to-teal-500",
    usageScenarios: ["紧张焦虑时快速放松", "睡前助眠", "压力大时调节"],
    available: true
  },
  {
    id: "meditation",
    title: "冥想计时器",
    description: "专注冥想，记录你的静心时光",
    detailedDescription: "自选冥想时长（5-30分钟），配备多种背景音效（雨声、海浪、森林），自动记录冥想时间，支持添加冥想笔记。养成每日静心习惯。",
    iconName: "Timer",
    category: "emotion",
    gradient: "from-indigo-500 to-purple-500",
    usageScenarios: ["每日冥想习惯养成", "专注力训练", "放松身心"],
    available: true
  },
  {
    id: "first-aid",
    title: "情绪急救箱",
    description: "快速识别情绪，获取即时缓解技巧",
    detailedDescription: "帮助你快速识别当前情绪状态（愤怒、焦虑、悲伤等），提供即时有效的情绪缓解技巧和专业建议，并提供紧急联系方式和AI陪伴功能。",
    iconName: "HeartPulse",
    category: "emotion",
    gradient: "from-rose-500 to-pink-500",
    usageScenarios: ["情绪突然爆发时", "不知如何应对情绪时", "需要专业建议时"],
    available: true
  },
  {
    id: "mindfulness",
    title: "正念练习",
    description: "AI语音引导，体验正念的力量",
    detailedDescription: "提供身体扫描、五感练习、感恩冥想等多种正念练习方式，每个练习都有详细步骤指导和预期益处说明，帮助提升当下觉察力。",
    iconName: "Sparkles",
    category: "emotion",
    gradient: "from-violet-500 to-indigo-500",
    usageScenarios: ["提升当下觉察力", "减压放松", "培养感恩心态"],
    available: true
  },
  // 自我探索工具
  {
    id: "values",
    title: "价值观探索",
    description: "发现你内心真正珍视的东西",
    detailedDescription: "通过多维度价值观卡片排序和反思练习，帮助你深入了解内心真正珍视的价值观，为人生重大决策提供清晰指引。",
    iconName: "Target",
    category: "exploration",
    gradient: "from-teal-500 to-emerald-500",
    usageScenarios: ["人生抉择、迷茫时", "职业选择困惑", "价值观冲突时"],
    available: true
  },
  {
    id: "strengths",
    title: "优势发现",
    description: "认识你的独特优势和天赋",
    detailedDescription: "通过优势识别测试和报告分析，帮助你发现自己的独特优势和天赋，学会在工作和生活中更好地发挥优势。",
    iconName: "Eye",
    category: "exploration",
    gradient: "from-blue-500 to-violet-500",
    usageScenarios: ["职业规划时", "提升自我认知", "发现个人天赋"],
    available: true
  },
  {
    id: "vision",
    title: "人生愿景画布",
    description: "可视化你的梦想和目标",
    detailedDescription: "通过可视化工具创建人生愿景画布，分领域规划（事业、健康、关系、财富等），让梦想和目标清晰可见，激发行动力。",
    iconName: "ImageIcon",
    category: "exploration",
    gradient: "from-orange-500 to-rose-500",
    usageScenarios: ["年度规划时", "目标设定", "梦想梳理"],
    available: true
  },
  {
    id: "gratitude",
    title: "感恩日记",
    description: "记录生活中的美好瞬间",
    detailedDescription: "分类记录每日感恩事项（人际、成就、简单快乐等），支持历史回顾和感恩趋势分析，培养积极乐观的生活态度。",
    iconName: "BookHeart",
    category: "exploration",
    gradient: "from-pink-500 to-purple-500",
    usageScenarios: ["每日睡前回顾", "培养感恩心态", "提升幸福感"],
    available: true
  },
  {
    id: "relationship",
    title: "人际关系",
    description: "维护关系，珍惜每一份联结",
    detailedDescription: "可视化关系图谱，设置联系提醒，记录互动历史和关系笔记，帮助你更好地维护和珍惜重要的人际关系。",
    iconName: "Heart",
    category: "exploration",
    gradient: "from-red-500 to-pink-500",
    usageScenarios: ["关系梳理", "社交管理", "维护重要关系"],
    available: true
  },
  // 生活管理工具
  {
    id: "habits",
    title: "习惯追踪",
    description: "养成好习惯，追踪你的进步",
    detailedDescription: "每日打卡记录，连续天数统计，数据可视化分析，帮助你养成好习惯，持续进步。支持多个习惯同时追踪。",
    iconName: "Calendar",
    category: "management",
    gradient: "from-green-500 to-teal-500",
    usageScenarios: ["21天习惯养成", "培养新习惯", "追踪进步"],
    available: true
  },
  {
    id: "energy",
    title: "能量管理",
    description: "了解你的能量曲线，优化时间安排",
    detailedDescription: "三维能量监测（体力、脑力、情绪），记录每日能量状态，分析能量趋势，帮助你在最佳状态安排最重要的事。",
    iconName: "Battery",
    category: "management",
    gradient: "from-yellow-500 to-orange-500",
    usageScenarios: ["高效工作安排", "了解能量规律", "优化时间管理"],
    available: true
  },
  {
    id: "sleep",
    title: "睡眠记录",
    description: "追踪睡眠质量，改善休息效果",
    detailedDescription: "记录入睡和醒来时间，睡眠质量评分，睡眠时长统计，发现睡眠模式，提供改善建议。",
    iconName: "Moon",
    category: "management",
    gradient: "from-blue-600 to-indigo-600",
    usageScenarios: ["睡眠改善计划", "追踪睡眠质量", "调整作息"],
    available: true
  },
  {
    id: "exercise",
    title: "运动打卡",
    description: "记录运动数据，保持健康活力",
    detailedDescription: "支持多种运动类型，记录时长、距离、卡路里消耗，可视化运动数据，帮助养成运动习惯，保持健康活力。",
    iconName: "Dumbbell",
    category: "management",
    gradient: "from-orange-500 to-red-500",
    usageScenarios: ["运动习惯养成", "健身打卡", "健康管理"],
    available: true
  },
  {
    id: "finance",
    title: "财务管理",
    description: "记录收支，掌握财务状况",
    detailedDescription: "分类记录收入支出，生成收支趋势图表，分析消费习惯，帮助你更好地掌握个人财务状况。",
    iconName: "DollarSign",
    category: "management",
    gradient: "from-emerald-500 to-green-500",
    usageScenarios: ["日常财务记录", "消费分析", "预算管理"],
    available: true
  },
  {
    id: "time",
    title: "时间管理",
    description: "高效规划，充分利用每一分钟",
    detailedDescription: "任务优先级管理，时间预估和追踪，高效规划每日任务，帮助你充分利用时间，提升工作和生活效率。",
    iconName: "Clock",
    category: "management",
    gradient: "from-sky-500 to-blue-500",
    usageScenarios: ["提升时间效率", "任务管理", "日程规划"],
    available: true
  }
];

// 辅助函数
export const getToolsByCategory = (category: string) => 
  tools.filter(t => t.category === category);

export const getToolById = (id: string) => 
  tools.find(t => t.id === id);

export const getToolCount = () => tools.length;

export const getCategoryCount = (category: string) => 
  tools.filter(t => t.category === category).length;

export const getCategoryConfig = (categoryId: string) =>
  categories.find(c => c.id === categoryId);
