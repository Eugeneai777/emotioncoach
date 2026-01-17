/**
 * 跨教练记忆共享工具函数
 * 用于构建各教练可共享的记忆上下文
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 教练类型与中文名称映射
export const COACH_TYPE_LABELS: Record<string, string> = {
  wealth: '财富教练',
  emotion: '情绪教练',
  parent: '亲子教练',
  vibrant_life: '生活教练',
  teen: '青少年教练',
  communication: '沟通教练',
  gratitude: '感恩教练',
};

// 记忆类型与中文名称映射
export const MEMORY_TYPE_LABELS: Record<string, string> = {
  insight: '💡 顿悟',
  pattern: '🔄 模式',
  milestone: '🏆 里程碑',
  sticking_point: '🔒 卡点',
  awakening: '✨ 觉醒',
};

// 层级与中文名称映射
export const LAYER_LABELS: Record<string, string> = {
  behavior: '行为层',
  emotion: '情绪层',
  belief: '信念层',
};

export interface CoachMemory {
  id: string;
  content: string;
  memory_type: string;
  layer: string | null;
  importance_score: number;
  coach_type: string;
  created_at: string;
  mentioned_count: number;
}

export interface CrossCoachMemoryContext {
  currentCoachMemories: CoachMemory[];
  crossCoachMemories: CoachMemory[];
  memoryPrompt: string;
}

/**
 * 获取跨教练记忆上下文
 * @param supabase Supabase客户端
 * @param userId 用户ID
 * @param currentCoachType 当前教练类型
 * @param currentLimit 当前教练记忆数量限制
 * @param crossLimit 跨教练记忆数量限制
 */
export async function getCrossCoachMemoryContext(
  supabase: SupabaseClient,
  userId: string,
  currentCoachType: string,
  currentLimit: number = 5,
  crossLimit: number = 3
): Promise<CrossCoachMemoryContext> {
  // 并行获取当前教练记忆和跨教练高分记忆
  const [currentMemoriesRes, crossMemoriesRes] = await Promise.all([
    // 当前教练的记忆
    supabase
      .from('user_coach_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('coach_type', currentCoachType)
      .order('importance_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(currentLimit),
    // 其他教练的高分记忆（重要度>=7）
    supabase
      .from('user_coach_memory')
      .select('*')
      .eq('user_id', userId)
      .neq('coach_type', currentCoachType)
      .gte('importance_score', 7)
      .order('importance_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(crossLimit),
  ]);

  const currentCoachMemories = (currentMemoriesRes.data || []) as CoachMemory[];
  const crossCoachMemories = (crossMemoriesRes.data || []) as CoachMemory[];

  // 构建记忆提示词
  const memoryPrompt = buildMemoryPrompt(
    currentCoachMemories,
    crossCoachMemories,
    currentCoachType
  );

  return {
    currentCoachMemories,
    crossCoachMemories,
    memoryPrompt,
  };
}

/**
 * 构建记忆提示词
 */
function buildMemoryPrompt(
  currentMemories: CoachMemory[],
  crossMemories: CoachMemory[],
  currentCoachType: string
): string {
  const parts: string[] = [];

  // 当前教练的记忆
  if (currentMemories.length > 0) {
    const coachLabel = COACH_TYPE_LABELS[currentCoachType] || currentCoachType;
    parts.push(`【${coachLabel}对话记忆】`);
    currentMemories.forEach((m, i) => {
      const typeLabel = MEMORY_TYPE_LABELS[m.memory_type] || m.memory_type;
      const layerLabel = m.layer ? `[${LAYER_LABELS[m.layer] || m.layer}]` : '';
      parts.push(`${i + 1}. ${typeLabel}${layerLabel}: ${m.content}`);
    });
    parts.push('');
  }

  // 跨教练的高分记忆
  if (crossMemories.length > 0) {
    parts.push(`【跨教练洞察共享】`);
    parts.push(`以下是用户在其他教练对话中分享的重要觉察，可适当引用以建立全面理解：`);
    
    crossMemories.forEach((m, i) => {
      const sourceLabel = COACH_TYPE_LABELS[m.coach_type] || m.coach_type;
      const typeLabel = MEMORY_TYPE_LABELS[m.memory_type] || m.memory_type;
      const layerLabel = m.layer ? `[${LAYER_LABELS[m.layer] || m.layer}]` : '';
      parts.push(`${i + 1}. 来自${sourceLabel} - ${typeLabel}${layerLabel}: ${m.content}`);
    });
    parts.push('');
  }

  // 使用指南
  if (currentMemories.length > 0 || crossMemories.length > 0) {
    parts.push(`【记忆使用指南】`);
    parts.push(`- 自然引用："你之前提到过..." / "我记得你说过..."`);
    parts.push(`- 建立连接："上次你觉察到...今天有什么新发现吗？"`);
    if (crossMemories.length > 0) {
      parts.push(`- 跨教练引用时更加谨慎，可以说："我注意到你在其他方面也有类似的觉察..."`);
      parts.push(`- 不要生硬地暴露"其他教练"的存在，而是自然地整合洞察`);
    }
  }

  return parts.length > 0 ? '\n\n' + parts.join('\n') : '';
}

/**
 * 获取全局高分记忆（用于智能通知等场景）
 */
export async function getGlobalHighScoreMemories(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 5,
  minScore: number = 6
): Promise<CoachMemory[]> {
  const { data } = await supabase
    .from('user_coach_memory')
    .select('*')
    .eq('user_id', userId)
    .gte('importance_score', minScore)
    .order('importance_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []) as CoachMemory[];
}

/**
 * 更新记忆被引用次数（需要通过RPC或直接SQL实现）
 */
export async function incrementMemoryMentionCount(
  supabase: SupabaseClient,
  memoryIds: string[]
): Promise<void> {
  if (memoryIds.length === 0) return;

  // 逐个更新记忆的引用次数
  for (const id of memoryIds) {
    const { data: current } = await supabase
      .from('user_coach_memory')
      .select('mentioned_count')
      .eq('id', id)
      .single();
    
    if (current) {
      await supabase
        .from('user_coach_memory')
        .update({
          mentioned_count: (current.mentioned_count || 0) + 1,
          last_mentioned_at: new Date().toISOString(),
        })
        .eq('id', id);
    }
  }
}

/**
 * 构建简洁的全局记忆摘要（用于语音对话等场景）
 */
export function buildCompactMemorySummary(
  memories: CoachMemory[],
  maxLength: number = 500
): string {
  if (memories.length === 0) return '';

  const lines = memories.map((m, i) => {
    const sourceLabel = COACH_TYPE_LABELS[m.coach_type] || '';
    return `${i + 1}. ${sourceLabel ? `[${sourceLabel}]` : ''}${m.content}`;
  });

  let result = lines.join('\n');
  if (result.length > maxLength) {
    result = result.slice(0, maxLength) + '...';
  }

  return result;
}
