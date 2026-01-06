// 统一简报类型定义，用于整合多个教练的简报数据

export type CoachType = 'emotion' | 'communication' | 'parent' | 'vibrant_life' | 'story' | 'gratitude' | 'wealth';

export interface UnifiedBriefing {
  id: string;
  created_at: string;
  coachType: CoachType;
  conversation_id: string;
  
  // 统一字段
  theme: string; // 主题/情绪/问题
  intensity: number | null; // 强度/难度（可选）
  insight: string | null; // 洞察
  action: string | null; // 行动建议
  
  // UI 配置
  icon?: string;
  color?: string;
  label?: string;
}

// 教练配置映射
export const coachConfig: Record<CoachType, { icon: string; color: string; label: string; gradient: string }> = {
  emotion: {
    icon: '🎭',
    color: 'text-green-600',
    label: '情绪教练',
    gradient: 'from-green-500/10 to-emerald-500/5'
  },
  communication: {
    icon: '💬',
    color: 'text-blue-600',
    label: '沟通教练',
    gradient: 'from-blue-500/10 to-cyan-500/5'
  },
  parent: {
    icon: '👪',
    color: 'text-purple-600',
    label: '亲子教练',
    gradient: 'from-purple-500/10 to-pink-500/5'
  },
  vibrant_life: {
    icon: '❤️',
    color: 'text-rose-600',
    label: '有劲AI',
    gradient: 'from-rose-500/10 to-red-500/5'
  },
  story: {
    icon: '📖',
    color: 'text-pink-600',
    label: '故事教练',
    gradient: 'from-pink-500/10 to-fuchsia-500/5'
  },
  gratitude: {
    icon: '🙏',
    color: 'text-amber-600',
    label: '感恩教练',
    gradient: 'from-amber-500/10 to-yellow-500/5'
  },
  wealth: {
    icon: '💰',
    color: 'text-yellow-600',
    label: '财富教练',
    gradient: 'from-yellow-500/10 to-amber-500/5'
  }
};

// 简报映射函数
export const mapEmotionBriefing = (b: any): UnifiedBriefing => ({
  id: b.id,
  created_at: b.created_at,
  coachType: 'emotion',
  conversation_id: b.conversation_id,
  theme: b.emotion_theme,
  intensity: b.emotion_intensity,
  insight: b.insight,
  action: b.action,
});

export const mapCommunicationBriefing = (b: any): UnifiedBriefing => ({
  id: b.id,
  created_at: b.created_at,
  coachType: 'communication',
  conversation_id: b.conversation_id || '',
  theme: b.communication_theme,
  intensity: b.communication_difficulty,
  insight: b.growth_insight,
  action: b.micro_action,
});

export const mapParentBriefing = (b: any): UnifiedBriefing => ({
  id: b.briefing_id || b.id,
  created_at: b.created_at,
  coachType: 'parent',
  conversation_id: b.conversation_id || '',
  theme: b.summary || '亲子互动记录',
  intensity: null,
  insight: null,
  action: b.micro_action,
});

export const mapVibrantLifeBriefing = (b: any): UnifiedBriefing => ({
  id: b.id,
  created_at: b.created_at,
  coachType: 'vibrant_life',
  conversation_id: b.conversation_id || '',
  theme: b.user_issue_summary || '生活咨询',
  intensity: null,
  insight: b.reasoning,
  action: null,
});
