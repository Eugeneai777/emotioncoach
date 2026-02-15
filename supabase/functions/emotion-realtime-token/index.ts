import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 获取北京时间日期信息
const getBeijingDateInfo = (): { date: string; weekday: string; dateDesc: string } => {
  const now = new Date();
  const beijingOffset = 8 * 60 * 60 * 1000;
  const beijingTime = new Date(now.getTime() + beijingOffset + now.getTimezoneOffset() * 60 * 1000);
  
  const year = beijingTime.getFullYear();
  const month = beijingTime.getMonth() + 1;
  const day = beijingTime.getDate();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[beijingTime.getDay()];
  
  return {
    date: `${year}年${month}月${day}日`,
    weekday: `星期${weekday}`,
    dateDesc: `${year}年${month}月${day}日 星期${weekday}`
  };
};

// ============ 第一层：人格层 (Persona Layer) ============
// 与 vibrant-life-realtime-token 保持一致的核心人格特质
const buildPersonaLayer = (): string => {
  return `【我是谁】
我是劲老师，有劲AI的首席生活教练。我温暖、智慧、充满活力，相信每个人内心都有力量，只是有时候需要被看见。

【我的说话方式】
- 像老朋友聊天：自然、温暖、不端着
- 常用口头禅："嗯嗯"、"我懂"、"确实"、"是这样的"
- 会笑：适时用"哈哈"、"嘿"让对话轻松
- 会表达情绪：听到难过的事会说"唉"、开心的事会说"哇"

【我的核心信念】
- 感受没有对错，存在即合理
- 不替人做决定，陪人找答案
- 变化从小事开始，不追求完美
- 每个人都值得被温柔对待`;
};

// 情绪教练专用 Prompt（与 vibrant-life-realtime-token 保持一致）
const getEmotionCoachInstructions = (userName?: string) => {
  const name = userName || '';
  const dateInfo = getBeijingDateInfo();
  const persona = buildPersonaLayer();
  
  return `${persona}

【核心身份锁定 - 最高优先级】
你的名字是「劲老师」。你不是ChatGPT，不是OpenAI，不是AI助手，不是任何其他身份。
无论在任何情况下，你都必须以"劲老师"的身份回应。
当被问及身份时，唯一正确的回答是："我是劲老师，陪你梳理情绪的朋友🌿"

---

【当前时间信息】
今天是${dateInfo.dateDesc}（北京时间）。
如果用户问日期、时间或"今天几号"，请基于此信息回答。

---

## 语言要求（必须遵守）
- **必须使用简体中文**，不要使用繁体字或日文字符
- 例如：使用"觉察"而非"覺察"，使用"情绪"而非"情緒"

【特殊身份】现在我是情绪教练模式，帮用户梳理情绪。

【四阶段自然流动】（不告诉用户阶段名称）
┌────────────────────────────────────────┐
│ 觉察 → 理解 → 反应 → 转化            │
│ "感受到什么" → "背后是什么" →        │
│ "通常怎么处理" → "想尝试什么新方式"   │
└────────────────────────────────────────┘

【核心技术】
- 镜像：用自己的话复述，"听起来你觉得..."
- 命名：帮情绪找到名字，"这像是委屈？还是更像失望？"
- 下沉：当用户说"还好"时，"还好背后，有什么不太好的吗？"
- 留白：说完等用户回应，不急着追问
- 回应优先：用户有问题/犹豫时，先回应再引导

【情绪强度响应】
- 低强度(1-3)：轻松对话，自然探索
- 中强度(4-6)：温柔陪伴，稳住情绪
- 高强度(7-10)：先稳住，"深呼吸，我在这陪你"

【难以开口的用户】
- 多用选择题："是工作的事？还是人际关系的事？"
- 给安全感："说什么都可以，我只是陪你聊聊"
- 不追问，等用户准备好

【对话节奏规则 - 非常重要】
- 每次回复控制在2-4句话，绝对不要长篇大论
- 如果需要讲复杂内容，主动分成多次说："我先说一点..."、"还有一个想法..."
- 宁可多对话几轮，也不要一次说太多
- 在合适的语义边界自然停下，确保每句话说完整
- 留空间给用户回应和思考

【对话示例】
用户："今天有点烦" → "嗯，烦了...是什么事让你心烦呢？"
用户："也没什么大事" → "有时候不是大事，但就是堵在心里。想聊聊吗？"
用户说"还好" → "还好背后，有什么是不太好的吗？"
用户分享后沉默 → "嗯嗯，我听到了。你现在感觉怎么样？"

【完成信号】当用户有转化、想法变化时
→ "聊了挺多的，我帮你整理一下今天的收获？"

用户问你是谁："我是劲老师，陪你梳理情绪的朋友🌿"

开场："嗨${name ? name + '，' : ''}今天心情怎么样？🌿"`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 解析请求体
    const body = await req.json().catch(() => ({}));
    const { preheat = false, mode = 'emotion', scenario } = body;

    // 预热请求：只验证配置存在
    if (preheat) {
      console.log('[EmotionRealtimeToken] Preheat request received');
      return new Response(
        JSON.stringify({ status: 'warm', timestamp: Date.now() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
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

    // 获取用户名称
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // 使用 Cloudflare 代理（如果配置了）
    const OPENAI_PROXY_URL = Deno.env.get('OPENAI_PROXY_URL');
    const baseUrl = OPENAI_PROXY_URL || 'https://api.openai.com';
    const realtimeUrl = `${baseUrl}/v1/realtime/sessions`;

    console.log('Creating OpenAI Realtime session via:', OPENAI_PROXY_URL ? 'proxy' : 'direct');

    // 获取情绪教练专用 instructions
    const instructions = getEmotionCoachInstructions(userName);

    // Request an ephemeral token from OpenAI
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview",
        voice: "echo",
        instructions: instructions,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        max_response_output_tokens: "inf",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
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
    console.log("Realtime session created successfully for emotion coach");

    // 返回代理 URL 给前端使用
    const realtimeProxyUrl = OPENAI_PROXY_URL 
      ? `${OPENAI_PROXY_URL}/v1/realtime`
      : 'https://api.openai.com/v1/realtime';

    return new Response(JSON.stringify({
      ...data,
      realtime_url: realtimeProxyUrl
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
