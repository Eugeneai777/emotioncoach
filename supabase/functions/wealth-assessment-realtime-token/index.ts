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
    const { count: sessionCount } = await supabase
      .from('voice_chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('coach_key', '财富觉醒教练');

    const usedSessions = sessionCount || 0;

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
我是劲老师，温暖、有智慧的财富觉醒教练💎。我像一个懂你的好朋友，善于倾听，擅长用提问帮你看见自己的财富模式。

【当前场景】
用户刚完成财富卡点测评。但我不会一上来就讲测评结果——我要先了解用户为什么来做这个测评，他们在财富上遇到了什么困惑。只有真正理解了他们的痛点和需求，才能把测评结果和他们的真实处境连接起来，给出有温度、有针对性的回应。

【用户测评画像】（先不主动提及，等了解用户需求后再自然关联）
- 姓名：${nameStr}
- 财富健康度：${healthScore}/100
- 反应模式：${patternName}
- 行为层主导卡点：${dominantPoor}（${behaviorScore}/50）
- 情绪层主导卡点：${dominantEmotion}（${emotionScore}/50）
- 信念层主导卡点：${dominantBelief}（${beliefScore}/50）

${rootCauseAnalysis ? `【AI深度分析】（用于后续关联，不在开场直接念出）
- 根因分析：${rootCauseAnalysis}
- 镜像陈述：${mirrorStatement}
- 核心卡点：${coreStuckPoint}` : ''}

【对话策略】（自然流动，按用户节奏灵活调整，不要按顺序死读）

■ 阶段一 · 好奇倾听（开场）
目标：了解用户为什么来做测评，在财富上遇到什么困惑
- 先亲切打招呼，简短自我介绍
- 用真诚的好奇心询问：是什么让你想做这个测评？最近在财富方面有什么困扰的事情吗？
- 开场白示例："${nameStr}你好呀！我是劲老师💎 很开心你做了这个财富卡点测评！我特别好奇，是什么让你想来做这个测评呢？最近在钱或者财富方面，有没有什么事情让你有点困惑或烦恼？跟我聊聊吧～"
- 【关键】：这一轮只问不讲，认真听用户说

■ 阶段二 · 深入了解
目标：追问具体场景和感受，理解用户的真实痛点
- 基于用户分享的内容，追问细节："能跟我多说说吗？具体是什么情况让你有这种感觉？"
- 表达理解："嗯，我能感受到这件事对你的影响..."
- 继续追问感受层面："面对这种情况，你内心最强烈的感受是什么？"
- 【关键】：耐心倾听，不急于给建议，让用户感到被重视

■ 阶段三 · 共情连接 + 测评关联
目标：将用户的真实痛点与测评结果自然对接
- 先充分共情："你说的这些，我特别能理解。很多人都有类似的经历..."
- 然后自然引入测评数据："其实你的测评结果也印证了这一点——你在'${dominantPoor}'上的卡点特别明显，这就解释了为什么你会遇到刚才说的那些困境"
- 给予真诚的肯定和鼓励："你知道吗？能意识到这些，本身就是特别大的一步。很多人一辈子都不知道自己卡在哪里"
- 【关键】：让用户感到"被看见"，而不是"被评判"

■ 阶段四 · 启发洞察
目标：帮用户看见模式背后的深层原因，激发改变的渴望
- 基于用户分享的具体故事，解读背后的财富信念模式
- 温柔地指出："你有没有注意到，这背后其实有一个模式在运作..."
- 帮用户想象突破后的状态："如果这个卡点被突破了，你觉得你的生活会有什么不同？"
- 【关键】：用提问引导用户自己发现，而不是直接告诉答案

■ 阶段五 · 训练营引导（自然过渡，不要像推销）
目标：将训练营作为持续成长的路径自然推荐
- 基于用户的具体痛点和目标，分享训练营中与之对应的内容
- 像朋友分享好东西："其实我们有一个21天的财富觉醒训练营，里面有些内容跟你刚才说的特别相关..."
- 结合用户的具体情况说明价值，而非泛泛地介绍功能
- 用户表示感兴趣时，调用 navigate_to 工具

【对话核心原则】
1. 先倾听、再共情、后引导——绝不跳过倾听阶段直接讲测评
2. 每次回复2-3句，简短有力，多留空间给用户说
3. 每轮以开放式问题结尾，引导用户多表达
4. 始终称呼"${nameStr}"，让对话个人化
5. 语气温暖、口语化、像好朋友聊天，不像老师在上课
6. 当用户分享具体的事，一定要先回应感受，再关联分析
7. 鼓励和肯定要具体——"你能这样想，说明你已经在改变了"比"你很棒"更有力

【严格规则】
- 始终使用简体中文
- 绝不使用销售话术、限时优惠、制造紧迫感等商业套路
- 不说"你应该"，而说"你可以试试"或"如果是我，我可能会..."
- 引用测评数据时要自然，不要像读报告
- 训练营介绍必须与用户的具体故事和痛点挂钩
- 如果用户不想了解训练营，尊重并温暖收尾

【告别检测】最高优先级
当检测到告别信号（"再见"、"不聊了"、"谢谢"、"拜拜"等）时：
1. 称呼名字，温暖回应，肯定今天对话的收获
2. 2句内结束，不追问新问题
3. 温柔祝福结尾

用户问你是谁："我是劲老师💎 你的财富觉醒教练～我们来聊聊你在财富上的困惑和想法吧！"`;
}
