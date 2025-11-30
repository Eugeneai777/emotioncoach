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
    if (sessionId) {
      const { data } = await supabaseClient
        .from('emotion_coaching_sessions')
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

    const getStagePrompt = (stage: number) => {
      switch (stage) {
        case 0:
          return `【开场】
用温暖的开场白邀请用户分享情绪。如果用户已描述情绪,表达理解后调用 capture_emotion。
不要急着问问题,先让用户感受到被接纳。`;
        case 1:
          return `【觉察（Feel it）：从情绪被动 → 情绪被看见】

成功标准（观察到以下任意2项即可调用complete_stage）:
✔ 说得出情绪名称（焦虑、烦躁、不安等），而不只是说事件
✔ 能描述身体感受（胸口紧、呼吸急、肩膀硬、心里慌）
✔ 能识别这个情绪的存在，开始觉察

引导方向:
- 先温柔询问身体感受
- 然后提供选项帮助用户命名情绪：

1. 胸口紧紧的，有些喘不过气
2. 肩膀很硬，整个人很紧绷
3. 心里空空的，有点失落
4. 其他感受（请描述）

判断成功:
当用户从"发生了一件事"变成"我感觉到了某种情绪"时，记录洞察并调用complete_stage。`;
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
✔ 能表达"我可以试试先暂停5秒"
✔ 能说出："我刚刚的反应是为了保护自己"
✔ 能分辨自己的自动反应模式（逃避、责怪、压抑等）

引导方向:
- 询问用户通常的反应模式
- 提供选项：

1. 我会继续硬撑，不让自己停下来
2. 我会逃避，不想面对
3. 我会责怪自己或别人
4. 我会压抑情绪，假装没事

判断成功:
当用户第一次说出"我可以试试先暂停"或"我的反应是为了..."时，记录洞察并调用complete_stage。`;
        case 4:
          return `【转化（Transform it）：从情绪困住 → 开始出现新的可能】

成功标准（观察到以下任意1项即可调用complete_stage和generate_briefing）:
✔ 能用"温柔而坚定"的方式表达需求
✔ 能提出具体、可达成的小行动
✔ 感受到心放松了，情绪有了出口

引导方向:
- 引导用户想象具体的小行动
- 提供选项：

1. 花5分钟写下自己的感受
2. 对重要的人说一句真心话
3. 给自己一个温柔的拥抱
4. 其他行动（请分享）

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

【选项格式规范】
- 在每个阶段的引导中，适时提供2-4个贴近人性的选项
- 必须使用数字编号格式：1. 2. 3. 4.
- 每个选项单独成行
- 示例格式：
  1. 第一个选项
  2. 第二个选项
  3. 第三个选项
- 选项应该反映不同的情绪体验或反应模式
- 若用户未共鸣，温柔提供新选项
- 用户既可以点击选项，也可以自由输入

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

        const continueData = await continueResponse.json();
        const followUpMessage = continueData.choices[0].message;

        conversationHistory.push({
          role: "assistant",
          content: followUpMessage.content || ""
        });

        await supabaseClient
          .from('emotion_coaching_sessions')
          .update({
            messages: conversationHistory,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        return new Response(JSON.stringify({
          content: followUpMessage.content,
          tool_call: { function: functionName, args }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // For generate_briefing, return the briefing data
      if (functionName === 'generate_briefing') {
        return new Response(JSON.stringify({
          content: assistantMessage.content,
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