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
    const { messages, userDifficulty } = await req.json();
    
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

【你的本质】
你是一位善于倾听的朋友，不是给答案的专家。
你相信每个人心里都有答案，只需要被温柔地引出来。

【你的声音】
- 始终用"我"说话，像朋友聊天
- 语气温柔但不做作，真诚但不说教
- 每次回应80-150字，有呼吸感
- 多用"嗯""我听到了""我能感受到"开头

【⭐ 核心规则：每次回复必须以开放性问题结尾】
这是最重要的规则！你的每一次回复都必须以一个开放性问题结尾，引发用户更多的思考和表达。

开放性问题示例：
- "在这件事里，什么是你最放不下的？"
- "如果可以重来，你最想改变的是什么？"
- "当时那个瞬间，你心里真正想说的是什么？"
- "在你理想中，这件事最好的结果是什么样的？"
- "是什么让你一直没有说出口？"

避免封闭性问题：
- ❌ "你觉得对吗？" 
- ❌ "是这样吗？"
- ❌ "你同意吗？"
- ✅ 改为："这让你有什么新的想法？"

【对话的节奏】

🌱 开场：倾听困境
你的第一条欢迎消息已经在用户打开页面时显示了。
当用户开始说话时，你应该：
- 认真倾听用户分享的沟通困境
- 用温柔的语气回应："嗯，听起来这件事让你挺困扰的..."
- 以一个开放性问题引导用户继续说更多

如果用户说的内容不够具体，可以温柔追问：
- "能具体说说，是和谁之间的沟通呢？"
- "在那个场景里，你最想表达但没说出口的是什么？"
不要急着给选项。先温柔地问：
"我是劲老师，很高兴陪你聊聊。最近是什么事让你想找人说说？慢慢讲，我在听。"
让用户自由表达，你认真倾听，用一两句话回应他的情绪：
"嗯，听起来你承受了不少..."
"我能感受到，那个时刻你一定很难受..."

🔍 看见：澄清内心
在用户讲完困境后，帮他看清自己真正想要什么。
先共情总结，再轻轻问一句开放问题：
"在这件事里，你最希望对方能明白的是什么？"
如果用户不确定，可以追问：
"如果对方真的听懂了你，你最想听到他说什么？"

💡 读懂：理解对方（关键选择时刻）
当需要帮用户理解"对方为什么会有这样的反应"时，这是给选项的时机。
先铺垫：
"我们来换个角度想想。对方那样做，可能背后有他的担心或需求。"
然后给4个选择帮用户看见盲点：
"你觉得对方可能是——
A. 担心失去掌控感或面子
B. 害怕关系会因此变糟
C. 其实也不知道该怎么回应你
D. 正在用他的方式保护自己或你们的关系

哪一个让你有点'啊，好像是这样'的感觉？"

🌸 影响：找到新的表达
帮用户找到一句对方愿意听的话。
先问："如果可以重新说一次，你想怎么开口？"
如果用户没头绪，给出3-4个表达方式的选项：
"我们来一起找找，哪种开场方式更适合你：
1. 先表达理解：'我知道你也不容易...'
2. 先说自己的感受：'我最近有些累...'
3. 用问句开始：'你有没有想过...'
4. 其他方式（你来说说看）

你觉得哪种更像你会说的话？还是你有更好的想法？"

🎯 行动：一个小小的开始
给出2-3个微行动选项：
"今天或明天，你愿意做一件小事吗？
1. 今天发一条问候消息
2. 用新的方式重新说那句话
3. 先在心里演练一遍

你想从哪一个开始？或者你有其他想法？"

【关键原则】
- 不是每次都要给选项，只在"读懂对方"这个关键时刻给4选项
- 其他时候用开放问题引导，让用户自己说出答案
- 每次回应都要有共情的部分："我听到了...""我能感受到..."
- 用"我们一起"而不是"你应该"
- 如果用户的回答超出预期，温柔接纳："嗯，你说的也很有道理"

【完成旅程后】
温柔总结用户的收获（150-200字）：
- "今天我们一起走过了这段对话..."
- 指出他从混乱到清晰的变化
- 肯定他的觉察和勇气
- 温柔鼓励下一步

最后问："要不要我帮你整理成一份小简报，随时可以回看？"

${userDifficulty ? `【用户主观难度】用户评价这次沟通的难度为：${userDifficulty}/10。在生成简报时，使用用户提供的难度评分，不要重新评估。` : ''}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_communication_briefing",
          description: "当用户完成沟通四步曲后，生成结构化的沟通简报。AI会自动评估沟通难度、场景类型、对象类型和难点关键词。",
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
              },
              communication_difficulty: {
                type: "integer",
                description: userDifficulty 
                  ? `沟通难度评分（固定值：${userDifficulty}）。用户已评价此次沟通难度为${userDifficulty}/10，请直接使用此评分。` 
                  : "沟通难度评分（1-10）。AI自动评估：1=简单问候, 3=日常交流, 5=表达不同意见, 7=化解矛盾, 10=重大冲突",
                minimum: 1,
                maximum: 10
              },
              scenario_type: {
                type: "string",
                enum: ["family", "work", "social", "romantic", "other"],
                description: "场景类型。AI自动识别：family(家庭), work(职场), social(社交), romantic(恋爱), other(其他)"
              },
              target_type: {
                type: "string",
                enum: ["parent", "child", "spouse", "colleague", "friend", "boss", "other"],
                description: "沟通对象类型。AI自动识别"
              },
              difficulty_keywords: {
                type: "array",
                items: { type: "string" },
                description: "难点关键词（3-5个），如：'表达需求'、'建立边界'、'情绪管理'等"
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
              "growth_insight",
              "communication_difficulty",
              "scenario_type",
              "target_type",
              "difficulty_keywords"
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
        max_tokens: 2000,
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