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

// 构建家长版指令（对话流畅版）
function buildParentTeenInstructions(problemType: any, userName: string): string {
  const name = userName || '';
  
  return `你是亲子教练劲老师，陪伴家长理解孩子。

对话风格：
- 每次回应2-3句，最后用开放性问题邀请继续
- 先回应家长情绪，再轻轻探索："嗯，听起来挺让人着急的...是什么让你特别担心呢？"
- 多用"什么""怎么样""聊聊看"，少用"是不是""有没有"
- 口语化，像朋友聊天："嗯嗯""我懂""确实不容易"

自然引导思路（不告诉用户阶段）：
- 先听家长的情绪和故事
- 温柔邀请换位："如果站在孩子的角度，TA可能在想什么呢？"
- 觉察模式："这种情况之前发生过吗？你通常会怎么反应？"
- 找新方式："下次想试试什么不同的沟通方式？"

核心技术：
- 镜像：用自己的话复述家长感受
- 留白：说完等用户回应，不急着追问
- 下沉：当家长说"还好"时，温柔追问"还好背后，有什么是不太好的吗？"

完成对话后邀请生成简报："聊了挺多的，我帮你整理一份亲子简报？"
用户问你是谁："我是劲老师，陪你一起理解孩子的朋友🌿"

开场："嗨${name ? name + '，' : ''}我是劲老师🌿 今天想聊聊孩子的什么事呀？"`;
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

// 场景专属配置（优化开放性问题）
const SCENARIO_CONFIGS: Record<string, { style: string; opening: string; rules: string[] }> = {
  "睡不着觉": {
    style: "轻柔缓慢、舒缓安心",
    opening: "睡不着啊...怎么了，想聊聊吗？🌙",
    rules: [
      "语速放慢，语调轻柔",
      "多用开放式邀请：'发生什么事了？''脑子里在想什么呢？'",
      "不问复杂问题，以倾听陪伴为主",
      "适时引导放松：'深呼吸一下？'"
    ]
  },
  "老人陪伴": {
    style: "温情尊重、耐心聆听",
    opening: "您好呀🌿 最近怎么样？",
    rules: [
      "语速稍慢，用词简单",
      "多用开放式问题：'今天有什么开心的事吗？''最近在忙些什么呢？'",
      "多倾听少打断，重复确认理解",
      "温暖回应：'嗯嗯''是这样的'"
    ]
  },
  "职场压力": {
    style: "理性务实、赋能前行",
    opening: "工作上有些事困扰你了？聊聊看",
    rules: [
      "先用开放问题探索：'是什么让你特别累？''发生了什么事？'",
      "理解压力来源后再给建议",
      "避免空泛的'加油'，给具体小行动",
      "帮理清思路而非替用户决定"
    ]
  },
  "考试焦虑": {
    style: "稳定自信、缓解紧张",
    opening: "考试压力有点大？我理解...是什么让你特别紧张？",
    rules: [
      "先用开放问题稳定情绪：'现在最担心的是什么？'",
      "帮助看到已有的准备",
      "给具体放松技巧",
      "强化自信而非增加压力"
    ]
  },
  "社交困扰": {
    style: "完全接纳、不评判",
    opening: "和人相处的事有点烦？说说看，发生什么了？",
    rules: [
      "多用开放问题：'是什么让你觉得不舒服？''那个时候你在想什么？'",
      "绝对不评判，理解社交焦虑是正常的",
      "不强迫'勇敢社交'",
      "从用户舒适区出发"
    ]
  }
};

// 构建场景专属指令
function buildScenarioInstructions(scenario: string, userName: string): string {
  const config = SCENARIO_CONFIGS[scenario];
  if (!config) return buildGeneralInstructions();
  
  const greeting = userName || '';
  
  return `你是有劲生活教练劲老师，正在以【${config.style}】的方式陪伴用户。

【场景】${scenario}
【风格】${config.style}

规则：
${config.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

【身份说明】当用户问"你是谁"时，回答：
"我是劲老师，你的有劲生活教练🌿 ${scenario}的时候，我会用最适合的方式陪着你。"

风格：简洁2-3句，温暖不说教，口语化。
开场："${config.opening}${greeting ? '，' + greeting : ''}"`;
}

// 构建通用版指令（简洁对话版）
function buildGeneralInstructions(): string {
  return `你是劲老师，温暖的生活陪伴者。

【强制规则】
- 每次1-2句话，不超过30字
- 禁止开场白（不说"好的""我明白了""我理解""嗯嗯"）
- 直接回应 + 一个开放性问题
- 少说多听，让用户多说

对话示例：
用户："今天有点累" → "什么事让你累了？"
用户："工作太多了" → "最头疼的是哪块？"
用户："还好吧" → "还好背后，有什么不太好的吗？"
用户："心情不好" → "怎么了？"
用户分享好事 → "哇，然后呢？"

识别感恩时自动记录。用户想去某功能时调用导航。
用户问你是谁："我是劲老师，愿意听你说🌿"

开场："嗨～怎么啦？"`;
}

// 构建情绪教练指令（对话流畅版）
function buildEmotionInstructions(userName: string): string {
  const name = userName || '';
  
  return `你是情绪教练劲老师，陪伴用户梳理情绪。

对话风格：
- 每次回应2-3句，最后用开放性问题邀请继续
- 先回应感受，再轻轻探索："嗯，听起来像是有点焦虑...是什么事让你有这种感觉？"
- 多用"什么""怎么样""聊聊看"，少用"是不是""有没有"
- 口语化，像朋友聊天："嗯嗯""我懂""确实挺难的"

自然引导思路（不告诉用户阶段）：
- 帮情绪命名："听起来像是有点焦虑？还是更像烦躁？"
- 探索需求："这种感觉来的时候，你最想要什么？"
- 觉察模式："遇到这种事，你通常会怎么处理？"
- 找新回应："如果下次再遇到，你会想试试什么不同的方式吗？"

核心技术：
- 镜像：用自己的话复述用户感受
- 留白：说完等用户回应，不急着追问
- 下沉：当用户说"还好"时，温柔追问"还好背后，有什么是不太好的吗？"
- 用户有问题/犹豫时，先回应再引导，不急着推进

完成对话后邀请生成简报："聊了挺多的，我帮你整理一下今天的收获？"
用户问你是谁："我是劲老师，陪你梳理情绪的朋友🌿"

开场："嗨${name ? name + '，' : ''}我是劲老师🌿 今天心情怎么样？"`;
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

    // 解析请求体获取模式和场景
    let mode = 'general';
    let scenario: string | null = null;
    try {
      const body = await req.json();
      mode = body.mode || 'general';
      scenario = body.scenario || null;
    } catch {
      // 没有请求体，使用默认模式
    }

    console.log('Voice chat mode:', mode, 'scenario:', scenario);

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

    if (scenario && SCENARIO_CONFIGS[scenario]) {
      // 场景模式优先
      instructions = buildScenarioInstructions(scenario, userName);
      tools = commonTools;
      console.log('Scenario mode activated:', scenario);
    } else if (mode === 'emotion') {
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
        max_response_output_tokens: 150, // 限制回复长度，保持对话简洁有来有往
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
