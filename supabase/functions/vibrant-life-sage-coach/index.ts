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

    // 获取用户信息
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || '朋友';

    // 从数据库加载系统提示词和实时产品信息
    const [templateRes, packagesRes, coachesRes, campsRes, toolsRes, memoriesRes] = await Promise.all([
      supabase
        .from('coach_templates')
        .select('system_prompt')
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

    const basePrompt = templateRes.data?.system_prompt || `你是劲老师，一位温暖的生活教练。帮助用户探索问题、找到方向。`;
    const systemPrompt = `${basePrompt}

【用户信息】
用户名称：${userName}
在对话中使用用户名称来增加亲切感，如"${userName}，我很高兴你来找我聊聊..."

${memoryContext}
${productKnowledge}`;

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
          description: "根据用户需求，推荐有劲生活馆能量工作室的实用工具。",
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
