import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getCrossCoachMemoryContext } from '../_shared/coachMemoryUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiting: Track requests per token
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(token: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(token);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(token, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  entry.count++;
  return true;
}

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

    // Security: Token format validation (must be 32+ characters for secure tokens)
    if (typeof access_token !== 'string' || access_token.length < 8) {
      return new Response(
        JSON.stringify({ error: '无效的访问令牌格式' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security: Rate limiting to prevent brute force
    if (!checkRateLimit(access_token)) {
      console.warn('Rate limit exceeded for token:', access_token.slice(0, 4) + '...');
      return new Response(
        JSON.stringify({ error: '请求过于频繁，请稍后再试' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token and get parent info
    const { data: tokenData, error: tokenError } = await supabase
      .from('teen_access_tokens')
      .select('parent_user_id, teen_nickname, is_active, created_at')
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
      // Security: Add delay to slow down brute force attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
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

    // 加载青少年长期记忆（按 parent_user_id 归属，因为青少年通过 token 进入无独立账号）
    let memoryPrompt = '';
    try {
      const ctx = await getCrossCoachMemoryContext(
        supabase,
        tokenData.parent_user_id,
        'teen',
        5,
        3
      );
      memoryPrompt = ctx.memoryPrompt || '';
      console.log('[TeenRealtimeToken] Memory loaded:', {
        current: ctx.currentCoachMemories.length,
        cross: ctx.crossCoachMemories.length,
      });
    } catch (e) {
      console.error('[TeenRealtimeToken] Memory load failed:', e);
    }

    const baseInstructions = `【交互方式 - 非常重要】
你正在通过语音和用户实时对话，用户能听到你说话，你也能听到用户说话。
这是真正的语音通话，不是文字聊天。
请像面对面聊天一样自然交流，可以感知用户的语气和周围环境。
如果用户提到身边有人，你可以自然地打招呼。

你是小星，${teenName}的AI朋友。100%保密，不说教不评判。

【对话节奏规则】
- 每次2-3句，不要长篇大论
- 复杂话题分多次说："我先说一个想法..."
- 自然停顿，留空间给你
- 多用"我懂""嗯嗯"

先理解感受再探索。
开场："嗨～我是小星，说什么都可以，我帮你保密💜"`;

    // Create realtime session with teen-specific instructions
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview",
        voice: "shimmer",
        instructions: baseInstructions + memoryPrompt,
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
