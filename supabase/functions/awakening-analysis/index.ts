import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 觉醒维度配置
const dimensionConfig: Record<string, { name: string; coachRoute: string; toolRoute: string }> = {
  emotion: { name: '情绪', coachRoute: '/', toolRoute: '/emotion-button' },
  gratitude: { name: '感恩', coachRoute: '/coach/gratitude', toolRoute: '/gratitude-journal' },
  action: { name: '行动', coachRoute: '/goals', toolRoute: '/goals' },
  decision: { name: '选择', coachRoute: '/coach/decision', toolRoute: '/coach/decision' },
  relation: { name: '关系', coachRoute: '/communication-coach', toolRoute: '/communication-coach' },
  direction: { name: '方向', coachRoute: '/story-coach', toolRoute: '/story-coach' }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, input, userId } = await req.json();

    if (!type || !input) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const dimension = dimensionConfig[type];
    if (!dimension) {
      return new Response(
        JSON.stringify({ error: '无效的觉醒类型' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 构建系统提示
    const systemPrompt = `你是一位专业的生命教练和心理咨询师。用户正在进行"${dimension.name}觉醒"记录，表达了以下内容。

你的任务是生成一张"生命卡片"，帮助用户快速获得洞察和行动力。

生命卡片必须包含以下5个部分，每个部分用1-2句话表达：

A. 看见（seeing）：用一句话总结用户此刻的核心状态/情绪/需求/冲突
B. 鼓励（encourage）：用一句支持性的话让用户感到被理解，格式如"你这样感觉很正常，因为..."
C. 盲点（blindSpot）：指出用户可能忽略的角度，如自动反应、隐藏假设、价值冲突等
D. 启发（insight）：提供一个小转念或新视角
E. 微行动（microAction）：建议一个2分钟内可完成的最小行动

输出格式必须是JSON：
{
  "seeing": "...",
  "encourage": "...",
  "blindSpot": "...",
  "insight": "...",
  "microAction": "...",
  "recommendedCoach": "${dimension.coachRoute}",
  "recommendedTool": "${dimension.toolRoute}"
}

注意：
- 语气温暖、接地气、不说教
- 内容具体、实用、可操作
- 微行动要足够小，让用户立刻可以做
- 只输出JSON，不要其他内容`;

    const userPrompt = `用户的${dimension.name}觉醒记录：
"${input}"

请生成生命卡片。`;

    // 调用 Lovable AI
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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
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

    // 解析 JSON 响应
    let lifeCard;
    try {
      // 尝试提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lifeCard = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    // 如果用户已登录，保存记录到统一的觉察记录表
    if (userId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 保存到觉察记录表
        const { error: insertError } = await supabase.from('awakening_entries').insert({
          user_id: userId,
          type: type,
          input_text: input,
          life_card: lifeCard
        });

        if (insertError) {
          console.error("Failed to save awakening entry:", insertError);
        } else {
          console.log(`Saved ${type} awakening entry for user ${userId}`);
        }
      } catch (saveError) {
        console.error("Failed to save awakening log:", saveError);
        // 不影响返回结果
      }
    }

    return new Response(
      JSON.stringify({ lifeCard }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Awakening analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "分析失败" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
