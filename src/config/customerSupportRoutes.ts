/**
 * 客服系统【单一真相路由源】
 *
 * 所有客服推荐入口必须从这里取，不允许在组件或边缘函数里硬编码 path。
 * 后端 customer-support edge function 的 navigate_to_page.enum 必须与此处的 key 完全对齐。
 *
 * 核对原则：
 * - 每个 route 必须是 src/App.tsx 中已注册的真实前端路由
 * - 不存在的独立路由，统一指向 /coach/<key> 或 /camps
 */

export interface SupportPageInfo {
  route: string;
  emoji: string;
  title: string;
  subtitle: string;
}

export const PAGE_ROUTES: Record<string, SupportPageInfo> = {
  orders: { route: '/settings?tab=account', emoji: '📋', title: '我的订单', subtitle: '查看购买记录和订单状态' },
  profile: { route: '/settings?tab=profile', emoji: '⚙️', title: '个人设置', subtitle: '修改个人信息和偏好' },
  emotion_button: { route: '/energy-studio', emoji: '🎯', title: '情绪按钮', subtitle: '9种情绪场景，即时疗愈' },
  // 感恩日记真实路由（GratitudeHistory）
  gratitude: { route: '/gratitude-journal', emoji: '📝', title: '感恩日记', subtitle: '记录日常感恩，生成幸福报告' },
  emotion_coach: { route: '/coach/vibrant_life_sage', emoji: '💙', title: '情绪教练', subtitle: '深度梳理情绪' },
  parent_coach: { route: '/parent-coach', emoji: '💜', title: '亲子教练', subtitle: '亲子情绪沟通' },
  communication_coach: { route: '/communication-coach', emoji: '💬', title: '沟通教练', subtitle: '改善人际沟通' },
  gratitude_coach: { route: '/coach/gratitude_coach', emoji: '💖', title: '感恩教练', subtitle: '日常感恩练习' },
  story_coach: { route: '/story-coach', emoji: '📖', title: '故事教练', subtitle: '英雄之旅创作' },
  vibrant_life: { route: '/coach/vibrant_life_sage', emoji: '❤️', title: '有劲生活教练', subtitle: '智能总入口' },
  // 真实训练营列表路由是 /camps，不是 /training-camps
  training_camps: { route: '/camps', emoji: '🏕️', title: '训练营', subtitle: '21天系统化训练' },
  community: { route: '/community', emoji: '🌈', title: '社区', subtitle: '分享与交流' },
  packages: { route: '/packages', emoji: '📦', title: '会员套餐', subtitle: '查看所有套餐' },
};

export type SupportPageType = keyof typeof PAGE_ROUTES;

/** 后端 enum 必须与此数组完全一致 */
export const SUPPORT_PAGE_ENUM = Object.keys(PAGE_ROUTES) as SupportPageType[];
