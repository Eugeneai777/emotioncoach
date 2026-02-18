import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url, link } = await req.json();

    if (!image_url && !link) {
      return new Response(JSON.stringify({ error: '请提供商品图片或链接' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build messages based on mode
    const messages: any[] = [
      {
        role: "system",
        content: `你是一个商品信息提取专家。从用户提供的商品图片或网页内容中，准确提取商品的关键信息。
如果某个字段无法确定，使用合理的默认值或留空。价格如无法确定则设为 0。
分类应为简短的中文分类词，如"养生食品"、"护肤美容"、"家居用品"等。
标签应为 2-5 个关键词。`
      }
    ];

    if (image_url) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "请从这张商品图片中提取商品信息，包括名称、价格、描述、分类等。" },
          { type: "image_url", image_url: { url: image_url } }
        ]
      });
    } else if (link) {
      // Fetch the webpage HTML
      let htmlContent = "";
      try {
        const pageResp = await fetch(link, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductBot/1.0)' },
          redirect: 'follow',
        });
        const fullHtml = await pageResp.text();
        htmlContent = fullHtml.substring(0, 8000);
      } catch (fetchErr) {
        console.error("Failed to fetch link:", fetchErr);
        return new Response(JSON.stringify({ error: '无法访问该链接，请检查 URL 是否正确' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      messages.push({
        role: "user",
        content: `请从以下网页 HTML 内容中提取商品信息。网页 URL: ${link}\n\nHTML 内容:\n${htmlContent}`
      });
    }

    // Call Lovable AI with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "extract_product_info",
              description: "提取并返回商品的结构化信息",
              parameters: {
                type: "object",
                properties: {
                  product_name: { type: "string", description: "商品名称" },
                  description: { type: "string", description: "商品描述，50-200字" },
                  price: { type: "number", description: "售价（元），如无法确定则为 0" },
                  original_price: { type: "number", description: "原价（元），如无则为 0" },
                  category: { type: "string", description: "商品分类，如养生食品、护肤美容" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-5个商品标签关键词"
                  },
                  shipping_info: { type: "string", description: "配送说明，如无则为空字符串" }
                },
                required: ["product_name", "description", "price", "category", "tags"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_product_info" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'AI 服务繁忙，请稍后再试' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI 额度不足，请联系管理员' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI 识别失败");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI 未返回有效结果");
    }

    const productInfo = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: productInfo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error("ai-extract-product error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : '未知错误' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
