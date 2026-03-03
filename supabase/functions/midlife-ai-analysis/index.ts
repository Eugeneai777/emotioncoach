import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personalityType, dimensions, internalFrictionRisk, actionPower, missionClarity, regretRisk, supportWarmth, answers, assessmentId, userId } = await req.json();

    if (!personalityType || !dimensions) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 构建维度描述
    const dimensionSummary = dimensions.map((d: any) => `${d.dimension}: ${d.score}/100`).join(', ');

    const personalityNames: Record<string, string> = {
      mistBound: '迷雾困兽型',
      suppressed: '责任压抑型',
      stableAnxiety: '稳定焦虑型',
      awakening: '觉醒转型型',
    };

    const systemPrompt = `你是一位深谙中年心理的生命教练，擅长透过数据看到人的内心世界。

用户刚完成"中场觉醒力测评"，以下是测评数据：

🎭 人格类型：${personalityNames[personalityType] || personalityType}

📊 六维得分（0-100）：${dimensionSummary}

📈 核心指标：
- 内耗风险：${internalFrictionRisk}/100
- 行动力：${actionPower}/100
- 使命清晰度：${missionClarity}/100
- 后悔风险：${regretRisk}/100
- 支持系统温度：${supportWarmth}/100（越高越缺乏支持）

你的任务是基于以上数据，生成一份击中用户痛点、让用户感到"被看见"的深度分析报告。

要求输出 JSON 格式：
{
  "coreInsight": "1-2段话，精准描述用户当前的内心状态和核心挣扎，让用户读后感到'这说的就是我'。语气温暖但犀利，不说废话。",
  "painPoint": "一句直击痛点的话，精准概括用户最深层的困境。像一面镜子，让用户突然看见自己一直在回避的东西。",
  "blindSpot": "指出用户的认知盲区——那些他/她以为是'正常'或'应该的'，但其实正在消耗生命力的模式。要具体，不要空泛。",
  "breakthrough": ["第一步：具体可操作的行动", "第二步：进阶的改变", "第三步：更深层的转变"],
  "microAction": "一个今天2分钟内就能完成的微小行动，要足够具体、足够小，让用户立刻可以做。",
  "coachInvite": "基于用户的具体盲点或痛点，用温和邀请式的一句话引导深聊。格式：'关于你提到的[具体内容]，如果你想，我可以陪你聊得更深一点。'",
  "recommendedActivity": "emotion_camp|identity_camp|life_camp 三选一，基于数据推荐最匹配的训练营类型",
  "userTags": ["3-5个用户画像标签，如：高内耗、行动力不足、关系焦虑等"]
}

注意：
- 语气温暖、真诚、接地气，像一个智慧的朋友在说话
- 每一条内容都要基于具体数据，不要泛泛而谈
- coreInsight 要有画面感，让用户看到自己的"日常场景"
- painPoint 要精准到让用户"心头一震"
- blindSpot 要让用户产生"原来如此"的顿悟
- breakthrough 三步要循序渐进，从易到难
- 只输出 JSON，不要其他内容`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "请基于以上测评数据生成深度分析报告。" }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后重试" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "服务额度不足，请联系管理员" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    // 保存分析结果到数据库
    if (userId && assessmentId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error: updateError } = await supabase
          .from('midlife_awakening_assessments')
          .update({ ai_analysis: analysis })
          .eq('id', assessmentId)
          .eq('user_id', userId);

        if (updateError) {
          console.error("Failed to save AI analysis:", updateError);
        }
      } catch (saveError) {
        console.error("Failed to save AI analysis:", saveError);
      }
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Midlife AI analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "分析失败" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
