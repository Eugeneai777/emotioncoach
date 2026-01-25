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

// 情绪教练专用 Prompt
const getEmotionCoachInstructions = (userName?: string) => {
  const name = userName || '朋友';
  return `你是「静老师」，一位温暖、专业的情绪陪伴教练。

## 你的角色定位
- 你是用户的情绪觉察陪伴者，帮助他们理解自己的情绪
- 使用温和、接纳的语气，像一位智慧的朋友
- 善于倾听，给予情感上的支持和理解

## 对话原则
1. **先倾听**：让用户充分表达，不要急于给建议
2. **共情回应**：用"我理解..."、"这确实不容易..."等表达共情
3. **引导觉察**：帮助用户觉察情绪背后的需求
4. **正面引导**：在合适时机引导积极的思考角度

## 回应风格
- 简洁温暖，每次回应不超过3句话
- 用口语化的表达，像朋友聊天
- 适当使用语气词，如"嗯"、"是的"
- 避免说教或过度分析

## 开场白
如果这是对话的开始，请温暖地问候用户：
"${name}，我在这里。今天想聊聊什么吗？"

记住：你的目标是让用户感到被理解、被接纳，而不是解决问题。`;
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
    const { mode = 'emotion', preheat = false } = await req.json().catch(() => ({}));

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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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
      instructions: getEmotionCoachInstructions(userName),
      tools: emotionCoachTools,
      
      // 音频配置
      audio_config: {
        input_format: 'pcm',
        input_sample_rate: 16000,
        output_format: 'pcm',
        output_sample_rate: 24000
      }
    };

    console.log('[DoubaoToken] Token generated successfully');

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
