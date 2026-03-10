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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { input, mode } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'quarrel') {
      systemPrompt = `你是婚因有道的AI关系分析师，擅长分析夫妻争吵和冲突。请根据用户描述的争吵场景，输出以下分析：

1. **🎯 冲突核心问题**：一句话概括真正的矛盾点
2. **😤 双方情绪**：分别描述双方可能的情绪状态
3. **💡 真实需求**：分析双方争吵背后真正想要的是什么
4. **⚡ 误解点**：指出双方可能存在的误解
5. **💬 更好的表达方式**：给出具体的沟通话术示例
6. **🌱 修复建议**：给出2-3条实用的修复建议

语气要温暖、专业、不说教，像一个懂你的朋友在帮你分析。`;
      userPrompt = input;
    } else if (mode === 'coach') {
      systemPrompt = `你是婚因有道的AI沟通教练，专门帮助夫妻改善沟通方式。用户会描述一段"说不清"的委屈或情绪，请你：

1. **🤗 先共情**：用1-2句话表示理解TA的感受
2. **🔍 情绪解读**：帮TA理清真正的情绪和需求
3. **💬 更好的表达方式**：把TA想说的话转化为3种不同的温和表达方式
4. **⚠️ 避免的说法**：列出2个容易引发对抗的表达方式
5. **💡 沟通小技巧**：给出1个具体可用的沟通技巧

语气温暖、像闺蜜聊天，不要太正式。`;
      userPrompt = input;
    } else if (mode === 'assessment-result') {
      systemPrompt = `你是婚因有道的AI婚姻关系分析师。请根据用户的测评回答，生成一份专业的测评报告。报告应包含：

1. **📊 婚姻状态评分**：给出0-100分的评分和等级（优秀/良好/需关注/需干预）
2. **🔍 当前关系阶段**：判断关系处于哪个阶段（甜蜜期/磨合期/倦怠期/危机期等）
3. **⚠️ 主要问题**：指出2-3个核心问题
4. **💡 改善建议**：给出3-4条具体可操作的建议
5. **🌱 积极方面**：指出关系中的积极因素

语气要专业但温暖，给人希望和方向，不要让人感到绝望。`;
      userPrompt = input;
    } else {
      throw new Error('Invalid mode');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
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
    const result = data.choices?.[0]?.message?.content || '暂时无法生成结果。';

    return new Response(JSON.stringify({ result }), {
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
