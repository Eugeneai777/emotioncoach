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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { type } = body;

    // === optimize_name mode ===
    if (type === "optimize_name") {
      const { currentName, products } = body;
      if (!currentName || !products?.length) {
        return new Response(JSON.stringify({ error: "缺少名称或产品列表" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const productList = products.map((p: any) => p.name).join('、');

      const nameResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: "你是一位专业的产品命名专家，擅长为健康与个人成长领域的产品组合包取名。名称应该简洁有力、富有吸引力、易于记忆，适合中国市场。每个名称控制在4-12个字。"
            },
            {
              role: "user",
              content: `请为以下产品组合包优化名称：\n\n当前名称：${currentName}\n包含产品：${productList}\n\n请生成3个优化后的名称建议。`
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_names",
                description: "返回3个优化后的产品组合包名称建议",
                parameters: {
                  type: "object",
                  properties: {
                    suggestions: {
                      type: "array",
                      items: { type: "string", description: "优化后的名称，4-12个字" },
                      minItems: 3,
                      maxItems: 3,
                    },
                  },
                  required: ["suggestions"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "suggest_names" } },
        }),
      });

      if (!nameResponse.ok) {
        const errText = await nameResponse.text();
        console.error("AI name optimization error:", nameResponse.status, errText);
        if (nameResponse.status === 429) {
          return new Response(JSON.stringify({ error: "AI 请求过于频繁，请稍后重试" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI 名称优化失败");
      }

      const nameData = await nameResponse.json();
      const toolCall = nameData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("AI 未返回结构化内容");

      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ suggestions: result.suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === suggest_bundle mode ===
    if (type === "suggest_bundle") {
      const { keyword, availableProducts } = body;
      if (!keyword || !availableProducts?.length) {
        return new Response(JSON.stringify({ error: "缺少场景关键词或可选产品列表" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const productListStr = availableProducts.map((p: any, i: number) =>
        `${i + 1}. ${p.name}（¥${p.price}）${p.description ? ' - ' + p.description : ''}`
      ).join('\n');

      const suggestResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: "你是有劲 AI 健康生活馆的产品组合顾问。你需要根据用户输入的目标场景或人群关键词，从可选产品列表中推荐最合适的 3-5 个产品组成组合包。推荐时要考虑产品之间的协同效应和互补性，确保组合对目标人群有最大价值。同时给出一个有吸引力的组合包名称建议。"
            },
            {
              role: "user",
              content: `目标场景/人群关键词：${keyword}\n\n可选产品列表：\n${productListStr}\n\n请从中推荐最合适的产品组合。`
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "recommend_bundle",
                description: "根据场景关键词推荐产品组合",
                parameters: {
                  type: "object",
                  properties: {
                    bundle_name: { type: "string", description: "推荐的组合包名称，4-12个字" },
                    recommended_indices: {
                      type: "array",
                      items: { type: "integer", description: "推荐产品在列表中的序号（从1开始）" },
                      description: "推荐的产品序号列表，3-5个",
                    },
                    reason: { type: "string", description: "推荐理由，100-200字，说明为什么这些产品适合该场景" },
                  },
                  required: ["bundle_name", "recommended_indices", "reason"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "recommend_bundle" } },
        }),
      });

      if (!suggestResponse.ok) {
        const errText = await suggestResponse.text();
        console.error("AI suggest error:", suggestResponse.status, errText);
        if (suggestResponse.status === 429) {
          return new Response(JSON.stringify({ error: "AI 请求过于频繁，请稍后重试" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (suggestResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI 额度不足，请充值后重试" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI 推荐失败");
      }

      const suggestData = await suggestResponse.json();
      const suggestToolCall = suggestData.choices?.[0]?.message?.tool_calls?.[0];
      if (!suggestToolCall) throw new Error("AI 未返回结构化推荐");

      const suggestion = JSON.parse(suggestToolCall.function.arguments);
      return new Response(JSON.stringify(suggestion), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Default: generate bundle content + image ===
    const { bundleName, products } = body;
    if (!bundleName || !products?.length) {
      return new Response(JSON.stringify({ error: "缺少组合包名称或产品列表" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productList = products.map((p: any) => `${p.name}（¥${p.price}）${p.description ? '：' + p.description : ''}`).join('\n');

    // Step 1: Generate text content via tool calling
    const textResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "你是一位专业的产品营销专家，擅长为健康与个人成长领域的产品组合包撰写精准的营销文案。文案应该温暖、专业、有说服力，面向中国市场。每个板块控制在80-150字。"
          },
          {
            role: "user",
            content: `请为以下产品组合包生成营销文案：\n\n组合包名称：${bundleName}\n\n包含产品：\n${productList}\n\n请生成四个板块的内容。`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_bundle_content",
              description: "生成产品组合包的四大板块营销内容",
              parameters: {
                type: "object",
                properties: {
                  target_audience: { type: "string", description: "目标人群描述，80-150字" },
                  pain_points: { type: "string", description: "解决的痛点，80-150字" },
                  solution: { type: "string", description: "如何解决和提供价值，80-150字" },
                  expected_results: { type: "string", description: "可以看到什么结果和收获，80-150字" },
                },
                required: ["target_audience", "pain_points", "solution", "expected_results"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_bundle_content" } },
      }),
    });

    if (!textResponse.ok) {
      const errText = await textResponse.text();
      console.error("AI text generation error:", textResponse.status, errText);
      if (textResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI 请求过于频繁，请稍后重试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI 文案生成失败");
    }

    const textData = await textResponse.json();
    const toolCall = textData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI 未返回结构化内容");

    const aiContent = JSON.parse(toolCall.function.arguments);

    // Step 2: Generate cover image with brand-aligned prompt
    const productKeywords = products.slice(0, 3).map((p: any) => p.name).join('、');
    const imagePrompt = `设计一张1:1正方形（1080x1080px）的产品组合包主图。

要求：
- 品牌名称：有劲 AI 健康生活馆
- 组合包名称：「${bundleName}」
- 包含产品关键词：${productKeywords}

设计规范：
- 背景：使用 teal 到 emerald 的柔和渐变色（#0D9488 到 #10B981），搭配温暖的米白或浅金色点缀
- 中央：用优雅的中文艺术字体展示组合包名称「${bundleName}」，字体颜色为白色或浅金色
- 底部留出 20% 空白区域（用于 UI 叠加价格和标题）
- 装饰：使用简约的几何图形（圆形、弧线）和柔和的光晕效果，不使用真实照片
- 整体风格：圆润温暖、专业简约、高端大气
- 不要出现任何真实物品照片，纯色块+文字排版+抽象装饰

这是一张用于健康电商平台的商品卡片主图，需要在手机上清晰可见。`;

    let coverImageUrl: string | null = null;

    try {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl && imageUrl.startsWith("data:image/")) {
          const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
          if (base64Match) {
            const ext = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
            const base64Data = base64Match[2];
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            const fileName = `bundle-covers/${crypto.randomUUID()}.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from("partner-assets")
              .upload(fileName, binaryData, {
                contentType: `image/${base64Match[1]}`,
                upsert: true,
              });

            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("partner-assets").getPublicUrl(fileName);
              coverImageUrl = urlData.publicUrl;
            } else {
              console.error("Upload error:", uploadError);
            }
          }
        }
      } else {
        console.error("Image generation failed:", imageResponse.status);
      }
    } catch (imgErr) {
      console.error("Image generation error:", imgErr);
    }

    return new Response(JSON.stringify({
      ai_content: aiContent,
      cover_image_url: coverImageUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate-bundle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
