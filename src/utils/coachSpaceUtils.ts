export interface CoachSpaceInfo {
  name: string;
  shortName: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  templateId?: string;
  routePath: string;
}

export interface PostBadges {
  coachType?: 'emotion' | 'communication' | 'parent' | 'vibrant_life' | 'wealth';
  coachLabel?: string;
  coachEmoji?: string;
  campName?: string;
  type?: string;
  [key: string]: unknown;
}

export const getCoachSpaceInfo = (
  campType: string | undefined, 
  campName: string | undefined,
  templateId: string | undefined,
  badges?: PostBadges
): CoachSpaceInfo | null => {
  // 优先从 badges 中读取教练类型
  if (badges?.coachType) {
    const coachTypeMap: Record<string, CoachSpaceInfo> = {
      emotion: {
        name: '情绪教练',
        shortName: '情绪',
        emoji: '💚',
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
        routePath: '/'
      },
      communication: {
        name: '沟通教练',
        shortName: '沟通',
        emoji: '💬',
        colorClass: 'text-blue-600 dark:text-blue-400',
        bgClass: 'bg-blue-100 dark:bg-blue-900/30',
        routePath: '/communication-coach'
      },
      parent: {
        name: '亲子教练',
        shortName: '亲子',
        emoji: '👪',
        colorClass: 'text-purple-600 dark:text-purple-400',
        bgClass: 'bg-purple-100 dark:bg-purple-900/30',
        routePath: '/parent-child-diary'
      },
      vibrant_life: {
        name: '有劲AI',
        shortName: '有劲',
        emoji: '❤️',
        colorClass: 'text-rose-600 dark:text-rose-400',
        bgClass: 'bg-rose-100 dark:bg-rose-900/30',
        routePath: '/dynamic-coach'
      },
      wealth: {
        name: '财富教练',
        shortName: '财富',
        emoji: '💰',
        colorClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-100 dark:bg-amber-900/30',
        routePath: '/wealth-coach'
      }
    };
    return coachTypeMap[badges.coachType] || null;
  }

  // 从 badges.campName 读取训练营名称
  const effectiveCampName = campName || badges?.campName;
  
  if (!campType && !effectiveCampName && !templateId) return null;
  
  // 根据 camp_type 或 camp_name 识别教练空间
  if (campType === 'parent_emotion_21' || effectiveCampName?.includes('亲子') || effectiveCampName?.includes('青少年')) {
    return {
      name: '亲子情绪教练',
      shortName: '亲子',
      emoji: '👨‍👩‍👧',
      colorClass: 'text-pink-600 dark:text-pink-400',
      bgClass: 'bg-pink-100 dark:bg-pink-900/30',
      routePath: '/parent-camp-landing'
    };
  }
  
  if (campType === 'emotion_journal_21' || effectiveCampName?.includes('情绪日记')) {
    return {
      name: '情绪日记教练',
      shortName: '情绪',
      emoji: '📝',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
      routePath: '/camp-list'
    };
  }
  
  if (campType === 'emotion_bloom' || effectiveCampName?.includes('绽放')) {
    return {
      name: '情感绽放教练',
      shortName: '绽放',
      emoji: '🌸',
      colorClass: 'text-purple-600 dark:text-purple-400',
      bgClass: 'bg-purple-100 dark:bg-purple-900/30',
      routePath: '/camp-list'
    };
  }
  
  if (campType === 'wealth_block_7' || campType === 'wealth_block_21' || effectiveCampName?.includes('财富') || effectiveCampName?.includes('财富卡点')) {
    return {
      name: '财富觉醒教练',
      shortName: '财富',
      emoji: '💰',
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      routePath: '/wealth-coach'
    };
  }
  
  // 默认：其他训练营
  return {
    name: effectiveCampName || '训练营',
    shortName: '营',
    emoji: '🏕️',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    templateId: templateId,
    routePath: templateId ? `/camp-template/${templateId}` : '/camp-list'
  };
};
