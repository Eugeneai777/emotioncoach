import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, stream: wantStream } = await req.json();
    
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
      
      const existingMessages = session?.messages || [];
      isNewSession = existingMessages.length === 0;
    }

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 每次新会话开始时扣费
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

    const calculateStageRounds = (messages: any[]) => {
      let rounds = 0;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') rounds++;
        if (messages[i].role === 'tool') break;
      }
      return rounds;
    };

    const getUserPreferences = async (userId: string, stage: number) => {
      try {
        const { data } = await supabaseClient
          .from('emotion_coach_preferences')
          .select('custom_option, frequency')
          .eq('user_id', userId)
          .eq('stage', stage)
          .order('frequency', { ascending: false })
          .limit(3);
        return data || [];
      } catch (e) {
        console.log('获取用户偏好失败:', e);
        return [];
      }
    };

    const userPreferences = await getUserPreferences(user.id, session?.current_stage || 1);
    const preferenceHint = userPreferences.length > 0 
      ? `\n【用户历史偏好 - 可优先使用这些选项】\n${userPreferences.map(p => `- "${p.custom_option}" (使用${p.frequency}次)`).join('\n')}\n`
      : '';

    const buildStagePrompt = (
      stage: number, 
      stageRounds: number, 
      stagePrompts: any,
      prefHint: string
    ) => {
      if (!stagePrompts || !stagePrompts.stages) {
        console.error('❌ stage_prompts 未配置');
        return '【系统提示：教练配置未完成，请联系管理员在后台设置 stage_prompts】';
      }
      
      const maxRounds = stage === 4 ? 2 : 3;
      const forceProgressWarning = stageRounds >= maxRounds 
        ? `\n⚠️ 【已达到本阶段最大轮数（${maxRounds}轮），必须在这一轮完成本阶段！不要再问问题，直接帮用户总结并调用 complete_stage 推进！】\n` 
        : '';
      
      const templateIdx = Math.floor(Math.random() * 3);
      const coachingTechniques = stagePrompts.coaching_techniques || '';
      const questionTemplates = stagePrompts.question_templates || {};
      const stageContent = stagePrompts.stages?.[String(stage)] || '';
      
      if (stage === 0 || stage === 5) return stageContent;
      
      let prompt = coachingTechniques;
      prompt += `\n\n${stageContent}`;
      prompt += `\n【本阶段已进行 ${stageRounds} 轮对话，最多${maxRounds}轮】`;
      prompt += forceProgressWarning;
      prompt += prefHint;
      
      const stageKey = `stage${stage}`;
      const templates = questionTemplates[stageKey];
      if (templates) {
        prompt += `\n\n【问法模板示例】`;
        if (templates.round1?.[templateIdx]) prompt += `\n第一轮: "${templates.round1[templateIdx]}"`;
        if (templates.round2?.[templateIdx]) prompt += `\n第二轮: "${templates.round2[templateIdx]}"`;
        if (templates.deepenNoEmotion?.[templateIdx]) prompt += `\n深入(未说情绪): "${templates.deepenNoEmotion[templateIdx]}"`;
        if (templates.acknowledge) prompt += `\n承认: "${templates.acknowledge}"`;
        if (templates.newPossibility?.[templateIdx]) prompt += `\n新可能: "${templates.newPossibility[templateIdx]}"`;
        if (templates.helpOptions) prompt += `\n帮助选项: "${templates.helpOptions}"`;
      }
      
      return prompt;
    };

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('companion_type, conversation_style, display_name')
      .eq('id', user.id)
      .single();

    const companionType = profile?.companion_type || 'jing_teacher';
    const userName = profile?.display_name || '朋友';

    const companions: Record<string, { name: string; icon: string }> = {
      jing_teacher: { name: '劲老师', icon: '🌿' },
      little_sprout: { name: '小树苗', icon: '🌱' },
      starlight: { name: '小星星', icon: '⭐' },
      calm_breeze: { name: '微风', icon: '🍃' },
      wise_owl: { name: '智慧猫头鹰', icon: '🦉' }
    };

    const companion = companions[companionType] || companions.jing_teacher;

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: coachTemplate } = await serviceClient
      .from('coach_templates')
      .select('system_prompt, stage_prompts')
      .eq('coach_key', 'emotion')
      .single();

    const { data: coachMemories } = await serviceClient
      .from('user_coach_memory')
      .select('*')
      .eq('user_id', user.id)
      .eq('coach_type', 'emotion')
      .order('importance_score', { ascending: false })
      .limit(5);

    const { data: lastSession } = await serviceClient
      .from('emotion_coaching_sessions')
      .select('session_summary, key_insight, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let memoryContext = '';
    if (coachMemories && coachMemories.length > 0) {
      memoryContext = `\n\n【教练记忆 - 用户过往重要觉察】
以下是${userName}之前分享过的重要觉察点，请在对话中自然地引用：
`;
      coachMemories.forEach((m: any, index: number) => {
        memoryContext += `${index + 1}. ${m.content}\n`;
      });
      memoryContext += `
使用方式：
- "你之前提到过..."
- "我记得你说过..."
- "上次你觉察到...今天有什么新发现吗？"`;
    }

    let continuityContext = '';
    if (lastSession?.session_summary) {
      const daysSince = Math.floor((Date.now() - new Date(lastSession.created_at).getTime()) / 86400000);
      continuityContext = `\n\n【上次对话连接】
距离上次对话：${daysSince}天
上次对话摘要：${lastSession.session_summary}
${lastSession.key_insight ? `上次核心觉察：${lastSession.key_insight}` : ''}

开场建议：
${daysSince < 3 ? `- "${userName}，继续我们上次的话题..."` : ''}
${daysSince >= 3 && daysSince <= 7 ? `- "${userName}，上次我们聊到${lastSession.session_summary}，这几天有什么新发现吗？"` : ''}
${daysSince > 7 ? `- "${userName}，好久不见呀～还记得上次你说${lastSession.key_insight || lastSession.session_summary}吗？"` : ''}
`;
    }

    const basePrompt = coachTemplate?.system_prompt || '';
    const stagePrompts = coachTemplate?.stage_prompts || null;
    const stageRounds = calculateStageRounds(conversationHistory);

    const systemPrompt = `${basePrompt}

【最高优先级规则：结束对话检测】
当用户表达结束对话意图时（包括但不限于："今天先聊到这"、"谢谢陪伴"、"再见"、"我先走了"、"下次再聊"、"好的，拜拜"、"不聊了"、"就到这吧"），你必须：
1. 温暖简短地回应，肯定本次对话的收获
2. 绝对不要再追问任何问题
3. 回复2-3句即可
4. 以温柔祝福结尾，如"照顾好自己哦 🌿"

【用户信息】
用户名称：${userName}
在对话中使用用户名称来增加亲切感，如"${userName}，我感受到..."

${memoryContext}
${continuityContext}

【当前阶段:${session?.current_stage || 0}/4】
${buildStagePrompt(session?.current_stage || 0, stageRounds, stagePrompts, preferenceHint)}

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
              event_summary: { type: "string", description: "情绪事件简要描述,20-30字" }
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
              stage: { type: "number", description: "完成的阶段 1-4" },
              insight: { type: "string", description: "本阶段的核心洞察内容" },
              reflection: { type: "string", description: `${companion.name}的温柔回应,20-30字` }
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
          parameters: { type: "object", properties: {}, required: [] }
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
              emotion_theme: { type: "string", description: "主题情绪" },
              emotion_tags: { type: "array", items: { type: "string" }, description: "情绪标签数组" },
              stage_1_content: { type: "string", description: "觉察:用户说出的情绪名称和身体感受" },
              stage_2_content: { type: "string", description: "理解:用户看见的需求或价值观" },
              stage_3_content: { type: "string", description: "反应:用户觉察到的自动反应模式" },
              stage_4_content: { type: "string", description: "转化:具体可执行的小行动" },
              insight: { type: "string", description: "今日洞察" },
              action: { type: "string", description: "今日行动" },
              growth_story: { type: "string", description: "今日成长" }
            },
            required: ["emotion_theme", "emotion_tags", "stage_1_content", "stage_2_content", "stage_3_content", "stage_4_content", "insight", "action", "growth_story"]
          }
        }
      }
    ];

    // Save user preferences
    const saveUserPreference = async (userId: string, stage: number, userMessage: string) => {
      const stageCategories: Record<number, string> = { 1: 'emotions', 2: 'needs', 3: 'reactions', 4: 'actions' };
      const category = stageCategories[stage];
      if (!category) return;
      
      const isCustomInput = !/^[1-4]$/.test(userMessage.trim()) && userMessage.length > 2 && userMessage.length < 50;
      if (isCustomInput) {
        try {
          const { data: existing } = await supabaseClient
            .from('emotion_coach_preferences')
            .select('id, frequency')
            .eq('user_id', userId)
            .eq('stage', stage)
            .eq('category', category)
            .eq('custom_option', userMessage.trim())
            .single();
          
          if (existing) {
            await supabaseClient
              .from('emotion_coach_preferences')
              .update({ frequency: existing.frequency + 1, updated_at: new Date().toISOString() })
              .eq('id', existing.id);
          } else {
            await supabaseClient
              .from('emotion_coach_preferences')
              .insert({ user_id: userId, stage, category, custom_option: userMessage.trim(), frequency: 1 });
          }
        } catch (e) {
          console.log('保存用户偏好失败:', e);
        }
      }
    };

    await saveUserPreference(user.id, session?.current_stage || 1, message);

    conversationHistory.push({ role: "user", content: message });

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
    ];

    // ===== Helper: non-streaming AI call =====
    const callAI = async (msgs: any[], retries = 3) => {
      let lastError = '';
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: msgs, tools, temperature: 0.7 }),
          });
          if (resp.ok) return await resp.json();
          lastError = await resp.text();
          if (resp.status !== 503 && resp.status !== 429) throw new Error(`AI error: ${resp.status}`);
          if (attempt < retries - 1) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        } catch (e) {
          lastError = e instanceof Error ? e.message : 'Network error';
          if (attempt < retries - 1) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
      throw new Error(`AI error after retries: ${lastError}`);
    };

    // ===== Helper: streaming AI call that returns a ReadableStream =====
    const callAIStream = async (msgs: any[]) => {
      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: msgs, tools, temperature: 0.7, stream: true }),
      });
      if (!resp.ok) throw new Error(`AI stream error: ${resp.status}`);
      return resp.body!;
    };

    // ===== Helper: send SSE streaming response =====
    const sendStreamingResponse = async (msgs: any[], toolCallInfo?: any) => {
      const upstreamBody = await callAIStream(msgs);
      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();

      let fullContent = '';

      const outputStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          // If there's a tool_call from earlier processing, send it as a metadata event first
          if (toolCallInfo) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool_call: toolCallInfo })}\n\n`));
          }
          try {
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              let nlIdx: number;
              while ((nlIdx = buffer.indexOf('\n')) !== -1) {
                let line = buffer.slice(0, nlIdx);
                buffer = buffer.slice(nlIdx + 1);
                if (line.endsWith('\r')) line = line.slice(0, -1);
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6).trim();
                if (payload === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }
                try {
                  const parsed = JSON.parse(payload);
                  const delta = parsed.choices?.[0]?.delta;
                  if (delta?.content) {
                    fullContent += delta.content;
                    // Forward SSE chunk
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                  }
                  // Check for tool_calls in stream (generate_briefing at end)
                  if (delta?.tool_calls) {
                    // Buffer tool calls - they'll be handled after stream ends
                    // For now just skip forwarding them
                  }
                } catch {
                  // incomplete JSON, put back
                  buffer = line + '\n' + buffer;
                  break;
                }
              }
            }
          } catch (e) {
            console.error('Stream relay error:', e);
          } finally {
            controller.close();
          }

          // Save to DB after stream completes
          conversationHistory.push({ role: "assistant", content: fullContent });
          await supabaseClient
            .from('emotion_coaching_sessions')
            .update({ messages: conversationHistory, updated_at: new Date().toISOString() })
            .eq('id', sessionId);
        }
      });

      return new Response(outputStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    };

    // ===== MAIN LOGIC =====
    // Step 1: First AI call (non-streaming) to detect tool calls
    const data = await callAI(aiMessages);
    const assistantMessage = data.choices[0].message;

    // If no tool calls and streaming requested: re-do as streaming call
    // (We already have the content from non-streaming call, just send it as SSE for consistency)
    if (!assistantMessage.tool_calls) {
      conversationHistory.push({ role: "assistant", content: assistantMessage.content || "" });
      await supabaseClient
        .from('emotion_coaching_sessions')
        .update({ messages: conversationHistory, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      // Stage 5 fallback
      if (session.current_stage >= 5) {
        console.log('🚨 Stage 5 但没有 tool_call，强制生成简报');
        const briefingData = {
          emotion_theme: session.event_summary || "情绪探索与成长",
          emotion_tags: ["情绪觉察", "自我成长", "内心力量"],
          stage_1_content: session.stage_1_insight || "觉察到自己的情绪，让感受被看见",
          stage_2_content: session.stage_2_insight || "理解了情绪背后的需求与渴望",
          stage_3_content: session.stage_3_insight || "看见了习惯性的反应模式",
          stage_4_content: session.stage_4_insight || "找到了新的应对方式和微行动",
        };

        if (wantStream) {
          // Send content as SSE
          const encoder = new TextEncoder();
          const content = assistantMessage.content || "太棒了！你已经完成了今天的情绪四部曲 🌿";
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool_call: { function: 'generate_briefing', args: briefingData } })}\n\n`));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          });
          return new Response(stream, {
            headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
          });
        }

        return new Response(JSON.stringify({
          content: assistantMessage.content || "太棒了！你已经完成了今天的情绪四部曲 🌿",
          tool_call: { function: 'generate_briefing', args: briefingData }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (wantStream) {
        // Convert already-fetched content into SSE format
        const encoder = new TextEncoder();
        const content = assistantMessage.content || "";
        const stream = new ReadableStream({
          start(controller) {
            // Send content in one chunk (it's already complete)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        });
        return new Response(stream, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
        });
      }

      return new Response(JSON.stringify({ content: assistantMessage.content || "" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ===== Tool call processing =====
    const toolCall = assistantMessage.tool_calls[0];
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    console.log('Tool call:', functionName, args);

    // Add tool call + result to history
    conversationHistory.push({ role: "assistant", content: assistantMessage.content || "", tool_calls: assistantMessage.tool_calls });

    if (functionName === 'capture_emotion') {
      await supabaseClient
        .from('emotion_coaching_sessions')
        .update({ event_summary: args.event_summary, current_stage: 1, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    if (functionName === 'complete_stage') {
      const stageKey = `stage_${args.stage}_insight`;
      await supabaseClient
        .from('emotion_coaching_sessions')
        .update({ current_stage: args.stage + 1, [stageKey]: args.insight, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    if (functionName === 'request_emotion_intensity') {
      conversationHistory.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify({ success: true, action: "show_intensity_prompt" }) });
      await supabaseClient
        .from('emotion_coaching_sessions')
        .update({ messages: conversationHistory, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (wantStream) {
        const encoder = new TextEncoder();
        const content = assistantMessage.content || "";
        const stream = new ReadableStream({
          start(controller) {
            if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool_call: { function: 'request_emotion_intensity', args: {} } })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        });
        return new Response(stream, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
        });
      }
      return new Response(JSON.stringify({ content: assistantMessage.content, tool_call: { function: 'request_emotion_intensity', args: {} } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (functionName === 'generate_briefing') {
      const briefingContent = assistantMessage.content || "太棒了！你已经完成了今天的情绪四部曲 🌿\n\n这是为你生成的情绪简报：";
      
      if (wantStream) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: briefingContent } }] })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool_call: { function: 'generate_briefing', args } })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        });
        return new Response(stream, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
        });
      }
      return new Response(JSON.stringify({ content: briefingContent, tool_call: { function: 'generate_briefing', args } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For capture_emotion and complete_stage: process tool, then stream the follow-up response
    conversationHistory.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify({ success: true, ...args }) });

    // Reload session for updated stage
    const { data: updatedSession } = await supabaseClient
      .from('emotion_coaching_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    const newStageRounds = 0;
    const continueSystemPrompt = `你是「${companion.name}」${companion.icon}，温柔的情绪陪伴者。

【当前阶段:${updatedSession?.current_stage || 0}/4】
${buildStagePrompt(updatedSession?.current_stage || 0, newStageRounds, stagePrompts, preferenceHint)}

继续温柔地引导用户探索当前阶段。每个阶段最多3轮对话（转化阶段最多2轮），要有推进意识。`;

    const continueMessages = [
      { role: "system", content: continueSystemPrompt },
      ...conversationHistory
    ];

    if (wantStream) {
      // Stream the follow-up response
      return await sendStreamingResponse(continueMessages, { function: functionName, args });
    }

    // Non-streaming fallback: handle nested tool calls
    let followUpData = await callAI(continueMessages);
    let followUpMessage = followUpData.choices[0].message;
    let finalContent = followUpMessage.content || "";
    let loopCount = 0;

    while (!finalContent && followUpMessage.tool_calls && loopCount < 3) {
      const nestedToolCall = followUpMessage.tool_calls[0];
      const nestedFn = nestedToolCall.function.name;
      const nestedArgs = JSON.parse(nestedToolCall.function.arguments);

      if (nestedFn === 'generate_briefing') {
        const bc = followUpMessage.content || "太棒了！你已经完成了今天的情绪四部曲 🌿";
        return new Response(JSON.stringify({ content: bc, tool_call: { function: 'generate_briefing', args: nestedArgs } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      conversationHistory.push({ role: "assistant", content: "", tool_calls: followUpMessage.tool_calls });
      conversationHistory.push({ role: "tool", tool_call_id: nestedToolCall.id, content: JSON.stringify({ success: true, ...nestedArgs }) });

      followUpData = await callAI([{ role: "system", content: continueSystemPrompt }, ...conversationHistory]);
      followUpMessage = followUpData.choices[0].message;
      finalContent = followUpMessage.content || "";
      loopCount++;
    }

    if (!finalContent) finalContent = "让我们继续探索你的感受吧 🌿";

    conversationHistory.push({ role: "assistant", content: finalContent });
    await supabaseClient
      .from('emotion_coaching_sessions')
      .update({ messages: conversationHistory, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    return new Response(JSON.stringify({ content: finalContent, tool_call: { function: functionName, args } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in emotion-coach:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
