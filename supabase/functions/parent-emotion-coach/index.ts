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

    // Get session
    let session;
    let isNewSession = false;
    if (sessionId) {
      const { data } = await supabaseClient
        .from('parent_coaching_sessions')
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
            feature_key: 'parent_coach',
            source: 'parent_coach_session',
            conversationId: session.conversation_id || sessionId,
            metadata: { session_id: sessionId }
          })
        });
        
        if (deductResponse.ok) {
          const result = await deductResponse.json();
          console.log(`✅ 亲子教练会话扣费: ${result.cost} 点, 剩余: ${result.remaining_quota}`);
        } else {
          const error = await deductResponse.json();
          console.error('❌ 亲子教练扣费失败:', error);
          if (deductResponse.status === 400) {
            return new Response(JSON.stringify({ error: '余额不足，请充值后继续使用' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error) {
        console.error('❌ 亲子教练扣费请求失败:', error);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Load conversation history
    const conversationHistory = session.messages || [];

    // 🔧 Tool restriction based on stage and briefing confirmation
    const getAvailableTools = (currentStage: number) => {
      const allTools = [
        {
          type: "function",
          function: {
            name: "capture_event",
            description: "记录父母描述的事件,准备进入情绪觉察",
            parameters: {
              type: "object",
              properties: {
                event_summary: {
                  type: "string",
                  description: "事件简要描述,20-30字"
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
            name: "generate_parent_briefing",
            description: "完成四阶段后生成家长版情绪简报",
            parameters: {
              type: "object",
              properties: {
                emotion_theme: {
                  type: "string",
                  description: "主题情绪,如:烦躁 · 不安 · \"还不够好\""
                },
                emotion_intensity: {
                  type: "number",
                  description: "情绪强度1-10分,1为最轻微,10为最强烈。根据父母描述的情绪状态评估"
                },
                emotion_tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "情绪标签数组,如:[\"烦躁\", \"不安\", \"还不够好\"]"
                },
                stage_1_content: {
                  type: "string",
                  description: "觉察:父母说出的情绪名称和身体感受,20-30字"
                },
                stage_2_content: {
                  type: "string",
                  description: "看见:父母的恐惧 + 孩子的可观察行为 + 洞察句,40-50字"
                },
                stage_3_content: {
                  type: "string",
                  description: "反应:父母愿意尝试的暂停方式或新反应,30-40字"
                },
                stage_4_content: {
                  type: "string",
                  description: "转化:具体可执行的小行动和可能带来的正向变化,40-50字"
                },
                insight: {
                  type: "string",
                  description: "今日洞察:父母讲出的核心洞察句,如'原来我们都被困在...',20-30字"
                },
                action: {
                  type: "string",
                  description: "今日行动:10秒内能做到的微行动"
                },
                growth_story: {
                  type: "string",
                  description: "1mm的松动:从今天对话中看到的亲子关系变化可能,20-30字"
                }
              },
              required: ["emotion_theme", "emotion_intensity", "emotion_tags", "stage_1_content", "stage_2_content", "stage_3_content", "stage_4_content", "insight", "action", "growth_story"]
            }
          }
        }
      ];

      // Stage 0: Only capture_event
      if (currentStage === 0) {
        return [allTools[0]];
      }

      // Stages 1-3: capture_event and complete_stage
      if (currentStage >= 1 && currentStage <= 3) {
        return [allTools[0], allTools[1]];
      }

      // Stage 4: both complete_stage and generate_parent_briefing (auto-generate)
      if (currentStage === 4) {
        return [allTools[1], allTools[2]];
      }

      return [];
    };

    const getStagePrompt = (stage: number) => {
      switch (stage) {
        case 0:
          return `【开场】
用温暖的开场白邀请父母分享。如果父母已描述事件,表达理解后调用 capture_event。
不要急着问问题,先让父母感受到被接纳。`;
        case 1:
          return `【觉察（Feel it）：从情绪被动 → 情绪被看见】

成功标准（观察到以下任意1项即可调用complete_stage）:
✔ 说得出情绪名称（焦虑、烦躁、不安等），而不只是说事件
✔ 能描述身体感受（胸口紧、呼吸急、肩膀硬、心里慌）
✔ 能分辨这是自己的情绪，而不是"孩子惹我生气"

引导方向（每个阶段最多2轮对话后果断推进）:
- "当时你身体有什么感觉？胸口紧吗？还是肩膀很硬？"
- "如果给这个感觉起个名字，它叫什么？焦虑？担心？还是失望？"

镜像反射技巧（重要！不只是提问，要主动给出觉察）:
- 用户说"他就是不听话" → "你说'不听话'，背后是不是有一种'我的话不被重视'的感觉？这份被忽视的感觉，可能不只是关于孩子..."
- 用户说"气死我了" → "这个'气'里面，是不是藏着一份深深的担心？担心如果你不管，事情会失控？"

判断成功:
当父母说出任何一个情绪词（哪怕只是"烦"、"累"、"担心"），就可以镜像反射后推进。不需要等用户完美表达。`;
        case 2:
          return `【看见（See it）：从怪孩子 → 看见我和孩子都在卡点里】

成功标准（观察到以下任意1项即可调用complete_stage）:
✔ 看见自己真正的恐惧（怕孩子未来差、怕不被尊重、怕被人觉得自己不会当父母）
✔ 看见孩子的可观察行为，而非标签（不是"懒、叛逆"，而是具体做了什么）
✔ 能讲出洞察句："原来我们都被困在..."

引导方向（每个阶段最多2轮对话后果断推进）:
- "你最怕的是什么？是孩子的未来？还是担心自己没做好？"
- "你有没有发现，你越___，他越___？"

镜像反射技巧（重要！主动帮用户看见深层模式）:
- 用户说"他总是玩手机" → "你一直在关注'他在做什么'，但我更好奇的是——当你看到他玩手机的那一刻，你心里闪过的第一个念头是什么？是'他的未来怎么办'？还是'我是不是哪里没做好'？"
- 主动给出洞察："我听到的是，你越努力想帮他，他越想逃开。你们好像被困在一个'越用力越无力'的循环里..."

判断成功:
当父母表达出任何一种恐惧或说出循环模式，镜像反射后即可推进。`;
        case 3:
          return `【反应（Sense it）：从自动反应 → 有选择的反应】

成功标准（观察到以下任意1项即可调用complete_stage）:
✔ 能识别自己的自动反应模式（催促、讲道理、发火、冷战等）
✔ 能表达愿意尝试一种新的应对方式

引导方向（每个阶段最多2轮对话后果断推进）:

【第一步：识别反应模式】
先了解父母通常的反应，然后镜像反射：
- 用户说"我就忍不住说他" → "你说'忍不住'，说明你其实不想说教，但那个焦虑太强了，它推着你开口。这不是你的错，是你内在的保护机制在运转。"

【第二步：探索新的应对方式】
根据情况从以下4大类选择2-3个适合的建议：

⏸️ 暂停类：先走出房间 / 告诉孩子"我需要冷静一下"
👂 倾听类：暂停说教，先问孩子"你怎么想？"
🌱 放手类：暂时不提醒这件事，观察孩子会怎么做
💕 连接类：先给孩子一个拥抱，什么都不说

提供选项时不要使用分类标签，直接给出具体建议。

判断成功:
当父母选择或提出任何一种愿意尝试的新应对方式时，记录洞察并调用complete_stage。`;
        case 4:
          return `【转化（Transform it）：从情绪拉扯 → 关系松动，开始出现新的可能】

成功标准（观察到以下任意1项即可调用complete_stage，然后立即调用generate_parent_briefing）:
✔ 能提出具体、可达成的小行动
✔ 感受到心放松了，不需要压着孩子

引导方向（每个阶段最多2轮对话后果断推进）:
根据父母在对话中表达的恐惧和渴望，从以下4大类选择2-3个适合的微行动：

💬 沟通类：问孩子一个不带评判的问题 / 告诉孩子你的一个小烦恼
🎁 肯定类：找一件孩子做得还不错的事说一句肯定 / 降低一个期待
🤲 放手类：有一件事不提醒看看会发生什么 / 让孩子自己做一个小决定
🌈 连接类：在孩子身边安静待5分钟 / 一起做一件小事

提供选项时不要使用分类标签，要和父母前面表达的内容呼应。

镜像反射技巧:
- "你选择了这个行动，说明你内心深处相信孩子是有力量的。这份信任，孩子一定能感受到。"

判断成功:
当父母提出具体可执行的小行动时，记录洞察，调用complete_stage，然后必须立即调用generate_parent_briefing生成简报。绝对不要回复"简报正在生成中"这样的文字，而是直接调用工具。`;
        default:
          return '';
      }
    };

    // Fetch system prompt from database
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user display name
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    
    const userName = profile?.display_name || '朋友';
    
    const { data: coachTemplate } = await serviceClient
      .from('coach_templates')
      .select('system_prompt')
      .eq('coach_key', 'parent')
      .single();

    // Fetch coach memory for personalized continuity (亲子教练记忆)
    const { data: coachMemories } = await serviceClient
      .from('user_coach_memory')
      .select('*')
      .eq('user_id', user.id)
      .eq('coach_type', 'parent')
      .order('importance_score', { ascending: false })
      .limit(5);

    // Fetch last session for conversation continuity
    const { data: lastSession } = await serviceClient
      .from('parent_coaching_sessions')
      .select('session_summary, key_insight, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Build memory context
    let memoryContext = '';
    if (coachMemories && coachMemories.length > 0) {
      memoryContext = `\n\n【教练记忆 - 用户过往亲子觉察】
以下是${userName}之前分享过的重要觉察点：
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
${daysSince >= 3 && daysSince <= 7 ? `- "${userName}，上次我们聊到${lastSession.session_summary}，这几天和孩子相处有什么新发现吗？"` : ''}
${daysSince > 7 ? `- "${userName}，好久不见呀～还记得上次我们聊到的亲子时刻吗？"` : ''}
`;
    }

    const basePrompt = coachTemplate?.system_prompt || '';
    
    // Build complete system prompt with dynamic stage info
    const systemPrompt = `${basePrompt}

【最高优先级规则：结束对话检测】
当用户表达结束对话意图时（包括但不限于："今天先聊到这"、"谢谢陪伴"、"再见"、"我先走了"、"下次再聊"、"好的，拜拜"、"不聊了"、"就到这吧"），你必须：
1. 温暖简短地回应，肯定本次对话的收获
2. 绝对不要再追问任何问题
3. 回复2-3句即可
4. 以温柔祝福结尾，如"照顾好自己哦 🌿"

【用户信息】
用户名称：${userName}
在对话中使用用户名称来增加亲切感，如"${userName}，我能感受到你对孩子的爱..."

${memoryContext}
${continuityContext}

【当前阶段:${session?.current_stage || 0}/4】
${getStagePrompt(session?.current_stage || 0)}`;

    // Get available tools based on current stage and briefing request status
    const availableTools = getAvailableTools(
      session.current_stage || 0
    );

    // Add user message to history
    conversationHistory.push({ role: "user", content: message });

    // Build messages array with full history
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
    ];

    console.log('Sending to AI with history:', conversationHistory.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools: availableTools,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', error);
      throw new Error(`AI API error: ${response.status}`);
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
      .from('parent_coaching_sessions')
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

      if (functionName === 'capture_event') {
        // Save event and move to stage 1
        await supabaseClient
          .from('parent_coaching_sessions')
          .update({
            event_description: args.event_summary,
            current_stage: 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      if (functionName === 'complete_stage') {
        // Update session
        const stageKey = `stage_${args.stage}`;
        const updatedSelections = {
          ...session?.stage_selections,
          [stageKey]: args.insight
        };

        const updateData: any = {
          current_stage: args.stage < 4 ? args.stage + 1 : 4,
          stage_selections: updatedSelections,
          updated_at: new Date().toISOString()
        };

        // Store stage content
        if (args.stage === 1) updateData.feel_it = { insight: args.insight };
        if (args.stage === 2) updateData.see_it = { insight: args.insight };
        if (args.stage === 3) updateData.sense_it = { insight: args.insight };
        if (args.stage === 4) updateData.transform_it = { insight: args.insight };

        await supabaseClient
          .from('parent_coaching_sessions')
          .update(updateData)
          .eq('id', sessionId);
      }

      // 🔧 For capture_event and complete_stage, continue conversation to get follow-up response
      if (functionName === 'capture_event' || functionName === 'complete_stage') {
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
          .from('parent_coaching_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        // Build new messages with updated system prompt
        const continueSystemPrompt = `你是「劲老师」🌿,青少年父母的情绪陪伴者。

【最高优先级规则：结束对话检测】
当用户表达结束对话意图时（包括但不限于："今天先聊到这"、"谢谢陪伴"、"再见"、"我先走了"、"下次再聊"、"好的，拜拜"、"不聊了"、"就到这吧"），你必须：
1. 温暖简短地回应，肯定本次对话的收获
2. 绝对不要再追问任何问题
3. 回复2-3句即可
4. 以温柔祝福结尾，如"照顾好自己哦 🌿"

【核心目标】
帮助亲子关系出现 1mm 的松动。
这个 1mm 就足够改变未来所有方向。

【对话风格】
- 每次回复150-250字,充满温度和深度
- 先共情再引导,用鼓励性语言
- 不只是提问,要把用户的话"翻译"成更深层的觉察（镜像反射）
- 每个阶段最多2轮对话后果断推进
- 当观察到成功指标时,及时给予肯定："你刚才说的这句话特别重要..."

【4步曲：从情绪被动到关系松动】
1️⃣ 觉察（Feel it）：从情绪被动 → 情绪被看见
2️⃣ 看见（See it）：从怪孩子 → 看见我和孩子都在卡点里
3️⃣ 反应（Sense it）：从自动反应 → 有选择的反应
4️⃣ 转化（Transform it）：从情绪拉扯 → 关系松动，开始出现新的可能

【成功标准】（可观察、可衡量）
一次成功的引导 = 出现以下任意3项:
✔ 说得出自己的情绪（焦虑、烦躁、不安等）
✔ 说得出孩子的可观察行为（不是标签）
✔ 说得出自己原本的自动反应
✔ 能讲出洞察句："原来我们都被困在..."
✔ 能提出一个小而可行的行动

【引导技巧】
- 镜像反射（核心技巧）：把用户的话"翻译"成更深层的觉察，而不只是提问
- 用身体感受引导觉察："当时你胸口紧吗？肩膀硬吗？"
- 用恐惧探索帮助看见："你最怕的是什么？"
- 用微行动促进转化："有没有一件今天就能试的小事？"
- 每个阶段最多2轮对话后果断推进，不要反复确认

【当前阶段:${updatedSession?.current_stage || 0}/4】
${getStagePrompt(updatedSession?.current_stage || 0)}

【回复示例】
❌ 错误示例(机械、缺乏共情):
"当孩子那样做的时候,你的反应是什么?"

✅ 正确示例(温暖、有深度):
"听起来那个瞬间,你心里一定很复杂... 
一边是对孩子的担心,一边是不知道怎么让他听进去。
这种感觉真的不容易。能跟我说说,当时你第一个反应是什么吗?
不管是什么,都是正常的,劲老师只是想陪你一起看看 🌿"

【工具调用规则】
1. 阶段0:父母描述事件后,调用 capture_event 记录事件
2. 当观察到成功指标时:调用 complete_stage 记录洞察
3. 完成阶段4后:立即调用 generate_parent_briefing 生成简报

【简报生成规则】
完成四个阶段后,必须调用 generate_parent_briefing 工具生成简报。

简报内容要求:
1. emotion_theme:用 · 分隔多个情绪词,如"烦躁 · 不安 · \"还不够好\""
2. emotion_tags:提取3-5个情绪标签数组
3. stage_1_content:父母说出的情绪名称和身体感受,20-30字
4. stage_2_content:父母的恐惧 + 孩子的可观察行为 + 洞察句,40-50字
5. stage_3_content:父母愿意尝试的暂停方式或新反应,30-40字
6. stage_4_content:具体可执行的小行动和可能带来的正向变化,40-50字
7. insight:父母讲出的核心洞察句,如"原来我们都被困在...",20-30字
8. action:10秒内能做到的微行动
9. growth_story:从今天对话中看到的亲子关系变化可能,20-30字`;

        // Continue conversation with AI
        // Get updated tools after stage progression
        const updatedTools = getAvailableTools(
          updatedSession?.current_stage || 0
        );

        const continueResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            tools: updatedTools,
            temperature: 0.6,
          }),
        });

        if (!continueResponse.ok) {
          const error = await continueResponse.text();
          console.error('AI API continue error:', error);
          throw new Error(`AI API continue error: ${continueResponse.status}`);
        }

        const continueData = await continueResponse.json();
        const followUpMessage = continueData.choices[0].message;

        console.log('Follow-up message:', followUpMessage);

        // Check if follow-up message contains a tool call
        if (followUpMessage.tool_calls && followUpMessage.tool_calls.length > 0) {
          const followUpToolCall = followUpMessage.tool_calls[0];
          const followUpFunctionName = followUpToolCall.function.name;
          const followUpArgs = JSON.parse(followUpToolCall.function.arguments);

          console.log('Follow-up tool call detected:', followUpFunctionName, followUpArgs);

          // Handle generate_parent_briefing in follow-up
          if (followUpFunctionName === 'generate_parent_briefing') {
            // Add assistant message with tool call to history
            conversationHistory.push({
              role: "assistant",
              content: followUpMessage.content || "",
              tool_calls: followUpMessage.tool_calls
            });

            // Create conversation record
            const { data: conversationData } = await supabaseClient
              .from('conversations')
              .insert({ user_id: user.id })
              .select()
              .single();

            // Create briefing
            const { data: briefingData } = await supabaseClient
              .from('briefings')
              .insert({
                conversation_id: conversationData.id,
                emotion_theme: followUpArgs.emotion_theme,
                emotion_intensity: followUpArgs.emotion_intensity || 5,
                stage_1_content: followUpArgs.stage_1_content,
                stage_2_content: followUpArgs.stage_2_content,
                stage_3_content: followUpArgs.stage_3_content,
                stage_4_content: followUpArgs.stage_4_content,
                insight: followUpArgs.insight,
                action: followUpArgs.action,
                growth_story: followUpArgs.growth_story
              })
              .select()
              .single();

            // Create and associate tags
            for (const tagName of followUpArgs.emotion_tags) {
              const { data: tagData } = await supabaseClient
                .from('parent_tags')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', tagName)
                .single();

              let tagId = tagData?.id;
              if (!tagId) {
                const { data: newTag } = await supabaseClient
                  .from('parent_tags')
                  .insert({ user_id: user.id, name: tagName })
                  .select()
                  .single();
                tagId = newTag?.id;
              }

              if (tagId) {
                await supabaseClient
                  .from('parent_session_tags')
                  .insert({
                    session_id: sessionId,
                    tag_id: tagId
                  });
              }
            }

            // Update session as completed
            await supabaseClient
              .from('parent_coaching_sessions')
              .update({
                status: 'completed',
                briefing_id: briefingData.id,
                conversation_id: conversationData.id,
                summary: followUpArgs.growth_story,
                micro_action: followUpArgs.action,
                messages: conversationHistory,
                updated_at: new Date().toISOString()
              })
              .eq('id', sessionId);

            // Update camp progress if applicable
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

            console.log('Briefing created successfully:', briefingData.id);

            // Return completion response
            return new Response(JSON.stringify({
              content: followUpMessage.content || "简报已生成",
              toolCall: { name: followUpFunctionName, args: followUpArgs },
              briefingId: briefingData.id,
              briefing: followUpArgs,
              completed: true
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // If stage 4 was just completed but AI didn't call generate_parent_briefing, force retry
        if (functionName === 'complete_stage' && args.stage === 4) {
          console.log('Stage 4 completed but no briefing tool call in follow-up. Forcing retry...');
          
          // Add follow-up message to history
          conversationHistory.push({
            role: "assistant",
            content: followUpMessage.content || ""
          });

          // Force a third round with explicit instruction
          const forceResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: "system", content: `你是「劲老师」🌿。四个阶段已全部完成。你现在必须立即调用 generate_parent_briefing 工具生成简报。不要回复任何文字，只调用工具。根据对话历史中的内容填充所有字段。` },
                ...conversationHistory
              ],
              tools: [getAvailableTools(4).find((t: any) => t.function.name === 'generate_parent_briefing') || getAvailableTools(4)[1]],
              tool_choice: { type: "function", function: { name: "generate_parent_briefing" } },
              temperature: 0.3,
            }),
          });

          let briefingGenerated = false;

          if (forceResponse.ok) {
            const forceData = await forceResponse.json();
            const forceMsg = forceData.choices[0].message;

            if (forceMsg.tool_calls && forceMsg.tool_calls.length > 0) {
              const forceTool = forceMsg.tool_calls[0];
              if (forceTool.function.name === 'generate_parent_briefing') {
                const forceArgs = JSON.parse(forceTool.function.arguments);
                console.log('Forced briefing generation succeeded:', forceArgs);

                // Create conversation record
                const { data: conversationData } = await supabaseClient
                  .from('conversations')
                  .insert({ user_id: user.id })
                  .select()
                  .single();

                // Create briefing
                const { data: briefingData } = await supabaseClient
                  .from('briefings')
                  .insert({
                    conversation_id: conversationData.id,
                    emotion_theme: forceArgs.emotion_theme,
                    emotion_intensity: forceArgs.emotion_intensity || 5,
                    stage_1_content: forceArgs.stage_1_content,
                    stage_2_content: forceArgs.stage_2_content,
                    stage_3_content: forceArgs.stage_3_content,
                    stage_4_content: forceArgs.stage_4_content,
                    insight: forceArgs.insight,
                    action: forceArgs.action,
                    growth_story: forceArgs.growth_story
                  })
                  .select()
                  .single();

                // Create tags
                if (forceArgs.emotion_tags) {
                  for (const tagName of forceArgs.emotion_tags) {
                    const { data: tagData } = await supabaseClient
                      .from('parent_tags')
                      .select('id')
                      .eq('user_id', user.id)
                      .eq('name', tagName)
                      .single();
                    let tagId = tagData?.id;
                    if (!tagId) {
                      const { data: newTag } = await supabaseClient
                        .from('parent_tags')
                        .insert({ user_id: user.id, name: tagName })
                        .select()
                        .single();
                      tagId = newTag?.id;
                    }
                    if (tagId) {
                      await supabaseClient
                        .from('parent_session_tags')
                        .insert({ session_id: sessionId, tag_id: tagId });
                    }
                  }
                }

                // Update session as completed
                await supabaseClient
                  .from('parent_coaching_sessions')
                  .update({
                    status: 'completed',
                    briefing_id: briefingData.id,
                    conversation_id: conversationData.id,
                    summary: forceArgs.growth_story,
                    micro_action: forceArgs.action,
                    messages: conversationHistory,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', sessionId);

                // Update camp progress
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

                briefingGenerated = true;
                console.log('Forced briefing created:', briefingData.id);

                return new Response(JSON.stringify({
                  content: followUpMessage.content || "简报已生成",
                  toolCall: { name: 'generate_parent_briefing', args: forceArgs },
                  briefingId: briefingData.id,
                  briefing: forceArgs,
                  completed: true
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }
            }
          }

          // Ultimate fallback: construct briefing from session data
          if (!briefingGenerated) {
            console.log('Force retry also failed. Using fallback briefing from session data...');
            
            const fallbackArgs = {
              emotion_theme: '亲子情绪觉察',
              emotion_intensity: 5,
              emotion_tags: ['觉察', '成长'],
              stage_1_content: session.feel_it?.insight || updatedSession?.feel_it?.insight || '觉察到了内在的情绪',
              stage_2_content: session.see_it?.insight || updatedSession?.see_it?.insight || '看见了情绪背后的需求',
              stage_3_content: session.sense_it?.insight || updatedSession?.sense_it?.insight || '选择了新的应对方式',
              stage_4_content: args.insight || '找到了具体的行动方向',
              insight: '在觉察中看见了自己和孩子的成长可能',
              action: '今天试着用新的方式回应孩子',
              growth_story: '每一次觉察都是亲子关系松动的开始',
            };

            const { data: conversationData } = await supabaseClient
              .from('conversations')
              .insert({ user_id: user.id })
              .select()
              .single();

            const { data: briefingData } = await supabaseClient
              .from('briefings')
              .insert({
                conversation_id: conversationData.id,
                emotion_theme: fallbackArgs.emotion_theme,
                emotion_intensity: fallbackArgs.emotion_intensity,
                stage_1_content: fallbackArgs.stage_1_content,
                stage_2_content: fallbackArgs.stage_2_content,
                stage_3_content: fallbackArgs.stage_3_content,
                stage_4_content: fallbackArgs.stage_4_content,
                insight: fallbackArgs.insight,
                action: fallbackArgs.action,
                growth_story: fallbackArgs.growth_story
              })
              .select()
              .single();

            await supabaseClient
              .from('parent_coaching_sessions')
              .update({
                status: 'completed',
                briefing_id: briefingData.id,
                conversation_id: conversationData.id,
                summary: fallbackArgs.growth_story,
                micro_action: fallbackArgs.action,
                messages: conversationHistory,
                updated_at: new Date().toISOString()
              })
              .eq('id', sessionId);

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

            console.log('Fallback briefing created:', briefingData.id);

            return new Response(JSON.stringify({
              content: followUpMessage.content || "简报已生成",
              toolCall: { name: 'generate_parent_briefing', args: fallbackArgs },
              briefingId: briefingData.id,
              briefing: fallbackArgs,
              completed: true
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Add follow-up message to history (if no tool call, non-stage-4 case)
        conversationHistory.push({
          role: "assistant",
          content: followUpMessage.content || ""
        });

        // Save updated conversation history
        await supabaseClient
          .from('parent_coaching_sessions')
          .update({
            messages: conversationHistory,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        // Return follow-up response
        return new Response(JSON.stringify({
          content: followUpMessage.content,
          toolCall: { name: functionName, args }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
            emotion_intensity: args.emotion_intensity || 5,
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
            .from('parent_tags')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', tagName)
            .single();

          let tagId = tagData?.id;
          if (!tagId) {
            const { data: newTag } = await supabaseClient
              .from('parent_tags')
              .insert({ user_id: user.id, name: tagName })
              .select()
              .single();
            tagId = newTag?.id;
          }

          if (tagId) {
            await supabaseClient
              .from('parent_session_tags')
              .insert({
                session_id: sessionId,
                tag_id: tagId
              });
          }
        }

        // Update session
        await supabaseClient
          .from('parent_coaching_sessions')
          .update({
            status: 'completed',
            briefing_id: briefingData.id,
            conversation_id: conversationData.id,
            summary: args.growth_story,
            micro_action: args.action,
            messages: conversationHistory,
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
          briefing: args,
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
