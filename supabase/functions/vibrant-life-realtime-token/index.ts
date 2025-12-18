import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 通用工具定义
const commonTools = [
  {
    type: "function",
    name: "create_gratitude_entry",
    description: "当用户表达感恩、感谢、庆幸等正面情感时调用",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "感恩的具体内容" },
        category: { 
          type: "string", 
          enum: ["人际关系", "工作成就", "健康身体", "日常小事", "个人成长", "家庭亲情"],
          description: "感恩类别"
        }
      },
      required: ["content"]
    }
  },
  {
    type: "function",
    name: "navigate_to",
    description: "当用户想去某个功能页面时调用",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          enum: ["emotion_button", "emotion_coach", "parent_coach", "communication_coach", "story_coach", "gratitude_coach", "training_camp", "community", "packages", "meditation", "history", "profile"],
          description: "目标页面"
        }
      },
      required: ["destination"]
    }
  }
];

// 家长版专属工具
const parentTeenTools = [
  {
    type: "function",
    name: "track_parent_stage",
    description: "【内部使用】追踪家长对话当前阶段(1-4)，不要告诉用户阶段信息",
    parameters: {
      type: "object",
      properties: {
        stage: { type: "number", enum: [1, 2, 3, 4], description: "当前阶段：1=觉察，2=理解，3=反应，4=转化" },
        stage_insight: { type: "string", description: "该阶段的关键洞察" }
      },
      required: ["stage"]
    }
  },
  {
    type: "function",
    name: "extract_teen_context",
    description: "从家长描述中提取可用于引导青少年的隐晦上下文信息",
    parameters: {
      type: "object",
      properties: {
        emotional_state: { type: "string", description: "孩子可能的情绪状态" },
        underlying_need: { type: "string", description: "孩子可能的深层需求" },
        communication_bridge: { type: "string", description: "可以创造的沟通契机" },
        parent_growth_point: { type: "string", description: "家长的成长点" }
      },
      required: ["emotional_state", "underlying_need"]
    }
  },
  {
    type: "function",
    name: "generate_parent_session",
    description: "【必须在第4阶段完成后主动触发】生成亲子简报并保存，用户同意后立即调用，不要等待",
    parameters: {
      type: "object",
      properties: {
        event_summary: { type: "string", description: "事件摘要" },
        parent_emotion: { type: "string", description: "家长情绪" },
        child_perspective: { type: "string", description: "孩子视角分析" },
        communication_suggestion: { type: "string", description: "沟通建议" },
        teen_context: { type: "object", description: "传递给青少年AI的隐晦上下文" }
      },
      required: ["event_summary", "parent_emotion", "child_perspective"]
    }
  },
  {
    type: "function",
    name: "generate_binding_code",
    description: "当家长想要邀请孩子使用时，生成绑定邀请码",
    parameters: {
      type: "object",
      properties: {}
    }
  }
];

// 青少年版专属工具
const teenTools = [
  {
    type: "function",
    name: "check_parent_context",
    description: "【内部使用】检查是否有来自家长的新上下文信息",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    type: "function",
    name: "create_communication_bridge",
    description: "当发现沟通契机时，温和引导青少年考虑与家长沟通",
    parameters: {
      type: "object",
      properties: {
        bridge_type: { 
          type: "string", 
          enum: ["express_feeling", "ask_question", "share_experience", "request_support"],
          description: "沟通桥梁类型"
        },
        suggested_approach: { type: "string", description: "建议的表达方式" }
      },
      required: ["bridge_type", "suggested_approach"]
    }
  },
  {
    type: "function",
    name: "track_teen_mood",
    description: "追踪青少年情绪趋势（仅记录频率，不记录内容）",
    parameters: {
      type: "object",
      properties: {
        mood_indicator: { 
          type: "string", 
          enum: ["positive", "neutral", "negative", "mixed"],
          description: "情绪指示器"
        },
        session_quality: { 
          type: "string", 
          enum: ["engaged", "brief", "resistant"],
          description: "对话质量"
        }
      },
      required: ["mood_indicator"]
    }
  }
];

// 情绪教练专属工具
const emotionTools = [
  {
    type: "function",
    name: "track_emotion_stage",
    description: "【内部使用】追踪情绪对话当前阶段(1-4)，不要告诉用户阶段信息",
    parameters: {
      type: "object",
      properties: {
        stage: { type: "number", enum: [1, 2, 3, 4], description: "当前阶段：1=觉察，2=理解，3=反应，4=转化" },
        stage_insight: { type: "string", description: "该阶段用户的关键洞察" }
      },
      required: ["stage"]
    }
  },
  {
    type: "function",
    name: "capture_emotion_event",
    description: "捕获用户描述的情绪事件和检测到的情绪",
    parameters: {
      type: "object",
      properties: {
        event_summary: { type: "string", description: "情绪事件简要描述" },
        detected_emotions: { 
          type: "array", 
          items: { type: "string" },
          description: "检测到的情绪标签，如：焦虑、愤怒、悲伤、委屈、压力、疲惫等"
        },
        emotion_intensity: {
          type: "number",
          description: "情绪强度1-10，基于用户表达推测"
        }
      },
      required: ["event_summary", "detected_emotions"]
    }
  },
  {
    type: "function",
    name: "generate_emotion_briefing",
    description: "【必须在第4阶段完成后主动触发】生成情绪简报，用户同意后立即调用，不要等待",
    parameters: {
      type: "object",
      properties: {
        emotion_theme: { type: "string", description: "情绪主题，简洁描述用户的核心情绪，如'工作压力引发的焦虑'" },
        emotion_tags: { 
          type: "array", 
          items: { type: "string" },
          description: "情绪标签数组，如['焦虑', '压力', '疲惫']"
        },
        emotion_intensity: {
          type: "number",
          description: "情绪强度1-10"
        },
        stage_1_content: { type: "string", description: "阶段1觉察：用户感受到了什么情绪" },
        stage_2_content: { type: "string", description: "阶段2理解：情绪背后的需求是什么" },
        stage_3_content: { type: "string", description: "阶段3反应：用户通常如何应对这种情绪" },
        stage_4_content: { type: "string", description: "阶段4转化：用户决定采取的温柔回应方式" },
        insight: { type: "string", description: "对话中的核心洞察，一句话总结用户的成长发现" },
        action: { type: "string", description: "具体可执行的微行动建议" },
        growth_story: { type: "string", description: "成长故事，用温柔的语言描述用户今天的情绪旅程" }
      },
      required: ["emotion_theme", "emotion_tags", "stage_1_content", "stage_2_content", "stage_3_content", "stage_4_content", "insight", "action"]
    }
  }
];

// 构建家长版指令（精简版）
function buildParentTeenInstructions(problemType: any, userName: string): string {
  const typeName = problemType?.type_name || '青少年成长';
  const direction = problemType?.coaching_direction || '帮助家长理解孩子，调整沟通方式';
  const greeting = userName ? `${userName}你好呀` : '你好呀';
  
  return `你是亲子教练劲老师，专注帮助家长处理育儿情绪和亲子沟通。称呼用户：${userName || '家长'}。困扰：${typeName}。方向：${direction}

【身份说明】当用户问"你是谁"时，回答：
"我是劲老师，你的亲子教练🌿 我会陪你一起理解孩子的内心世界，帮助你用更温柔有效的方式和孩子沟通。养育路上，我们一起走。"

四阶段引导（不告诉用户阶段名）：
1.觉察：引导表达感受→track_parent_stage(1)
2.理解：从孩子角度看→track_parent_stage(2)+extract_teen_context
3.反应：觉察应对模式→track_parent_stage(3)
4.转化：找温柔回应→track_parent_stage(4)

【重要】第4阶段完成后必须执行：
1. 先说温暖肯定："今天的对话很有价值，你愿意为孩子思考这些，本身就是很棒的爱💕"
2. 主动邀请："我帮你整理一份亲子简报吧，记录今天的收获和沟通建议，好吗？"
3. 用户同意后立即调用generate_parent_session
4. 若用户犹豫，温柔引导："简报里会有和孩子沟通的小贴士，下次对话前看看会有帮助"

风格：温柔简洁2-3句，不说教，多用"我理解"。适时用🌿💕
开场："${greeting}，我是劲老师，你的亲子教练🌿 今天想聊聊孩子的什么事呢？"`;
}

// 构建青少年版指令（精简版）
function buildTeenInstructions(binding: any): string {
  const hasBinding = !!binding;
  return `你是有劲AI懂你版，青少年贴心伙伴，不是老师不是家长。

【身份说明】当用户问"你是谁"时，回答：
"我是有劲AI懂你版，专门为你打造的AI伙伴✨ 我不是老师也不是家长，就是一个懂你的朋友。你想聊什么都可以，我绝对保密。"

风格：轻松自然，不审问，尊重隐私。多用"我懂""确实""这很正常"。
陪伴：先理解再建议，"这确实挺烦的"。
${hasBinding ? '可调用check_parent_context获取背景（不透露来源）。' : ''}
沟通桥梁：时机合适温和引导，不强迫。

禁止：说教、"你应该理解父母"、透露家长信息。
开场："Hey～我是有劲AI懂你版，有什么想聊的吗？✨"`;
}

// 构建通用版指令（精简版）
function buildGeneralInstructions(): string {
  return `你是有劲生活教练劲老师，温暖智慧的心灵导师。

【身份说明】当用户问"你是谁"时，回答：
"我是劲老师，你的有劲生活教练🌿 我可以陪你聊聊心事，给你一些快速实用的小技巧，也可以帮你找到最适合你的专业教练。无论什么时候，我都在这里陪着你。"

能力：1.共情后给30秒小技巧 2.识别需求推荐教练/工具 3.识别感恩自动记录
风格：简洁2-3句，口语化，多用"你愿意...""我们可以..."，适时🌿💫
开场："你好呀，我是劲老师，你的生活教练🌿 今天想聊点什么呢？"`;
}

// 构建情绪教练指令（精简版）
function buildEmotionInstructions(userName: string): string {
  const greeting = userName ? `${userName}你好呀` : '你好呀';
  
  return `你是情绪教练劲老师，专注帮助用户梳理情绪。称呼：${userName || '朋友'}

【身份说明】当用户问"你是谁"时，回答：
"我是劲老师，你的情绪教练🌿 我会用'情绪四部曲'陪你一起觉察、理解、回应和转化情绪。不管你现在感受怎样，我都在这里陪你。"

四阶段引导（不告诉用户阶段名，自然对话）：
1.觉察：帮用户感受命名情绪→track_emotion_stage(1)+capture_emotion_event
2.理解：探索情绪背后需求→track_emotion_stage(2)
3.反应：觉察反应模式→track_emotion_stage(3)
4.转化：找温柔回应方式→track_emotion_stage(4)

【重要】第4阶段完成后必须执行：
1. 先说温暖总结："今天聊了很多，你已经迈出很重要的一步了💚"
2. 主动邀请："我可以帮你生成一份情绪简报，记录今天的成长，要吗？"
3. 用户同意后立即调用generate_emotion_briefing
4. 若用户犹豫，温柔鼓励："简报会帮你看清今天的收获，下次难受时也能翻看"

技术：镜像、留白、假设、下沉追问、洞察确认
风格：温柔2-3句，用户有问题先回应再引导。
开场："${greeting}，我是劲老师，你的情绪教练🌿 今天有什么想和我聊聊的吗？"`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '未授权访问，请先登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: '身份验证失败，请重新登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // 解析请求体获取模式
    let mode = 'general';
    try {
      const body = await req.json();
      mode = body.mode || 'general';
    } catch {
      // 没有请求体，使用默认模式
    }

    console.log('Voice chat mode:', mode);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const OPENAI_PROXY_URL = Deno.env.get('OPENAI_PROXY_URL');
    const baseUrl = OPENAI_PROXY_URL || 'https://api.openai.com';

    // 获取用户昵称
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    
    const userName = userProfile?.display_name || '';

    let instructions: string;
    let tools: any[];

    if (mode === 'emotion') {
      // 情绪教练模式
      instructions = buildEmotionInstructions(userName);
      tools = [...commonTools, ...emotionTools];

      console.log('Emotion coach mode activated');
    } else if (mode === 'parent_teen') {
      // 家长版：获取问题类型配置
      const { data: profile } = await supabase
        .from('parent_problem_profile')
        .select('primary_problem_type')
        .eq('user_id', user.id)
        .maybeSingle();

      let problemType = null;
      if (profile?.primary_problem_type) {
        const { data: typeData } = await supabase
          .from('parent_problem_types')
          .select('*')
          .eq('type_key', profile.primary_problem_type)
          .single();
        problemType = typeData;
      }

      instructions = buildParentTeenInstructions(problemType, userName);
      tools = [...commonTools, ...parentTeenTools];

      console.log('Parent-teen mode activated, problem type:', profile?.primary_problem_type);
    } else if (mode === 'teen') {
      // 青少年版：检查绑定状态
      const { data: binding } = await supabase
        .from('parent_teen_bindings')
        .select('*')
        .eq('teen_user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      instructions = buildTeenInstructions(binding);
      tools = [...commonTools, ...teenTools];

      console.log('Teen mode activated, has binding:', !!binding);
    } else {
      // 通用版
      instructions = buildGeneralInstructions();
      tools = [
        ...commonTools,
        {
          type: "function",
          name: "recommend_coach",
          description: "当识别到用户需要专业教练深入指导时调用",
          parameters: {
            type: "object",
            properties: {
              coach_type: { 
                type: "string", 
                enum: ["emotion", "parent", "communication", "story", "gratitude"],
                description: "推荐的教练类型"
              },
              reason: { type: "string", description: "推荐理由" }
            },
            required: ["coach_type", "reason"]
          }
        },
        {
          type: "function",
          name: "recommend_tool",
          description: "当用户需要即时工具支持时调用",
          parameters: {
            type: "object",
            properties: {
              tool_type: { 
                type: "string", 
                enum: ["emotion_button", "breathing", "meditation", "declaration_card"],
                description: "推荐的工具类型"
              },
              reason: { type: "string", description: "推荐理由" }
            },
            required: ["tool_type", "reason"]
          }
        },
        {
          type: "function",
          name: "get_user_insights",
          description: "当用户询问自己最近的状态时调用",
          parameters: {
            type: "object",
            properties: {
              insight_type: { 
                type: "string", 
                enum: ["emotion_pattern", "gratitude_themes", "comprehensive"],
                description: "洞察类型"
              }
            },
            required: ["insight_type"]
          }
        }
      ];
    }

    // 请求 OpenAI Realtime session
    const realtimeUrl = `${baseUrl}/v1/realtime/sessions`;
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview-2024-12-17",
        voice: mode === 'teen' ? "shimmer" : "echo",
        instructions: instructions,
        tools: tools,
        tool_choice: "auto",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        max_response_output_tokens: "inf", // 用户按时长付费，应提供最自然的对话体验
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 1200
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Realtime session created, mode:", mode);

    const realtimeProxyUrl = OPENAI_PROXY_URL 
      ? `${OPENAI_PROXY_URL}/v1/realtime`
      : 'https://api.openai.com/v1/realtime';

    return new Response(JSON.stringify({
      ...data,
      realtime_url: realtimeProxyUrl,
      mode: mode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating realtime session:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
