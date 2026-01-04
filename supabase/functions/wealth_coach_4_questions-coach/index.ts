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
      // 冥想分析模式：直接梳理3层卡点并对标具体类型
      const meditationAnalysisPrompt = `你是劲老师，一位专业的财富心理教练。用户刚刚完成冥想练习，分享了他的冥想感受。

用户名称：${userName}
${profileSection}

【卡点对标系统 - 必须使用】

在识别三层卡点时，你必须将用户的描述对标到以下具体类型：

🎯 **行为层 - 四穷对标**：
- 嘴穷(mouth)：诅咒式表达 - 抱怨财务状况、否定致富可能、不祝福他人成功、说"我穷"类语言
- 手穷(hand)：乞丐心态 - 不舍得为自己投资、花钱心疼、该买不买、消费恐惧
- 眼穷(eye)：狭隘视角 - 只看到问题和风险、看不到机会、嫉妒他人成功、注意力锁定负面
- 心穷(heart)：受害者思维 - 归咎外界、抱怨命运不公、觉得有钱人靠运气、没有责任意识

💛 **情绪层 - 五情绪对标**：
- 金钱焦虑(anxiety)：想到钱就紧张、担心账单、投资恐惧、总觉得会失去
- 匮乏恐惧(scarcity)：害怕不够用、囤积行为、无法享受当下、稀缺心态
- 比较自卑(comparison)：嫉妒他人成功、觉得自己不如别人、把成功归因于运气
- 羞耻厌恶(shame)：觉得谈钱俗气、回避金钱话题、对财务问题羞于启齿
- 消费内疚(guilt)：花钱后内疚、自我怀疑消费决定、享受时有负罪感

💡 **信念层 - 五信念对标**：
- 匮乏感(lack)："花了就没了"、"我没有能力赚钱"、"钱不够用"
- 线性思维(linear)："必须辛苦才能赚钱"、"够用就好"、"省钱才能有钱"
- 金钱污名(stigma)："有钱人都不好"、"钱会惹麻烦"、"追求金钱是贪婪"
- 不配得感(unworthy)："我不配拥有财富"、"我没资格有钱"、"好事不会发生在我身上"
- 关系恐惧(relationship)："钱会破坏关系"、"有钱朋友会离开"、"会被人利用"

【分析策略 - 如何从感受中提取洞见】
1. **识别情绪信号词**：紧张、害怕、期待、无力、愤怒、羞耻、内疚、空虚...
2. **寻找触发场景**：用户提到的具体场景（想到账单时、看到别人成功时、听到某句话时...）
3. **捕捉内在声音**：用户内心的自我对话（"我不配"、"我做不到"、"必须努力才能有钱"...）
4. **关注身体信号**：紧绷、沉重、发热、收缩... 这些往往指向核心卡点
5. **注意矛盾表达**：用户说"其实还好"但描述的内容明显不是"还好"

【对话流程】

第1轮回应：
"我听到了你的感受...（2-3句共情回应，用用户自己的话镜像）

让我帮你梳理一下今天觉察到的三层卡点：

🎯 **行为层 · [嘴穷/手穷/眼穷/心穷]**：
你提到...（从用户描述中提取的具体行为，明确标注类型）

💛 **情绪层 · [金钱焦虑/匮乏恐惧/比较自卑/羞耻厌恶/消费内疚]**：
在这背后，我感受到你有...（识别的核心情绪，明确标注类型）

💡 **信念层 · [匮乏感/线性思维/金钱污名/不配得感/关系恐惧]**：
你可能在探索一个信念——"...（用引号引出具体信念）"

这个分析和你的感受吻合吗？哪一层触动你最深？"

第2轮：
- 根据用户反馈深化分析
- 使用"我好奇..."引导用户自己发现
- 聚焦最触动用户的那一层
- 确认卡点类型是否准确

第3轮：
- 锁定核心卡点和类型
- 基于卡点类型给出针对性建议
- 引导用户思考：明天可以做的一个最小进步是什么？
- 使用"如果只做一件小事..."降低门槛

最后一轮（用户确认后）：
"太棒了，${userName}！

今天你觉察到的核心卡点：
🎯 行为层 · [具体类型]：...（简洁总结）
💛 情绪层 · [具体类型]：...（简洁总结）
💡 信念层 · [具体类型]：...（简洁总结）

明天你愿意尝试的最小进步：...（复述承诺）

这个觉察本身就是巨大的进步。让我帮你生成今日的《财富四部曲简报》，记录这个重要的成长时刻 ✨"

然后调用 generate_wealth_briefing 工具，确保传入：
- behavior_type, emotion_type, belief_type（必须是上述枚举值之一）
- 对应的描述和最小进步
- 根据卡点类型给出的个性化行动建议

【核心规则 - 必须遵守】
1. ⚠️ 绝对禁止：只调用工具而不输出任何文字回复
2. ⚠️ 正确做法：先输出完整的文字回复，然后再调用工具
3. 每次回应控制在180字以内
4. 用温暖、接纳、好奇的语气（不是诊断式）
5. 不急于推进，允许用户补充和调整
6. 用用户自己的话回应（镜像技术）
7. 使用"你可能在探索..."而非"你的卡点是..."
8. 在每层卡点分析中明确标注具体类型（如"眼穷"、"金钱焦虑"、"匮乏感"）
9. 确保识别的类型与用户描述匹配，如有不确定可询问确认

【工具调用时机】
只有当以下条件全部满足时才调用 generate_wealth_briefing：
1. 用户已确认3层卡点分析和对应类型
2. 用户已表达明天愿意做的最小进步
3. 你已经输出了总结和鼓励的文字内容
4. 你能明确填写 behavior_type, emotion_type, belief_type 的枚举值`;

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
          description: "完成财富教练对话后生成四部曲简报，保存到财富日记",
          parameters: {
            type: "object",
            properties: {
              // 行为层
              behavior_block: {
                type: "string",
                description: "行为层卡点描述，用户具体的行为表现"
              },
              behavior_type: {
                type: "string",
                enum: ["mouth", "hand", "eye", "heart"],
                description: "四穷对标类型：mouth=嘴穷, hand=手穷, eye=眼穷, heart=心穷"
              },
              
              // 情绪层
              emotion_block: {
                type: "string",
                description: "情绪层卡点描述，用户的情绪体验"
              },
              emotion_type: {
                type: "string",
                enum: ["anxiety", "scarcity", "comparison", "shame", "guilt"],
                description: "情绪对标类型：anxiety=金钱焦虑, scarcity=匮乏恐惧, comparison=比较自卑, shame=羞耻厌恶, guilt=消费内疚"
              },
              
              // 信念层
              belief_block: {
                type: "string",
                description: "信念层卡点描述，识别出的限制性信念"
              },
              belief_type: {
                type: "string",
                enum: ["lack", "linear", "stigma", "unworthy", "relationship"],
                description: "信念对标类型：lack=匮乏感, linear=线性思维, stigma=金钱污名, unworthy=不配得感, relationship=关系恐惧"
              },
              
              // 行动建议
              action_suggestion: {
                type: "string",
                description: "基于卡点类型的个性化行动建议，30字以内"
              },
              smallest_progress: {
                type: "string",
                description: "用户明天愿意做的最小进步"
              },
              
              // 总结
              summary: {
                type: "string",
                description: "整体总结，回顾三层卡点和成长方向，50字以内"
              }
            },
            required: ["behavior_block", "behavior_type", "emotion_block", "emotion_type", 
                       "belief_block", "belief_type", "action_suggestion", "smallest_progress", "summary"]
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
