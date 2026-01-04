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
    const { messages, mode } = await req.json();
    
    // mode: 'standard' | 'meditation_analysis'
    const chatMode = mode || 'standard';
    
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

    // Fetch system prompt and stage prompts from database
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

      // Fallback strategies based on reaction pattern
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

    // Parse stage prompts from database
    const stagePrompts = coachTemplate?.stage_prompts as any || {};
    const coachingTechniques = stagePrompts.coaching_techniques || '';

    // Analyze current stage based on complete_stage tool calls and conversation flow
    const analyzeCurrentStage = (msgs: any[]) => {
      // Check for complete_stage markers in conversation
      const assistantMessages = msgs.filter(m => m.role === 'assistant');
      let completedStages = 0;
      
      // Simple heuristic: count assistant responses to estimate stage
      // Each stage typically has 2-3 exchanges
      const totalExchanges = assistantMessages.length;
      
      if (totalExchanges === 0) return 0; // Opening
      if (totalExchanges <= 2) return 1;  // Stage 1: Behavior
      if (totalExchanges <= 4) return 2;  // Stage 2: Emotion
      if (totalExchanges <= 6) return 3;  // Stage 3: Belief
      if (totalExchanges <= 8) return 4;  // Stage 4: Progress
      return 5; // Completion
    };

    const currentStage = analyzeCurrentStage(messages);

    // Build stage-specific guidance from database
    const getStageGuidance = (stage: number) => {
      const stageKey = `stage_${stage}`;
      const stageData = stagePrompts[stageKey];
      
      if (!stageData) {
        // Fallback for missing stage data
        return `【第${stage}阶段】继续引导用户深入探索。`;
      }

      const questions = stageData.questions?.join('\n- ') || '';
      const deepening = stageData.deepening_prompts?.join('\n- ') || '';
      const options = stageData.option_templates?.join('、') || '';
      const successCriteria = stageData.success_criteria || '';
      const completionNote = stageData.completion_note || '';

      return `【${stageData.name}】
目标：${stageData.goal}

参考问题（随机选择1-2个，不要全部使用）：
- ${questions}

深化引导（当用户回应模糊时使用）：
- ${deepening}

${options ? `备选选项（仅在用户第3轮仍不清晰时提供）：${options}` : ''}

成功标准：${successCriteria}
${completionNote ? `\n⚠️ ${completionNote}` : ''}`;
    };

    // Build system prompt based on mode
    let systemPrompt: string;
    
    if (chatMode === 'meditation_analysis') {
      // 冥想分析模式：直接梳理3层卡点
      const meditationAnalysisPrompt = `你是劲老师，一位专业的财富心理教练。用户刚刚完成冥想练习，分享了他的冥想感受。

用户名称：${userName}
${profileSection}

【你的任务】
用户分享了冥想后的感受，你需要：
1. 首先共情回应用户的感受（1-2句话）
2. 然后直接分析并呈现3层卡点结构：
   - 🎯 行为层：从感受中识别的行为模式或习惯
   - 💛 情绪层：感受中的情绪信号和情绪卡点
   - 💡 信念层：可能隐藏的限制性信念

【输出格式】
Round 1：
"我听到了你的感受...（1-2句共情回应）

让我帮你梳理一下今天觉察到的3层卡点：

🎯 **行为层**：...（从用户描述中提取的行为模式）

💛 **情绪层**：...（感受到的情绪信号）

💡 **信念层**：...（可能的限制性信念）

这个分析和你的感受吻合吗？有什么想补充或调整的？"

Round 2-3：
- 根据用户反馈深化分析
- 聚焦最核心的信念卡点
- 引导用户设定明天的最小进步

【完成条件】
当用户确认分析并表达了明天愿意做的最小进步后，调用 generate_wealth_briefing 工具生成财富日记。

【对话规则】
1. 每次回应控制在150字以内
2. 用温暖、接纳的语气
3. 不急于推进，允许用户补充和调整
4. 用用户自己的话回应（镜像技术）

【重要规则】
当你决定调用 generate_wealth_briefing 工具时，必须同时输出一段确认文字（如"好的，让我帮你整理今天的觉察..."），不要只调用工具而不回复任何文字。`;

      systemPrompt = meditationAnalysisPrompt;
    } else {
      // 标准四问法模式
      systemPrompt = `${basePrompt}

用户名称：${userName}
${profileSection}

${coachingTechniques}

${getStageGuidance(currentStage)}

【当前进度：第${currentStage}问/共4问】

【对话规则】
1. 【最高优先级】如果用户提问、表达疑虑、使用犹豫语言（"可是..."、"但是..."、"怎么办"），必须先充分回应其关切，帮助用户思考，不要急于推进阶段
2. 每次回应简洁有力，控制在100字以内
3. 多使用开放式问题引导用户自我觉察
4. 营造安全、接纳、不评判的环境
5. 用用户自己的话回应（镜像技术）
6. 不急于推进，允许用户在每个阶段充分表达
7. 当用户明确表达出阶段核心内容后，自然过渡到下一阶段

【完成条件】当四问全部完成后，调用 generate_wealth_briefing 工具生成财富日记。`;
    }

    console.log('Chat mode:', chatMode);
    
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

    console.log('Sending to AI with', messages.length, 'messages, mode:', chatMode, 'current stage:', currentStage);

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
