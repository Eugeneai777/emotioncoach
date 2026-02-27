import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
      return new Response(
        JSON.stringify({ error: '身份验证失败，请重新登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let assessmentData: any = {};
    try {
      const body = await req.json();
      assessmentData = body.assessmentData || {};
    } catch {
      // no body
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const OPENAI_PROXY_URL = Deno.env.get('OPENAI_PROXY_URL');
    const baseUrl = OPENAI_PROXY_URL || 'https://api.openai.com';

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    const userName = profile?.display_name || '家长';

    const instructions = buildCommCoachInstructions(assessmentData, userName);

    const realtimeUrl = `${baseUrl}/v1/realtime/sessions`;
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview",
        voice: "shimmer",
        instructions,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
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
    console.log("Comm assessment realtime session created");

    const realtimeProxyUrl = OPENAI_PROXY_URL 
      ? `${OPENAI_PROXY_URL}/v1/realtime`
      : 'https://api.openai.com/v1/realtime';

    return new Response(JSON.stringify({
      ...data,
      realtime_url: realtimeProxyUrl,
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

function buildCommCoachInstructions(data: any, userName: string): string {
  const {
    primaryPattern = '未知',
    secondaryPattern = '',
    perspective = 'parent',
    totalScore = 0,
    maxTotalScore = 72,
    dimensionScores = [],
  } = data;

  const scorePercentage = Math.round((totalScore / maxTotalScore) * 100);
  const perspectiveLabel = perspective === 'parent' ? '家长' : '青少年';

  let dimensionDetail = '';
  if (Array.isArray(dimensionScores) && dimensionScores.length > 0) {
    dimensionDetail = dimensionScores.map((d: any) => 
      `${d.label}：${d.score}/${d.maxScore}（${d.percentage}%）`
    ).join('\n');
  }

  return `【交互方式 - 非常重要】
你正在通过语音和用户实时对话，用户能听到你说话，你也能听到用户说话。
这是真正的语音通话，不是文字聊天。
请像面对面聊天一样自然交流。

你是亲子沟通教练"小桥"。你温暖、专业、不说教，帮助${perspectiveLabel}改善亲子沟通。

【用户信息】
称呼：${userName}
视角：${perspectiveLabel}视角
沟通模式：${primaryPattern}${secondaryPattern ? `（次要：${secondaryPattern}）` : ''}
综合得分：${scorePercentage}%

【六维得分】
${dimensionDetail || '暂无详细数据'}

【对话策略 - 三阶段自然流动】
第一阶段（2-3轮）：锁定痛点
- 基于测评结果，精准提出1个最突出的沟通问题
- 用具体场景引发共鸣："比如说，当孩子跟你说学校的事，你通常的第一反应是什么？"
- 让用户感到"你真的懂我"

第二阶段（3-4轮）：放大感受+给出洞察
- 帮用户看到当前模式的深层影响
- 分享一个简短的改善案例
- 让用户感到改变是可能的

第三阶段（2-3轮）：行动引导
- 给出1个可以今天就开始的小练习
- 推荐21天亲子突破训练营
- "如果你想系统地改善，我推荐试试21天亲子突破训练营"

【对话节奏规则】
- 每次2-3句，温暖简洁
- 复杂话题分多次说
- 多用"我理解""嗯嗯"
- 避免说教，用提问引导

开场："${userName}你好呀！我是小桥，看了你的沟通测评结果，我发现了一些很有意思的地方，想和你聊聊～"`;
}