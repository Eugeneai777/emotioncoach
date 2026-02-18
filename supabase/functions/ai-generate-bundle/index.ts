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

    const { bundleName, products } = await req.json();
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

    // Step 2: Generate cover image
    const productKeywords = products.slice(0, 5).map((p: any) => p.name).join('、');
    const imagePrompt = `为产品组合包"${bundleName}"设计一张专业精美的商品主图。产品包含：${productKeywords}。风格要求：现代简约、健康温暖、专业可信赖。使用柔和的渐变色背景，中间放置组合包名称的艺术字体。整体感觉高端大气，适合健康与个人成长领域。16:9横版比例。`;

    let coverImageUrl: string | null = null;

    try {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl && imageUrl.startsWith("data:image/")) {
          // Extract base64 and upload to storage
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
      // Continue without image
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
