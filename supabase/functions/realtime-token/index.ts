import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function toClientSecretsBody(legacy: Record<string, any>): Record<string, any> {
  const session: Record<string, any> = { type: "realtime", model: legacy.model };
  if (legacy.instructions !== undefined) session.instructions = legacy.instructions;
  if (legacy.tools !== undefined) session.tools = legacy.tools;
  if (legacy.tool_choice !== undefined) session.tool_choice = legacy.tool_choice;
  if (legacy.max_response_output_tokens !== undefined) session.max_output_tokens = legacy.max_response_output_tokens;
  const audioInput: Record<string, any> = { format: { type: "audio/pcm", rate: 24000 } };
  if (legacy.input_audio_transcription) audioInput.transcription = legacy.input_audio_transcription;
  if (legacy.turn_detection) audioInput.turn_detection = legacy.turn_detection;
  const audioOutput: Record<string, any> = { format: { type: "audio/pcm", rate: 24000 } };
  if (legacy.voice) audioOutput.voice = legacy.voice;
  session.audio = { input: audioInput, output: audioOutput };
  return { session };
}

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
    const realtimeUrl = `${baseUrl}/v1/realtime/client_secrets`;

    console.log('Creating OpenAI Realtime session via:', OPENAI_PROXY_URL ? 'proxy' : 'direct');

    // Request an ephemeral token from OpenAI
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toClientSecretsBody({
        model: "gpt-4o-mini-realtime-preview",
        voice: "echo",
        instructions: `【交互方式 - 非常重要】
你正在通过语音和用户实时对话，用户能听到你说话，你也能听到用户说话。
这是真正的语音通话，不是文字聊天。
请像面对面聊天一样自然交流，可以感知用户的语气和周围环境。

【我是谁】我是小劲，劲老师的AI助手。

用户问我是谁："我是小劲，劲老师的AI助手，帮你了解有劲AI✨"
开场："你好呀！我是小劲，有什么可以帮你的？"`,
        max_response_output_tokens: "inf",
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 1200
        }
      })),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Realtime session created successfully");

    const realtimeProxyUrl = OPENAI_PROXY_URL
      ? `${OPENAI_PROXY_URL}/v1/realtime/calls`
      : 'https://api.openai.com/v1/realtime/calls';

    return new Response(JSON.stringify({
      ...data,
      client_secret: { value: data.value, expires_at: data.expires_at },
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
