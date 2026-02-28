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

    const { dimensionScores, subDimensionScores, resultType, resultTitle, followUpAnswers, totalScore, totalMax } = await req.json();

    // 找出最弱子维度
    const weakestSub = subDimensionScores?.reduce((min: any, cur: any) =>
      (cur.score / cur.maxScore) < (min.score / min.maxScore) ? cur : min
    , subDimensionScores[0]);

    const followUpContext = followUpAnswers?.length > 0
      ? `\n\n用户在AI追问中的回答：\n${followUpAnswers.map((f: any) => `- 问题"${f.question}"→ 回答"${f.answer}"（维度：${f.dimension}）`).join('\n')}`
      : '';

    const systemPrompt = `你是劲老师，一位温暖专业的亲子沟通教练。请基于家长的"三力测评"结果，生成个性化的深度解读。

要求严格按JSON格式输出，不要输出其他内容：
{
  "portrait": "3-4句话的家长情绪画像，温暖、精准、不说教",
  "blindSpot": "最弱维度的具体场景分析，告诉家长这个盲区在日常中如何表现",
  "microAction": "本周可执行的1个具体微行动，包含具体步骤",
  "balanceComment": "一句话点评三力平衡状态，有洞见、有启发"
}`;

    const userPrompt = `测评结果：
- 类型：${resultTitle}（${resultType}）
- 综合得分：${totalScore}/${totalMax}
- 三力得分：${dimensionScores.map((d: any) => `${d.label} ${d.score}/${d.maxScore}（${d.percentage}%）`).join('、')}
- 最弱子维度：${weakestSub?.label}（${weakestSub?.score}/${weakestSub?.maxScore}）
- 各子维度得分：${subDimensionScores.map((s: any) => `${s.label} ${s.score}/${s.maxScore}`).join('、')}${followUpContext}

请生成个性化解读。`;

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
    const content = data.choices?.[0]?.message?.content || '';

    let result;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', content);
      result = {
        portrait: '你正在努力成为更好的父母，这本身就是最大的力量。',
        blindSpot: '建议关注自己最弱的维度，从一个小场景开始练习。',
        microAction: '本周尝试：在孩子发脾气时，先深呼吸3次再回应。',
        balanceComment: `你的三力分布显示了独特的模式，系统训练将帮助你更好地平衡三力。`,
      };
    }

    return new Response(JSON.stringify(result), {
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
