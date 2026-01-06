import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * 为现有日记补充提取教练记忆的按钮
 * 主要用于在记忆提取功能上线前创建的日记
 */
export const BackfillMemoriesButton = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const queryClient = useQueryClient();

  const handleBackfill = async () => {
    if (!user?.id || isProcessing) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: 0 });

    try {
      // 1. 获取最近的日记（最多10条）
      const { data: journals, error: fetchError } = await supabase
        .from('wealth_journal_entries')
        .select('id, day_number, meditation_reflection, behavior_block, emotion_block, belief_block, new_belief, giving_action, emotion_need')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;

      if (!journals || journals.length === 0) {
        toast.info('没有找到日记记录');
        return;
      }

      setProgress({ current: 0, total: journals.length });
      let successCount = 0;

      // 2. 逐个处理日记
      for (let i = 0; i < journals.length; i++) {
        const journal = journals[i];
        setProgress({ current: i + 1, total: journals.length });

        // 构建模拟对话
        const conversation: { role: string; content: string }[] = [];

        if (journal.meditation_reflection) {
          conversation.push({ role: 'user', content: journal.meditation_reflection });
        }

        if (journal.behavior_block) {
          conversation.push({ role: 'assistant', content: `我听到你说的行为卡点是：${journal.behavior_block}` });
        }

        if (journal.emotion_block) {
          conversation.push({ role: 'user', content: journal.emotion_block });
        }

        if (journal.emotion_need) {
          conversation.push({ role: 'assistant', content: `你内心真正需要的是：${journal.emotion_need}` });
        }

        if (journal.belief_block) {
          conversation.push({ role: 'user', content: journal.belief_block });
        }

        if (journal.new_belief) {
          conversation.push({ role: 'assistant', content: `新的信念是：${journal.new_belief}` });
        }

        if (journal.giving_action) {
          conversation.push({ role: 'user', content: `我今天的给予行动是：${journal.giving_action}` });
        }

        // 至少需要2条对话才有意义
        if (conversation.length < 2) continue;

        try {
          const { error: invokeError } = await supabase.functions.invoke('extract-coach-memory', {
            body: {
              conversation,
              session_id: journal.id,
            }
          });

          if (!invokeError) {
            successCount++;
          }
        } catch (err) {
          console.error(`[BackfillMemories] Day ${journal.day_number} 处理失败:`, err);
        }

        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 刷新记忆列表
      queryClient.invalidateQueries({ queryKey: ['coach-memories'] });

      toast.success(`记忆提取完成`, {
        description: `成功处理 ${successCount}/${journals.length} 条日记`,
      });

    } catch (err) {
      console.error('[BackfillMemories] 错误:', err);
      toast.error('记忆提取失败', {
        description: err instanceof Error ? err.message : '未知错误',
      });
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBackfill}
      disabled={isProcessing}
      className="gap-2"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>提取中 {progress.current}/{progress.total}</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          <span>补充提取历史记忆</span>
        </>
      )}
    </Button>
  );
};
