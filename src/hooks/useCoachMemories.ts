import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CoachMemory {
  id: string;
  content: string;
  memory_type: 'insight' | 'pattern' | 'milestone' | 'sticking_point' | 'awakening';
  layer: 'behavior' | 'emotion' | 'belief' | null;
  importance_score: number;
  mentioned_count: number;
  source_session_id: string | null;
  created_at: string;
}

const memoryTypeLabels: Record<string, string> = {
  insight: '💡 顿悟',
  pattern: '🔄 模式',
  milestone: '🏆 里程碑',
  sticking_point: '🔒 卡点',
  awakening: '✨ 觉醒',
};

const layerLabels: Record<string, string> = {
  behavior: '行为层',
  emotion: '情绪层',
  belief: '信念层',
};

const layerColors: Record<string, string> = {
  behavior: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  emotion: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  belief: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
};

export const useCoachMemories = (limit?: number) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['coach-memories', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('user_coach_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('importance_score', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[useCoachMemories] 查询失败:', error);
        throw error;
      }
      
      return (data || []) as CoachMemory[];
    },
    enabled: !!user?.id,
  });
};

export const getMemoryTypeLabel = (type: string) => memoryTypeLabels[type] || type;
export const getLayerLabel = (layer: string | null) => layer ? layerLabels[layer] : '';
export const getLayerColor = (layer: string | null) => layer ? layerColors[layer] : 'bg-muted text-muted-foreground';
