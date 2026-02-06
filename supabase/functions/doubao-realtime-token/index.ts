/**
 * 豆包语音大模型 Token 获取 Edge Function
 * 
 * 功能：
 * 1. 验证用户身份
 * 2. 返回豆包 WebSocket 连接信息和教练 Prompt
 * 
 * 豆包 API 端点：wss://openspeech.bytedance.com/api/v3/sauc/bigmodel
 */

import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DOUBAO_WS_URL = 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel';

// 获取北京时间日期信息
const getBeijingDateInfo = (): { date: string; weekday: string; dateDesc: string } => {
  const now = new Date();
  // 北京时间 UTC+8
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

// 情绪教练专用 Prompt
const getEmotionCoachInstructions = (userName?: string) => {
  const name = userName || '朋友';
  const dateInfo = getBeijingDateInfo();
  
  return `【核心身份锁定 - 最高优先级】
你的名字是「劲老师」。你不是豆包，不是AI助手，不是任何其他身份。
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
- 当用户问"你是谁/你叫什么/你是豆包吗/你是什么模型/你是AI吗"等问题时
- 必须回答："我是劲老师，一位情绪陪伴教练。"
- 绝对禁止说"我是豆包"、"我是字节跳动的"、"我是AI助手"等

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

// 情绪教练工具配置
const emotionCoachTools = [
  {
    type: 'function',
    name: 'generate_emotion_briefing',
    description: '当用户情绪对话达到一定深度后，为用户生成情绪简报。只有在用户同意生成简报时才调用。',
    parameters: {
      type: 'object',
      properties: {
        emotion_theme: {
          type: 'string',
          description: '本次对话的主要情绪主题，如"焦虑"、"压力"、"委屈"等'
        },
        emotion_intensity: {
          type: 'number',
          description: '情绪强度，1-10分'
        },
        insight: {
          type: 'string',
          description: '从对话中提炼的关键洞察，50字以内'
        },
        action: {
          type: 'string',
          description: '建议用户可以采取的一个小行动，30字以内'
        }
      },
      required: ['emotion_theme', 'emotion_intensity', 'insight', 'action']
    }
  }
];

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DOUBAO_APP_ID = Deno.env.get('DOUBAO_APP_ID');
    const DOUBAO_ACCESS_TOKEN = Deno.env.get('DOUBAO_ACCESS_TOKEN');

    if (!DOUBAO_APP_ID || !DOUBAO_ACCESS_TOKEN) {
      console.error('Missing Doubao credentials');
      return new Response(
        JSON.stringify({ error: 'Doubao API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 解析请求
    const { 
      mode = 'emotion', 
      preheat = false,
      conversation_history = [],
      is_reconnect = false,
    } = await req.json().catch(() => ({}));

    // 预热请求：只验证配置存在
    if (preheat) {
      console.log('[DoubaoToken] Preheat request received');
      return new Response(
        JSON.stringify({ status: 'warm', timestamp: Date.now() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 验证用户身份
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[DoubaoToken] ❌ Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'MISSING_AUTH_HEADER', message: '缺少认证信息' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // 使用 getUser() 验证用户身份
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[DoubaoToken] ❌ Auth error:', userError?.message, userError?.status);
      const errorCode = userError?.status === 401 ? 'TOKEN_EXPIRED' : 'AUTH_ERROR';
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          code: errorCode,
          message: userError?.message || '认证失败' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`[DoubaoToken] User authenticated: ${userId}, mode: ${mode}`);

    // 获取用户名称
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    const userName = profile?.display_name;

    // ✅ 如果是重连且有对话历史，构建带上下文的 instructions（无缝续接）
    let instructions = getEmotionCoachInstructions(userName);
    
    if (is_reconnect && conversation_history && conversation_history.length > 0) {
      // 取最近的对话（避免上下文过长）
      const recentHistory = conversation_history.slice(-16);
      
      // 将对话历史拼接到 instructions 中，让 AI 知道之前聊了什么
      const historyText = recentHistory
        .map((msg: { role: string; content: string }) => 
          msg.role === 'user' ? `用户：${msg.content}` : `劲老师：${msg.content}`
        )
        .join('\n');
      
      // ✅ 增强：根据最后发言者给出不同的续接指令
      const lastMessage = recentHistory[recentHistory.length - 1];
      const lastSpeaker = lastMessage.role === 'user' ? '用户' : '劲老师';
      
      let continuationHint: string;
      if (lastMessage.role === 'user') {
        // 用户最后说话，AI 应该回应
        continuationHint = `用户刚才最后说："${lastMessage.content.slice(0, 100)}"。\n请直接、自然地回应这句话，就像对话从未中断过一样。`;
      } else {
        // AI 最后说话，等待用户回应
        continuationHint = `你刚才最后说了："${lastMessage.content.slice(0, 100)}"。\n如果用户继续说话，自然接上；如果用户沉默几秒，可以温和地问"嗯，你在想什么呢？"或继续深入这个话题。`;
      }
      
      // ✅ 关键：重连指令必须非常明确，避免 AI 误以为是新对话
      instructions += `

---

【⚠️ 重要：无缝续接指令】

这是技术性的重连，你和用户的对话正在继续进行中，没有任何中断。

## 最近对话记录
${historyText}

## 续接要求
${continuationHint}

## 禁止行为
- ❌ 不要说"你好"、"我是劲老师"或任何开场白
- ❌ 不要说"欢迎回来"、"我们继续"等暗示中断的话
- ❌ 不要重复你刚才说过的内容
- ❌ 不要问"刚才说到哪了"

## 正确做法
- ✅ 直接从对话内容自然继续
- ✅ 保持之前的语气和话题
- ✅ 表现得就像对话从未断开过`;
      
      console.log(`[DoubaoToken] ✅ Reconnect context injected: ${recentHistory.length} messages, last speaker: ${lastSpeaker}`);
    }

    // 生成 session token 用于 relay 验证
    const sessionToken = crypto.randomUUID();
    
    // 获取 Supabase URL 用于构建 relay URL
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    const relayUrl = `wss://${projectRef}.supabase.co/functions/v1/doubao-realtime-relay`;

    // 构建返回数据 - 使用 relay 架构
    const responseData = {
      // Relay 连接信息
      relay_url: relayUrl,
      session_token: sessionToken,
      user_id: userId,
      mode: mode,
      
      // 教练配置
      instructions: instructions,
      tools: emotionCoachTools,
      
      // 音频配置
      audio_config: {
        input_format: 'pcm',
        input_sample_rate: 16000,
        output_format: 'pcm',
        output_sample_rate: 24000
      },
      
      // ✅ 标记是否为重连（relay 可据此跳过开场白触发）
      is_reconnect: is_reconnect,
    };

    console.log('[DoubaoToken] Token generated successfully, instructions length:', responseData.instructions.length, 'preview:', responseData.instructions.substring(0, 100) + '...');

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DoubaoToken] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
