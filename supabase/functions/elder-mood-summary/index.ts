import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('未授权');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('未登录');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logs, error: logsError } = await supabase
      .from('elder_mood_logs')
      .select('mood_label, intensity, feature_used, created_at')
      .eq('child_user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (logsError) throw logsError;

    if (!logs || logs.length === 0) {
      return new Response(
        JSON.stringify({ summary: null, hasData: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('AI配置不完整');

    const moodSummary = logs.map(l =>
      `${new Date(l.created_at).toLocaleDateString('zh-CN')}: ${l.mood_label}(强度${l.intensity}/5), 功能:${l.feature_used}`
    ).join('\n');

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `你是一个温和的家庭关系专家。请根据长辈的使用记录，生成一段简短的周度状态摘要（2-3句话）。
要求：
- 语气温暖、关切
- 只描述趋势，不暴露任何对话内容
- 如果有低落/疲惫情绪，用关怀的方式提及
- 最后给子女一个小建议（比如打个电话、回家看看）
- 控制在80字以内`
          },
          {
            role: 'user',
            content: `以下是长辈近7天的使用记录（仅标签和强度，无对话内容）：\n${moodSummary}\n\n请生成周度状态摘要。`
          }
        ],
      }),
    });

    if (!aiResp.ok) {
      const moodCounts: Record<string, number> = {};
      logs.forEach(l => { moodCounts[l.mood_label] = (moodCounts[l.mood_label] || 0) + 1; });
      const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

      return new Response(
        JSON.stringify({
          summary: `本周长辈共使用${logs.length}次，主要心情为「${topMood[0]}」。记得常联系TA 🌿`,
          hasData: true,
          totalLogs: logs.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResp.json();
    const aiSummary = aiData.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({
        summary: aiSummary,
        hasData: true,
        totalLogs: logs.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('elder-mood-summary error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '生成摘要失败' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
