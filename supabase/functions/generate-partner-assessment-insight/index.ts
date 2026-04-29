import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { dimensionScores, primaryPattern, totalScore, maxScore, aiInsightPrompt, title } = await req.json();
    const isMaleMidlifeVitality = String(title || '').includes('有劲') || String(title || '').includes('男性');

    const systemPrompt = aiInsightPrompt || `你是劲老师，一位温暖专业的心理教练。请基于测评结果提供个性化建议。
要求：
1. 先用1-2句话温暖地概括TA的特点
2. 提供3条具体可操作的改善建议（每条30字以内）
3. 推荐1个本周可以开始的小练习
4. 语气温暖、不说教、像朋友聊天
输出格式为纯文本，用换行分隔。`;

    const userPrompt = `测评名称：${title || '综合测评'}
${isMaleMidlifeVitality ? '重要评分说明：本测评原始分是“恢复阻力分”，低分代表当前状态更稳，高分代表恢复阻力更高。解读时请转译为“有劲状态”，不要把低原始分说成状态差。' : ''}
测评结果：
- 主要模式：${primaryPattern || '未知'}
- 综合得分：${totalScore}/${maxScore}
- 各维度得分：${(dimensionScores || []).map((d: any) => `${d.label} ${d.score}/${d.maxScore}`).join('、')}

请给出个性化建议。`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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
        return new Response(JSON.stringify({ error: 'Rate limited' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
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
