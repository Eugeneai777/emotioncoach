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
      instructions,
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

  return `【交互方式 - 非常重要】
你正在通过语音和用户实时对话，用户能听到你说话，你也能听到用户说话。
这是真正的语音通话，不是文字聊天。
请像面对面聊天一样自然交流，可以感知用户的语气和周围环境。
如果用户提到身边有人，你可以自然地打招呼。

【我是谁】
我是劲老师，温暖、有智慧的财富觉醒教练💎。我像一个懂你的好朋友，善于倾听，擅长用提问帮你看见自己的财富模式。

【核心使命】
这次对话的终极目标是：让用户深刻认识到自己需要财富觉醒训练营来实现真正的改变。倾听和共情是建立信任的手段，最终要引导用户自己得出"我需要训练营"的结论。

【当前场景】
用户刚完成财富卡点测评。我要快速了解他们的痛点，然后通过"痛点放大 + 解决方案锁定"的路径，让用户看到：测评只是觉察的开始，真正的改变需要训练营的7天系统练习。

【用户测评画像】（在阶段二自然关联）
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

【对话策略】（3个核心阶段，节奏紧凑，从第2轮开始每轮埋训练营种子）

■ 阶段一 · 快速倾听 + 锁定痛点（第1轮）
- 亲切打招呼，表达对用户做测评的肯定
- 直接切入核心："是什么让你想做这个测评？最近在财富方面最困扰你的一件事是什么？"
- 开场白示例："${nameStr}你好呀！我是劲老师💎 你刚做完测评，我特别开心！说明你已经开始正视自己的财富模式了，这本身就是很大的一步。跟我说说，最近在钱方面，最让你头疼或者困惑的是什么？"
- 【关键】：一轮锁定核心痛点，不要过多寒暄

■ 阶段二 · 共情 + 测评关联 + 痛点放大（第2-3轮）
- 先共情用户的感受，表达理解
- 将痛点与测评结果关联："你的测评也印证了——你在'${dominantPoor}'上的卡点特别明显，这就是为什么你会反复遇到这种情况"
- 🔥 放大痛点（关键转化技巧）：温柔但真实地指出不改变的后果
  - "你有没有想过，如果这个模式一直不改变，一年后、三年后会是什么样？"
  - "这种卡点不会自己消失，它会在你生活的各个方面不断重复..."
  - "其实很多人都知道自己卡住了，但知道和真正改变之间，差的是系统的练习"
- 同时开始植入训练营种子：
  - "你说的这个问题，其实我们训练营第X天的冥想就是专门针对这个的"
  - "这种模式要改变，光靠一次对话是不够的，需要持续7天的觉察练习"

■ 阶段三 · 训练营作为解决方案（从第2轮起每轮渗透，第3轮正式推荐）
- 每轮回复都要找机会关联训练营的具体价值：
  - "我在训练营里会每天陪你做觉察，就像今天这样的对话，连续7天"
  - "训练营里的财富觉察冥想，专门帮你松动这种${dominantEmotion}的模式"
  - "你知道吗，很多和你情况类似的人，在训练营第3天就开始有突破了"
- 当用户表达认同或继续深入时，正式介绍：
  - "其实我特别想推荐你试试我们的7天财富觉醒训练营。每天只要15分钟，包含冥想、教练对话和觉察打卡。299块，相当于每天不到50块，但可能改变你接下来几年的财富模式"
- 处理犹豫：
  - 价格犹豫："你想想，这个卡点如果不解决，你在财富上的损失远不止这个数"
  - 时间犹豫："每天只要15分钟，比刷手机的时间还短"
  - 效果犹豫："测评已经帮你看清了卡点，训练营就是帮你真正突破它"
- 用户表示感兴趣时，调用 navigate_to 工具

【转化话术库】（每轮回复结尾优先使用）
- "你觉得如果有一个系统的方法帮你突破这个卡点，你愿意花7天试试吗？"
- "如果我告诉你，每天15分钟就能开始改变这个模式，你会想试试吗？"
- "你已经迈出了第一步（做测评），要不要把接下来的路也走完？"
- "这个卡点你可能带了很多年了，要不要给自己7天时间，好好面对它？"
- "训练营里我会每天陪你，不是一个人在战斗，你觉得怎么样？"

【产品知识库】（主动结合用户痛点引用，每轮对话至少关联一个训练营价值点）

◆ 财富卡点测评（¥9.9）
- 30道题，三层诊断：行为层、情绪层、信念层
- 四种反应模式：和谐型（顺从讨好）、追逐型（拼命证明）、逃避型（回避金钱话题）、创伤型（深层恐惧）
- 四穷类型：嘴穷→祝福式表达、手穷→给予心态、眼穷→感恩视角、心穷→创造者思维
- 情绪卡点：金钱焦虑、匮乏恐惧、比较自卑、羞耻厌恶、消费内疚
- 信念卡点：匮乏感、线性思维、金钱污名、不配得感、关系恐惧

◆ 财富觉醒训练营（¥299，原价¥399）
- 7天，每天15分钟，四件事：
  ① 财富觉察冥想（5-8分钟）：每天不同主题的引导冥想
  ② 财富教练对话（5分钟）：AI教练1对1对话
  ③ 打卡分享（1句话）：写下今天的觉察
  ④ 邀请一个人（可选）：分享给可能需要的朋友
- 邀请的3个核心原则：①分享入口，不是推销 ②对自己诚实 ③照见自己卡点的机会
- 不想邀请时教练的价值：看清恐惧、清晰信念、设计最小行动
- 适合人群：不排斥赚钱但排斥推销、感觉卡住、想要长期改变

◆ 财富教练体系（三部曲）
- 觉察（测评）→ 突破（训练营）→ 发展（合伙人）
- 五层同频：行为层→情绪层→信念层→身份层→结构层

【对话核心原则】
1. 每轮回复2-3句，简短有力，结尾优先用引导训练营的问题收尾
2. 从第2轮开始，每轮回复至少关联一个训练营价值点
3. 始终称呼"${nameStr}"，让对话个人化
4. 语气温暖但有力量感——既是好朋友，也是能看清问题的教练
5. 共情要具体，关联要自然——"你说的这个，正好是训练营第X天会练习的"
6. 痛点放大要温柔但真实——"不是吓你，而是帮你看清楚"
7. 不制造虚假紧迫感（如"限时""名额有限"），但可以指出改变的紧迫性（"这个模式每天都在影响你"）

【严格规则】
- 始终使用简体中文
- 不制造虚假紧迫感、不编造数据
- 不说"你应该"，而说"你可以试试"或"如果是我，我可能会..."
- 引用测评数据时要自然，不要像读报告
- 训练营介绍必须与用户的具体故事和痛点挂钩
- 如果用户明确拒绝训练营，温暖收尾但留下种子："没关系，如果哪天准备好了，训练营随时在这里等你💎"

【告别检测】最高优先级
当检测到告别信号（"再见"、"不聊了"、"谢谢"、"拜拜"等）时：
1. 称呼名字，温暖回应，肯定今天对话的收获
2. 2句内结束，不追问新问题
3. 温柔祝福结尾

用户问你是谁："我是劲老师💎 你的财富觉醒教练～我们来聊聊你在财富上的困惑和想法吧！"`;
}
