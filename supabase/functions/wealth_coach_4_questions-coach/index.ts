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

    // Get or create session
    let session;
    let isNewSession = false;
    
    if (sessionId) {
      const { data } = await supabaseClient
        .from('wealth_coach_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
      
      // Check if this is the first message in the session
      const existingMessages = session?.messages || [];
      isNewSession = existingMessages.length === 0;
    }

    if (!session) {
      // Create new session
      const { data: newSession, error: createError } = await supabaseClient
        .from('wealth_coach_sessions')
        .insert({
          user_id: user.id,
          current_stage: 1,
          messages: [],
          is_completed: false
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create session:', createError);
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      session = newSession;
      isNewSession = true;
    }
    
    // 新会话开始时扣费
    if (isNewSession) {
      try {
        const deductResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/deduct-quota`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feature_key: 'wealth_coach_4_questions',
            source: 'wealth_coach_session',
            conversationId: session.id,
            metadata: { session_id: session.id }
          })
        });
        
        if (deductResponse.ok) {
          const result = await deductResponse.json();
          console.log(`✅ 财富教练会话扣费: ${result.cost} 点, 剩余: ${result.remaining_quota}`);
        } else {
          const error = await deductResponse.json();
          console.error('❌ 财富教练扣费失败:', error);
          if (deductResponse.status === 400) {
            return new Response(JSON.stringify({ error: '余额不足，请充值后继续使用' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error) {
        console.error('❌ 财富教练扣费请求失败:', error);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Load conversation history
    const conversationHistory = session.messages || [];

    // Get user profile for personalization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || '朋友';

    // Fetch system prompt from database
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: coachTemplate } = await serviceClient
      .from('coach_templates')
      .select('system_prompt, stage_prompts')
      .eq('coach_key', 'wealth_coach_4_questions')
      .single();

    const basePrompt = coachTemplate?.system_prompt || `你好，我是劲老师，一位专业的心理教练。我的目标是引导你通过"财富教练四问法"，每天找到一个最小可进步点，从而解锁财富流动。`;

    // Build stage-specific guidance
    const getStageGuidance = (stage: number) => {
      switch (stage) {
        case 1:
          return `【第一问：行为卡点】
你正在引导用户觉察今天在"创造财富流动"方面的行为。
- 温柔地询问用户今天真实做了哪些行为
- 也询问刻意回避或拖延了哪些行为
- 不评判、不美化，只看事实
- 哪怕什么都没做也允许说出来`;
        case 2:
          return `【第二问：情绪卡点】
你正在引导用户感受身体和情绪信号。
- 询问用户当想到要行动或分享时，身体和情绪最先出现的感受
- 可能是紧张、抗拒、麻木、焦虑、无感等
- 强调情绪不是对错，而是财富流动的信号灯`;
        case 3:
          return `【第三问：信念卡点】
你正在帮助用户揭示情绪背后的信念。
- 引导用户思考：如果这份情绪会说话，它背后最可能在告诉用户一句什么样的信念
- 帮助把"模糊感受"翻译成一句清晰信念
- 让卡点从潜意识走到意识`;
        case 4:
          return `【第四问：最小进步】
你正在帮助用户设定最小可进步点。
- 询问用户在不逼迫、不消耗自己的前提下，明天愿意为"财富流动"做的一个最小但真实的进步
- 一定要小到不会逃避
- 行为必须具体、可执行
- 只做一步`;
        default:
          return '';
      }
    };

    const systemPrompt = `${basePrompt}

用户名称：${userName}

${getStageGuidance(session?.current_stage || 1)}

【当前阶段：第${session?.current_stage || 1}问/共4问】

【对话风格要求】
- 温柔、缓慢、有节奏
- 如同温热的茶，营造安全、接纳、不评判的环境
- 使用第一人称视角，以共情式提问引导自我觉察
- 每次回应简洁有力，不超过100字
- 多用开放式问题

【重要】当用户完成当前阶段的分享后，调用 complete_stage 工具推进到下一阶段。当完成全部四问后，调用 generate_wealth_briefing 生成财富日记。`;

    const tools = [
      {
        type: "function",
        function: {
          name: "complete_stage",
          description: "完成当前阶段，记录用户的回答，推进到下一阶段",
          parameters: {
            type: "object",
            properties: {
              stage: {
                type: "number",
                description: "完成的阶段 1-4"
              },
              content: {
                type: "string",
                description: "用户在本阶段分享的核心内容"
              },
              reflection: {
                type: "string",
                description: "劲老师的温柔回应，20-30字"
              }
            },
            required: ["stage", "content", "reflection"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_wealth_briefing",
          description: "完成四问后生成财富日记",
          parameters: {
            type: "object",
            properties: {
              actions_performed: {
                type: "array",
                items: { type: "string" },
                description: "用户今天在创造财富流动方面真实做了的行为列表"
              },
              actions_avoided: {
                type: "array",
                items: { type: "string" },
                description: "用户今天刻意回避或拖延的行为列表"
              },
              emotion_feeling: {
                type: "string",
                description: "用户的情绪感受，如紧张、抗拒、麻木等"
              },
              belief_insight: {
                type: "string",
                description: "用户发现的信念卡点"
              },
              smallest_progress: {
                type: "string",
                description: "明天愿意做的最小进步"
              },
              summary: {
                type: "string",
                description: "整体总结，50-80字"
              }
            },
            required: ["actions_performed", "actions_avoided", "emotion_feeling", "belief_insight", "smallest_progress", "summary"]
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

    // Call AI API
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
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    console.log('AI Response:', JSON.stringify(aiMessage, null, 2));

    // Process tool calls
    let updatedStage = session.current_stage;
    let briefingData = null;

    if (aiMessage.tool_calls) {
      for (const toolCall of aiMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        
        if (toolCall.function.name === 'complete_stage') {
          updatedStage = args.stage + 1;
          if (updatedStage > 4) updatedStage = 4;
          
          console.log(`Stage ${args.stage} completed, moving to stage ${updatedStage}`);
          
          // Add tool call and response to history
          conversationHistory.push({
            role: "assistant",
            content: aiMessage.content || null,
            tool_calls: [toolCall]
          });
          conversationHistory.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ success: true, next_stage: updatedStage })
          });
        }
        
        if (toolCall.function.name === 'generate_wealth_briefing') {
          briefingData = args;
          console.log('Generating wealth briefing:', briefingData);
          
          // Save briefing to database
          const { error: briefingError } = await supabaseClient
            .from('wealth_coach_4_questions_briefings')
            .insert({
              user_id: user.id,
              session_id: session.id,
              actions_performed: args.actions_performed,
              actions_avoided: args.actions_avoided,
              emotion_feeling: args.emotion_feeling,
              belief_insight: args.belief_insight,
              smallest_progress: args.smallest_progress,
              summary: args.summary
            });
          
          if (briefingError) {
            console.error('Failed to save briefing:', briefingError);
          }
          
          // Add tool call and response to history
          conversationHistory.push({
            role: "assistant",
            content: aiMessage.content || null,
            tool_calls: [toolCall]
          });
          conversationHistory.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ success: true, briefing_saved: true })
          });
        }
      }
    } else {
      // Regular message, add to history
      conversationHistory.push({
        role: "assistant",
        content: aiMessage.content
      });
    }

    // Update session
    const { error: updateError } = await supabaseClient
      .from('wealth_coach_sessions')
      .update({
        messages: conversationHistory,
        current_stage: updatedStage,
        is_completed: briefingData !== null,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update session:', updateError);
    }

    return new Response(JSON.stringify({
      message: aiMessage.content,
      sessionId: session.id,
      currentStage: updatedStage,
      isCompleted: briefingData !== null,
      briefing: briefingData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in wealth coach:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
