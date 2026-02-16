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

// Style variations to ensure each regeneration looks different
const STYLE_VARIATIONS = [
  { bg: "deep black gradient background with subtle red glow at edges", textStyle: "massive bold calligraphic strokes in pure gold with outer glow", layout: "centered vertically, text stacked with generous spacing", extra: "minimal gold particle dust floating" },
  { bg: "rich dark crimson to black diagonal gradient", textStyle: "elegant serif-style Chinese typography in warm amber-gold with shadow", layout: "text aligned left with dramatic negative space on right", extra: "single thin gold horizontal line as divider between lines" },
  { bg: "solid matte black background", textStyle: "bold sans-serif modern Chinese font in bright gold with red accent shadow", layout: "text bottom-heavy, large title at bottom, supporting text at top", extra: "geometric gold corner accents, very minimal" },
  { bg: "dark red textured background like aged paper or silk fabric", textStyle: "traditional brush calligraphy style in metallic gold ink", layout: "vertical text layout (top to bottom, right to left) traditional Chinese style", extra: "subtle red seal stamp in corner" },
  { bg: "gradient from deep navy blue at top to dark red at bottom", textStyle: "thick blocky modern Chinese font in gradient gold-to-white", layout: "centered with title oversized taking 60% of canvas, subtitle small above", extra: "soft bokeh light circles in gold" },
  { bg: "pure deep red background, no gradient, clean and bold", textStyle: "white text for subtitle, massive gold text for main title with 3D emboss effect", layout: "top-aligned subtitle cluster, center-dominant main title", extra: "subtle cloud pattern watermark in slightly lighter red" },
];

const THEME_COPY: Record<string, { subtitle: string; title: string }> = {
  "觉醒": { subtitle: "除夕夜，别人在数红包\\n你在想：为什么我总赚不到钱？", title: "马上觉醒" },
  "发财": { subtitle: "同样的24小时\\n为什么别人越来越有钱？", title: "马上发财" },
  "回血": { subtitle: "亏过的钱、错过的机会\\n都是蜕变前的代价", title: "马上回血" },
  "看见": { subtitle: "你不是缺能力\\n你只是还没看见卡住你的那堵墙", title: "马上看见" },
  "破局": { subtitle: "一直在努力，一直没突破？\\n问题不在勤奋，在认知", title: "马上破局" },
  "翻身": { subtitle: "人生低谷不可怕\\n可怕的是在低谷里躺平", title: "马上翻身" },
  "出发": { subtitle: "想了一百次不如迈出第一步\\n新的一年，不再等了", title: "马上出发" },
};

function buildPrompt(theme: string): string {
  const copy = THEME_COPY[theme];
  const style = STYLE_VARIATIONS[Math.floor(Math.random() * STYLE_VARIATIONS.length)];
  
  return `A clean, bold Chinese social media poster in 3:4 portrait aspect ratio. ${style.bg}. Minimal and uncluttered — no complex illustrations, no horses, no busy patterns. The entire focus is on powerful typography. ${style.layout}. The supporting text reads: "${copy.subtitle}". The main dramatic large title is "${copy.title}" in ${style.textStyle}, taking up major visual space. ${style.extra}. Chinese New Year premium feel. The text IS the design — clean, impactful, scroll-stopping. No cartoon characters, no animals, no objects — ONLY text and background.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme } = await req.json();

    if (!theme || !THEME_COPY[theme]) {
      return new Response(
        JSON.stringify({ error: `无效主题，可选: ${Object.keys(THEME_COPY).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = buildPrompt(theme);
    console.log(`生成小红书封面: 马上${theme}, prompt长度: ${prompt.length}`);

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
