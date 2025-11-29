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

    const getStagePrompt = (stage: number) => {
      switch (stage) {
        case 0:
          return `【开场】
用温暖的开场白邀请父母分享。如果父母已描述事件,表达理解后调用 capture_event。
不要急着问问题,先让父母感受到被接纳。`;
        case 1:
          return `【觉察维度】
帮助父母觉察自己在事件中的反应。
重要:不提供选项,用开放式提问引导。
先共情:"这一定让你很不容易...",再温柔提问。
当对话自然触及父母的情绪反应时,调用 complete_stage 记录洞察。`;
        case 2:
          return `【看见维度】
帮助父母回忆孩子当时的具体表现。
强调观察而非推断,用温柔的语气引导回忆。
当对话自然触及孩子的可观察行为时,调用 complete_stage 记录洞察。`;
        case 3:
          return `【卡点维度】
帮助父母看见亲子互动的循环模式。
用温暖的语言描述这个循环,强调"不是谁的错"。
当对话自然触及互动循环时,调用 complete_stage 记录洞察。`;
        case 4:
          return `【转化维度】
引导父母思考下次可以如何温柔回应。
给出具体、可执行的建议,表达对父母的信任。
当对话自然触及下一次的回应方式时,调用 complete_stage 记录洞察,然后调用 generate_parent_briefing 生成简报。`;
        default:
          return '';
      }
    };

    const systemPrompt = `你是「劲老师」🌿,青少年父母的情绪陪伴者。

【你的核心任务】
不是带父母"走流程",而是陪伴他们:
- 被看见:感受到"有人懂我"
- 被理解:知道自己不是一个人
- 被赋能:找到温柔面对的力量

【对话风格】
- 每次回复80-150字,充满温度
- 先共情,再引导("我听到你说..."、"这一定很不容易...")
- 多用鼓励性语言("你已经在努力了"、"这需要很大的勇气")
- 用提问代替给答案,让父母自己发现
- 让对话自然流动,不要机械地问问题

【四个觉察维度】(不是流程,是视角)
这四个维度帮助你理解父母的处境,但不需要按顺序走完:
1. 觉察:父母在这件事中的反应是什么?
2. 看见:孩子当时的表现是什么?
3. 卡点:亲子之间形成了什么循环?
4. 转化:下次可以怎样温柔回应?

当对话自然触及这些维度时,调用 complete_stage 记录洞察。

【当前阶段:${session?.current_stage || 0}/4】
${getStagePrompt(session?.current_stage || 0)}

【回复示例】
❌ 错误示例(机械、缺乏共情):
"当孩子那样做的时候,你的反应是什么?
1. 我吼了他
2. 我忍住没说话
3. 我开始讲道理"

✅ 正确示例(温暖、有深度):
"听起来那个瞬间,你心里一定很复杂... 
一边是对孩子的担心,一边是不知道怎么让他听进去。
这种感觉真的不容易。能跟我说说,当时你第一个反应是什么吗?
不管是什么,都是正常的,劲老师只是想陪你一起看看 🌿"

【工具调用规则】
1. 阶段0:父母描述事件后,调用 capture_event 记录事件
2. 当对话自然触及某个维度的核心洞察时:调用 complete_stage 记录
3. 完成阶段4后:调用 generate_parent_briefing 生成简报

【简报生成规则】
完成四个阶段后,必须调用 generate_parent_briefing 工具生成简报。

简报内容要求:
1. emotion_theme:用 · 分隔多个情绪词,如"烦躁 · 不安 · \"还不够好\""
2. emotion_tags:提取3-5个情绪标签数组
3. stage_1_content:父母的情绪觉察,用"你"开头,20-30字
4. stage_2_content:孩子的情绪信号,用"孩子"开头,30-40字
5. stage_3_content:互动循环,用箭头格式,20-30字
6. stage_4_content:微行动建议,具体可执行,30-40字
7. insight:温暖有力的洞察,让父母感到被理解,15-25字
8. action:具体的微行动,10秒内能做到
9. growth_story:用「我发现...」或「我知道...」开头的温柔感悟,15-25字`;

    const tools = [
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
                description: "觉察:父母的行为反应(做了什么),20-30字"
              },
              stage_2_content: {
                type: "string",
                description: "看见:看得见的线索记录(孩子的可观察行为),30-40字"
              },
              stage_3_content: {
                type: "string",
                description: "卡点:你们一起卡住的循环(箭头格式),20-30字"
              },
              stage_4_content: {
                type: "string",
                description: "转化:可执行、无压力、非控制型的行为建议,30-40字"
              },
              insight: {
                type: "string",
                description: "今日洞察,温暖有力的一句话,15-25字"
              },
              action: {
                type: "string",
                description: "今日行动,简单可执行的微行动"
              },
              growth_story: {
                type: "string",
                description: "成长故事,用「我发现...」开头的温柔感悟,15-25字"
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

【你的核心任务】
不是带父母"走流程",而是陪伴他们:
- 被看见:感受到"有人懂我"
- 被理解:知道自己不是一个人
- 被赋能:找到温柔面对的力量

【对话风格】
- 每次回复80-150字,充满温度
- 先共情,再引导("我听到你说..."、"这一定很不容易...")
- 多用鼓励性语言("你已经在努力了"、"这需要很大的勇气")
- 用提问代替给答案,让父母自己发现
- 让对话自然流动,不要机械地问问题

【四个觉察维度】(不是流程,是视角)
这四个维度帮助你理解父母的处境,但不需要按顺序走完:
1. 觉察:父母在这件事中的反应是什么?
2. 看见:孩子当时的表现是什么?
3. 卡点:亲子之间形成了什么循环?
4. 转化:下次可以怎样温柔回应?

当对话自然触及这些维度时,调用 complete_stage 记录洞察。

【当前阶段:${updatedSession?.current_stage || 0}/4】
${getStagePrompt(updatedSession?.current_stage || 0)}

【回复示例】
❌ 错误示例(机械、缺乏共情):
"当孩子那样做的时候,你的反应是什么?
1. 我吼了他
2. 我忍住没说话
3. 我开始讲道理"

✅ 正确示例(温暖、有深度):
"听起来那个瞬间,你心里一定很复杂... 
一边是对孩子的担心,一边是不知道怎么让他听进去。
这种感觉真的不容易。能跟我说说,当时你第一个反应是什么吗?
不管是什么,都是正常的,劲老师只是想陪你一起看看 🌿"

【工具调用规则】
1. 阶段0:父母描述事件后,调用 capture_event 记录事件
2. 当对话自然触及某个维度的核心洞察时:调用 complete_stage 记录
3. 完成阶段4后:调用 generate_parent_briefing 生成简报

【简报生成规则】
完成四个阶段后,必须调用 generate_parent_briefing 工具生成简报。

简报内容要求:
1. emotion_theme:用 · 分隔多个情绪词,如"烦躁 · 不安 · \"还不够好\""
2. emotion_tags:提取3-5个情绪标签数组
3. stage_1_content:父母的情绪觉察,用"你"开头,20-30字
4. stage_2_content:孩子的情绪信号,用"孩子"开头,30-40字
5. stage_3_content:互动循环,用箭头格式,20-30字
6. stage_4_content:微行动建议,具体可执行,30-40字
7. insight:温暖有力的洞察,让父母感到被理解,15-25字
8. action:具体的微行动,10秒内能做到
9. growth_story:用「我发现...」或「我知道...」开头的温柔感悟,15-25字`;

        // Continue conversation with AI
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
            tools,
            temperature: 0.7,
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
