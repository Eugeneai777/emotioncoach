import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CrossCoachMemory {
  id: string;
  content: string;
  memory_type: 'insight' | 'pattern' | 'milestone' | 'sticking_point' | 'awakening';
  layer: 'behavior' | 'emotion' | 'belief' | null;
  importance_score: number;
  coach_type: string;
  mentioned_count: number;
  source_session_id: string | null;
  created_at: string;
}

// 教练类型标签
export const COACH_TYPE_LABELS: Record<string, string> = {
  wealth: '财富教练',
  emotion: '情绪教练',
  parent: '亲子教练',
  vibrant_life: '生活教练',
  teen: '青少年教练',
  communication: '沟通教练',
  gratitude: '感恩教练',
};

// 记忆类型标签
export const MEMORY_TYPE_LABELS: Record<string, string> = {
  insight: '💡 顿悟',
  pattern: '🔄 模式',
  milestone: '🏆 里程碑',
  sticking_point: '🔒 卡点',
  awakening: '✨ 觉醒',
};

// 层级标签和颜色
export const LAYER_CONFIG: Record<string, { label: string; color: string }> = {
  behavior: { 
    label: '行为层', 
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
  },
  emotion: { 
    label: '情绪层', 
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' 
  },
  belief: { 
    label: '信念层', 
    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' 
  },
};

interface CrossCoachMemoriesOptions {
  /** 当前教练类型（获取该类型的专属记忆） */
  currentCoachType?: string;
  /** 当前教练记忆数量限制 */
  currentLimit?: number;
  /** 跨教练记忆数量限制 */
  crossLimit?: number;
  /** 跨教练记忆的最低重要度分数 */
  minCrossScore?: number;
  /** 是否启用 */
  enabled?: boolean;
}

interface CrossCoachMemoriesResult {
  /** 当前教练的记忆 */
  currentMemories: CrossCoachMemory[];
  /** 来自其他教练的高分记忆 */
  crossMemories: CrossCoachMemory[];
  /** 所有记忆（当前 + 跨教练） */
  allMemories: CrossCoachMemory[];
  /** 按教练类型分组的记忆 */
  memoriesByCoach: Record<string, CrossCoachMemory[]>;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: Error | null;
}

/**
 * 获取跨教练记忆的 Hook
 * 支持获取当前教练记忆和其他教练的高分洞察
 */
export const useCrossCoachMemories = (
  options: CrossCoachMemoriesOptions = {}
): CrossCoachMemoriesResult => {
  const { user } = useAuth();
  const {
    currentCoachType,
    currentLimit = 5,
    crossLimit = 3,
    minCrossScore = 7,
    enabled = true,
  } = options;

  const query = useQuery({
    queryKey: ['cross-coach-memories', user?.id, currentCoachType, currentLimit, crossLimit, minCrossScore],
    queryFn: async () => {
      if (!user?.id) return { current: [], cross: [] };

      // 并行获取当前教练记忆和跨教练记忆
      const queries = [];

      // 当前教练记忆查询
      if (currentCoachType) {
        queries.push(
          supabase
            .from('user_coach_memory')
            .select('*')
            .eq('user_id', user.id)
            .eq('coach_type', currentCoachType)
            .order('importance_score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(currentLimit)
        );

        // 跨教练高分记忆查询
        queries.push(
          supabase
            .from('user_coach_memory')
            .select('*')
            .eq('user_id', user.id)
            .neq('coach_type', currentCoachType)
            .gte('importance_score', minCrossScore)
            .order('importance_score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(crossLimit)
        );
      } else {
        // 无指定教练类型时，获取所有高分记忆
        queries.push(
          supabase
            .from('user_coach_memory')
            .select('*')
            .eq('user_id', user.id)
            .order('importance_score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(currentLimit + crossLimit)
        );
      }

      const results = await Promise.all(queries);

      if (currentCoachType) {
        return {
          current: (results[0]?.data || []) as CrossCoachMemory[],
          cross: (results[1]?.data || []) as CrossCoachMemory[],
        };
      } else {
        return {
          current: (results[0]?.data || []) as CrossCoachMemory[],
          cross: [] as CrossCoachMemory[],
        };
      }
    },
    enabled: enabled && !!user?.id,
  });

  const currentMemories = query.data?.current || [];
  const crossMemories = query.data?.cross || [];
  const allMemories = [...currentMemories, ...crossMemories];

  // 按教练类型分组
  const memoriesByCoach = allMemories.reduce((acc, memory) => {
    const coachType = memory.coach_type;
    if (!acc[coachType]) {
      acc[coachType] = [];
    }
    acc[coachType].push(memory);
    return acc;
  }, {} as Record<string, CrossCoachMemory[]>);

  return {
    currentMemories,
    crossMemories,
    allMemories,
    memoriesByCoach,
    isLoading: query.isLoading,
    error: query.error,
  };
};

/**
 * 获取全局高分记忆（无教练类型限制）
 */
export const useGlobalMemories = (limit: number = 10, minScore: number = 6) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['global-memories', user?.id, limit, minScore],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_coach_memory')
        .select('*')
        .eq('user_id', user.id)
        .gte('importance_score', minScore)
        .order('importance_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[useGlobalMemories] 查询失败:', error);
        throw error;
      }

      return (data || []) as CrossCoachMemory[];
    },
    enabled: !!user?.id,
  });
};

/**
 * 辅助函数：获取教练类型标签
 */
export const getCoachTypeLabel = (coachType: string): string => {
  return COACH_TYPE_LABELS[coachType] || coachType;
};

/**
 * 辅助函数：获取记忆类型标签
 */
export const getMemoryTypeLabel = (memoryType: string): string => {
  return MEMORY_TYPE_LABELS[memoryType] || memoryType;
};

/**
 * 辅助函数：获取层级配置
 */
export const getLayerConfig = (layer: string | null) => {
  if (!layer) return null;
  return LAYER_CONFIG[layer] || null;
};
