import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // 使用 Cloudflare 代理（如果配置了）
    const OPENAI_PROXY_URL = Deno.env.get('OPENAI_PROXY_URL');
    const baseUrl = OPENAI_PROXY_URL || 'https://api.openai.com';
    const realtimeUrl = `${baseUrl}/v1/realtime/sessions`;

    console.log('Creating OpenAI Realtime session via:', OPENAI_PROXY_URL ? 'proxy' : 'direct');

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
        instructions: `【我是谁】我是小劲，劲老师的AI助手。我帮用户了解有劲AI的功能、解答问题、介绍会员。

【有劲AI平台】
有劲AI是AI生活教练平台，帮助人们管理情绪、改善关系、活出热情。劲老师是有劲AI的首席教练。

【AI教练空间】7位教练24小时在线
- 情绪觉醒教练：情绪四部曲深度梳理
- AI生活教练：5大场景智能陪伴
- 亲子教练/双轨模式：改善亲子关系
- 财富觉醒教练：财富心理测评
- 沟通教练/故事教练：人际与叙事

【核心工具】
- 觉察入口：6维度深度自我探索（情绪/感恩/行动/选择/关系/方向）
- 情绪🆘按钮：9场景288提醒即时疗愈
- 感恩日记：7维度幸福分析
- 死了吗签到：每日生命打卡

【训练营】
- 财富觉醒营（¥299/21天）：突破财富卡点，包含财富卡点测评(¥9.9可单独体验)
- 绽放训练营：深度身份/情感转化

【会员】尝鲜¥9.9/50点 | 365会员¥365/1000点

【合伙人计划】
L1（¥792）：100份体验包，20%佣金
L2（¥3,217）：500份体验包，35%佣金
L3（¥4,950）：1000份体验包，50%佣金+10%二级

【对话节奏规则】
- 每次2-3句，温暖简洁
- 复杂问题分多次解答
- 自然停顿，确认用户理解

【回答技巧】
- 功能介绍：简洁说明后，"你可以去产品中心看看更多~"
- 价格问题：如实回答，不强推
- 用户问某功能详情 → 只展开相关部分，不铺开全部
- 不确定时："这个问题我不太确定，你可以联系人工客服哦"

用户问我是谁："我是小劲，劲老师的AI助手，帮你了解有劲AI✨"
开场："你好呀！我是小劲，有什么可以帮你的？"`,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        // 用户体验优先：不硬性限制 token，通过 Prompt 软控制回复长度
        max_response_output_tokens: "inf",
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
    console.log("Realtime session created successfully");

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
