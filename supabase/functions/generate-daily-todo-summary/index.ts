import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DailyTodo {
  id: string;
  title: string;
  priority: string;
  completed: boolean;
  estimated_time: number | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, date } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    // 获取当日所有待办
    const { data: todos, error: fetchError } = await supabase
      .from('daily_todos')
      .select('*')
      .eq('user_id', user_id)
      .eq('date', targetDate);

    if (fetchError) {
      throw fetchError;
    }

    const totalCount = todos?.length || 0;
    const completedCount = todos?.filter((t: DailyTodo) => t.completed).length || 0;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const overdueItems = todos?.filter((t: DailyTodo) => !t.completed).map((t: DailyTodo) => ({
      title: t.title,
      priority: t.priority,
    })) || [];

    // 使用 AI 生成总结
    let aiSummary = '';
    let insights = '';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (LOVABLE_API_KEY && totalCount > 0) {
      try {
        const completedTitles = todos?.filter((t: DailyTodo) => t.completed).map((t: DailyTodo) => t.title).join('、') || '无';
        const pendingTitles = todos?.filter((t: DailyTodo) => !t.completed).map((t: DailyTodo) => t.title).join('、') || '无';

        const prompt = `你是有劲AI生命教练，帮助用户做待办事项的每日总结。

今日待办情况：
- 总计：${totalCount}项
- 完成：${completedCount}项（${completionRate.toFixed(0)}%）
- 已完成：${completedTitles}
- 未完成：${pendingTitles}

请用温暖鼓励的语气，生成两段内容：
1. 一句简短的今日总结（不超过50字），肯定已完成的，温柔理解未完成的
2. 一句洞察建议（不超过30字），帮助明天更好地完成

格式要求：
{
  "summary": "今日总结内容",
  "insights": "洞察建议内容"
}

只输出JSON，不要其他内容。`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          
          try {
            // 尝试解析 JSON
            const parsed = JSON.parse(content);
            aiSummary = parsed.summary || '';
            insights = parsed.insights || '';
          } catch {
            // 如果解析失败，使用原始内容作为总结
            aiSummary = content?.slice(0, 100) || '';
          }
        }
      } catch (aiError) {
        console.error('AI summary generation error:', aiError);
      }
    }

    // 如果没有 AI 总结，生成默认总结
    if (!aiSummary && totalCount > 0) {
      if (completionRate === 100) {
        aiSummary = `太棒了！今天${totalCount}项待办全部完成，继续保持！`;
      } else if (completionRate >= 50) {
        aiSummary = `今天完成了${completedCount}/${totalCount}项，已经很努力了，明天继续加油！`;
      } else if (completedCount > 0) {
        aiSummary = `今天完成了${completedCount}项，每一步都是进步。明天我们一起完成更多！`;
      } else {
        aiSummary = `今天的待办还没开始，没关系，明天是新的开始。`;
      }
    }

    // 保存总结
    const { data: summary, error: upsertError } = await supabase
      .from('daily_todo_summaries')
      .upsert({
        user_id,
        date: targetDate,
        total_count: totalCount,
        completed_count: completedCount,
        completion_rate: completionRate,
        overdue_items: overdueItems,
        ai_summary: aiSummary,
        insights,
      }, {
        onConflict: 'user_id,date',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      throw upsertError;
    }

    console.log(`[GenerateTodoSummary] Generated summary for user ${user_id}, date ${targetDate}`);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate todo summary error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
