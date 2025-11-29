export interface CoachSpaceInfo {
  name: string;
  shortName: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  templateId?: string;
  routePath: string;
}

export const getCoachSpaceInfo = (
  campType: string | undefined, 
  campName: string | undefined,
  templateId: string | undefined
): CoachSpaceInfo | null => {
  if (!campType && !campName && !templateId) return null;
  
  // 根据 camp_type 或 camp_name 识别教练空间
  if (campType === 'parent_emotion_21' || campName?.includes('亲子') || campName?.includes('青少年')) {
    return {
      name: '亲子情绪教练',
      shortName: '亲子',
      emoji: '👨‍👩‍👧',
      colorClass: 'text-pink-600 dark:text-pink-400',
      bgClass: 'bg-pink-100 dark:bg-pink-900/30',
      routePath: '/parent-camp-landing'
    };
  }
  
  if (campType === 'emotion_journal_21' || campName?.includes('情绪日记')) {
    return {
      name: '情绪日记教练',
      shortName: '情绪',
      emoji: '📝',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
      routePath: '/camp-list'
    };
  }
  
  if (campType === 'emotion_bloom' || campName?.includes('绽放')) {
    return {
      name: '情感绽放教练',
      shortName: '绽放',
      emoji: '🌸',
      colorClass: 'text-purple-600 dark:text-purple-400',
      bgClass: 'bg-purple-100 dark:bg-purple-900/30',
      routePath: '/camp-list'
    };
  }
  
  // 默认：其他训练营
  return {
    name: campName || '训练营',
    shortName: '营',
    emoji: '🏕️',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    templateId: templateId,
    routePath: templateId ? `/camp-template/${templateId}` : '/camp-list'
  };
};
