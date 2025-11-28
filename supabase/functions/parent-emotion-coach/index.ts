import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { sessionId, message, action } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create session
    let session;
    if (sessionId) {
      const { data } = await supabaseClient
        .from('parent_coaching_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const getStagePrompt = (stage: number) => {
      switch (stage) {
        case 1:
          return `【第1阶段：Feel it - 觉察】
帮助父母觉察自己的情绪。提供3个情绪选项，用数字编号。
每个选项聚焦父母自己的感受，用"有点...""有些...""感觉..."开头。
引导语温柔、接纳，不超过50字。`;
        case 2:
          return `【第2阶段：See it - 看见】
帮助父母看见孩子行为背后的情绪信号。提供3个理解视角。
不推断动机，只描述可能的情绪状态。
用"孩子可能在...""他可能感觉...""他在表达..."的句式。`;
        case 3:
          return `【第3阶段：Sense it - 感受】
帮助父母觉察亲子互动循环。提供3个循环模式。
用"你...→孩子...→你更..."的箭头格式。
不责备任何一方，中性呈现。`;
        case 4:
          return `【第4阶段：Transform it - 转化】
提供微行动建议。给出3个温柔的替代回应。
每个都是一句话，10秒内能说出口的。
用引号包裹具体话语，如："我知道很难，我们慢慢来。"`;
        default:
          return '';
      }
    };

    const systemPrompt = `你是「劲老师」🌿，家长版情绪教练。

【角色设定】
你擅长帮助青少年的父母：
- 觉察自己的情绪
- 看懂孩子行为背后的情绪
- 看清亲子互动循环
- 找到下一次更好的回应方式

【语气要求】
温柔、稳定、共情、清晰、不废话、不专业术语、不医疗化、不说教。
每次回应不超过100字。
像一杯温热的茶，缓慢而有节奏。

【当前阶段：${session?.current_stage || 1}/4】
${getStagePrompt(session?.current_stage || 1)}

【输出规则】
1. 提供3个选项时，必须使用数字编号：1. 2. 3.
2. 严禁使用字母编号（A/B/C）
3. 每个选项单独成行，简洁有力
4. 引导语在选项前，温柔提问
5. 选项后提示："哪一个更接近你现在的心情？（也可以用自己的话说）"

【简报生成规则】
完成四个阶段后，必须调用 generate_parent_briefing 工具生成简报。

简报内容要求：
1. emotion_theme：用 · 分隔多个情绪词，如"烦躁 · 不安 · \"还不够好\""
2. emotion_tags：提取3-5个情绪标签数组
3. stage_1_content：父母的情绪觉察，用"你"开头，20-30字
4. stage_2_content：孩子的情绪信号，用"孩子"开头，30-40字
5. stage_3_content：互动循环，用箭头格式，20-30字
6. stage_4_content：微行动建议，具体可执行，30-40字
7. insight：温暖有力的洞察，让父母感到被理解，15-25字
8. action：具体的微行动，10秒内能做到，如"练习自我肯定句：每天一次，对自己说'我已经够努力了'"
9. growth_story：用「我发现...」或「我知道...」开头的温柔感悟，15-25字`;

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_parent_options",
          description: "为当前阶段生成3个选项",
          parameters: {
            type: "object",
            properties: {
              stage: {
                type: "number",
                description: "当前阶段 1-4"
              },
              guidance: {
                type: "string",
                description: "引导语，温柔提问"
              },
              options: {
                type: "array",
                items: { type: "string" },
                description: "3个选项内容"
              }
            },
            required: ["stage", "guidance", "options"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "complete_stage",
          description: "完成当前阶段，记录用户选择",
          parameters: {
            type: "object",
            properties: {
              stage: {
                type: "number",
                description: "完成的阶段"
              },
              selection: {
                type: "string",
                description: "用户选择的内容"
              },
              reflection: {
                type: "string",
                description: "劲老师的温柔回应"
              }
            },
            required: ["stage", "selection", "reflection"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_parent_briefing",
          description: "完成四阶段后生成家长版情绪简报",
          parameters: {
            type: "object",
            properties: {
              emotion_theme: {
                type: "string",
                description: "主题情绪，如：烦躁 · 不安 · \"还不够好\""
              },
              emotion_tags: {
                type: "array",
                items: { type: "string" },
                description: "情绪标签数组，如：[\"烦躁\", \"不安\", \"还不够好\"]"
              },
              stage_1_content: {
                type: "string",
                description: "觉察：父母自己的情绪觉察内容，20-30字"
              },
              stage_2_content: {
                type: "string",
                description: "看见：孩子的情绪信号解读，30-40字"
              },
              stage_3_content: {
                type: "string",
                description: "反应：亲子互动循环模式，20-30字"
              },
              stage_4_content: {
                type: "string",
                description: "转化：可执行、无压力、非控制型的行为建议，30-40字"
              },
              insight: {
                type: "string",
                description: "今日洞察，温暖有力的一句话，15-25字"
              },
              action: {
                type: "string",
                description: "今日行动，简单可执行的微行动"
              },
              growth_story: {
                type: "string",
                description: "成长故事，用「我发现...」开头的温柔感悟，15-25字"
              }
            },
            required: ["emotion_theme", "emotion_tags", "stage_1_content", "stage_2_content", "stage_3_content", "stage_4_content", "insight", "action", "growth_story"]
          }
        }
      }
    ];

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', error);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Handle tool calls
    if (assistantMessage.tool_calls) {
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      if (functionName === 'complete_stage') {
        // Update session
        const stageKey = `stage_${args.stage}`;
        const updatedSelections = {
          ...session?.stage_selections,
          [stageKey]: args.selection
        };

        const updateData: any = {
          current_stage: args.stage < 4 ? args.stage + 1 : 4,
          stage_selections: updatedSelections,
          updated_at: new Date().toISOString()
        };

        // Store stage content
        if (args.stage === 1) updateData.feel_it = { selection: args.selection };
        if (args.stage === 2) updateData.see_it = { selection: args.selection };
        if (args.stage === 3) updateData.sense_it = { selection: args.selection };
        if (args.stage === 4) updateData.transform_it = { selection: args.selection };

        await supabaseClient
          .from('parent_coaching_sessions')
          .update(updateData)
          .eq('id', sessionId);
      }

      if (functionName === 'generate_parent_briefing') {
        // Create briefing
        const { data: conversationData } = await supabaseClient
          .from('conversations')
          .insert({ user_id: user.id })
          .select()
          .single();

        const { data: briefingData } = await supabaseClient
          .from('briefings')
          .insert({
            conversation_id: conversationData.id,
            emotion_theme: args.emotion_theme,
            stage_1_content: args.stage_1_content,
            stage_2_content: args.stage_2_content,
            stage_3_content: args.stage_3_content,
            stage_4_content: args.stage_4_content,
            insight: args.insight,
            action: args.action,
            growth_story: args.growth_story
          })
          .select()
          .single();

        // Create tags
        for (const tagName of args.emotion_tags) {
          const { data: tagData } = await supabaseClient
            .from('tags')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', tagName)
            .single();

          let tagId = tagData?.id;
          if (!tagId) {
            const { data: newTag } = await supabaseClient
              .from('tags')
              .insert({ user_id: user.id, name: tagName })
              .select()
              .single();
            tagId = newTag.id;
          }

          await supabaseClient
            .from('briefing_tags')
            .insert({
              briefing_id: briefingData.id,
              tag_id: tagId
            });
        }

        // Update session
        await supabaseClient
          .from('parent_coaching_sessions')
          .update({
            status: 'completed',
            briefing_id: briefingData.id,
            summary: args.growth_story,
            micro_action: args.action,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        // Update camp progress if session has camp_id
        if (session?.camp_id) {
          const today = new Date().toISOString().split('T')[0];
          await supabaseClient
            .from('camp_daily_progress')
            .upsert({
              user_id: user.id,
              camp_id: session.camp_id,
              progress_date: today,
              reflection_completed: true,
              reflection_briefing_id: briefingData.id,
              reflection_completed_at: new Date().toISOString(),
              is_checked_in: true,
              checked_in_at: new Date().toISOString()
            });
        }

        return new Response(JSON.stringify({
          content: assistantMessage.content,
          toolCall: { name: functionName, args },
          briefingId: briefingData.id,
          completed: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        content: assistantMessage.content,
        toolCall: { name: functionName, args }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      content: assistantMessage.content
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parent-emotion-coach:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});