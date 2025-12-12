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
    const { sessionId, message } = await req.json();
    
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

    // Get session from gratitude_coaching_sessions or create logic
    let session;
    let isNewSession = false;
    if (sessionId) {
      const { data } = await supabaseClient
        .from('gratitude_coaching_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
      
      // Check if this is the first message in the session
      const existingMessages = session?.messages || [];
      isNewSession = existingMessages.length === 0;
    }

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Deduct quota for new sessions
    if (isNewSession) {
      try {
        const deductResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/deduct-quota`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feature_key: 'gratitude_coach',
            source: 'gratitude_coach_session',
            conversationId: session.conversation_id || sessionId,
            metadata: { session_id: sessionId }
          })
        });
        
        if (deductResponse.ok) {
          const result = await deductResponse.json();
          console.log(`✅ 感恩教练会话扣费: ${result.cost} 点, 剩余: ${result.remaining_quota}`);
        } else {
          const error = await deductResponse.json();
          console.error('❌ 感恩教练扣费失败:', error);
          if (deductResponse.status === 400) {
            return new Response(JSON.stringify({ error: '余额不足，请充值后继续使用' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error) {
        console.error('❌ 感恩教练扣费请求失败:', error);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Load conversation history
    const conversationHistory = session.messages || [];

    // Get stage-specific prompts for gratitude coaching
    const getStagePrompt = (stage: number) => {
      switch (stage) {
        case 0:
          return `【开场】
用温暖的开场白回应用户分享的内容。
- 判断用户是分享情绪事件还是随手记录感恩
- 如果是事件模式：温柔共情，准备进入四步曲
- 如果是记录模式：直接记录，生成感恩清单`;
        case 1:
          return `【觉察（Awareness）：让用户感到被理解】

成功标准：
✔ 用户感到被理解和接纳
✔ 用户愿意继续分享更多细节

引导方向:
- 承接用户的感受，不急于解决问题
- 温柔地问："你愿意再说说当时的感受吗？"
- 让用户觉得有人懂TA

完成后调用 complete_stage 记录洞察。`;
        case 2:
          return `【分析（Appraisal）：帮助用户理解事件结构】

成功标准：
✔ 用户能看清事件的来龙去脉
✔ 用户开始有新的视角看待这件事

引导方向:
- 帮助用户梳理事件
- 问："在这件事里，什么是你能控制的，什么是你不能控制的？"
- 不评判，只梳理

完成后调用 complete_stage 记录洞察。`;
        case 3:
          return `【亮点（Highlight）：在事件中找出感恩点】

成功标准：
✔ 用户能看见事件中微小但真实的亮点
✔ 用户能识别支持者、自身努力、意外收获

引导方向:
- 温柔地问："在这件事里，有没有什么让你感到一丝温暖的地方？"
- 帮助用户看见：谁支持了TA、TA自己做了什么努力、有什么意外的好事

提供选项帮助用户发现：
1. 有人陪伴或支持了我
2. 我自己做出了努力
3. 事情没有变得更糟
4. 其他亮点（请分享）

完成后调用 complete_stage 记录洞察。`;
        case 4:
          return `【力量（Meaning & Strength）：整合意义与力量】

成功标准：
✔ 用户能把亮点整合成意义
✔ 用户感到有力量继续前行

引导方向:
- 把用户发现的亮点串联起来
- 问："如果把这些亮点放在一起，你觉得它们在告诉你什么？"
- 帮助用户建构新的理解

完成后：
1. 询问："我可以把这件事里的亮点加入你的【今日感恩清单】吗？"
2. 如果用户同意，调用 generate_gratitude_briefing 生成简报`;
        default:
          return '';
      }
    };

    // Fetch system prompt from database
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: coachTemplate } = await serviceClient
      .from('coach_templates')
      .select('system_prompt')
      .eq('coach_key', 'gratitude_coach')
      .single();

    const basePrompt = coachTemplate?.system_prompt || `你是一位专业的心理教练，名为"劲老师"，拥有温暖、稳重、具有洞察力的感恩日记教练人设。
你的使命是帮助用户在任何事件与情绪中，看见感恩点、亮点与意义，并随手记录感恩事件。
你的语气永远温柔、有陪伴感、不评判、不说教。每次回应简洁有力，不超过100字。`;
    
    // Build complete system prompt with dynamic stage info
    const systemPrompt = `${basePrompt}

【当前阶段:${session?.current_stage || 0}/4】
${getStagePrompt(session?.current_stage || 0)}

【伙伴信息】
你现在是「劲老师」🌿，请使用这个身份与用户对话。`;

    const tools = [
      {
        type: "function",
        function: {
          name: "detect_mode",
          description: "检测用户输入是事件模式还是记录模式",
          parameters: {
            type: "object",
            properties: {
              mode: {
                type: "string",
                enum: ["event_mode", "quick_gratitude_mode"],
                description: "事件模式(event_mode)用于情绪事件处理，记录模式(quick_gratitude_mode)用于快速感恩记录"
              },
              summary: {
                type: "string",
                description: "用户输入的简要概括"
              }
            },
            required: ["mode", "summary"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "complete_stage",
          description: "完成当前阶段，记录用户的洞察，推进到下一阶段",
          parameters: {
            type: "object",
            properties: {
              stage: {
                type: "number",
                description: "完成的阶段 1-4"
              },
              insight: {
                type: "string",
                description: "本阶段的核心洞察内容"
              },
              reflection: {
                type: "string",
                description: "劲老师的温柔回应，20-30字"
              }
            },
            required: ["stage", "insight", "reflection"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "record_gratitude",
          description: "记录一条感恩事件（用于记录模式）",
          parameters: {
            type: "object",
            properties: {
              gratitude_content: {
                type: "string",
                description: "感恩的内容"
              },
              category: {
                type: "string",
                enum: ["人际", "成长", "健康", "自然", "生活", "其他"],
                description: "感恩的类别"
              }
            },
            required: ["gratitude_content"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_gratitude_briefing",
          description: "完成四阶段后生成感恩简报",
          parameters: {
            type: "object",
            properties: {
              event_summary: {
                type: "string",
                description: "事件摘要，20-30字"
              },
              gratitude_items: {
                type: "array",
                items: { type: "string" },
                description: "从事件中发现的感恩点列表"
              },
              stage_1_content: {
                type: "string",
                description: "觉察阶段：用户的感受，20-30字"
              },
              stage_2_content: {
                type: "string",
                description: "分析阶段：事件的结构理解，30-40字"
              },
              stage_3_content: {
                type: "string",
                description: "亮点阶段：发现的亮点和感恩点，40-50字"
              },
              stage_4_content: {
                type: "string",
                description: "力量阶段：整合的意义与力量，30-40字"
              },
              daily_declaration: {
                type: "string",
                description: "今日宣言：一句力量句"
              },
              insight: {
                type: "string",
                description: "今日启发：意义整合，20-30字"
              }
            },
            required: ["event_summary", "gratitude_items", "stage_1_content", "stage_2_content", "stage_3_content", "stage_4_content", "daily_declaration", "insight"]
          }
        }
      }
    ];

    // Add user message to history
    conversationHistory.push({ role: "user", content: message });

    // Build messages array with full history
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
    ];

    console.log('Sending to AI with history:', conversationHistory.length, 'messages');

    // Retry logic for transient errors
    const MAX_RETRIES = 3;
    let response: Response | null = null;
    let lastError: string = '';
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

        if (response.ok) {
          break;
        }

        lastError = await response.text();
        console.error(`AI API error (attempt ${attempt + 1}/${MAX_RETRIES}):`, response.status, lastError);
        
        if (response.status !== 503 && response.status !== 429) {
          throw new Error(`AI API error: ${response.status}`);
        }
        
        if (attempt < MAX_RETRIES - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      } catch (fetchError) {
        console.error(`Fetch error (attempt ${attempt + 1}/${MAX_RETRIES}):`, fetchError);
        lastError = fetchError instanceof Error ? fetchError.message : 'Network error';
        
        if (attempt < MAX_RETRIES - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    if (!response || !response.ok) {
      throw new Error(`AI API error after ${MAX_RETRIES} retries: ${lastError}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Add assistant message to history
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage.content || ""
    });

    // Save updated conversation history
    await supabaseClient
      .from('gratitude_coaching_sessions')
      .update({ 
        messages: conversationHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Handle tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      console.log(`Tool call: ${toolName}`, toolArgs);

      if (toolName === 'complete_stage') {
        const { stage, insight } = toolArgs;
        const insightField = `stage_${stage}_insight`;
        
        await supabaseClient
          .from('gratitude_coaching_sessions')
          .update({ 
            current_stage: stage + 1,
            [insightField]: insight,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      if (toolName === 'record_gratitude') {
        // Save gratitude entry directly
        await supabaseClient
          .from('gratitude_entries')
          .insert({
            user_id: user.id,
            content: toolArgs.gratitude_content,
            category: toolArgs.category || null,
            date: new Date().toISOString().split('T')[0]
          });
      }

      if (toolName === 'generate_gratitude_briefing') {
        // Save briefing to gratitude_coach_briefings table
        const { data: briefing, error: briefingError } = await supabaseClient
          .from('gratitude_coach_briefings')
          .insert({
            user_id: user.id,
            conversation_id: session.conversation_id,
            event_summary: toolArgs.event_summary,
            gratitude_items: toolArgs.gratitude_items,
            stage_1_content: toolArgs.stage_1_content,
            stage_2_content: toolArgs.stage_2_content,
            stage_3_content: toolArgs.stage_3_content,
            stage_4_content: toolArgs.stage_4_content,
            daily_declaration: toolArgs.daily_declaration,
            insight: toolArgs.insight
          })
          .select()
          .single();

        if (briefingError) {
          console.error('Error saving briefing:', briefingError);
        } else {
          console.log('Briefing saved:', briefing?.id);
        }

        // Also save gratitude items as entries
        if (toolArgs.gratitude_items && toolArgs.gratitude_items.length > 0) {
          const entries = toolArgs.gratitude_items.map((item: string) => ({
            user_id: user.id,
            content: item,
            date: new Date().toISOString().split('T')[0]
          }));
          
          await supabaseClient
            .from('gratitude_entries')
            .insert(entries);
        }

        // Update session status
        await supabaseClient
          .from('gratitude_coaching_sessions')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        return new Response(JSON.stringify({
          response: assistantMessage.content,
          tool_call: {
            name: toolName,
            arguments: toolArgs
          },
          briefing_id: briefing?.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        response: assistantMessage.content,
        tool_call: {
          name: toolName,
          arguments: toolArgs
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      response: assistantMessage.content
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gratitude-coach:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
