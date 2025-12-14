import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token } = await req.json();
    
    if (!access_token) {
      return new Response(
        JSON.stringify({ error: '缺少访问令牌' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token and get parent info
    const { data: tokenData, error: tokenError } = await supabase
      .from('teen_access_tokens')
      .select('parent_user_id, teen_nickname, is_active')
      .eq('access_token', access_token)
      .maybeSingle();

    if (tokenError) {
      console.error('Token lookup error:', tokenError);
      return new Response(
        JSON.stringify({ error: '验证失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenData || !tokenData.is_active) {
      return new Response(
        JSON.stringify({ error: '链接已失效' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check parent's quota
    const { data: quotaData, error: quotaError } = await supabase
      .from('user_accounts')
      .select('remaining_quota')
      .eq('user_id', tokenData.parent_user_id)
      .single();

    if (quotaError || !quotaData) {
      console.error('Quota check error:', quotaError);
      return new Response(
        JSON.stringify({ error: '账户状态异常' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (quotaData.remaining_quota < 8) {
      return new Response(
        JSON.stringify({ error: '账户余额不足，请联系爸妈充值' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token validated, parent:', tokenData.parent_user_id, 'quota:', quotaData.remaining_quota);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const OPENAI_PROXY_URL = Deno.env.get('OPENAI_PROXY_URL');
    const baseUrl = OPENAI_PROXY_URL || 'https://api.openai.com';
    const realtimeUrl = `${baseUrl}/v1/realtime/sessions`;

    const teenName = tokenData.teen_nickname || '你';

    // Create realtime session with teen-specific instructions
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "shimmer", // 温暖女声，适合青少年
        instructions: `你是一个温暖、理解、不评判的AI朋友，专门陪伴青少年倾诉心事。

你的身份：
- 你叫"小星"，是一个懂得倾听的AI朋友
- 你的存在是完全保密的，${teenName}说的任何话都不会被别人知道
- 你像一个可以信任的大姐姐/大哥哥，而不是老师或家长

核心原则：
1. 绝对接纳：不管${teenName}说什么，都不批评、不说教、不评判
2. 共情优先：先理解感受，再探索想法
3. 保守秘密：反复强调这里的一切都是保密的，建立信任感
4. 温柔陪伴：用轻松、年轻的语气交流，像朋友聊天

回应风格：
- 每次回复简短温暖，2-3句话
- 使用口语化表达，偶尔用一些年轻人的语气词
- 多用"我懂"、"嗯嗯"、"我在"这样的陪伴性语言
- 不急于给建议，先让${teenName}说完想说的
- 可以适当用emoji让对话更轻松

常见场景回应：
- 学业压力："学习的事真的好累啊，我懂的。想说说怎么回事吗？"
- 人际困扰："朋友/同学的事确实会让人很烦恼。我在听～"
- 情绪低落："有时候就是会心情不好，这很正常。想聊聊吗？"
- 和父母的矛盾："代沟确实存在，你的感受是真实的。"

开场白："嗨～我是小星，很高兴认识你！这里只有我们两个，说什么都可以，我会为你保密的 💜"`,
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
    console.log("Teen realtime session created");

    const realtimeProxyUrl = OPENAI_PROXY_URL 
      ? `${OPENAI_PROXY_URL}/v1/realtime`
      : 'https://api.openai.com/v1/realtime';

    return new Response(JSON.stringify({
      ...data,
      realtime_url: realtimeProxyUrl,
      parent_user_id: tokenData.parent_user_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
