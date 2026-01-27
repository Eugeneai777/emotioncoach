import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 情绪模式描述
const patternDescriptions: Record<string, string> = {
  exhaustion: '长期压抑情绪、过度付出，身心已经疲惫不堪',
  anxiety: '容易紧张焦虑，对未来充满担忧，难以放松',
  numbness: '情感麻木，很难感受到快乐或悲伤，像是与自己隔离',
  volatility: '情绪波动剧烈，容易受外界影响，难以稳定',
  suppression: '习惯性压抑情绪，不愿表达真实感受'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, pattern, patternName, action } = await req.json();
    
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

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 处理创建会话请求
    if (action === 'create_session') {
      // 检查用户是否有会员权益
      const { data: subscriptions } = await serviceClient
        .from('subscriptions')
        .select('package_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString());

      const hasMembership = subscriptions && subscriptions.length > 0;

      // 检查是否参与了训练营
      const { data: campPurchases } = await serviceClient
        .from('user_camp_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'paid');

      const hasTrainingCamp = campPurchases && campPurchases.length > 0;

      // 如果没有会员且没有训练营，检查免费额度
      if (!hasMembership && !hasTrainingCamp) {
        // 查询已使用的测评教练简报次数
        const { data: usedBriefings } = await serviceClient
          .from('emotion_coaching_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('source', 'assessment')
          .eq('status', 'completed');

        if (usedBriefings && usedBriefings.length >= 1) {
          return new Response(JSON.stringify({ 
            error: '体验次数已用完',
            upsell: true,
            message: '你已经使用过一次免费的AI情绪教练简报，继续使用需要购买会员或训练营'
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // 创建 conversation
      const { data: conversation, error: convError } = await supabaseClient
        .from('conversations')
        .insert({
          user_id: user.id,
          coach_type: 'emotion',
          metadata: { source: 'assessment', pattern, patternName }
        })
        .select()
        .single();

      if (convError) throw convError;

      // 创建 session
      const { data: session, error: sessionError } = await supabaseClient
        .from('emotion_coaching_sessions')
        .insert({
          user_id: user.id,
          conversation_id: conversation.id,
          current_stage: 0,
          status: 'active',
          source: 'assessment',
          messages: [],
          metadata: { pattern, patternName }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      return new Response(JSON.stringify({ 
        sessionId: session.id,
        conversationId: conversation.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 获取会话
    let session;
    let isNewSession = false;
    if (sessionId) {
      const { data } = await supabaseClient
        .from('emotion_coaching_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
      
      const existingMessages = session?.messages || [];
      isNewSession = existingMessages.length === 0;
    }

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const conversationHistory = session.messages || [];
    const metadata = session.metadata || {};
    const sessionPattern = metadata.pattern || pattern || 'exhaustion';
    const sessionPatternName = metadata.patternName || patternName || '耗竭型';

    // 计算当前阶段已进行的对话轮数
    const calculateStageRounds = (messages: any[]) => {
      let rounds = 0;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          rounds++;
        }
        if (messages[i].role === 'tool') {
          break;
        }
      }
      return rounds;
    };

    // 获取用户信息
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || '朋友';

    // 获取教练模板
    const { data: coachTemplate } = await serviceClient
      .from('coach_templates')
      .select('system_prompt, stage_prompts, steps')
      .eq('coach_key', 'emotion')
      .single();

    const basePrompt = coachTemplate?.system_prompt || '';
    const stagePrompts = coachTemplate?.stage_prompts || null;
    const stageRounds = calculateStageRounds(conversationHistory);

    // 构建阶段提示词
    const buildStagePrompt = (
      stage: number, 
      stageRounds: number, 
      stagePrompts: any
    ) => {
      if (!stagePrompts || !stagePrompts.stages) {
        console.error('❌ stage_prompts 未配置');
        return '【系统提示：教练配置未完成】';
      }
      
      const maxRounds = stage === 4 ? 2 : 3;
      const forceProgressWarning = stageRounds >= maxRounds 
        ? `\n⚠️ 【已达到本阶段最大轮数（${maxRounds}轮），必须在这一轮完成本阶段！直接帮用户总结并调用 complete_stage 推进！】\n` 
        : '';
      
      const coachingTechniques = stagePrompts.coaching_techniques || '';
      const stageContent = stagePrompts.stages?.[String(stage)] || '';
      
      if (stage === 0 || stage === 5) {
        return stageContent;
      }
      
      let prompt = coachingTechniques;
      prompt += `\n\n${stageContent}`;
      prompt += `\n【本阶段已进行 ${stageRounds} 轮对话，最多${maxRounds}轮】`;
      prompt += forceProgressWarning;
      
      return prompt;
    };

    // 测评结果上下文注入
    const assessmentContext = `
【测评背景】
用户刚完成情绪健康测评，结果显示为"${sessionPatternName}"模式。
这意味着用户可能存在以下特征：${patternDescriptions[sessionPattern] || '情绪上存在一些困扰'}

请基于这个背景，温柔地引导用户开始情绪觉察的旅程。
${isNewSession ? '这是第一轮对话，先共情用户的处境，询问最近让他们最困扰的是什么，再自然过渡到情绪四部曲。' : ''}
`;

    // 构建系统提示词
    const systemPrompt = `${basePrompt}

【用户信息】
用户名称：${userName}
在对话中使用用户名称来增加亲切感，如"${userName}，我感受到..."

${assessmentContext}

【当前阶段:${session.current_stage || 0}/4】
${buildStagePrompt(session.current_stage || 0, stageRounds, stagePrompts)}

【伙伴信息】
你是「劲老师」🌿，温柔专业的情绪教练。`;

    // 工具定义
    const tools = [
      {
        type: "function",
        function: {
          name: "capture_emotion",
          description: "记录用户描述的情绪,准备进入情绪觉察",
          parameters: {
            type: "object",
            properties: {
              event_summary: {
                type: "string",
                description: "情绪事件简要描述,20-30字"
              }
            },
            required: ["event_summary"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "complete_stage",
          description: "完成当前阶段,记录用户的洞察,推进到下一阶段",
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
                description: "劲老师的温柔回应,20-30字"
              }
            },
            required: ["stage", "insight", "reflection"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_briefing",
          description: "完成四阶段后生成情绪简报",
          parameters: {
            type: "object",
            properties: {
              emotion_theme: {
                type: "string",
                description: "主题情绪,如:烦躁 · 不安 · 还不够好"
              },
              emotion_tags: {
                type: "array",
                items: { type: "string" },
                description: "情绪标签数组"
              },
              stage_1_content: {
                type: "string",
                description: "觉察:用户说出的情绪名称和身体感受,20-30字"
              },
              stage_2_content: {
                type: "string",
                description: "理解:用户看见的需求或价值观 + 洞察句,40-50字"
              },
              stage_3_content: {
                type: "string",
                description: "反应:用户觉察到的自动反应模式,30-40字"
              },
              stage_4_content: {
                type: "string",
                description: "转化:具体可执行的小行动和可能带来的变化,40-50字"
              },
              insight: {
                type: "string",
                description: "今日洞察:用户讲出的核心洞察句,20-30字"
              },
              action: {
                type: "string",
                description: "今日行动:10秒内能做到的微行动"
              },
              growth_story: {
                type: "string",
                description: "今日成长:从今天对话中看到的成长可能,20-30字"
              }
            },
            required: ["emotion_theme", "emotion_tags", "stage_1_content", "stage_2_content", "stage_3_content", "stage_4_content", "insight", "action", "growth_story"]
          }
        }
      }
    ];

    // 添加用户消息到历史
    conversationHistory.push({ role: "user", content: message });

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
    ];

    console.log('Assessment coach - Stage:', session.current_stage, 'Messages:', conversationHistory.length);

    // 调用 AI
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
    const assistantMessage = data.choices[0].message;

    // 添加助手消息到历史
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage.content || ""
    });

    // 保存对话历史
    await supabaseClient
      .from('emotion_coaching_sessions')
      .update({
        messages: conversationHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // 处理工具调用
    if (assistantMessage.tool_calls) {
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log('Tool call:', functionName, args);

      if (functionName === 'capture_emotion') {
        await supabaseClient
          .from('emotion_coaching_sessions')
          .update({
            event_summary: args.event_summary,
            current_stage: 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      if (functionName === 'complete_stage') {
        const stageKey = `stage_${args.stage}_insight`;
        const updateData: any = {
          current_stage: args.stage + 1,
          [stageKey]: args.insight,
          updated_at: new Date().toISOString()
        };

        await supabaseClient
          .from('emotion_coaching_sessions')
          .update(updateData)
          .eq('id', sessionId);
      }

      // 处理阶段完成后继续对话
      if (functionName === 'capture_emotion' || functionName === 'complete_stage') {
        conversationHistory.push({
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: assistantMessage.tool_calls
        });
        
        conversationHistory.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: true, ...args })
        });

        const { data: updatedSession } = await supabaseClient
          .from('emotion_coaching_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        const continueSystemPrompt = `你是「劲老师」🌿，温柔的情绪陪伴者。

【当前阶段:${updatedSession?.current_stage || 0}/4】
${buildStagePrompt(updatedSession?.current_stage || 0, 0, stagePrompts)}

继续温柔地引导用户探索当前阶段。`;

        const continueMessages = [
          { role: "system", content: continueSystemPrompt },
          ...conversationHistory
        ];

        const continueResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: continueMessages,
            tools,
            temperature: 0.7,
          }),
        });

        if (!continueResponse.ok) {
          throw new Error(`AI API error: ${continueResponse.status}`);
        }

        const continueData = await continueResponse.json();
        let followUpMessage = continueData.choices[0].message;
        let finalContent = followUpMessage.content || "";

        // 处理嵌套工具调用
        if (!finalContent && followUpMessage.tool_calls) {
          const nestedToolCall = followUpMessage.tool_calls[0];
          const nestedFunctionName = nestedToolCall.function.name;
          const nestedArgs = JSON.parse(nestedToolCall.function.arguments);
          
          if (nestedFunctionName === 'generate_briefing') {
            const briefingContent = followUpMessage.content || 
              "太棒了！你已经完成了今天的情绪四部曲 🌿\n\n这是为你生成的情绪简报：";
            
            // 标记会话完成
            await supabaseClient
              .from('emotion_coaching_sessions')
              .update({
                status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', sessionId);
            
            return new Response(JSON.stringify({
              content: briefingContent,
              current_stage: updatedSession?.current_stage || 5,
              tool_call: { function: 'generate_briefing', args: nestedArgs }
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          finalContent = "让我们继续探索你的感受吧 🌿";
        }

        conversationHistory.push({
          role: "assistant",
          content: finalContent
        });

        await supabaseClient
          .from('emotion_coaching_sessions')
          .update({
            messages: conversationHistory,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        return new Response(JSON.stringify({
          content: finalContent,
          current_stage: updatedSession?.current_stage || 0,
          tool_call: { function: functionName, args }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 处理简报生成
      if (functionName === 'generate_briefing') {
        const briefingContent = assistantMessage.content || 
          "太棒了！你已经完成了今天的情绪四部曲 🌿\n\n这是为你生成的情绪简报：";
        
        // 标记会话完成
        await supabaseClient
          .from('emotion_coaching_sessions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        
        return new Response(JSON.stringify({
          content: briefingContent,
          current_stage: 5,
          tool_call: { function: 'generate_briefing', args }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Stage 5 强制兜底
    if (session.current_stage >= 5 && !assistantMessage.tool_calls) {
      const extractBriefingFromSession = () => {
        return {
          emotion_theme: session.event_summary || "情绪探索与成长",
          emotion_tags: ["情绪觉察", "自我成长", "内心力量"],
          stage_1_content: session.stage_1_insight || "觉察到自己的情绪，让感受被看见",
          stage_2_content: session.stage_2_insight || "理解了情绪背后的需求与渴望",
          stage_3_content: session.stage_3_insight || "看见了习惯性的反应模式",
          stage_4_content: session.stage_4_insight || "找到了新的应对方式和微行动",
          insight: "今天你勇敢地面对了自己的情绪，每一步都是成长。",
          action: "深呼吸三次，对自己说一句温柔的话。",
          growth_story: "继续温柔地对待自己。🌿"
        };
      };
      
      const briefingData = extractBriefingFromSession();
      const briefingContent = assistantMessage.content || 
        "太棒了！你已经完成了今天的情绪四部曲 🌿";
      
      await supabaseClient
        .from('emotion_coaching_sessions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      return new Response(JSON.stringify({
        content: briefingContent,
        current_stage: 5,
        tool_call: { function: 'generate_briefing', args: briefingData }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      content: assistantMessage.content || "",
      current_stage: session.current_stage || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in assessment-emotion-coach:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
