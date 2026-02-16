import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THEME_PINYIN: Record<string, string> = {
  "觉醒": "juexing",
  "发财": "facai",
  "回血": "huixue",
  "看见": "kanjian",
  "破局": "poju",
  "翻身": "fanshen",
  "出发": "chufa",
};

const THEME_PROMPTS: Record<string, string> = {
  "觉醒": "A majestic horse awakening from thick golden mist, its eyes glowing with brilliant golden light, dawn breaking behind it with rays of gold piercing through darkness. Chinese red and gold color palette, dark crimson and black accents. Guochao (国潮) illustration style, grand and powerful composition. 3:4 portrait aspect ratio. Display the large Chinese text \"马上觉醒\" prominently in the center of the image using bold calligraphic style with golden strokes and red outline. The text should be the focal point. Suitable for social media cover image.",
  "发财": "A powerful horse galloping over a sea of golden coins and gold ingots (yuanbao), splashing gold everywhere, surrounded by auspicious red clouds (祥云). Chinese red and gold color palette, dark crimson and black accents. Guochao (国潮) illustration style, grand and powerful composition. 3:4 portrait aspect ratio. Display the large Chinese text \"马上发财\" prominently in the center of the image using bold calligraphic style with golden strokes and red outline. The text should be the focal point. Suitable for social media cover image.",
  "回血": "A magnificent horse leaping upward from a deep valley, its wounds transforming into streams of golden light, phoenix-like rebirth energy surrounding it. Chinese red and gold color palette, dark crimson and black accents. Guochao (国潮) illustration style, grand and powerful composition. 3:4 portrait aspect ratio. Display the large Chinese text \"马上回血\" prominently in the center of the image using bold calligraphic style with golden strokes and red outline. The text should be the focal point. Suitable for social media cover image.",
  "看见": "A wise horse standing on a mountain peak overlooking vast landscape, a mystical third eye on its forehead emitting golden light beams, seeing through everything. Chinese red and gold color palette, dark crimson and black accents. Guochao (国潮) illustration style, grand and powerful composition. 3:4 portrait aspect ratio. Display the large Chinese text \"马上看见\" prominently in the center of the image using bold calligraphic style with golden strokes and red outline. The text should be the focal point. Suitable for social media cover image.",
  "破局": "A mighty horse breaking through golden chains and walls, fragments and debris flying everywhere with explosive force, pure power and determination. Chinese red and gold color palette, dark crimson and black accents. Guochao (国潮) illustration style, grand and powerful composition. 3:4 portrait aspect ratio. Display the large Chinese text \"马上破局\" prominently in the center of the image using bold calligraphic style with golden strokes and red outline. The text should be the focal point. Suitable for social media cover image.",
  "翻身": "A heroic horse leaping from a deep abyss toward the sky, red and gold auspicious clouds (祥云) supporting it from below, a dramatic reversal pose mid-air. Chinese red and gold color palette, dark crimson and black accents. Guochao (国潮) illustration style, grand and powerful composition. 3:4 portrait aspect ratio. Display the large Chinese text \"马上翻身\" prominently in the center of the image using bold calligraphic style with golden strokes and red outline. The text should be the focal point. Suitable for social media cover image.",
  "出发": "A determined horse standing at a starting line facing a magnificent sunrise, red silk ribbons flowing in the wind, ready to charge forward. Chinese red and gold color palette, dark crimson and black accents. Guochao (国潮) illustration style, grand and powerful composition. 3:4 portrait aspect ratio. Display the large Chinese text \"马上出发\" prominently in the center of the image using bold calligraphic style with golden strokes and red outline. The text should be the focal point. Suitable for social media cover image.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme } = await req.json();

    if (!theme || !THEME_PROMPTS[theme]) {
      return new Response(
        JSON.stringify({ error: `无效主题，可选: ${Object.keys(THEME_PROMPTS).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = THEME_PROMPTS[theme];
    console.log(`生成小红书封面: 马上${theme}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API 错误:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI服务繁忙，请稍后重试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI额度不足" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error("No image in response:", JSON.stringify(aiData).slice(0, 200));
      throw new Error("AI 响应中没有图片数据");
    }

    // Upload to storage
    const base64Data = imageBase64.split(",")[1];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `xiaohongshu/mashang-${THEME_PINYIN[theme] || theme}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("community-images")
      .upload(fileName, binaryData, { contentType: "image/png", upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("community-images")
      .getPublicUrl(uploadData.path);

    console.log(`✅ 马上${theme} 生成成功: ${publicUrl}`);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl, theme }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("生成封面失败:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "生成失败" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
