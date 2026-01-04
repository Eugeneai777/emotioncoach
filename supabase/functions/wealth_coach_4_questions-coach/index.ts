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
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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

    // 新会话时扣费（只有一条用户消息时）
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
    if (userMessageCount === 1) {
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
            metadata: { user_id: user.id }
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

    // Fetch user wealth profile for personalization
    const { data: wealthProfile } = await serviceClient
      .from('user_wealth_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get coaching strategy based on user profile
    const getCoachingStrategy = (profile: any) => {
      if (!profile) return { tone: '温柔接纳', focus: '通用引导', keyQuestion: '', avoidance: '', description: '标准模式' };
      
      const strategy = profile.coach_strategy;
      if (strategy && typeof strategy === 'object') {
        return strategy;
      }

      // Fallback strategies
      const strategies: Record<string, any> = {
        chase: {
          tone: '放慢节奏，帮助用户觉察急切',
          focus: '校准行为节奏，减少用力过猛',
          keyQuestion: '你现在感受到多少「急」或「焦」？',
          avoidance: '避免给出太多行动建议，先稳定情绪'
        },
        avoid: {
          tone: '温暖接纳，建立安全感',
          focus: '渐进式暴露，降低门槛',
          keyQuestion: '这个想法让你有多不舒服？',
          avoidance: '避免推动太快，尊重边界'
        },
        trauma: {
          tone: '极度温柔，提供结构化容器',
          focus: '神经系统调节，陪伴式支持',
          keyQuestion: '你现在身体有什么感觉？',
          avoidance: '避免直接触碰创伤，先稳定'
        },
        harmony: {
          tone: '轻松对话，巩固状态',
          focus: '价值放大，复制成功模式',
          keyQuestion: '今天有什么值得庆祝的？',
          avoidance: '避免过度分析，保持流动'
        }
      };
      
      return strategies[profile.reaction_pattern] || strategies.harmony;
    };

    const coachStrategy = getCoachingStrategy(wealthProfile);

    // Build personalized profile section
    let profileSection = '';
    if (wealthProfile) {
      profileSection = `
【用户财富画像】
- 反应模式：${wealthProfile.reaction_pattern || '未知'}
- 主导四穷类型：${wealthProfile.dominant_poor || '未知'}
- 主导情绪卡点：${wealthProfile.dominant_emotion || '未知'}
- 主导信念卡点：${wealthProfile.dominant_belief || '未知'}
- 健康度：${wealthProfile.health_score || 50}/100

【个性化教练策略】
- 对话基调：${coachStrategy.tone}
- 重点关注：${coachStrategy.focus}
- 核心提问：${coachStrategy.keyQuestion}
- 注意避免：${coachStrategy.avoidance}
`;
    }

    const basePrompt = coachTemplate?.system_prompt || `你好，我是劲老师，一位专业的心理教练。我的目标是引导你通过"财富教练四问法"，每天找到一个最小可进步点，从而解锁财富流动。`;

    // 根据对话历史分析当前阶段
    const analyzeCurrentStage = (msgs: any[]) => {
      const assistantMessages = msgs.filter(m => m.role === 'assistant').length;
      if (assistantMessages < 2) return 1;
      if (assistantMessages < 4) return 2;
      if (assistantMessages < 6) return 3;
      return 4;
    };

    const currentStage = analyzeCurrentStage(messages);

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
- 只做一步

完成四问后，请调用 generate_wealth_briefing 工具生成财富日记。`;
        default:
          return '';
      }
    };

    const systemPrompt = `${basePrompt}

用户名称：${userName}
${profileSection}
${getStageGuidance(currentStage)}

【当前阶段：第${currentStage}问/共4问】

【对话风格要求】
- 温柔、缓慢、有节奏
- 如同温热的茶，营造安全、接纳、不评判的环境
- 使用第一人称视角，以共情式提问引导自我觉察
- 每次回应简洁有力，不超过100字
- 多用开放式问题

【重要】根据对话进展自然推进阶段。当完成全部四问后，调用 generate_wealth_briefing 工具生成财富日记。`;

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_wealth_briefing",
          description: "完成四问后生成财富日记简报",
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

    // Build messages array with system prompt
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log('Sending to AI with', messages.length, 'messages, current stage:', currentStage);

    // Call AI API with streaming
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
        tools,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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
