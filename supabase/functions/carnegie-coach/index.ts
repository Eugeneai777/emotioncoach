import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 根据当前阶段生成阶段提示
const getStagePrompt = (stage: number) => {
  const stagePrompts = {
    0: `【开场：倾听困境】
用温暖的开场白邀请用户分享沟通困境。
认真倾听，不要急着推进。
当用户描述了具体的沟通场景（谁、在哪、想说什么）后，调用 capture_scenario 进入阶段1。`,
    
    1: `【阶段1：看见（See）- 澄清内心】
目标：帮助用户看清自己真正想要什么。
成功标准（观察到以下任意2项即可调用 complete_stage）:
✔ 能说出想要的沟通目标
✔ 能描述当前的卡点
✔ 能表达自己真正想让对方明白的是什么
引导方式：用开放问题，如"在这件事里，你最希望对方能明白的是什么？"`,
    
    2: `【阶段2：读懂（Understand）- 理解对方】
目标：帮助用户从对方角度看问题。
成功标准（观察到以下任意2项即可调用 complete_stage）:
✔ 能从对方角度看问题
✔ 能理解对方的担心/需求
✔ 能说出"原来对方可能是..."这样的洞察
引导方式：给4个理解对方的角度选项，帮用户看见盲点。`,
    
    3: `【阶段3：影响（Influence）- 找到新的表达】
目标：帮助用户找到对方愿意听的表达方式。
成功标准（观察到以下任意1项即可调用 complete_stage）:
✔ 能想出一句对方愿意听的开场白
✔ 能用"我..."句式表达需求
✔ 选择了一种更好的表达方式
引导方式：给3-4个表达方式的选项。`,
    
    4: `【阶段4：行动（Act）- 一个小小的开始】
目标：给出具体可执行的微行动。
成功标准（观察到以下任意1项即可调用 complete_stage）:
✔ 能提出具体可执行的微行动
✔ 表达出"我今天/明天可以试试..."的意愿
完成后：温柔总结收获（150-200字），然后询问用户是否生成简报。`,
    
    5: `【阶段5：等待用户确认】
你已完成四步曲，现在等待用户确认是否生成简报。
只有当用户明确选择"生成简报"或说"生成简报"时，才能调用 generate_communication_briefing。`
  };
  
  return stagePrompts[stage as keyof typeof stagePrompts] || stagePrompts[0];
};

// 根据当前阶段返回允许的工具
const getAvailableTools = (currentStage: number, briefingRequested: boolean) => {
  const captureScenarioTool = {
    type: "function",
    function: {
      name: "capture_scenario",
      description: "记录用户的沟通场景，进入阶段1",
      parameters: {
        type: "object",
        properties: {
          scenario_description: {
            type: "string",
            description: "沟通场景的简要描述"
          }
        },
        required: ["scenario_description"]
      }
    }
  };

  const completeStageTool = {
    type: "function",
    function: {
      name: "complete_stage",
      description: "完成当前阶段，推进到下一阶段。只有当用户达到本阶段的成功标准时才能调用。",
      parameters: {
        type: "object",
        properties: {
          stage_content: {
            type: "string",
            description: "本阶段的核心内容总结"
          }
        },
        required: ["stage_content"]
      }
    }
  };

  const generateBriefingTool = {
    type: "function",
    function: {
      name: "generate_communication_briefing",
      description: "生成结构化的沟通简报。只有在完成四步曲并获得用户确认后才能调用。",
      parameters: {
        type: "object",
        properties: {
          communication_theme: {
            type: "string",
            description: "沟通主题"
          },
          see_content: {
            type: "string",
            description: "看见阶段内容"
          },
          understand_content: {
            type: "string",
            description: "读懂阶段内容"
          },
          influence_content: {
            type: "string",
            description: "影响阶段内容"
          },
          act_content: {
            type: "string",
            description: "行动阶段内容"
          },
          scenario_analysis: {
            type: "string",
            description: "场景分析"
          },
          perspective_shift: {
            type: "string",
            description: "视角转换"
          },
          recommended_script: {
            type: "string",
            description: "推荐话术"
          },
          avoid_script: {
            type: "string",
            description: "避免说的话"
          },
          strategy: {
            type: "string",
            description: "最佳沟通策略"
          },
          micro_action: {
            type: "string",
            description: "今日微行动"
          },
          growth_insight: {
            type: "string",
            description: "沟通成长洞察"
          },
          communication_difficulty: {
            type: "integer",
            description: "沟通难度评分（1-10）",
            minimum: 1,
            maximum: 10
          },
          scenario_type: {
            type: "string",
            enum: ["family", "work", "social", "romantic", "other"],
            description: "场景类型"
          },
          target_type: {
            type: "string",
            enum: ["parent", "child", "spouse", "colleague", "friend", "boss", "other"],
            description: "沟通对象类型"
          },
          difficulty_keywords: {
            type: "array",
            items: { type: "string" },
            description: "难点关键词（3-5个）"
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
  };

  // 根据阶段返回允许的工具
  switch (currentStage) {
    case 0:
      return [captureScenarioTool];
    case 1:
    case 2:
    case 3:
    case 4:
      return [completeStageTool];
    case 5:
      return briefingRequested ? [generateBriefingTool] : [];
    default:
      return [];
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userDifficulty, sessionId } = await req.json();
    
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

    // 获取或创建会话
    let session: any;
    if (sessionId) {
      const { data } = await supabase
        .from('communication_coaching_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
    }

    if (!session) {
      // 创建新会话
      const { data: newSession, error: sessionError } = await supabase
        .from('communication_coaching_sessions')
        .insert({
          user_id: user.id,
          current_stage: 0,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      session = newSession;
    }

    const currentStage = session.current_stage;
    const isFirstMessage = messages.length <= 1;

    // 构建系统提示
    const systemPrompt = `你是劲老师，一位温柔的沟通陪伴者。

【⚠️ 严格规则 - 必须遵守】
1. 你当前在【阶段${currentStage}/4】
2. 你【只能】使用系统允许的工具
3. 【禁止】跳过任何阶段
4. 【禁止】在用户明确说"生成简报"之前调用 generate_communication_briefing
5. 每次回应必须以开放性问题结尾

【你的声音】
- 始终用"我"说话，像朋友聊天
- 语气温柔但不做作，真诚但不说教
- 每次回应80-150字，有呼吸感
- 多用"嗯""我听到了""我能感受到"开头

${isFirstMessage ? `【⭐ 首次对话】
用温暖友好的方式开场，比如："嗨，我是劲老师 👋"
` : ''}
【当前阶段任务】
${getStagePrompt(currentStage)}

${userDifficulty ? `【用户难度评分】用户评价此次沟通难度为：${userDifficulty}/10。生成简报时使用此评分。` : ''}`;

    const availableTools = getAvailableTools(currentStage, session.briefing_requested);

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
        tools: availableTools,
        temperature: 0.6,
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

    // 在返回响应头中包含 session_id
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'X-Session-Id': session.id,
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