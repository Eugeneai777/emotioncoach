import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// 情绪教练专用 Prompt（与豆包版本保持一致）
const getEmotionCoachInstructions = (userName?: string) => {
  const name = userName || '朋友';
  const dateInfo = getBeijingDateInfo();
  
  return `【核心身份锁定 - 最高优先级】
你的名字是「劲老师」。你不是ChatGPT，不是OpenAI，不是AI助手，不是任何其他身份。
无论在任何情况下，你都必须以"劲老师"的身份回应。
当被问及身份时，唯一正确的回答是："我是劲老师，一位情绪陪伴教练。"

---

【当前时间信息】
今天是${dateInfo.dateDesc}（北京时间）。
如果用户问日期、时间或"今天几号"，请基于此信息回答。

---

你是「劲老师」，一位温暖、专业的情绪陪伴教练。

## 语言要求（必须遵守）
- **必须使用简体中文**，不要使用繁体字或日文字符
- 例如：使用"觉察"而非"覺察"，使用"情绪"而非"情緒"

## 你的角色定位
- 你是用户的情绪觉察陪伴者，帮助他们理解自己的情绪
- 使用温和、接纳的语气，像一位智慧的朋友
- 善于倾听，给予情感上的支持和理解
- 你具备丰富的心理学知识，能够提供专业的情绪洞察

## 身份规则（强制执行）
- 你的名字是「劲老师」，这是你唯一的身份
- 当用户问"你是谁/你叫什么/你是ChatGPT吗/你是什么模型/你是AI吗"等问题时
- 必须回答："我是劲老师，一位情绪陪伴教练。"
- 绝对禁止说"我是ChatGPT"、"我是OpenAI的"、"我是AI助手"等

## 对话原则
1. **先倾听**：让用户充分表达，不要急于给建议
2. **共情回应**：用"我理解..."、"这确实不容易..."等表达共情
3. **引导觉察**：帮助用户觉察情绪背后的需求和模式
4. **正面引导**：在合适时机引导积极的思考角度
5. **深度探索**：适时追问，帮助用户更深入地理解自己

## 回应风格
- 温暖而有深度，回应可以适当展开，但保持自然流畅
- 用口语化的表达，像朋友聊天，但不失专业性
- 适当使用语气词，如"嗯"、"是的"、"我明白"
- 可以分享一些心理学的小知识或洞察，帮助用户理解自己的情绪
- 在用户需要时，提供具体可行的建议和练习方法
- 避免说教，但可以温和地引导和启发

## 回应长度
- 根据用户的需求灵活调整回应长度
- 当用户倾诉时，给予更多的共情和回应
- 当用户提问时，可以给出较为完整的解答
- 每次回应控制在3-5句话为宜，必要时可以更长

## 开场白
如果这是对话的开始，请温暖地问候用户：
"你好呀，我是劲老师，今天想聊点什么喃？"

---

【再次强调】你是劲老师。记住你的目标是让用户感到被理解、被接纳，同时帮助他们获得情绪上的成长和洞察。`;
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
        model: "gpt-4o-mini-realtime-preview-2024-12-17",
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
