import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('未提供认证信息');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('用户认证失败');
    }

    const systemPrompt = `你是 卡内基沟通 AI 教练（Dale Carnegie Communication Coach）🎯

你擅长用"温暖、可被接受、减少防御、有效表达"的方式，帮助用户提升沟通技巧。

【对话节奏原则 - 非常重要】
1. 每次只聚焦一个阶段，用1-2个开放式问题引导用户思考
2. 等用户回应后再进入下一阶段，不要跳跃
3. 先倾听、先共情、再分析、再建议
4. 不要一次给出所有答案，让用户在对话中自己发现
5. 每个阶段结束时简短总结，然后自然过渡

【你的风格】
- 温和但清晰
- 以人性为基础，而非技巧堆叠
- 强调对方的感受与需求
- 专注帮助用户"具体到一句话怎么说"
- 所有建议都要简单到立刻能用

【你的使命】
让每一个人都能更轻松地说出想说的话，并让对方愿意听。

【卡内基沟通四步曲 - 按步骤推进】

🔍 1️⃣ 看见（See）— 把沟通问题变清晰
目标：帮助用户从"情绪讲故事"切换到"沟通变量"
开放式问题示例：
- "在这次沟通中，你最想让对方理解什么？"
- "对话卡住的那个瞬间，发生了什么？"
- "如果对方完全理解你的意思，你希望达成什么结果？"
需要了解：场景、对方是谁、目标、卡点
阶段完成标志：已了解场景、对象、目标、卡点
过渡语：✅ "好的，我大概理解了。我们来看看对方的视角。"

💡 2️⃣ 读懂（Understand）— 读懂对方的感受与动机
目标：从"人性视角"解析对方的行为
开放式问题示例：
- "你觉得对方为什么会有这样的反应？"
- "如果从对方的角度看，他可能在担心什么？"
- "对方最在意的是什么？是面子、安全感、还是被尊重？"
需要分析：对方的担心、需求、防御原因
阶段完成标志：用户开始理解对方的动机
过渡语：✅ "这个视角很有价值。现在我们来想想怎么说更有效。"

🎯 3️⃣ 影响（Influence）— 给一句对方愿意听的话
目标：提供"可复制、当下能用"的句子
必须给出：
- 一句减少防御的开场（先连结）
- 一句表达需求的话（不对立）
- 一句不要说的话（避坑）
- 最佳沟通策略
开放式问题：
- "如果重新开口，你会怎么说第一句话？"
- "有没有一种说法，既表达了你的需求，又不会让对方觉得被指责？"
过渡语：✅ "有了话术，最后给自己定一个小行动。"

✨ 4️⃣ 行动（Act）— 一个今天就能做的沟通微行动
目标：给一个30秒能做、明天就能复制的行动
开放式问题：
- "接下来24小时，你愿意尝试做什么小事？"
- "如果只能改变一个词或一个态度，你会改变什么？"
行动标准：30秒能做、明天就能复制、让关系比现在好一点

【阶段指示器】
在每次回复开头用小标签显示当前阶段：
🔍 看见阶段 | 💡 读懂阶段 | 🎯 影响阶段 | ✨ 行动阶段

⚠️ 关键任务：当用户完成四个阶段后，请：
1. 先给出理解鼓励对话（50-80字）
2. 然后询问是否要生成简报
3. 若用户同意，调用 generate_communication_briefing 工具生成简报`;

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_communication_briefing",
          description: "当用户完成沟通四步曲后，生成结构化的沟通简报",
          parameters: {
            type: "object",
            properties: {
              communication_theme: {
                type: "string",
                description: "沟通主题，如：职场汇报·寻求认可·表达分歧"
              },
              see_content: {
                type: "string",
                description: "看见阶段：场景、对象、目标、卡点的总结"
              },
              understand_content: {
                type: "string",
                description: "读懂阶段：对方的感受、担心、需求的分析"
              },
              influence_content: {
                type: "string",
                description: "影响阶段：开场话术和表达需求的方式"
              },
              act_content: {
                type: "string",
                description: "行动阶段：今日微行动的描述"
              },
              scenario_analysis: {
                type: "string",
                description: "场景分析：对话在哪、对方是谁、核心诉求"
              },
              perspective_shift: {
                type: "string",
                description: "视角转换：对方在意什么、为什么防御"
              },
              recommended_script: {
                type: "string",
                description: "推荐话术：完整的可复制话术"
              },
              avoid_script: {
                type: "string",
                description: "避免说的话：错误示范"
              },
              strategy: {
                type: "string",
                description: "最佳沟通策略"
              },
              micro_action: {
                type: "string",
                description: "今日微行动：30秒能做的具体行动"
              },
              growth_insight: {
                type: "string",
                description: "沟通成长洞察"
              }
            },
            required: [
              "communication_theme",
              "see_content",
              "understand_content",
              "influence_content",
              "act_content",
              "scenario_analysis",
              "perspective_shift",
              "recommended_script",
              "avoid_script",
              "strategy",
              "micro_action",
              "growth_insight"
            ]
          }
        }
      }
    ];

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
          ...messages
        ],
        tools: tools,
        tool_choice: 'auto',
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 配额不足，请联系管理员" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway 错误:', response.status, errorText);
      throw new Error('AI Gateway 请求失败');
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });

  } catch (error: any) {
    console.error('卡内基沟通教练错误:', error);
    return new Response(
      JSON.stringify({ error: error.message || '处理请求时发生错误' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});