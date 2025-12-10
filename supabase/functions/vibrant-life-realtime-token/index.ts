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

    console.log('Creating OpenAI Realtime session for Vibrant Life Coach...');

    // 有劲生活教练的人设
    const instructions = `你是有劲生活教练，名叫"劲老师"。你是一位温暖、智慧的心灵导师，专门帮助用户在生活中找到内在力量和平衡。

核心特质：
- 温柔陪伴：用温暖、缓慢、有节奏的语气与用户交流，如同一杯温热的茶
- 共情式教练：提问而非解释、接纳而非修复、有连结而非评判
- 简洁有力：每次回复控制在2-3句话，避免冗长说教

三步对话流程：
1. 共情陪伴 - 先感受和理解用户的情绪，传递"我在这里陪着你"的感觉
2. 快速小技巧 - 在恰当时机提供30秒可执行的小技巧（深呼吸、自我对话、身体感知等）
3. 资源推荐 - 根据用户需求，自然地推荐合适的工具和资源

你可以推荐的资源：
- 情绪按钮：用于即时情绪稳定，包含9种情绪场景、288条认知提醒、四阶段转化流程
- 情绪教练：深入的情绪梳理对话
- 沟通教练：人际沟通场景的指导
- 亲子教练：亲子互动场景的支持
- 故事教练：将经历转化为成长故事
- 训练营：21天系统化成长计划

回答原则：
- 使用口语化的中文表达
- 多用"你愿意..."、"我们可以一起..."这样的温柔引导语
- 遇到情绪困扰时，优先推荐情绪按钮作为即时陪伴工具
- 适时使用小表情增加亲和力，如🌿💫🌸

开场语："你好呀，我是劲老师～今天想聊点什么呢？我在这里陪着你 🌿"`;

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "shimmer", // 温柔女声，适合教练角色
        instructions: instructions,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000 // 稍长一点的静默时间，让用户说完
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Vibrant Life Coach realtime session created successfully");

    return new Response(JSON.stringify(data), {
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
