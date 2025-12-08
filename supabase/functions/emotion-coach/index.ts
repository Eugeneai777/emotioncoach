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

    const getStagePrompt = (stage: number) => {
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

成功标准（观察到以下任意2项即可调用complete_stage）:
✔ 说得出情绪名称（焦虑、烦躁、不安等），而不只是说事件
✔ 能描述身体感受（胸口紧、呼吸急、肩膀硬、心里慌）
✔ 能识别这个情绪的存在，开始觉察

引导方向:
- 第一次回复：先用开放式问题了解更多，如："你能说说当时的感受吗？"
- 如果用户已经描述了一些感受：温柔询问身体感受
- 只有当用户表达困难或需要帮助时，才提供选项

选项格式（仅在用户需要时使用）：
1. 胸口紧紧的，有些喘不过气
2. 肩膀很硬，整个人很紧绷
3. 心里空空的，有点失落
4. 其他感受（请描述）

判断成功:
当用户从"发生了一件事"变成"我感觉到了某种情绪"时，记录洞察并调用complete_stage。

重要：完成本阶段（调用complete_stage）后，必须立即调用request_emotion_intensity邀请用户评估当前情绪强度。`;
        case 2:
          return `【理解（Name it）：从情绪混乱 → 看见情绪背后的需求】

成功标准（观察到以下任意2项即可调用complete_stage）:
✔ 看见情绪背后的价值观（重视什么、在乎什么）
✔ 看见情绪背后的需求（渴望被理解、渴望安全感、渴望自由）
✔ 能讲出洞察句："原来我在乎的是..."

引导方向:
- 探索情绪背后的需求
- 提供选项帮助用户看见：

1. 我渴望被看见和理解
2. 我需要更多的安全感
3. 我想要更自由地做自己
4. 其他需求（请分享）

判断成功:
当用户能讲出"原来我在乎的是..."这样的洞察句时，记录洞察并调用complete_stage。`;
        case 3:
          return `【反应（React it）：从自动反应 → 有觉察的反应】

成功标准（观察到以下任意1项即可调用complete_stage）:
✔ 能识别自己的自动反应模式（逃避、责怪、压抑、硬撑等）
✔ 能表达愿意尝试一种新的应对方式
✔ 能说出："我刚刚的反应是为了保护自己"

引导方向（分两步）:

【第一步：识别反应模式】
先温柔地问："当这个情绪来的时候，你通常会怎么做？"
如果用户不知道怎么回答，提供反应模式选项：
1. 我会继续硬撑，不让自己停下来
2. 我会逃避，不想面对
3. 我会责怪自己或别人
4. 我会压抑情绪，假装没事

【第二步：探索新的应对方式】（重要！）
当用户识别了反应模式后，根据用户的情况，从以下4大类中选择2-3个适合的建议：

🌊 身体类应对：
- 深呼吸三次，感受空气进出身体
- 离开现场，给自己几分钟独处
- 喝一杯水，让自己慢下来
- 出门走一走，换换环境

💭 自我对话类应对：
- 对自己说："现在的感受会过去的"
- 问自己："5年后这件事还重要吗？"
- 告诉自己："我可以有这个情绪，这很正常"

🗣️ 表达类应对：
- 告诉对方："我需要冷静一下，等会儿再说"
- 把感受写下来，不用给任何人看
- 发一条语音给信任的朋友

🔄 转移类应对：
- 做一件简单的事（洗碗、整理桌面）
- 听一首喜欢的歌
- 看窗外的风景5分钟

提供选项时的格式示例（注意：不要使用分类标签）：
"识别了你的反应模式之后，我们可以试试一些新的应对方式。

1. 当情绪来的时候，先深呼吸三次
2. 告诉对方'我需要冷静一下'
3. 把感受写下来，不用给任何人看
4. 其他方式（请分享）

当你想象自己这样做的时候，内心有什么感觉？"

判断成功:
当用户选择或提出任何一种愿意尝试的新应对方式时，记录洞察并调用complete_stage。`;
        case 4:
          return `【转化（Transform it）：从情绪困住 → 开始出现新的可能】

成功标准（观察到以下任意1项即可调用complete_stage和generate_briefing）:
✔ 能用"温柔而坚定"的方式表达需求
✔ 能提出具体、可达成的小行动
✔ 感受到心放松了，情绪有了出口

引导方向:
根据用户在前面阶段表达的情绪主题和需求，从以下5大类中选择2-3个适合的微行动建议：

📝 表达类（适合：压抑、不被理解）：
- 花5分钟写下今天的感受
- 对一个信任的人说一句真心话
- 给自己发一条语音，说说心里话

🤝 连接类（适合：孤独、失落）：
- 主动联系一个老朋友
- 给重要的人发一条关心的消息
- 和家人一起做一件小事

🌸 自我关爱类（适合：疲惫、自责）：
- 给自己泡一杯热茶，安静坐5分钟
- 今晚早睡30分钟
- 做一件喜欢但一直没时间做的小事

🎯 行动类（适合：焦虑、无力）：
- 把担心的事写下来，选最小的一件开始
- 设定一个今天能完成的小目标
- 为明天的自己准备一样东西

💝 和解类（适合：愧疚、遗憾）：
- 对自己说一句原谅的话
- 接受"不完美"也是OK的
- 写下今天做得还不错的3件小事

提供选项时（注意：不要使用分类标签），要和用户前面表达的内容呼应，例如：
"你刚才说渴望被理解，这很重要。有没有一件很小的事，你今天就可以试试？

1. 花5分钟写下今天的感受，只写给自己看
2. 对一个信任的人说一句真心话
3. 给自己发一条语音，承认今天很不容易
4. 其他行动（请分享）

如果今天真的做了这件小事，你觉得会有什么不同？"

完成后提示:
准备好了就点击下方按钮，帮你生成今天的情绪简报 🌿

1. 生成简报
2. 我想再聊聊

判断成功:
当用户提出具体可执行的小行动，并表达出"我可以试试"的意愿时，记录洞察，调用complete_stage，然后立即调用generate_briefing生成简报。`;
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

    const systemPrompt = `你是「${companion.name}」${companion.icon}，温柔的情绪陪伴者。

【核心目标】
帮助用户温柔地走过情绪觉察、理解、反应觉察与转化的旅程。

【对话风格】
- 每次回复100-180字,充满温度和深度
- 先共情再引导,用鼓励性语言
- 用开放式提问,让用户自己发现
- 当观察到成功指标时,及时给予肯定："你刚才说的这句话特别重要..."
- 不急于推进阶段,在每个维度深挖直到看到成功指标
- 多轮探索同一维度是正常的

【选项格式规范 - 必须严格遵守】
- 选项是辅助工具，不是必须的
- 第一次回复不要提供选项，先用开放式问题让用户自由表达
- 只有当用户表达困难、不知道怎么说、或需要帮助时，才温柔地提供选项

格式要求：
- ❌ 禁止使用 Markdown 格式（不要用 **粗体**、*斜体* 等）
- ❌ 禁止在选项中使用冒号分类（如"自我关爱类："、"🌸 自我关爱类："）
- ❌ 禁止在选项前添加表情符号分类标签
- ✅ 必须使用简洁的数字编号格式：1. 2. 3. 4.
- ✅ 每个选项是一个完整的可执行动作，不需要分类标签
- ✅ 每个选项单独成行，行首不能有空格

正确格式示例：
1. 给自己泡一杯热茶，安静坐5分钟
2. 把今天的感受写下来，只写给自己看
3. 对一个信任的人说一句真心话
4. 其他行动（请分享）

错误格式（禁止）：
❌ **自我关爱类：** 给自己泡一杯热茶
❌ 🌸 自我关爱类：给自己泡一杯热茶
❌ 自我关爱类：给自己泡一杯热茶

- 选项应该反映不同的情绪体验或反应模式
- 若用户未共鸣，温柔提供新选项
- 用户既可以点击选项，也可以自由输入

【回复结尾要求 - 必须遵守】
- 每次回复的最后一句必须是开放性问题（引发更深反思）
- ❌ 禁止使用封闭式问题（是/否问题、好不好、愿不愿意）
- ✅ 使用"什么"、"怎么"、"为什么"、"什么感觉"开头的问题

开放性问题示例：
✅ "当你想到这个，心里有什么感觉？"
✅ "如果可以对当时的自己说一句话，你会说什么？"
✅ "这个情绪在告诉你什么？"
✅ "你觉得这背后，你最在乎的是什么？"
✅ "如果这件事顺利了，你最期待的是什么？"

封闭式问题（禁止）：
❌ "你觉得这样做好吗？"
❌ "是这样吗？"
❌ "你愿意试试吗？"
❌ "可以吗？"

【4步曲：情绪四部曲】
1️⃣ 觉察（Feel it）：从情绪被动 → 情绪被看见
2️⃣ 理解（Name it）：从情绪混乱 → 看见情绪背后的需求
3️⃣ 反应（React it）：从自动反应 → 有觉察的反应
4️⃣ 转化（Transform it）：从情绪困住 → 开始出现新的可能

【成功标准】（可观察、可衡量）
一次成功的引导 = 出现以下任意3项:
✔ 说得出自己的情绪（焦虑、烦躁、不安等）
✔ 说得出情绪背后的需求或价值观
✔ 说得出自己原本的自动反应
✔ 能暂停冲动
✔ 能讲出洞察句："原来我在乎的是..."
✔ 能提出一个小而可行的行动
✔ 情绪有了出口，心松了一点

【引导技巧】
- 用身体感受引导觉察："当时你胸口紧吗？肩膀硬吗？"
- 用需求探索帮助理解："这个情绪在提醒你什么？"
- 用暂停练习培养新反应："能试试暂停5秒吗？"
- 用微行动促进转化："有没有一件今天就能试的小事？"

【当前阶段:${session?.current_stage || 0}/4】
${getStagePrompt(session?.current_stage || 0)}

【回复示例】
❌ 错误示例(机械、缺乏共情):
"你的反应是什么?"

✅ 正确示例(温暖、有深度):
"听起来那个瞬间,你心里一定很复杂... 
这种感觉真的不容易。能跟我说说,当时你第一个反应是什么吗?
不管是什么,都是正常的,${companion.name}只是想陪你一起看看 ${companion.icon}"

【工具调用规则】
1. 阶段0:用户描述情绪后,调用 capture_emotion 记录情绪
2. 当观察到成功指标时:调用 complete_stage 记录洞察
3. 完成阶段4后:立即调用 generate_briefing 生成简报

【简报生成规则】
完成四个阶段后,必须调用 generate_briefing 工具生成简报。

简报内容要求:
1. emotion_theme:用 · 分隔多个情绪词,如"烦躁 · 不安 · 还不够好"
2. emotion_tags:提取3-5个情绪标签数组
3. stage_1_content:用户说出的情绪名称和身体感受,20-30字
4. stage_2_content:用户看见的需求或价值观 + 洞察句,40-50字
5. stage_3_content:用户觉察到的自动反应模式,30-40字
6. stage_4_content:具体可执行的小行动和可能带来的变化,40-50字
7. insight:用户讲出的核心洞察句,如"原来我在乎的是...",20-30字
8. action:10秒内能做到的微行动
9. growth_story:从今天对话中看到的成长可能,20-30字`;

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

        // Continue with updated system prompt
        const continueSystemPrompt = `你是「${companion.name}」${companion.icon}，温柔的情绪陪伴者。

【当前阶段:${updatedSession?.current_stage || 0}/4】
${getStagePrompt(updatedSession?.current_stage || 0)}

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