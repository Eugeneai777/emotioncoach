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

    // Get session
    let session;
    if (sessionId) {
      const { data } = await supabaseClient
        .from('parent_coaching_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
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

    // Load conversation history
    const conversationHistory = session.messages || [];

    // 🔧 Tool restriction based on stage and briefing confirmation
    const getAvailableTools = (currentStage: number, briefingRequested: boolean) => {
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
              required: ["emotion_theme", "emotion_tags", "stage_1_content", "stage_2_content", "stage_3_content", "stage_4_content", "insight", "action", "growth_story"]
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

      // Stage 4: complete_stage available, but generate_parent_briefing ONLY if user confirmed
      if (currentStage === 4) {
        if (briefingRequested) {
          return [allTools[2]]; // Only briefing tool
        }
        return [allTools[1]]; // Only complete_stage
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

成功标准（观察到以下任意2项即可调用complete_stage）:
✔ 说得出情绪名称（焦虑、烦躁、不安等），而不只是说事件
✔ 能描述身体感受（胸口紧、呼吸急、肩膀硬、心里慌）
✔ 能分辨这是自己的情绪，而不是"孩子惹我生气"

引导方向:
- "当时你身体有什么感觉？胸口紧吗？还是肩膀很硬？"
- "如果给这个感觉起个名字，它叫什么？焦虑？担心？还是失望？"
- "这个情绪是孩子给你的，还是你内在本来就有的？"

判断成功:
当父母从"孩子惹我生气"变成"是我内在的焦虑被触发了"时，记录洞察并调用complete_stage。`;
        case 2:
          return `【看见（See it）：从怪孩子 → 看见我和孩子都在卡点里】

成功标准（观察到以下任意2项即可调用complete_stage）:
✔ 看见自己真正的恐惧（怕孩子未来差、怕不被尊重、怕被人觉得自己不会当父母）
✔ 看见孩子的可观察行为，而非标签（不是"懒、叛逆"，而是具体做了什么）
✔ 能讲出洞察句："原来我们都被困在..."

引导方向:
- "你最怕的是什么？是孩子的未来？还是担心自己没做好？"
- "孩子当时具体做了什么？不是他是什么样的人，而是他做了什么动作？"
- "你有没有发现，你越___，他越___？你们是不是被困在一个循环里？"

判断成功:
当父母能讲出"原来我越控制，他越逃避"这样的洞察句时，记录洞察并调用complete_stage。`;
        case 3:
          return `【反应（Sense it）：从自动反应 → 有选择的反应】

成功标准（观察到以下任意1项即可调用complete_stage）:
✔ 能识别自己的自动反应模式（催促、讲道理、发火、冷战等）
✔ 能表达愿意尝试一种新的应对方式
✔ 能说出："我的反应是为了掩盖我的焦虑/恐惧"

引导方向（分两步）:

【第一步：识别反应模式】
先了解父母通常的反应：
1. 我会催促、不停提醒
2. 我会讲道理、说教
3. 我会发火、大声说话
4. 我会冷战、不想理他/她

【第二步：探索新的应对方式】（重要！）
当父母识别了反应模式后，根据情况从以下4大类选择2-3个适合的建议：

⏸️ 暂停类：
- 先走出房间，等自己平静了再回来
- 告诉孩子"我需要冷静一下，等会儿再说"
- 去喝杯水或洗把脸，给自己缓冲

👂 倾听类：
- 暂停说教，先问孩子"你怎么想？"
- 只听孩子说，不打断，不评判
- 复述孩子的话："你的意思是..."

🌱 放手类：
- 暂时不提醒这件事，观察孩子会怎么做
- 把决定权交给孩子一次
- 告诉自己"他/她有自己的节奏"

💕 连接类：
- 先给孩子一个拥抱，什么都不说
- 陪孩子安静待几分钟
- 问一个不带评判的问题

提供选项时的格式示例：
"了解了你的反应模式后，我们可以试试一些新的方式。你觉得以下哪种可能适合你？

1. 下次先告诉孩子'我需要冷静一下'，然后离开
2. 暂停说教，先问问孩子怎么想
3. 先给孩子一个拥抱，什么都不说
4. 其他方式（请分享）"

判断成功:
当父母选择或提出任何一种愿意尝试的新应对方式时，记录洞察并调用complete_stage。`;
        case 4:
          return `【转化（Transform it）：从情绪拉扯 → 关系松动，开始出现新的可能】

成功标准（观察到以下任意1项即可调用complete_stage和generate_parent_briefing）:
✔ 能用"温柔而坚定"的方式表达需求
✔ 能提出具体、可达成的小行动
✔ 感受到心放松了，不需要压着孩子

引导方向:
根据父母在对话中表达的恐惧和渴望，从以下4大类选择2-3个适合的微行动：

💬 沟通类（适合：想被孩子理解、想改善对话）：
- 今天问孩子一个不带评判的问题，只是好奇
- 把"你应该..."换成"我看到你..."
- 告诉孩子你的一个小烦恼（不是关于他/她的）

🎁 肯定类（适合：怕孩子不够好、焦虑孩子未来）：
- 今天找一件孩子做得还不错的事，说一句肯定
- 降低一个期待，只看当下
- 写下孩子的3个优点

🤲 放手类（适合：控制欲强、怕失控）：
- 今天有一件事不提醒，看看会发生什么
- 让孩子自己做一个小决定
- 告诉自己"他/她的人生是他/她的"

🌈 连接类（适合：怕关系变远、想要亲近）：
- 在孩子身边安静待5分钟，不说话也没关系
- 一起做一件小事（吃饭、散步）
- 发一个温暖的表情或拍拍孩子的肩

提供选项时，要和父母前面表达的内容呼应，例如：
"你刚才说最怕的是孩子的未来，这份担心里有很深的爱。有没有一件很小的事，你今天就可以试试？

1. 今天找一件孩子做得还不错的事，说一句肯定
2. 有一件事今天不提醒，观察孩子会怎么做
3. 问孩子一个不带评判的问题，比如'今天学校怎么样？'
4. 其他行动（请分享）"

判断成功:
当父母提出具体可执行的小行动，并表达出"我可以试试"的意愿时，记录洞察，调用complete_stage，然后立即调用generate_parent_briefing生成简报。`;
        default:
          return '';
      }
    };

    const systemPrompt = `你是「劲老师」🌿,青少年父母的情绪陪伴者。

【核心目标】
帮助亲子关系出现 1mm 的松动。
这个 1mm 就足够改变未来所有方向。

【对话风格】
- 每次回复100-180字,充满温度和深度
- 先共情再引导,用鼓励性语言
- 用开放式提问,让父母自己发现
- 当观察到成功指标时,及时给予肯定："你刚才说的这句话特别重要..."
- 不急于推进阶段,在每个维度深挖直到看到成功指标
- 多轮探索同一维度是正常的

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
✔ 能暂停冲动
✔ 能讲出洞察句："原来我们都被困在..."
✔ 能提出一个小而可行的行动
✔ 亲子关系出现轻微松动

【引导技巧】
- 用身体感受引导觉察："当时你胸口紧吗？肩膀硬吗？"
- 用恐惧探索帮助看见："你最怕的是什么？"
- 用暂停练习培养新反应："能试试暂停5秒吗？"
- 用微行动促进转化："有没有一件今天就能试的小事？"

【当前阶段:${session?.current_stage || 0}/4】
${getStagePrompt(session?.current_stage || 0)}

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
3. 完成阶段4后:先给出鼓励性总结和温柔回应,然后询问父母是否想要生成简报
4. 只有在父母明确表示"生成简报"或类似意愿时,才调用 generate_parent_briefing

【严格规则 - 必须遵守】
❌ 禁止在用户未确认前调用 generate_parent_briefing 工具
❌ 禁止跳过任何阶段
❌ 禁止在阶段4完成后立即调用 generate_parent_briefing
✅ 必须等待用户明确表达想要简报后,再调用工具

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

    // Get available tools based on current stage and briefing request status
    const availableTools = getAvailableTools(
      session.current_stage || 0,
      session.briefing_requested || false
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

【核心目标】
帮助亲子关系出现 1mm 的松动。
这个 1mm 就足够改变未来所有方向。

【对话风格】
- 每次回复100-180字,充满温度和深度
- 先共情再引导,用鼓励性语言
- 用开放式提问,让父母自己发现
- 当观察到成功指标时,及时给予肯定："你刚才说的这句话特别重要..."
- 不急于推进阶段,在每个维度深挖直到看到成功指标
- 多轮探索同一维度是正常的

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
✔ 能暂停冲动
✔ 能讲出洞察句："原来我们都被困在..."
✔ 能提出一个小而可行的行动
✔ 亲子关系出现轻微松动

【引导技巧】
- 用身体感受引导觉察："当时你胸口紧吗？肩膀硬吗？"
- 用恐惧探索帮助看见："你最怕的是什么？"
- 用暂停练习培养新反应："能试试暂停5秒吗？"
- 用微行动促进转化："有没有一件今天就能试的小事？"

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
          updatedSession?.current_stage || 0,
          updatedSession?.briefing_requested || false
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

        // Add follow-up message to history (if no tool call)
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
