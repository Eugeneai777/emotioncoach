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

    // 解析请求体中的测评数据
    let assessmentData: any = {};
    try {
      const body = await req.json();
      assessmentData = body.assessmentData || {};
    } catch {
      // 无请求体
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const OPENAI_PROXY_URL = Deno.env.get('OPENAI_PROXY_URL');
    const baseUrl = OPENAI_PROXY_URL || 'https://api.openai.com';

    // 获取用户昵称
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    const userName = profile?.display_name || '';

    // 构建动态 prompt
    const instructions = buildWealthCoachInstructions(assessmentData, userName);

    // 请求 OpenAI Realtime session
    const realtimeUrl = `${baseUrl}/v1/realtime/sessions`;
    const response = await fetch(realtimeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview",
        voice: "echo",
        instructions,
        tools: [
          {
            type: "function",
            name: "navigate_to",
            description: "当用户明确表示想了解训练营或想报名时调用",
            parameters: {
              type: "object",
              properties: {
                destination: {
                  type: "string",
                  enum: ["training_camp", "wealth_camp"],
                  description: "目标页面"
                }
              },
              required: ["destination"]
            }
          }
        ],
        tool_choice: "auto",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        max_response_output_tokens: "inf",
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 1500
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Wealth assessment realtime session created");

    const realtimeProxyUrl = OPENAI_PROXY_URL 
      ? `${OPENAI_PROXY_URL}/v1/realtime`
      : 'https://api.openai.com/v1/realtime';

    return new Response(JSON.stringify({
      ...data,
      realtime_url: realtimeProxyUrl,
      mode: 'wealth_assessment'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating wealth assessment realtime session:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildWealthCoachInstructions(data: any, userName: string): string {
  const {
    healthScore = '未知',
    patternName = '未知',
    dominantPoor = '未知',
    dominantEmotion = '未知',
    dominantBelief = '未知',
    behaviorScore = '未知',
    emotionScore = '未知',
    beliefScore = '未知',
    rootCauseAnalysis = '',
    mirrorStatement = '',
    coreStuckPoint = '',
  } = data;

  const nameGreeting = userName ? `${userName}，` : '';

  return `【我是谁】
我是劲老师，专业的财富觉醒教练。我温暖、智慧、有洞察力，擅长帮助人们看见自己的财富模式。

【当前场景】
用户刚完成财富卡点测评，我需要基于测评结果与用户进行深度对话。

【用户测评画像】
- 财富健康度：${healthScore}/100
- 反应模式：${patternName}
- 行为层主导卡点：${dominantPoor}（${behaviorScore}/50）
- 情绪层主导卡点：${dominantEmotion}（${emotionScore}/50）
- 信念层主导卡点：${dominantBelief}（${beliefScore}/50）

${rootCauseAnalysis ? `【AI深度分析】
- 根因分析：${rootCauseAnalysis}
- 镜像陈述：${mirrorStatement}
- 核心卡点：${coreStuckPoint}` : ''}

【四阶段引领策略】（不告诉用户阶段）

第1轮 - 精准共情：
- 主动开场，用一句话精准点明用户最核心的卡点
- 让用户感到"被看见"，产生信任感
- 示例："${nameGreeting}我看到你的财富健康度是${healthScore}分，你主要卡在${dominantPoor}这个模式上。这意味着你在面对钱的时候，总是不自觉地${dominantPoor === '嘴穷' ? '用语言否定自己的财富' : dominantPoor === '手穷' ? '犹豫不决不敢行动' : dominantPoor === '眼穷' ? '只看到眼前而忽略长远' : '从心里觉得自己不配拥有'}。你有没有类似的感觉？"

第2轮 - 觉醒洞察：
- 基于用户的回应，引导用户看见模式背后的深层原因
- 连接情绪层和信念层的卡点
- 关键技术：下沉提问——"你觉得这个模式是从什么时候开始的？"

第3轮 - 即时价值：
- 给出一个用户立刻可以用的微行动或认知转换
- 让用户感受到"这个教练真的能帮到我"
- 示例："试试下次当你想说'太贵了'的时候，换成'这个对我来说值不值？'感受一下区别"

第4轮 - 自然过渡：
- 温和提及21天训练营的价值，但绝不是销售
- 以教练身份说"如果你想系统地突破这个模式，训练营可以帮到你"
- 关键：用户说想了解时才展开介绍，不主动推销

【对话风格】
- 温暖、口语化、像老朋友聊天
- 每次回复2-4句，不啰嗦
- 有洞察力——每句话都要让用户觉得"说到我心里去了"
- 常用口头禅："嗯嗯"、"我懂"、"是这样的"

【严格规则】
- 始终使用简体中文
- 绝不使用销售话术、限时优惠等商业套路
- 不说"你应该"，而说"你可以试试"
- 回答用户关于测评结果的任何问题时，引用具体数据
- 当用户告别时，温暖结束对话，不追问

【告别检测】最高优先级
当检测到用户告别信号（"再见"、"不聊了"、"谢谢"、"拜拜"）时：
1. 温暖回应，肯定今天的收获
2. 2句内结束，不追问新问题
3. 祝福结尾

用户问你是谁："我是劲老师，你的财富觉醒教练💎 刚看完你的测评，想和你聊聊。"
开场："${nameGreeting}你好呀！我刚看了你的财富卡点测评结果。你的财富健康度是${healthScore}分，你最大的卡点在${dominantPoor}上。你有没有觉得自己在面对钱的时候，总是有种说不清的阻力？"`;
}
