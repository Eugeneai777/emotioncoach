import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentPrompt, instruction, promptType = 'system' } = await req.json();

    if (!currentPrompt) {
      return new Response(
        JSON.stringify({ error: '当前 Prompt 不能为空' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!instruction) {
      return new Response(
        JSON.stringify({ error: '优化指令不能为空' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI 服务未配置' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemMessage = promptType === 'stage' 
      ? `你是专业的心理教练阶段提示词优化专家。你的任务是根据用户的优化指令，改进以下阶段提示词配置。

【优化要求】
1. 保留原有的核心方法论和阶段结构
2. 保持教练的对话风格特征
3. 根据用户指令进行针对性优化
4. 保持 JSON 结构不变，只优化内容
5. 确保返回有效的 JSON 格式

请直接返回优化后的 JSON，不要添加任何解释或 markdown 格式。`
      : `你是专业的心理教练 Prompt 优化专家。你的任务是根据用户的优化指令，改进以下教练系统 Prompt。

【优化要求】
1. 保留原有的核心方法论和四步曲结构（如果有）
2. 保持教练的对话风格特征
3. 根据用户指令进行针对性优化
4. 保持专业性和共情能力
5. 确保输出的 Prompt 可以直接使用

请直接返回优化后的完整 Prompt 文本，不要添加任何解释或 markdown 格式包裹。`;

    const userMessage = `【当前 Prompt】
${typeof currentPrompt === 'string' ? currentPrompt : JSON.stringify(currentPrompt, null, 2)}

【用户优化指令】
${instruction}

请根据以上优化指令，输出改进后的${promptType === 'stage' ? 'JSON' : 'Prompt'}：`;

    console.log('Calling Lovable AI for prompt optimization...');
    console.log('Prompt type:', promptType);
    console.log('Instruction:', instruction);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI 服务请求过于频繁，请稍后再试' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI 服务额度不足，请联系管理员' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI 服务调用失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let optimizedPrompt = data.choices?.[0]?.message?.content;

    if (!optimizedPrompt) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'AI 未返回有效内容' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up potential markdown formatting
    optimizedPrompt = optimizedPrompt.trim();
    if (optimizedPrompt.startsWith('```')) {
      optimizedPrompt = optimizedPrompt.replace(/^```(?:json|text)?\n?/, '').replace(/\n?```$/, '');
    }

    // For stage prompts, validate JSON
    if (promptType === 'stage') {
      try {
        const parsed = JSON.parse(optimizedPrompt);
        optimizedPrompt = JSON.stringify(parsed, null, 2);
      } catch (e) {
        console.error('Failed to parse stage prompts as JSON:', e);
        return new Response(
          JSON.stringify({ error: 'AI 返回的阶段提示词格式无效' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Optimization successful, prompt length:', optimizedPrompt.length);

    return new Response(
      JSON.stringify({ 
        optimizedPrompt,
        usage: data.usage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in optimize-coach-prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '优化失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
