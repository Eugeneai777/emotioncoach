import { GRADIENT_PRESETS } from "./GradientPicker";

export interface CardTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundValue: string;
  textColor: "dark" | "light";
  imagePosition: "right" | "left" | "top" | "background";
  hasReminder: boolean;
  reminderTime: string;
  reminderMessage: string;
  actionText: string;
  actionType: string;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: "daily_checkin",
    name: "每日打卡",
    category: "习惯养成",
    icon: "📅",
    emoji: "✅",
    title: "今天，你打卡了吗？",
    subtitle: "坚持每一天，成就更好的自己",
    description: "记录你的每日进步，让好习惯成为生活的一部分。持续打卡，见证成长的力量。",
    backgroundValue: GRADIENT_PRESETS[1].value, // 治愈绿
    textColor: "dark",
    imagePosition: "right",
    hasReminder: true,
    reminderTime: "21:00",
    reminderMessage: "别忘了今天的打卡哦 ✨",
    actionText: "立即打卡",
    actionType: "chat",
  },
  {
    id: "study_plan",
    name: "学习计划",
    category: "学习成长",
    icon: "📚",
    emoji: "📖",
    title: "今日学习目标",
    subtitle: "每天进步一点点",
    description: "制定学习计划，追踪学习进度。持续学习，让知识成为你最宝贵的财富。",
    backgroundValue: GRADIENT_PRESETS[2].value, // 宁静蓝
    textColor: "dark",
    imagePosition: "right",
    hasReminder: true,
    reminderTime: "09:00",
    reminderMessage: "该开始今天的学习计划了 📚",
    actionText: "开始学习",
    actionType: "chat",
  },
  {
    id: "exercise_log",
    name: "运动记录",
    category: "健康生活",
    icon: "💪",
    emoji: "🏃",
    title: "运动打卡",
    subtitle: "保持活力，健康生活",
    description: "记录你的运动轨迹，监测身体变化。每一次挥汗如雨，都是对自己的投资。",
    backgroundValue: GRADIENT_PRESETS[3].value, // 暖阳橙
    textColor: "dark",
    imagePosition: "right",
    hasReminder: true,
    reminderTime: "18:00",
    reminderMessage: "该活动活动身体啦 💪",
    actionText: "记录运动",
    actionType: "chat",
  },
  {
    id: "gratitude_diary",
    name: "感恩日记",
    category: "情绪管理",
    icon: "🙏",
    emoji: "💝",
    title: "今天的小确幸",
    subtitle: "感恩生活中的美好",
    description: "记录每天值得感恩的事，培养积极心态。发现生活中的小美好，让心灵更充实。",
    backgroundValue: GRADIENT_PRESETS[0].value, // 温柔粉
    textColor: "dark",
    imagePosition: "right",
    hasReminder: true,
    reminderTime: "20:00",
    reminderMessage: "今天有什么值得感恩的事情呢？💝",
    actionText: "写下感恩",
    actionType: "chat",
  },
  {
    id: "reading_notes",
    name: "阅读笔记",
    category: "学习成长",
    icon: "📝",
    emoji: "📕",
    title: "今日阅读",
    subtitle: "书籍是进步的阶梯",
    description: "记录阅读心得，积累知识财富。每一本书都是一次新的旅程。",
    backgroundValue: GRADIENT_PRESETS[5].value, // 向阳黄
    textColor: "dark",
    imagePosition: "right",
    hasReminder: true,
    reminderTime: "22:00",
    reminderMessage: "该享受阅读时光了 📕",
    actionText: "记录笔记",
    actionType: "chat",
  },
  {
    id: "meditation_time",
    name: "冥想时刻",
    category: "情绪管理",
    icon: "🧘",
    emoji: "🕉️",
    title: "静心冥想",
    subtitle: "与内心对话的时刻",
    description: "每天给自己留出片刻宁静，通过冥想放松身心，找到内在的平静。",
    backgroundValue: GRADIENT_PRESETS[4].value, // 星空紫
    textColor: "light",
    imagePosition: "background",
    hasReminder: true,
    reminderTime: "07:00",
    reminderMessage: "早安，开启一天的冥想时光 🕉️",
    actionText: "开始冥想",
    actionType: "chat",
  },
  {
    id: "water_reminder",
    name: "喝水提醒",
    category: "健康生活",
    icon: "💧",
    emoji: "💦",
    title: "记得喝水",
    subtitle: "健康从每一杯水开始",
    description: "保持充足的水分摄入，让身体保持最佳状态。健康生活，从喝水开始。",
    backgroundValue: "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)",
    textColor: "dark",
    imagePosition: "right",
    hasReminder: true,
    reminderTime: "10:00",
    reminderMessage: "该喝水啦，补充水分 💧",
    actionText: "记录饮水",
    actionType: "chat",
  },
  {
    id: "sleep_tracker",
    name: "睡眠记录",
    category: "健康生活",
    icon: "😴",
    emoji: "🌙",
    title: "优质睡眠",
    subtitle: "好梦，晚安",
    description: "记录睡眠时间和质量，养成良好的睡眠习惯。充足的睡眠是健康的基石。",
    backgroundValue: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #3f51b5 100%)",
    textColor: "light",
    imagePosition: "background",
    hasReminder: true,
    reminderTime: "22:30",
    reminderMessage: "该准备休息了，早睡早起 🌙",
    actionText: "记录睡眠",
    actionType: "chat",
  },
  {
    id: "goal_tracking",
    name: "目标追踪",
    category: "自我提升",
    icon: "🎯",
    emoji: "🎯",
    title: "目标进度",
    subtitle: "每一步都在接近梦想",
    description: "设定目标，追踪进度，让梦想不再遥远。量化你的努力，见证成长的每一步。",
    backgroundValue: "linear-gradient(135deg, #e8eaf6 0%, #c5cae9 50%, #9fa8da 100%)",
    textColor: "dark",
    imagePosition: "right",
    hasReminder: true,
    reminderTime: "19:00",
    reminderMessage: "回顾今天的目标进度 🎯",
    actionText: "查看进度",
    actionType: "chat",
  },
  {
    id: "mood_journal",
    name: "心情日记",
    category: "情绪管理",
    icon: "😊",
    emoji: "💭",
    title: "今日心情",
    subtitle: "记录情绪，理解自己",
    description: "每天记录心情变化，了解自己的情绪模式。觉察情绪，是管理情绪的第一步。",
    backgroundValue: GRADIENT_PRESETS[0].value,
    textColor: "dark",
    imagePosition: "right",
    hasReminder: true,
    reminderTime: "20:30",
    reminderMessage: "今天的心情如何？记录下来吧 💭",
    actionText: "记录心情",
    actionType: "chat",
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: "all", name: "全部模板", icon: "📋" },
  { id: "习惯养成", name: "习惯养成", icon: "✅" },
  { id: "学习成长", name: "学习成长", icon: "📚" },
  { id: "健康生活", name: "健康生活", icon: "💪" },
  { id: "情绪管理", name: "情绪管理", icon: "💝" },
  { id: "自我提升", name: "自我提升", icon: "🎯" },
];
