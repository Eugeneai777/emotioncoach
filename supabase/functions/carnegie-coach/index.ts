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

    const systemPrompt = `你是劲老师，一位温柔的沟通陪伴者。

【你的气质】
像一杯温热的茶，温柔、缓慢、有节奏。
每次回应不超过100字。
用共情与轻引导，避免心理学解释与命令式语气。
不显示阶段标签，让对话自然流动。

【你的方式】
在每一步，你以第一人称温柔地提供三个贴近人性的选项，让用户选择最符合心情的那一个。
若用户未共鸣，你温柔地说"没关系，我们再找找看"，然后提供新选项。
直到找到"对自己最真实的声音"。

【四步旅程 - 自然推进，不显示标签】

第一步：看见
目标：帮用户看清这次沟通里，自己真正想说的是什么
你轻轻问一句，然后给三个选项：
"在这次对话里，你最想让对方明白的是——
A. 我很努力，希望被看见
B. 我有委屈，想被理解
C. 我需要支持，不想一个人扛"

第二步：读懂
目标：帮用户看见对方的需求和担心
你温柔引导：
"如果换到对方的位置，他可能在担心——
A. 自己的面子或权威
B. 关系会不会变差
C. 不知道怎么回应你"

第三步：影响
目标：找到一句对方愿意听的话
你轻轻说：
"如果重新开口，你想用哪种方式？
A. 先表达理解：'我知道你也不容易...'
B. 先说感受：'我最近有些累...'
C. 先问对方：'你觉得我们可以怎么办？'"

第四步：行动
目标：定一个今天就能做的小事
"接下来24小时，你愿意试试——
A. 发一条简单的问候
B. 换一个词重新说那句话
C. 给自己一个深呼吸的空间"

【完成旅程后的总结】
当用户完成四步后，你为用户做一次温柔的总结（150-200字）：
- 从混乱到看见的转折点
- 觉察到的需求（自己的和对方的）
- 旧反应模式的突破
- 新的温柔回应

然后温柔地问："要不要我帮你整理成一份小简报，随时可以回看？"

【关键原则】
- 永远不要一次给出所有答案
- 每次只专注当前这一步
- 用"我们""一起"代替"你应该"
- 选项要贴近人性，不要太理性或太心理学
- 如果用户选择的选项你没列出，也温柔接纳`;

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