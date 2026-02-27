import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured');

    const { dimensionScores, primaryPattern, secondaryPattern, perspective, totalScore } = await req.json();

    const perspectiveLabel = perspective === 'parent' ? '家长' : '青少年';

    const systemPrompt = `你是劲老师，一位温暖专业的亲子沟通教练。请基于以下亲子沟通模式测评结果，为这位${perspectiveLabel}提供个性化的沟通改善建议。

要求：
1. 先用1-2句话温暖地概括TA的沟通特点（看见优势）
2. 提供3条具体可操作的改善建议（每条30字以内）
3. 推荐1个本周可以开始的小练习
4. 语气温暖、不说教、像朋友聊天

输出格式为纯文本，用换行分隔，不用JSON。`;

    const userPrompt = `测评结果：
- 身份：${perspectiveLabel}
- 主要沟通模式：${primaryPattern}
- 次要沟通模式：${secondaryPattern || '无'}
- 综合得分：${totalScore}/72
- 各维度得分：${dimensionScores.map((d: any) => `${d.label} ${d.score}/${d.maxScore}`).join('、')}

请给出个性化建议。`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || '暂时无法生成建议。';

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
