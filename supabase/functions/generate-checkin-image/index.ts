import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, emotionTheme, campName, day, style } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数：title" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 风格映射对象
    const stylePrompts: Record<string, string> = {
      // 基础风格
      warm: "Warm, healing illustration style with soft, harmonious pastel colors. Gentle and comforting atmosphere.",
      minimal: "Minimalist, clean design with fresh pastel tones. Simple shapes, lots of white space, modern aesthetic.",
      anime: "Japanese anime/manga illustration style. Kawaii aesthetic with soft lighting and cute elements.",
      watercolor: "Artistic watercolor painting style with soft brushstrokes. Flowing colors and dreamy textures.",
      
      // 自然风光
      nature: "Beautiful nature scenery in photography style. Landscapes, flowers, or peaceful outdoor scenes.",
      sunset: "Golden sunset scenery with warm orange, pink and purple hues. Silhouettes against a glowing sky, romantic atmosphere.",
      ocean: "Peaceful ocean and beach scene. Calm turquoise blue waters, gentle waves, white sand, serene coastal atmosphere.",
      forest: "Mystical forest scene with sunlight filtering through tall trees. Lush green foliage, peaceful and enchanting.",
      countryside: "Idyllic countryside landscape. Rolling green hills, farms, wildflowers, peaceful rural life under blue sky.",
      
      // 艺术风格
      geometric: "Modern geometric shapes with beautiful gradient colors. Abstract, contemporary design with clean lines.",
      vintage: "Vintage film photography style. Nostalgic warm tones, film grain texture, retro 70s-80s feel.",
      oilpainting: "Classical oil painting style. Rich textures, impressionist brush strokes, artistic masterpiece feel.",
      chinese: "Traditional Chinese ink wash painting (水墨画) style. Elegant brushwork, mountains, bamboo, minimalist oriental aesthetic.",
      popart: "Vibrant pop art style inspired by Andy Warhol. Bold contrasting colors, graphic shapes, energetic design.",
      
      // 氛围主题
      cosmic: "Dreamy cosmic/galaxy theme. Deep blues and purples with sparkles, stars, nebulas. Ethereal space atmosphere.",
      moonlight: "Serene moonlit night scene. Silver moonlight illuminating landscape, peaceful darkness, romantic silhouettes.",
      city: "Urban cityscape with modern skyline silhouette. City lights at dusk/night, architectural beauty, metropolitan vibe.",
      cafe: "Cozy cafe atmosphere with warm golden lighting. Coffee cups, books, plants, comfortable hygge ambiance.",
      floral: "Beautiful floral arrangement or garden scene. Elegant blooming flowers, soft romantic colors, botanical beauty.",
      rainbow: "Bright rainbow colors with candy-like cheerfulness. Playful, cute, happy vibes, suitable for celebration.",
    };

    // 获取风格描述，默认使用温暖风格
    const styleDescription = stylePrompts[style] || stylePrompts.warm;

    // 构建生成提示词（使用英文避免乱码）
    const prompt = `Generate an illustration for an emotional diary check-in card.

Theme: ${title}
Emotional tone: ${emotionTheme || "positive and uplifting"}
Context: Day ${day || "1"} of ${campName || "Emotional Diary"} training camp

Art Style Requirements:
${styleDescription}

Technical Requirements:
- Horizontal composition, 16:9 ratio
- Suitable for social media sharing
- CRITICAL: Do NOT include any text, words, letters, numbers, or characters in the image
- Create a pure background/illustration without any text overlay
- High quality, visually appealing

Generate a beautiful header image following these requirements.`;

    console.log("正在生成打卡头图，提示词:", prompt);

    // 调用 Lovable AI 生成图片
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API 错误:", aiResponse.status, errorText);
      throw new Error(`AI API 返回错误: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI 响应结构:", JSON.stringify(aiData, null, 2));

    const imageBase64 =
      aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error("完整 AI 响应:", JSON.stringify(aiData));
      throw new Error("AI 响应中没有图片数据，请查看日志了解详情");
    }

    console.log("图片生成成功，准备上传到存储桶");

    // 将 base64 转换为 Blob
    const base64Data = imageBase64.split(",")[1];
    const binaryData = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0)
    );

    // 上传到 Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `checkin-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("community-images")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("上传图片失败:", uploadError);
      throw uploadError;
    }

    console.log("图片上传成功:", uploadData.path);

    // 获取公开 URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("community-images").getPublicUrl(uploadData.path);

    return new Response(
      JSON.stringify({
        imageUrl: publicUrl,
        message: "头图生成成功",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("生成打卡头图失败:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "生成头图失败",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
