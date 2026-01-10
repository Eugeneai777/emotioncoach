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

    // 计算当前阶段已进行的对话轮数（用户消息数）
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

    // 获取用户历史偏好选项
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

    // 获取用户偏好
    const userPreferences = await getUserPreferences(user.id, session?.current_stage || 1);
    const preferenceHint = userPreferences.length > 0 
      ? `\n【用户历史偏好 - 可优先使用这些选项】\n${userPreferences.map(p => `- "${p.custom_option}" (使用${p.frequency}次)`).join('\n')}\n`
      : '';

    // ⚠️ 重要：所有 prompt 现在都从数据库读取，不再使用硬编码默认值
    // 如果数据库中没有配置 stage_prompts，将抛出错误
    // 这确保了 prompt 的单一数据源，便于版本控制和管理

    // 构建阶段提示词函数（强制从数据库读取）
    const buildStagePrompt = (
      stage: number, 
      stageRounds: number, 
      stagePrompts: any,
      preferenceHint: string
    ) => {
      // 如果数据库中没有配置 stage_prompts，返回警告信息
      if (!stagePrompts || !stagePrompts.stages) {
        console.error('❌ stage_prompts 未配置，请在后台管理界面设置');
        return '【系统提示：教练配置未完成，请联系管理员在后台设置 stage_prompts】';
      }
      
      const maxRounds = stage === 4 ? 2 : 3;
      const forceProgressWarning = stageRounds >= maxRounds 
        ? `\n⚠️ 【已达到本阶段最大轮数（${maxRounds}轮），必须在这一轮完成本阶段！不要再问问题，直接帮用户总结并调用 complete_stage 推进！】\n` 
        : '';
      
      // 随机选择问法模板的索引
      const templateIdx = Math.floor(Math.random() * 3);
      
      // 从数据库读取
      const coachingTechniques = stagePrompts.coaching_techniques || '';
      const questionTemplates = stagePrompts.question_templates || {};
      const stageContent = stagePrompts.stages?.[String(stage)] || '';
      
      // 构建完整提示词
      if (stage === 0 || stage === 5) {
        return stageContent;
      }
      
      // 为阶段 1-4 添加技术和动态信息
      let prompt = coachingTechniques;
      prompt += `\n\n${stageContent}`;
      prompt += `\n【本阶段已进行 ${stageRounds} 轮对话，最多${maxRounds}轮】`;
      prompt += forceProgressWarning;
      prompt += preferenceHint;
      
      // 添加问法模板示例
      const stageKey = `stage${stage}`;
      const templates = questionTemplates[stageKey];
      if (templates) {
        prompt += `\n\n【问法模板示例】`;
        if (templates.round1?.[templateIdx]) {
          prompt += `\n第一轮: "${templates.round1[templateIdx]}"`;
        }
        if (templates.round2?.[templateIdx]) {
          prompt += `\n第二轮: "${templates.round2[templateIdx]}"`;
        }
        if (templates.deepenNoEmotion?.[templateIdx]) {
          prompt += `\n深入(未说情绪): "${templates.deepenNoEmotion[templateIdx]}"`;
        }
        if (templates.acknowledge) {
          prompt += `\n承认: "${templates.acknowledge}"`;
        }
        if (templates.newPossibility?.[templateIdx]) {
          prompt += `\n新可能: "${templates.newPossibility[templateIdx]}"`;
        }
        if (templates.helpOptions) {
          prompt += `\n帮助选项: "${templates.helpOptions}"`;
        }
      }
      
      return prompt;
    };

    // Get user preferences and display name
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('companion_type, conversation_style, display_name')
      .eq('id', user.id)
      .single();

    const companionType = profile?.companion_type || 'jing_teacher';
    const conversationStyle = profile?.conversation_style || 'gentle';
    const userName = profile?.display_name || '朋友';

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
      .select('system_prompt, stage_prompts')
      .eq('coach_key', 'emotion')
      .single();

    // Fetch coach memory for personalized continuity (情绪教练记忆)
    const { data: coachMemories } = await serviceClient
      .from('user_coach_memory')
      .select('*')
      .eq('user_id', user.id)
      .eq('coach_type', 'emotion')
      .order('importance_score', { ascending: false })
      .limit(5);

    // Fetch last session for conversation continuity
    const { data: lastSession } = await serviceClient
      .from('emotion_coaching_sessions')
      .select('session_summary, key_insight, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Build memory context for injection into prompt
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

    // Build last session continuity context
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
    
    // 计算当前阶段轮数
    const stageRounds = calculateStageRounds(conversationHistory);
    
    // Build complete system prompt with dynamic stage info and round tracking
    const systemPrompt = `${basePrompt}

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

    // 检测用户是否选择了"其他"并保存偏好
    const saveUserPreference = async (userId: string, stage: number, userMessage: string) => {
      // 检测用户是否在回复"其他"类型的自定义输入
      // 常见模式：用户直接描述情绪/需求/反应，而不是选择数字选项
      const stageCategories: Record<number, string> = {
        1: 'emotions',
        2: 'needs', 
        3: 'reactions',
        4: 'actions'
      };
      
      const category = stageCategories[stage];
      if (!category) return;
      
      // 检查消息是否像自定义输入（不是简单的数字选择）
      const isCustomInput = !/^[1-4]$/.test(userMessage.trim()) && 
                           userMessage.length > 2 && 
                           userMessage.length < 50;
      
      if (isCustomInput) {
        try {
          // 先查询是否已存在
          const { data: existing } = await supabaseClient
            .from('emotion_coach_preferences')
            .select('id, frequency')
            .eq('user_id', userId)
            .eq('stage', stage)
            .eq('category', category)
            .eq('custom_option', userMessage.trim())
            .single();
          
          if (existing) {
            // 更新频率
            await supabaseClient
              .from('emotion_coach_preferences')
              .update({ 
                frequency: existing.frequency + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
            console.log(`✅ 更新用户偏好频率: stage=${stage}, option="${userMessage.trim()}", frequency=${existing.frequency + 1}`);
          } else {
            // 插入新记录
            await supabaseClient
              .from('emotion_coach_preferences')
              .insert({
                user_id: userId,
                stage: stage,
                category: category,
                custom_option: userMessage.trim(),
                frequency: 1
              });
            console.log(`✅ 保存新用户偏好: stage=${stage}, category=${category}, option="${userMessage.trim()}"`);
          }
        } catch (e) {
          console.log('保存用户偏好失败:', e);
        }
      }
    };

    // 保存用户输入作为潜在偏好
    await saveUserPreference(user.id, session?.current_stage || 1, message);

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
        // Update session - 阶段4完成后推进到阶段5
        const stageKey = `stage_${args.stage}_insight`;
        const updateData: any = {
          current_stage: args.stage + 1,  // 1→2, 2→3, 3→4, 4→5
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
${buildStagePrompt(updatedSession?.current_stage || 0, newStageRounds, stagePrompts, preferenceHint)}

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
          
          // 如果是 generate_briefing，直接返回简报信号
          if (nestedFunctionName === 'generate_briefing') {
            console.log('generate_briefing detected in nested loop, returning briefing signal');
            const briefingContent = followUpMessage.content || 
              "太棒了！你已经完成了今天的情绪四部曲 🌿\n\n这是为你生成的情绪简报：";
            
            return new Response(JSON.stringify({
              content: briefingContent,
              tool_call: { function: 'generate_briefing', args: nestedArgs }
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
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

    // 🚨 Stage 5 强制兜底：如果 AI 在 stage 5 没有调用 generate_briefing，自动构建
    if (session.current_stage >= 5 && !assistantMessage.tool_calls) {
      console.log('🚨 Stage 5 但没有 tool_call，强制生成简报');
      
      // 从会话历史和 session 提取简报数据
      const extractBriefingFromSession = () => {
        return {
          emotion_theme: session.event_summary || "情绪探索与成长",
          emotion_tags: ["情绪觉察", "自我成长", "内心力量"],
          stage_1_content: session.stage_1_insight || "觉察到自己的情绪，让感受被看见",
          stage_2_content: session.stage_2_insight || "理解了情绪背后的需求与渴望",
          stage_3_content: session.stage_3_insight || "看见了习惯性的反应模式",
          stage_4_content: session.stage_4_insight || "找到了新的应对方式和微行动",
          actionable_insight: "今天你勇敢地面对了自己的情绪，每一步都是成长。继续温柔地对待自己。",
          affirmation: "你已经迈出了重要的一步，这份觉察本身就是最大的力量。🌿"
        };
      };
      
      const briefingData = extractBriefingFromSession();
      const briefingContent = assistantMessage.content || 
        "太棒了！你已经完成了今天的情绪四部曲 🌿\n\n这是为你生成的情绪简报：";
      
      return new Response(JSON.stringify({
        content: briefingContent,
        tool_call: { function: 'generate_briefing', args: briefingData }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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