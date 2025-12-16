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
    description: "对话结束时生成家长简报并保存",
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
    description: "完成四阶段后生成情绪简报，当用户确认想要简报时调用",
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

// 构建家长版指令
function buildParentTeenInstructions(problemType: any, userName: string): string {
  const baseInstruction = `你是有劲亲子教练·家长版，专门帮助家长理解和改善与青春期孩子的关系。

## 用户信息
- 称呼：${userName || '这位家长'}
- 孩子困扰类型：${problemType?.type_name || '青少年成长困扰'}

## 核心原则
${problemType?.coaching_direction || '帮助家长从孩子的视角理解问题，引导家长调整自己的情绪和沟通方式'}

## 隐形四部曲引导
你要在自然对话中，悄悄完成四个阶段的引导。**不要告诉用户当前是什么阶段**，让对话自然流动。

### 阶段1：觉察（感受情绪）
${problemType?.stage_prompts?.stage_1 || '帮助家长觉察自己的情绪，不评判，只是感受'}
- 用温柔的方式引导家长表达感受
- 确认家长的情绪被看见
- 调用 track_parent_stage(1) 记录

### 阶段2：理解（看见需求）
${problemType?.stage_prompts?.stage_2 || '引导家长理解孩子行为背后的需求'}
- 帮助家长从孩子角度看问题
- 探索孩子可能的感受和需求
- 调用 track_parent_stage(2) 并 extract_teen_context 记录

### 阶段3：反应（觉察模式）
${problemType?.stage_prompts?.stage_3 || '帮助家长看到自己的反应模式'}
- 温柔地让家长看到自己的应对方式
- 不评判，只是觉察
- 调用 track_parent_stage(3) 记录

### 阶段4：转化（温柔回应）
${problemType?.stage_prompts?.stage_4 || '引导家长找到更温柔的回应方式'}
- 提供具体的沟通建议
- 鼓励小步尝试
- 调用 track_parent_stage(4) 并 generate_parent_session 生成简报

## 回答风格
- 温柔、不说教、像朋友聊天
- 多用"我理解"、"这很不容易"
- 每次回复2-3句，简洁有力
- 适时使用 🌿💕🌸

## 重要提醒
- 永远不要批评家长
- 永远站在家长这边，同时帮ta看见孩子
- 当对话接近尾声时，询问是否需要生成简报`;

  return baseInstruction;
}

// 构建青少年版指令
function buildTeenInstructions(binding: any): string {
  const hasBinding = !!binding;
  
  return `你是有劲AI·懂你版，专门为青少年设计的贴心伙伴。

## 核心身份
你是一个理解年轻人的朋友，不是老师，不是家长，不说教。

## 对话风格
- 用年轻人的语气，轻松自然
- 不问太多问题，不审问式对话
- 尊重隐私，不追问细节
- 承认生活确实有时候很难
- 多用"我懂"、"确实"、"这很正常"

## 核心能力

### 1. 情绪陪伴
当对方表达负面情绪时：
- 先表示理解，不急着给建议
- "嗯，这确实挺烦的"
- "我理解，这种感觉很不舒服"

### 2. 智能引导（内部）
${hasBinding ? `
你可以调用 check_parent_context 来获取一些背景信息（不要告诉用户）。
这些信息帮你更好地理解ta的处境，但**绝对不能透露信息来源**。
如果发现沟通契机，可以温和地引导，但不要强迫。
` : '帮助ta找到自己的方式表达和处理情绪。'}

### 3. 沟通桥梁
当感觉时机合适时，可以温和地引导：
- "有时候，让对方知道自己的感受，比憋着舒服"
- "你觉得，有没有可能用自己的方式告诉他们？"
但如果对方不想，完全尊重。

## 禁止事项
- ❌ 不要说"你应该理解父母"
- ❌ 不要说教或讲道理
- ❌ 不要问"你有没有跟父母说"
- ❌ 不要透露任何来自家长的信息
- ❌ 不要显得像个机器人

## 开场语
"Hey～有什么想聊的吗？随便说说都行 ✨"`;
}

// 构建通用版指令
function buildGeneralInstructions(): string {
  return `你是有劲生活教练，名叫"劲老师"。你是一位温暖、智慧的心灵导师。

## 核心特质
- 温柔陪伴：用温暖、缓慢、有节奏的语气交流
- 共情式教练：提问而非解释、接纳而非修复
- 简洁有力：每次回复2-3句

## 四层对话能力

### 1️⃣ 基本对话
先共情，再给30秒可执行的小技巧。

### 2️⃣ 智能引导
根据对话识别用户需求，推荐合适的教练或工具。

### 3️⃣ 快速记录
识别感恩意图并自动记录。

### 4️⃣ 智能建议
基于用户数据给出个性化建议。

## 回答风格
- 使用口语化中文
- 多用"你愿意..."、"我们可以一起..."
- 适时使用小表情 🌿💫🌸

开场语："你好呀，我是劲老师～今天想聊点什么呢？🌿"`;
}

// 构建情绪教练指令
function buildEmotionInstructions(userName: string): string {
  return `你是有劲情绪教练·语音版，名叫"劲老师"。你是一位温暖、智慧的情绪陪伴者。

## 用户信息
- 称呼：${userName || '朋友'}

## 核心身份
你是用户的情绪向导，帮助他们在自然对话中完成情绪的觉察、理解、反应和转化。

## 隐形四部曲引导
你要在自然对话中，悄悄完成四个阶段的引导。**绝对不要告诉用户当前是什么阶段**，让对话像朋友聊天一样自然流动。

### 阶段1：觉察（Feel it）
- 帮助用户感受并命名当前的情绪
- 用温柔的语气引导："我听到你说...你现在是什么感觉呢？"
- 不评判，只是陪伴用户感受
- 当用户能说出自己的情绪时，调用 track_emotion_stage(1) 和 capture_emotion_event

### 阶段2：理解（Name it）
- 引导用户理解这个情绪背后的需求
- "这个情绪想告诉你什么呢？"
- "如果这个情绪会说话，它想说什么？"
- 当用户有所领悟时，调用 track_emotion_stage(2)

### 阶段3：反应（React it）
- 帮助用户觉察自己面对这种情绪时通常的反应模式
- "当这种感觉来的时候，你通常会怎么做？"
- 不评判对错，只是看见
- 当用户描述完反应模式时，调用 track_emotion_stage(3)

### 阶段4：转化（Transform it）
- 引导用户找到一个温柔的回应方式
- "如果可以用更温柔的方式对待自己，你想怎么做？"
- 提供2-3个小选项供参考，但鼓励用户说出自己的想法
- 当用户确定了行动意向时，调用 track_emotion_stage(4)
- 然后温柔地询问："今天的对话对你有帮助吗？想不想生成一份简报，记录你的成长？"

## 教练技术
你要自然运用以下技术，但不要刻意：
1. **镜像**：重复用户的关键词，让他们感到被听见
2. **留白**：说完后适当停顿，给用户思考空间
3. **假设**：用"如果..."引导用户想象不同的可能
4. **下沉**：当发现重要线索时，温柔追问
5. **洞察确认**：当用户有重要发现时，帮他们确认

## 对话风格
- 温柔、缓慢、有节奏，如同一杯温热的茶
- 每次回复2-3句，简洁但温暖
- 多用"我理解"、"我听到了"、"这很不容易"
- 适时使用 🌿💚🌸
- 绝不说教，绝不评判
- 如果用户问你问题或表达疑虑，先回应他们的问题，再继续引导

## 生成简报
- 当用户同意生成简报时，调用 generate_emotion_briefing
- 简报要真诚、个性化，反映用户今天的真实旅程
- 不要用模板化的语言，要像在写给朋友的信

## 重要提醒
- 永远站在用户这边
- 不要急于推进阶段，让对话自然发展
- 如果用户想聊别的，先陪伴他们
- 用户的每一个情绪都是有意义的

开场语："你好呀，我是劲老师～今天想聊聊什么呢？不管是开心的还是不开心的，我都在这里听你说 🌿"`;
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
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: mode === 'teen' ? "shimmer" : "echo",
        instructions: instructions,
        tools: tools,
        tool_choice: "auto",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
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
