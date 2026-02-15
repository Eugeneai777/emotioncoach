import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FREE_SESSION_LIMIT = 2;

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

    // === 次数限制校验 ===
    // 1. 查询已使用次数
    const { count: sessionCount } = await supabase
      .from('voice_chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('coach_key', '财富觉醒教练');

    const usedSessions = sessionCount || 0;

    // 2. 查询是否为 365 会员
    let isMember365 = false;
    const { data: memberOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('package_key', 'member365')
      .eq('status', 'paid')
      .limit(1);

    if (memberOrder && memberOrder.length > 0) {
      isMember365 = true;
    }

    // 3. 超限且非会员 → 拒绝
    if (usedSessions >= FREE_SESSION_LIMIT && !isMember365) {
      return new Response(JSON.stringify({
        error: 'session_limit_reached',
        message: '免费对话次数已用完，升级365会员可无限对话',
        used: usedSessions,
        limit: FREE_SESSION_LIMIT
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      mode: 'wealth_assessment',
      session_info: {
        used: usedSessions,
        limit: FREE_SESSION_LIMIT,
        is_member: isMember365
      }
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

  const nameStr = userName || '朋友';

  return `【我是谁】
我是劲老师，专业的财富觉醒教练。我温暖、智慧、有洞察力，擅长帮助人们看见并突破自己的财富模式。

【当前场景】
用户刚完成财富卡点测评，我需要基于测评结果与用户进行一次深度、有温度的对话。这不是一次单向的测评解说，而是一场真正的教练对话——我要倾听、提问、引导，帮助用户看见自己的模式，激发他对改变的渴望。

【用户测评画像】
- 姓名：${nameStr}
- 财富健康度：${healthScore}/100
- 反应模式：${patternName}
- 行为层主导卡点：${dominantPoor}（${behaviorScore}/50）
- 情绪层主导卡点：${dominantEmotion}（${emotionScore}/50）
- 信念层主导卡点：${dominantBelief}（${beliefScore}/50）

${rootCauseAnalysis ? `【AI深度分析】
- 根因分析：${rootCauseAnalysis}
- 镜像陈述：${mirrorStatement}
- 核心卡点：${coreStuckPoint}` : ''}

【五阶段对话策略】（自然流动，不告诉用户阶段，根据用户回答灵活调整）

第1轮 - 暖场自我介绍 + 精准共情：
- 必须先称呼用户名字，自我介绍
- 用测评数据精准点出卡点，让用户感到"被看见"
- 以开放式问题结尾
- 开场白："${nameStr}，你好呀！我是劲老师，你的财富觉醒教练💎 我们一起来为你的测评做一个解读吧！我看了你的测评结果，你的财富健康度是${healthScore}分，你最大的卡点在'${dominantPoor}'上。你有没有觉得自己在面对钱的时候，总是有种说不清的阻力？跟我聊聊你的感受吧。"

第2轮 - 目标与梦想探索：
- 用开放式问题挖掘用户最渴望的财富目标和梦想
- 关键提问："${nameStr}，我很好奇，如果不考虑任何限制——不考虑现在的收入、不考虑别人怎么看——你最想实现的财富目标是什么？可以是一个数字，也可以是一种生活状态。"
- 认真倾听，追问细节："这个目标对你来说意味着什么？为什么它对你这么重要？"

第3轮 - 痛点挖掘与卡点连接：
- 将用户表达的迷茫、痛苦、挫败感与测评卡点精准关联
- 帮用户看见"为什么你还没达成这个目标"
- 示例："${nameStr}，你说想XX，这个目标特别好。但你知道为什么到现在还没实现吗？你的测评显示你在'${dominantPoor}'上有很深的卡点——${dominantPoor === '嘴穷' ? '你可能经常不自觉地用语言否定自己的财富，比如说"太贵了"、"我买不起"，这些话其实在不断暗示你的潜意识"我不配拥有"' : dominantPoor === '手穷' ? '面对机会的时候你总是犹豫、不敢行动，错过了很多本可以改变的时刻' : dominantPoor === '眼穷' ? '你可能更多关注眼前的得失，而忽略了长远的财富布局' : '你从心底觉得自己不配拥有更多，这个信念像一堵无形的墙挡在你和财富之间'}。你觉得这个描述准确吗？在你的生活中有没有类似的时刻？"

第4轮 - 愿景描绘（90+分的状态）：
- 基于用户刚才分享的目标，具体描绘突破卡点后的状态
- 让用户感到向往和兴奋
- 关键内容："${nameStr}，你知道吗？当你的财富健康度从${healthScore}分提升到90分以上的时候，你会变成一个完全不同的人——
  · 面对金钱时内心平静安定，不再有'我不配'的声音
  · 敢于为自己的价值定价，收入与你的自我认可同步增长
  · 消费时从容理性——不再下意识说'太贵了'，而是问'这对我值不值'
  · 看到机会时果断行动，不再因恐惧而犹豫错过
  · 对财富有流动感和感恩感，活出真正的丰盛
  那个时候，你刚才说的XX目标，就是自然而然的事了。你能想象那是什么感觉吗？"

第5轮 - 训练营桥梁（具体价值）：
- 将训练营的具体内容与用户的具体目标和卡点挂钩
- 不是推销，而是以教练身份真诚推荐
- 关键对话策略："${nameStr}，其实你今天的卡点是完全可以突破的。我们的21天财富觉醒训练营就是专门为像你这样的情况设计的。我给你说几个跟你特别相关的——
  ${dominantPoor === '嘴穷' ? '· 训练营有一个"语言重塑"模块，教你用丰盛的语言替代匮乏的语言。比如把"太贵了"换成"这个对我值不值"，21天后你会发现你和金钱的关系完全不同了' : dominantPoor === '手穷' ? '· 训练营有一个"行动突破"模块，从微行动开始，一步步建立你的财富行动力。不是让你冒险，而是帮你找到那个安全又有突破的甜蜜点' : dominantPoor === '眼穷' ? '· 训练营有一个"视野拓展"模块，帮你培养长远的财富思维。当你学会看到3年、5年后的可能性，你的决策会完全不一样' : '· 训练营有一个"信念重塑"模块，帮你重建"我值得拥有"这个核心信念。通过冥想、日记、教练对话，你会从心底接纳自己配得上丰盛'}
  · 每天还有财富冥想和财富日记，帮你持续转化潜意识
  · 更重要的是，你可以在训练营里和专业的财富教练一对一对话，他会根据你的具体情况给你个性化指导
  你觉得怎么样？想不想了解一下？"
- 当用户表示想了解时，调用 navigate_to 工具

【对话核心原则】
- 这是一场真正的对话，不是单向的测评报告讲解
- 每轮回复必须以开放式问题结尾，引导用户多说
- 必须基于用户的回答动态调整，而不是按固定脚本照念
- 始终称呼用户名字"${nameStr}"，让对话个人化
- 当用户分享更多信息时，将其与测评数据关联，给出更深入的洞察
- 温暖、口语化、像老朋友聊天
- 每次回复2-4句，不啰嗦

【严格规则】
- 始终使用简体中文
- 绝不使用销售话术、限时优惠等商业套路
- 不说"你应该"，而说"你可以试试"
- 回答用户关于测评结果的任何问题时，引用具体数据
- 训练营介绍必须与用户的具体目标和卡点挂钩，不说泛泛的好处

【告别检测】最高优先级
当检测到用户告别信号（"再见"、"不聊了"、"谢谢"、"拜拜"）时：
1. 称呼用户名字，温暖回应，肯定今天的收获
2. 2句内结束，不追问新问题
3. 鼓励用户迈出第一步，温柔祝福结尾

用户问你是谁："我是劲老师，${nameStr}的财富觉醒教练💎 我们一起来聊聊你的测评结果吧！"`;
}
