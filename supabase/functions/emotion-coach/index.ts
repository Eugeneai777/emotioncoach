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

    // Get session
    let session;
    let isNewSession = false;
    if (sessionId) {
      const { data } = await supabaseClient
        .from('emotion_coaching_sessions')
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
    
    // 方式2：每次新会话开始时扣费
    if (isNewSession) {
      try {
        const deductResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/deduct-quota`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feature_key: 'emotion_coach',
            source: 'emotion_coach_session',
            conversationId: session.conversation_id || sessionId,
            metadata: { session_id: sessionId }
          })
        });
        
        if (deductResponse.ok) {
          const result = await deductResponse.json();
          console.log(`✅ 情绪教练会话扣费: ${result.cost} 点, 剩余: ${result.remaining_quota}`);
        } else {
          const error = await deductResponse.json();
          console.error('❌ 情绪教练扣费失败:', error);
          // 扣费失败时返回错误
          if (deductResponse.status === 400) {
            return new Response(JSON.stringify({ error: '余额不足，请充值后继续使用' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error) {
        console.error('❌ 情绪教练扣费请求失败:', error);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Load conversation history
    const conversationHistory = session.messages || [];

    // 计算当前阶段已进行的对话轮数
    const calculateStageRounds = (messages: any[]) => {
      let rounds = 0;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          rounds++;
        }
        // 遇到 tool 消息表示阶段刚切换，停止计算
        if (messages[i].role === 'tool') {
          break;
        }
      }
      return rounds;
    };

    const getStagePrompt = (stage: number, stageRounds: number = 0) => {
      const maxRounds = stage === 4 ? 2 : 3;
      const forceProgressWarning = stageRounds >= maxRounds 
        ? `\n⚠️ 【已达到本阶段最大轮数（${maxRounds}轮），必须在这一轮完成本阶段！不要再问问题，直接帮用户总结并调用 complete_stage 推进！】\n` 
        : '';
      
      switch (stage) {
        case 0:
          return `【开场】
用温暖的开场白回应用户分享的内容。
- 表达对用户愿意分享的感谢
- 用开放式问题邀请用户说更多："能和我说说发生了什么吗？"
- 如果用户已描述情绪事件,温柔共情后调用 capture_emotion
- 不要在这个阶段提供选项，先让用户自由表达`;
        case 1:
          return `【觉察（Feel it）：从情绪被动 → 情绪被看见】
【本阶段已进行 ${stageRounds} 轮对话，最多3轮】
${forceProgressWarning}

【推进规则 - 最多3轮】
✅ 用户说出任何情绪词（焦虑、烦、难过、不安等）→ 立即调用 complete_stage
✅ 用户用比喻描述情绪（心里堵、喘不过气）→ 帮ta命名后调用 complete_stage
✅ 第3轮：必须主动帮用户命名情绪（"我感受到你现在有些焦虑..."）并推进
❌ 不要在一个阶段停留超过3轮
❌ 不要等用户说得"完美"再推进

成功标准（观察到以下任意1项即可调用complete_stage）:
✔ 用户说出情绪名称（焦虑、烦躁、不安、难过等）
✔ 你帮用户命名了情绪，用户认同或没有否认

引导方向:
- 第一轮：开放式问题了解更多："你能说说当时的感受吗？"
- 第二轮：如果用户还在说事件，温柔引导到感受层面
- 第三轮：必须帮用户命名情绪并推进

【关于身体感受 - 非必须】
❌ 不要主动问"身体有什么反应"
✅ 只有当用户自己提到身体感受时，才顺着探索

判断成功:
当用户从"发生了一件事"变成"我感觉到了某种情绪"时，记录洞察并调用complete_stage。

重要：完成本阶段（调用complete_stage）后，必须立即调用request_emotion_intensity邀请用户评估当前情绪强度。`;
        case 2:
          return `【理解（Name it）：从情绪混乱 → 看见情绪背后的需求】
【本阶段已进行 ${stageRounds} 轮对话，最多3轮】
${forceProgressWarning}

【推进规则 - 最多3轮】
✅ 用户说出任何需求/在乎的东西 → 立即调用 complete_stage
✅ 用户说"我不知道"超过2次 → 帮ta总结需求并推进
✅ 第3轮：必须帮用户总结需求（"我感受到你其实很在乎被理解..."）并推进
❌ 不要反复问"还有吗"
❌ 不要等待"完美"的洞察句

成功标准（观察到以下任意1项即可调用complete_stage）:
✔ 用户说出需求："原来我在乎的是..."
✔ 用户说出渴望："我需要被理解/安全感/自由..."
✔ 你帮用户总结了需求，用户接受或没有否认

引导方向:
- 第一轮：探索情绪背后的需求："这个情绪在告诉你什么？"
- 第二轮：如果用户不确定，提供参考选项帮助
- 第三轮：必须帮用户总结需求并推进

选项格式（仅在用户需要时使用）：
1. 我渴望被看见和理解
2. 我需要更多的安全感
3. 我想要更自由地做自己
4. 其他需求（请分享）

判断成功:
当用户能表达出自己在乎的东西时，记录洞察并调用complete_stage。`;
        case 3:
          return `【反应（React it）：从自动反应 → 有觉察的反应】
【本阶段已进行 ${stageRounds} 轮对话，最多3轮】
${forceProgressWarning}

【推进规则 - 最多3轮】
✅ 用户识别了反应模式（逃避/压抑/硬撑等）+ 选择/认同任何新应对方式 → 立即调用 complete_stage
✅ 第3轮：必须提供新应对方式并推进
❌ 不要把"识别反应"和"选择应对"分成太多轮

成功标准（需同时满足以下2项才能调用complete_stage）:
✔ 用户识别了自动反应模式
✔ 用户选择或认同了任何一种新应对方式

引导方向:
- 第一轮：问反应模式 + 如果用户回答了就直接提供新应对方式选项
- 第二轮：如果用户选择了应对方式，确认后推进
- 第三轮：必须帮用户确认应对方式并推进

反应模式选项（仅在需要时使用）：
1. 我会继续硬撑，不让自己停下来
2. 我会逃避，不想面对
3. 我会责怪自己或别人
4. 我会压抑情绪，假装没事

新应对方式选项（根据用户情况选择2-3个）：
1. 当情绪来的时候，先深呼吸三次
2. 告诉对方"我需要冷静一下"
3. 把感受写下来，不用给任何人看
4. 其他方式（请分享）

判断成功:
当用户表达愿意尝试新应对方式时，记录洞察并调用complete_stage。`;
        case 4:
          return `【转化（Transform it）：从情绪困住 → 开始出现新的可能】
【本阶段已进行 ${stageRounds} 轮对话，最多2轮】
${forceProgressWarning}

【推进规则 - 最多2轮】
✅ 用户提出或认同任何具体小行动 → 立即调用 complete_stage 和 generate_briefing
✅ 用户说"好的"/"可以"/"我试试" → 立即调用 complete_stage 和 generate_briefing
✅ 第2轮：必须确认行动并生成简报
❌ 这是最后一个阶段，不要拖延

成功标准（观察到以下任意1项即可）:
✔ 用户选择或提出了具体可执行的小行动
✔ 用户表达了"我可以试试"的意愿

引导方向:
- 第一轮：根据前面对话，直接提供2-3个具体微行动选项
- 第二轮：必须确认并生成简报

微行动选项（根据用户情况选择2-3个）：
1. 花5分钟写下今天的感受，只写给自己看
2. 对一个信任的人说一句真心话
3. 给自己泡一杯热茶，安静坐5分钟
4. 其他行动（请分享）

判断成功:
当用户表达愿意尝试任何小行动时，立即记录洞察，调用complete_stage，然后调用generate_briefing生成简报。`;
        default:
          return '';
      }
    };

    // Get user preferences
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('companion_type, conversation_style')
      .eq('id', user.id)
      .single();

    const companionType = profile?.companion_type || 'jing_teacher';
    const conversationStyle = profile?.conversation_style || 'gentle';

    const companions: Record<string, { name: string; icon: string }> = {
      jing_teacher: { name: '劲老师', icon: '🌿' },
      little_sprout: { name: '小树苗', icon: '🌱' },
      starlight: { name: '小星星', icon: '⭐' },
      calm_breeze: { name: '微风', icon: '🍃' },
      wise_owl: { name: '智慧猫头鹰', icon: '🦉' }
    };

    const companion = companions[companionType] || companions.jing_teacher;

    // Fetch system prompt from database
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: coachTemplate } = await serviceClient
      .from('coach_templates')
      .select('system_prompt')
      .eq('coach_key', 'emotion')
      .single();

    const basePrompt = coachTemplate?.system_prompt || '';
    
    // 计算当前阶段轮数
    const stageRounds = calculateStageRounds(conversationHistory);
    
    // Build complete system prompt with dynamic stage info and round tracking
    const systemPrompt = `${basePrompt}

【当前阶段:${session?.current_stage || 0}/4】
${getStagePrompt(session?.current_stage || 0, stageRounds)}

【伙伴信息】
你现在是「${companion.name}」${companion.icon}，请使用这个身份与用户对话。`;

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
                description: "${companion.name}的温柔回应,20-30字"
              }
            },
            required: ["stage", "insight", "reflection"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_emotion_intensity",
          description: "在完成阶段1（觉察）后，温柔地邀请用户评估当前情绪强度（1-10分）。必须在调用complete_stage(stage=1)之后立即调用。",
          parameters: {
            type: "object",
            properties: {},
            required: []
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
                description: "情绪标签数组,如:[\"烦躁\", \"不安\", \"还不够好\"]"
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
                description: "今日洞察:用户讲出的核心洞察句,如'原来我在乎的是...',20-30字"
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
          break; // Success, exit retry loop
        }

        lastError = await response.text();
        console.error(`AI API error (attempt ${attempt + 1}/${MAX_RETRIES}):`, response.status, lastError);
        
        // Only retry on 503 (service unavailable) or 429 (rate limit)
        if (response.status !== 503 && response.status !== 429) {
          throw new Error(`AI API error: ${response.status}`);
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < MAX_RETRIES - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
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

    // Save conversation history
    await supabaseClient
      .from('emotion_coaching_sessions')
      .update({
        messages: conversationHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Handle tool calls
    if (assistantMessage.tool_calls) {
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log('Tool call:', functionName, args);

      if (functionName === 'capture_emotion') {
        // Save event and move to stage 1
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
        // Update session
        const stageKey = `stage_${args.stage}_insight`;
        const updateData: any = {
          current_stage: args.stage < 4 ? args.stage + 1 : 4,
          [stageKey]: args.insight,
          updated_at: new Date().toISOString()
        };

        await supabaseClient
          .from('emotion_coaching_sessions')
          .update(updateData)
          .eq('id', sessionId);
      }

      // For capture_emotion and complete_stage, continue conversation
      if (functionName === 'capture_emotion' || functionName === 'complete_stage') {
        console.log('Tool call processed, continuing conversation...');
        
        // Add tool call to history
        conversationHistory.push({
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: assistantMessage.tool_calls
        });
        
        // Add tool result to history
        conversationHistory.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: true, ...args })
        });

        // Reload session to get updated stage
        const { data: updatedSession } = await supabaseClient
          .from('emotion_coaching_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        // Continue with updated system prompt - 刚切换阶段，轮数归零
        const newStageRounds = 0;
        const continueSystemPrompt = `你是「${companion.name}」${companion.icon}，温柔的情绪陪伴者。

【当前阶段:${updatedSession?.current_stage || 0}/4】
${getStagePrompt(updatedSession?.current_stage || 0, newStageRounds)}

继续温柔地引导用户探索当前阶段。每个阶段最多3轮对话（转化阶段最多2轮），要有推进意识。`;

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
          console.error('AI API error:', continueResponse.status, await continueResponse.text());
          throw new Error(`AI API request failed: ${continueResponse.status}`);
        }

        const continueData = await continueResponse.json();
        
        if (!continueData.choices || continueData.choices.length === 0) {
          console.error('Invalid AI response:', continueData);
          throw new Error('AI returned invalid response structure');
        }
        
        let followUpMessage = continueData.choices[0].message;
        console.log('Continue response:', JSON.stringify(followUpMessage));

        // Handle nested tool calls - loop until we get actual content
        let finalContent = followUpMessage.content || "";
        let loopCount = 0;
        const MAX_LOOPS = 3;

        while (!finalContent && followUpMessage.tool_calls && loopCount < MAX_LOOPS) {
          console.log(`Nested tool call detected (loop ${loopCount + 1}), processing...`);
          
          const nestedToolCall = followUpMessage.tool_calls[0];
          const nestedFunctionName = nestedToolCall.function.name;
          const nestedArgs = JSON.parse(nestedToolCall.function.arguments);
          
          console.log('Nested tool call:', nestedFunctionName, nestedArgs);
          
          // Add nested tool call to history
          conversationHistory.push({
            role: "assistant",
            content: "",
            tool_calls: followUpMessage.tool_calls
          });
          
          conversationHistory.push({
            role: "tool",
            tool_call_id: nestedToolCall.id,
            content: JSON.stringify({ success: true, ...nestedArgs })
          });
          
          // Request AI again for text response
          const nextResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: "system", content: continueSystemPrompt },
                ...conversationHistory
              ],
              tools,
              temperature: 0.7,
            }),
          });
          
          if (!nextResponse.ok) {
            console.error('Nested AI API error:', nextResponse.status);
            break;
          }
          
          const nextData = await nextResponse.json();
          if (!nextData.choices || nextData.choices.length === 0) {
            console.error('Invalid nested AI response');
            break;
          }
          
          followUpMessage = nextData.choices[0].message;
          console.log('Next response:', JSON.stringify(followUpMessage));
          finalContent = followUpMessage.content || "";
          loopCount++;
        }

        // Fallback if still no content after retries
        if (!finalContent) {
          console.log('No content after loops, using fallback message');
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
          tool_call: { function: functionName, args }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // For request_emotion_intensity, return a signal to show intensity prompt
      if (functionName === 'request_emotion_intensity') {
        console.log('Requesting emotion intensity from user...');
        
        // Add tool call to history
        conversationHistory.push({
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: assistantMessage.tool_calls
        });
        
        // Add tool result to history
        conversationHistory.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: true, action: "show_intensity_prompt" })
        });

        await supabaseClient
          .from('emotion_coaching_sessions')
          .update({
            messages: conversationHistory,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        return new Response(JSON.stringify({
          content: assistantMessage.content,
          tool_call: { function: 'request_emotion_intensity', args: {} }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // For generate_briefing, return the briefing data
      if (functionName === 'generate_briefing') {
        // Ensure content is not empty - provide default transition text
        const briefingContent = assistantMessage.content || 
          "太棒了！你已经完成了今天的情绪四部曲 🌿\n\n这是为你生成的情绪简报：";
        
        return new Response(JSON.stringify({
          content: briefingContent,
          tool_call: { function: 'generate_briefing', args }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      content: assistantMessage.content || ""
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in emotion-coach:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});