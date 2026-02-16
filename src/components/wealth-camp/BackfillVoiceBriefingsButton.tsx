import { useState } from 'react';
import { Loader2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * 为历史语音通话记录补充生成财富简报
 * 主要用于修复 coach_key 硬编码导致语音记录未生成财富日记的问题
 */
export const BackfillVoiceBriefingsButton = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const queryClient = useQueryClient();

  const handleBackfill = async () => {
    if (!user?.id || isProcessing) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: 0 });

    try {
      // 1. 查找包含财富相关内容的语音记录
      const { data: sessions, error: fetchError } = await supabase
        .from('voice_chat_sessions')
        .select('id, transcript_summary, duration_seconds, created_at')
        .eq('user_id', user.id)
        .gt('duration_seconds', 30)
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      // 过滤出财富相关的语音记录
      const wealthSessions = (sessions || []).filter(s => {
        const text = s.transcript_summary || '';
        return text.includes('财富') || text.includes('卡点') || text.includes('穷') || 
               text.includes('信念') || text.includes('觉醒') || text.includes('训练营');
      });

      if (wealthSessions.length === 0) {
        toast.info('没有找到需要补齐的财富语音记录');
        return;
      }

      // 2. 查找用户的训练营信息
      const { data: campData } = await supabase
        .from('training_camps')
        .select('id, start_date')
        .eq('camp_type', 'wealth')
        .order('created_at', { ascending: false })
        .limit(1);

      const campId = campData?.[0]?.id || null;
      const campStartDate = campData?.[0]?.start_date ? new Date(campData[0].start_date) : null;

      // 3. 查找已有的 wealth_journal_entries 以避免重复
      const { data: existingEntries } = await supabase
        .from('wealth_journal_entries')
        .select('session_id')
        .eq('user_id', user.id);

      const existingSessionIds = new Set(
        (existingEntries || []).map(e => e.session_id).filter(Boolean)
      );

      // 过滤掉已有简报的记录
      const toProcess = wealthSessions.filter(s => !existingSessionIds.has(s.id));

      if (toProcess.length === 0) {
        toast.info('所有语音记录已有对应简报，无需补齐');
        return;
      }

      setProgress({ current: 0, total: toProcess.length });
      let successCount = 0;

      // 4. 逐个处理
      for (let i = 0; i < toProcess.length; i++) {
        const session = toProcess[i];
        setProgress({ current: i + 1, total: toProcess.length });

        // 将 transcript_summary 转换为对话格式
        const lines = (session.transcript_summary || '').split('\n').filter((l: string) => l.trim());
        const conversation: { role: string; content: string }[] = lines.map((line: string, idx: number) => ({
          role: idx % 2 === 0 ? 'assistant' : 'user',
          content: line.trim(),
        }));

        if (conversation.length < 2) continue;

        // 计算 day_number
        let dayNumber = 1;
        if (campStartDate) {
          const sessionDate = new Date(session.created_at);
          dayNumber = Math.max(1, Math.ceil((sessionDate.getTime() - campStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        try {
          const { error: invokeError } = await supabase.functions.invoke('generate-wealth-journal', {
            body: {
              user_id: user.id,
              camp_id: campId,
              session_id: session.id,
              day_number: dayNumber,
              conversation_history: conversation,
            }
          });

          if (!invokeError) {
            successCount++;
          } else {
            console.error(`[BackfillVoice] Session ${session.id} 失败:`, invokeError);
          }
        } catch (err) {
          console.error(`[BackfillVoice] Session ${session.id} 处理失败:`, err);
        }

        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 刷新数据
      queryClient.invalidateQueries({ queryKey: ['wealth-journal-unified'] });
      queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries'] });

      toast.success(`语音简报补齐完成`, {
        description: `成功处理 ${successCount}/${toProcess.length} 条语音记录`,
      });

    } catch (err) {
      console.error('[BackfillVoice] 错误:', err);
      toast.error('语音简报补齐失败', {
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
          <span>补齐中 {progress.current}/{progress.total}</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          <span>补齐语音简报</span>
        </>
      )}
    </Button>
  );
};
