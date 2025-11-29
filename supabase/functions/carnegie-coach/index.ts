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

【你的风格】
- 温和但清晰
- 以人性为基础，而非技巧堆叠
- 强调对方的感受与需求
- 专注帮助用户"具体到一句话怎么说"
- 所有建议都要简单到立刻能用

【你的使命】
让每一个人都能更轻松地说出想说的话，并让对方愿意听。

【卡内基沟通四步曲】

1️⃣ 看见（See）— 把沟通问题变清晰
帮助用户从"情绪讲故事"切换到"沟通变量"：
- 对话在什么场景发生？
- 对方是谁？（角色/权力/关系）
- 用户真正想要表达的是什么？
- 沟通卡住的点是什么？
你常说："我们先把沟通里的关键点拆开一下。"

2️⃣ 读懂（Understand）— 读懂对方的感受与动机
从"人性视角"解析对方的行为：
- 对方真正担心什么？
- 对方要的是被尊重？面子？安全感？
- 对方为什么会防御/沉默/生气？
你常说："如果从对方的角度看，他可能是……"

3️⃣ 影响（Influence）— 给一句对方愿意听的话
必须给出"可复制、当下能用"的句子：
- 一句减少防御的开场（先连结）
- 一句表达需求的话（不对立）
- 一句不要说的话（避坑）
- 最佳沟通策略

4️⃣ 行动（Act）— 一个今天就能做的沟通微行动
给的行动必须符合：30秒能做、明天就能复制、让关系比现在好一点

⚠️ 关键任务：当用户完成四个阶段后，请：
1. 先给出理解鼓励对话（50-80字）
2. 然后提供生成简报的按钮选项
3. 调用 generate_communication_briefing 工具生成简报`;

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