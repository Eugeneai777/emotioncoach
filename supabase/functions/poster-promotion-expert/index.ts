import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `你是一位专业的AI推广专家，帮助合伙人创建最吸引人的推广海报。

你的职责：
1. 通过对话了解合伙人的目标用户群体
2. 询问推广场景（朋友圈/微信群/小红书等）
3. 深入了解目标用户的痛点和需求
4. 基于以上信息推荐最合适的产品
5. 生成3种定制化推广文案供选择

对话风格：
- 专业但亲切，像一位有经验的营销伙伴
- 简洁高效，每次只问1-2个问题
- 善于引导和激发思考
- 给出具体、可操作的建议
- 使用emoji让对话更生动

可推荐的产品模板：
- emotion_button: 情绪按钮 - 适合有即时情绪困扰的人群，288条认知提醒，9种情绪场景
- emotion_coach: 情绪教练 - 适合想深度梳理情绪的人群，四部曲方法
- parent_coach: 亲子教练 - 适合有育儿困扰的家长群体
- communication_coach: 沟通教练 - 适合职场人群和人际关系困扰者
- training_camp: 21天训练营 - 适合想系统学习和改变的人群
- member_365: 365会员 - 适合重度用户，1000点数超值
- partner_recruit: 招募合伙人 - 适合想创业/副业的人群

对话流程：
1. 首先询问目标用户群体
2. 了解推广场景
3. 深挖用户痛点
4. 当信息足够时，调用 generate_poster_copy 工具生成文案

重要：
- 不要一次问太多问题
- 根据用户回答灵活调整
- 当收集到足够信息（人群+场景+痛点）后，立即调用工具生成文案`;

const tools = [
  {
    type: "function",
    function: {
      name: "generate_poster_copy",
      description: "生成定制化海报文案。当了解够目标用户信息后调用此工具。",
      parameters: {
        type: "object",
        properties: {
          recommended_template: {
            type: "string",
            enum: ["emotion_button", "emotion_coach", "parent_coach", 
                   "communication_coach", "training_camp", "member_365", 
                   "partner_recruit"],
            description: "推荐的产品模板key"
          },
          target_audience: {
            type: "string",
            description: "目标用户画像描述"
          },
          promotion_scene: {
            type: "string",
            description: "推广场景"
          },
          headline_options: {
            type: "array",
            items: { type: "string" },
            description: "3个吸引人的标题选项，每个不超过15字"
          },
          subtitle_options: {
            type: "array",
            items: { type: "string" },
            description: "3个副标题/描述选项，每个不超过25字"
          },
          selling_points: {
            type: "array",
            items: { type: "string" },
            description: "3个产品卖点，每个不超过10字"
          },
          call_to_action: {
            type: "string",
            description: "号召行动的文案，如：扫码立即体验"
          },
          promotion_tips: {
            type: "string",
            description: "推广技巧建议，帮助合伙人更好地推广"
          }
        },
        required: ["recommended_template", "target_audience", "headline_options", 
                   "subtitle_options", "selling_points", "call_to_action"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling AI with messages:", messages.length);

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
          ...messages,
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "服务额度不足" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("poster-promotion-expert error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
