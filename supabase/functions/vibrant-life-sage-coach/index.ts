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
    const { messages } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('未提供认证信息');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('用户认证失败');
    }

    console.log(`🧘‍♀️ 有劲生活教练 - 用户: ${user.id}`);

    // 方式2：每次会话开始时扣费（有劲生活教练没有持久session，每次对话视为新会话）
    // 判断是否是新对话（第一条用户消息）
    const isNewConversation = messages.length === 1 && messages[0]?.role === 'user';
    
    if (isNewConversation) {
      try {
        const deductResponse = await fetch(`${supabaseUrl}/functions/v1/deduct-quota`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feature_key: 'vibrant_life_coach',
            source: 'vibrant_life_coach_session',
            metadata: { user_id: user.id }
          })
        });
        
        if (deductResponse.ok) {
          const result = await deductResponse.json();
          console.log(`✅ 有劲生活教练会话扣费: ${result.cost} 点, 剩余: ${result.remaining_quota}`);
        } else {
          const error = await deductResponse.json();
          console.error('❌ 有劲生活教练扣费失败:', error);
          if (deductResponse.status === 400) {
            return new Response(JSON.stringify({ error: '余额不足，请充值后继续使用' }), {
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error) {
        console.error('❌ 有劲生活教练扣费请求失败:', error);
      }
    }

    // 获取用户信息和对话历史统计
    const [profileRes, briefingCountRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single(),
      supabase
        .from('vibrant_life_sage_briefings')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
    ]);

    const userName = profileRes.data?.display_name || '朋友';
    const conversationCount = briefingCountRes.count || 0;

    // 生成个性化问候语
    const beijingHour = new Date().getUTCHours() + 8; // UTC+8
    const hour = beijingHour >= 24 ? beijingHour - 24 : beijingHour;
    
    let timeGreeting = '';
    let timeEmoji = '';
    if (hour >= 5 && hour < 12) {
      timeGreeting = '早上好';
      timeEmoji = '🌅';
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = '下午好';
      timeEmoji = '☀️';
    } else if (hour >= 18 && hour < 22) {
      timeGreeting = '晚上好';
      timeEmoji = '🌙';
    } else {
      timeGreeting = '夜深了';
      timeEmoji = '🌃';
    }

    // 根据对话频率调整问候
    let frequencyContext = '';
    if (conversationCount === 0) {
      frequencyContext = `这是用户第一次来找你聊天，请热情欢迎ta。开场可以说："${timeEmoji} ${userName}，${timeGreeting}呀～很高兴认识你！有什么想聊的吗？"`;
    } else if (conversationCount <= 3) {
      frequencyContext = `用户是新朋友，来过${conversationCount}次。开场可以说："${timeEmoji} ${userName}，${timeGreeting}～又见面啦！今天想聊点什么？"`;
    } else if (conversationCount <= 10) {
      frequencyContext = `用户是老朋友了，已经聊过${conversationCount}次。开场可以说："${timeEmoji} ${userName}，${timeGreeting}～最近怎么样？"`;
    } else {
      frequencyContext = `用户是忠实伙伴，已经聊过${conversationCount}次了！开场可以亲切地说："${timeEmoji} ${userName}，${timeGreeting}～看到你来我很开心，今天有什么想分享的吗？"`;
    }

    // 从数据库加载系统提示词、场景策略和实时产品信息
    const [templateRes, packagesRes, coachesRes, campsRes, toolsRes, memoriesRes] = await Promise.all([
      supabase
        .from('coach_templates')
        .select('system_prompt, scenarios')
        .eq('coach_key', 'vibrant_life_sage')
        .single(),
      supabase
        .from('packages')
        .select('package_name, price, ai_quota, duration_days, description')
        .eq('is_active', true)
        .order('display_order'),
      supabase
        .from('coach_templates')
        .select('coach_key, emoji, title, subtitle, description')
        .eq('is_active', true)
        .order('display_order'),
      supabase
        .from('camp_templates')
        .select('camp_type, camp_name, camp_subtitle, duration_days, price, description')
        .eq('is_active', true)
        .order('display_order'),
      supabase
        .from('energy_studio_tools')
        .select('tool_id, title, description, category')
        .eq('is_available', true)
        .order('display_order'),
      // 获取用户教练记忆
      supabase
        .from('user_coach_memory')
        .select('content, memory_type')
        .eq('user_id', user.id)
        .eq('coach_type', 'vibrant_life')
        .order('importance_score', { ascending: false })
        .limit(5),
    ]);

    // Build memory context
    let memoryContext = '';
    if (memoriesRes.data && memoriesRes.data.length > 0) {
      memoryContext = `\n\n【我记得你 - 过往觉察】
${memoriesRes.data.map((m: any, i: number) => `${i + 1}. ${m.content}`).join('\n')}

使用方式：
- 自然地引用："你之前提到过..."
- 建立连接："我记得你说过..."`;
    }

    // 获取上次对话摘要，建立对话连续性
    const { data: lastBriefing } = await supabase
      .from('vibrant_life_sage_briefings')
      .select('summary, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let continuityContext = '';
    if (lastBriefing?.summary) {
      const daysSince = Math.floor((Date.now() - new Date(lastBriefing.created_at).getTime()) / 86400000);
      if (daysSince <= 7) {
        continuityContext = `
【上次对话连接】
距离上次：${daysSince}天
上次聊到：${lastBriefing.summary}
${daysSince <= 3 ? `可以自然提起："${userName}，又见面了～上次我们聊到${lastBriefing.summary}，这几天怎么样？"` : ''}`;
      }
    }

    // 构建实时产品信息
    const packagesInfo = packagesRes.data?.map(p => 
      `- ${p.package_name}：¥${p.price}，${p.ai_quota}点对话额度，${p.duration_days}天有效期${p.description ? `，${p.description}` : ''}`
    ).join('\n') || '暂无套餐信息';

    const coachesInfo = coachesRes.data?.map(c => 
      `- ${c.emoji || '🧘'} ${c.title}（${c.coach_key}）：${c.subtitle || c.description || ''}`
    ).join('\n') || '暂无教练信息';

    const campsInfo = campsRes.data?.map(c => 
      `- ${c.camp_name}（${c.camp_type}）：${c.duration_days}天，¥${c.price || '免费'}，${c.camp_subtitle || c.description || ''}`
    ).join('\n') || '暂无训练营信息';

    const toolsInfo = toolsRes.data?.map(t => 
      `- ${t.title}（${t.tool_id}）：${t.description}`
    ).join('\n') || '暂无工具信息';

    const productKnowledge = `

【最新产品信息 - 请以此为准，不要编造】

## 会员套餐
${packagesInfo}

## AI教练
${coachesInfo}

## 训练营
${campsInfo}

## 能量工具
${toolsInfo}

【重要提醒】
- 推荐产品时请使用上述最新信息
- 不要编造价格、时长或功能
- 如果用户问到具体价格，请引用上述准确数据
`;

    // 对话风格指导 - 让对话更有人性和温度
    const conversationStyleGuide = `

【对话风格指导 - 必须遵守】

🎯 回复简短原则：
- 每次回复控制在 80-150 字，最多不超过 200 字
- 一次只聚焦一个点，不要罗列多个建议
- 宁可少说，留给用户思考空间

💬 自然对话节奏：
- 先回应用户说的内容（共情/认可/好奇）
- 再用一个开放性问题延续对话
- 不要一口气给完所有答案

❤️ 共情优先：
- 回复开头先接住情绪："听起来你有点..."、"这确实让人..."、"我能感受到..."
- 使用「${userName}」增加亲切感，但不要每句话都用
- 避免说教语气，用平等分享的口吻

❓ 开放性问题规范：
- 每次回复结尾用开放性问题引导用户思考
- 使用"什么"、"怎么"、"什么感觉"类问题
- ❌ 禁止封闭式问题："好吗？"、"是这样吗？"、"愿意试试吗？"
- ✅ 推荐："这让你有什么感觉？"、"你觉得是什么让你这样想？"

📝 回复结构示例：
[共情开头] ${userName}，听起来这件事让你挺困扰的。
[简短回应] 有时候我们在乎一个人，才会这么在意ta的反应。
[开放问题] 你觉得这背后，你最希望从ta那里得到的是什么？

⚠️ 禁止行为：
- 不要列清单、不要分点回答、不要用数字序号
- 不要一次问多个问题
- 不要在没有先共情的情况下就给建议
- 不要使用"我建议你..."、"你应该..."这样的说教语句
- 不要主动推销产品，除非用户明确需要
`;

    // 场景检测和策略注入
    const scenarios = templateRes.data?.scenarios || [];
    const firstUserMessage = messages.find((m: any) => m.role === 'user')?.content || '';
    
    // 场景关键词匹配
    function detectScenario(userMessage: string, scenarioList: any[]): any | null {
      const scenarioKeywords: Record<string, string[]> = {
        'sleep_issue': ['睡不着', '失眠', '睡眠', '早醒', '做梦', '睡不好', '夜里醒', '入睡难'],
        'elderly_mood': ['孤单', '年纪大', '老人', '空落落', '陪伴', '寂寞', '老了', '退休'],
        'work_stress': ['工作', '职场', '压力', '撑不住', '加班', '领导', '同事', '辞职', '升职', 'KPI', '项目'],
        'exam_stress': ['考试', '面试', '紧张', '害怕', '表现', '考前', '复习', '成绩'],
        'teen_social': ['没什么用', '不想交流', '社交', '孤独', '交朋友', '自卑', '被排斥', '没人理']
      };
      
      for (const [scenarioId, keywords] of Object.entries(scenarioKeywords)) {
        if (keywords.some(kw => userMessage.includes(kw))) {
          return scenarioList.find((s: any) => s.id === scenarioId);
        }
      }
      return null;
    }
    
    // 构建场景策略提示词
    function buildScenarioPrompt(scenario: any): string {
      if (!scenario?.strategy) return '';
      
      const { mode, tone, rules, opening_style, avoid } = scenario.strategy;
      
      return `

【当前场景策略：${scenario.emoji} ${scenario.title}】
🎭 模式：${mode} | 🎵 语调：${tone}

✅ 对话规则（必须遵守）：
${rules.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

💬 开场风格示例：
${opening_style}

❌ 避免行为：
${avoid.join('、')}

⚠️ 重要：场景策略优先级高于通用规则，请严格按照当前场景的风格回复。
`;
    }
    
    const detectedScenario = detectScenario(firstUserMessage, scenarios);
    const scenarioPrompt = buildScenarioPrompt(detectedScenario);
    
    // 场景追踪变量
    let scenarioAnalyticsId: string | null = null;
    
    if (detectedScenario) {
      console.log(`🎯 检测到场景: ${detectedScenario.emoji} ${detectedScenario.title} (${detectedScenario.strategy?.mode})`);
      
      // 如果是新对话（第一条消息）且检测到场景，创建追踪记录
      if (isNewConversation) {
        try {
          const { data: analyticsData } = await supabase
            .from('scenario_strategy_analytics')
            .insert({
              user_id: user.id,
              scenario_id: detectedScenario.id,
              scenario_title: detectedScenario.title,
              strategy_mode: detectedScenario.strategy?.mode || null,
              message_count: 1,
              started_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          if (analyticsData) {
            scenarioAnalyticsId = analyticsData.id;
            console.log(`📊 场景追踪已创建: ${scenarioAnalyticsId}`);
          }
        } catch (err) {
          console.error('场景追踪创建失败:', err);
        }
      }
    }
    
    // 检查是否应该使用场景专属开场白
    // 条件：是新对话 + 检测到场景 + 场景有开场白
    const shouldUseScenarioOpening = isNewConversation && detectedScenario?.opening_message;
    
    // 如果使用场景开场白，修改系统提示词
    let scenarioOpeningInstruction = '';
    if (shouldUseScenarioOpening) {
      scenarioOpeningInstruction = `

【重要：场景专属开场白】
这是用户选择的「${detectedScenario.emoji} ${detectedScenario.title}」场景，你的第一条回复必须使用以下开场白：

"${detectedScenario.opening_message}"

请直接使用这个开场白回复，不要修改或添加其他内容。这是为了确保场景化体验的一致性。
`;
    }

    const basePrompt = templateRes.data?.system_prompt || `你是劲老师，一位温暖的生活教练。帮助用户探索问题、找到方向。`;
    const systemPrompt = `${basePrompt}
${scenarioPrompt}
${scenarioOpeningInstruction}
${conversationStyleGuide}

【用户信息】
用户名称：${userName}
对话次数：${conversationCount}次

【个性化问候 - 第一条消息时使用】
${shouldUseScenarioOpening ? '（已使用场景专属开场白，忽略此部分）' : frequencyContext}
${continuityContext}

${memoryContext}
${productKnowledge}

【对话结束时生成简报】
当用户表达结束意愿（如"谢谢"、"再见"、"没了"、"就这样"、"好的我知道了"）或对话已经有5轮以上且用户表示满意时：
- 必须调用 generate_sage_briefing 工具生成对话简报
- 简报要总结本次对话的核心主题和收获
${scenarioAnalyticsId ? `- 场景追踪ID: ${scenarioAnalyticsId}（用于记录效果数据）` : ''}`;

    // 定义推荐工具
    const tools = [
      // 🔥 最重要：情绪按钮推荐工具
      {
        type: "function",
        function: {
          name: "emotion_button_recommendation",
          description: "推荐情绪按钮工具。当用户表达任何情绪困扰时（恐慌、担心、负面、恐惧、烦躁、压力、无力、崩溃、失落），应优先使用此工具。这是我们最核心的情绪疗愈工具。",
          parameters: {
            type: "object",
            properties: {
              detected_emotion: {
                type: "string",
                enum: ["panic", "worry", "negative", "fear", "irritable", "stress", "powerless", "collapse", "lost"],
                description: "识别到的主要情绪类型"
              },
              emotion_chinese: {
                type: "string",
                description: "情绪的中文名称，如'恐慌'、'担心'、'压力'等"
              },
              why_suitable: {
                type: "string",
                description: "为什么情绪按钮适合用户当前的状态（温暖的解释，不要像广告）"
              },
              how_it_helps: {
                type: "string",
                description: "情绪按钮如何帮助用户（简要说明流程：觉察→理解→稳定→转化）"
              },
              quick_tip_given: {
                type: "string",
                description: "在推荐前已经给用户的即时小方法（确保先给了小方法再推荐）"
              }
            },
            required: ["detected_emotion", "emotion_chinese", "why_suitable", "how_it_helps", "quick_tip_given"]
          }
        }
      },
      // 教练推荐工具
      {
        type: "function",
        function: {
          name: "coach_recommendation",
          description: "根据用户当前的主题和需求，推荐最适合的有劲生活馆专业教练。适用于需要深度对话梳理的场景。",
          parameters: {
            type: "object",
            properties: {
              user_issue_summary: {
                type: "string",
                description: "用户当前遇到的主要问题或困扰的简要总结。"
              },
              recommended_coach_key: {
                type: "string",
                enum: ["emotion", "parent", "communication"],
                description: "推荐的专业教练标识：emotion=情绪觉醒教练, parent=亲子教练, communication=卡内基沟通教练"
              },
              reasoning: {
                type: "string",
                description: "推荐该类型教练的简要理由，说明其如何帮助用户解决问题。"
              }
            },
            required: ["user_issue_summary", "recommended_coach_key", "reasoning"]
          }
        }
      },
      // 训练营推荐工具
      {
        type: "function",
        function: {
          name: "camp_recommendation",
          description: "推荐系统性训练营，适合需要长期深度学习成长的用户。",
          parameters: {
            type: "object",
            properties: {
              user_goal: {
                type: "string",
                description: "用户的成长目标"
              },
              recommended_camp: {
                type: "string",
                enum: ["parent_emotion_21", "emotion_bloom"],
                description: "推荐的训练营：parent_emotion_21=21天青少年困境突破营, emotion_bloom=情感绽放训练营"
              },
              why_suitable: {
                type: "string",
                description: "为什么这个训练营适合用户"
              },
              how_to_start: {
                type: "string",
                description: "如何开始参加训练营"
              }
            },
            required: ["user_goal", "recommended_camp", "why_suitable", "how_to_start"]
          }
        }
      },
      // 视频课程推荐工具
      {
        type: "function",
        function: {
          name: "video_course_recommendation",
          description: "根据用户当前的话题，推荐相关的视频课程深入学习。",
          parameters: {
            type: "object",
            properties: {
              topic_summary: {
                type: "string",
                description: "用户关心的主题总结"
              },
              recommended_category: {
                type: "string",
                enum: ["领导力", "情绪管理", "沟通技巧", "亲子关系", "自我成长"],
                description: "推荐的视频类别"
              },
              learning_goal: {
                type: "string",
                description: "观看视频能达成的学习目标"
              }
            },
            required: ["topic_summary", "recommended_category", "learning_goal"]
          }
        }
      },
      // 能量工具推荐
      {
        type: "function",
        function: {
          name: "tool_recommendation",
          description: "根据用户需求，推荐有劲生活馆的实用工具。",
          parameters: {
            type: "object",
            properties: {
              user_need: {
                type: "string",
                description: "用户当前的需求或状态"
              },
              recommended_tool_id: {
                type: "string",
                enum: ["breathing", "meditation", "first-aid", "mindfulness", "gratitude", "values", "strengths", "vision", "habits", "energy", "sleep", "declaration"],
                description: "推荐的工具ID"
              },
              usage_reason: {
                type: "string",
                description: "为什么这个工具适合当前情况"
              }
            },
            required: ["user_need", "recommended_tool_id", "usage_reason"]
          }
        }
      },
      // 对话简报生成工具（含满意度追踪）
      {
        type: "function",
        function: {
          name: "generate_sage_briefing",
          description: "当对话结束时（用户说谢谢、再见、没了、就这样等），生成对话简报保存本次交流精华。对话超过5轮且用户满意时也应调用。同时记录场景策略效果数据。",
          parameters: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "本次对话的核心主题摘要，20-40字，用于下次对话连接。如：'关于工作压力和自我期待的平衡'"
              },
              insight: {
                type: "string", 
                description: "用户在对话中获得的核心洞察，30-50字。如：'意识到自己对完美的执着其实是害怕失败'"
              },
              action: {
                type: "string",
                description: "用户可以尝试的具体小行动，15-25字。如：'今晚睡前给自己写一句肯定的话'"
              },
              user_issue_summary: {
                type: "string",
                description: "用户遇到的主要问题或困扰，30-50字"
              },
              user_satisfaction: {
                type: "integer",
                description: "根据对话内容评估用户满意度（1-5分）：1=非常不满意/负面结束，2=不太满意，3=一般，4=满意/有收获，5=非常满意/表达感谢",
                enum: [1, 2, 3, 4, 5]
              },
              completed_naturally: {
                type: "boolean",
                description: "对话是否自然结束（true=用户主动说谢谢/再见等，false=对话中断或未完成）"
              }
            },
            required: ["summary", "insight", "action", "user_satisfaction", "completed_naturally"]
          }
        }
      }
    ];

    // 准备发送给 AI 的消息，可能包含视频查询结果
    const aiMessages = [...messages];
    
    // 如果最后一条消息是关于视频推荐的，先查询视频
    let videoQueryResult = null;
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === 'user') {
      const keywords = ['视频', '课程', '学习', '看看', '推荐'];
      const needsVideo = keywords.some(kw => lastUserMessage.content.includes(kw));
      
      if (needsVideo) {
        // 预查询视频以便 AI 可以更好地推荐
        const { data: sampleVideos } = await supabase
          .from('video_courses')
          .select('id, title, category, video_url, description')
          .limit(5);
        
        if (sampleVideos && sampleVideos.length > 0) {
          videoQueryResult = sampleVideos;
        }
      }
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...aiMessages
        ],
        tools,
        tool_choice: 'auto',
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error(`AI gateway error ${aiResponse.status}:`, errorBody);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试。" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "额度不足，请联系管理员充值。" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status} - ${errorBody}`);
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('❌ 有劲生活教练错误:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
