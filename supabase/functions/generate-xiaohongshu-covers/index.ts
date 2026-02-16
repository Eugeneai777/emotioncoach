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

// 小红书爆款封面设计公式：大字报 + 情绪冲击 + 对比反差 + 留白呼吸感
// 每次重新生成随机组合不同风格
const XHS_STYLES = [
  {
    name: "暗黑大字报",
    bg: "Pure solid black background, completely clean with no textures or patterns",
    titleStyle: "超大号加粗无衬线中文字体，纯白色，字号占画面宽度80%，字间距紧凑",
    subtitleStyle: "小号浅灰色文字，行间距大，呼吸感强",
    accent: "标题中1-2个关键字用亮红色(#FF2442)高亮",
    composition: "标题居中偏上，副标题在下方1/3处，大量留白"
  },
  {
    name: "红底白字冲击",
    bg: "Solid deep red background (#CC0000), flat and clean, no gradient",
    titleStyle: "超大号加粗中文字体，纯白色，粗体，占画面宽度85%",
    subtitleStyle: "小号淡粉色文字，简洁排列",
    accent: "标题下方一条细白线作为分隔",
    composition: "标题垂直居中，副标题紧贴标题下方，上下大量留白"
  },
  {
    name: "奶油温柔风",
    bg: "Warm cream/beige solid background (#FFF5E6), soft and clean",
    titleStyle: "大号深棕色(#3D2B1F)加粗圆体中文字，温暖有力",
    subtitleStyle: "中号浅棕色文字，手写感",
    accent: "关键词用暖橙色(#FF6B35)标注，像荧光笔划重点的效果",
    composition: "文字左对齐，右侧大量留白，标题占左侧60%宽度"
  },
  {
    name: "深蓝高级感",
    bg: "Deep navy blue solid background (#0A1628), premium and clean",
    titleStyle: "大号金色(#D4AF37)加粗衬线中文字，质感高级",
    subtitleStyle: "小号浅蓝灰色文字，优雅间距",
    accent: "标题字带微弱金色光晕",
    composition: "标题居中，上方有小号英文或数字装饰，整体对称"
  },
  {
    name: "荧光撞色",
    bg: "Solid black background, completely dark",
    titleStyle: "超大号荧光绿色(#00FF88)加粗无衬线字体，视觉冲击力极强",
    subtitleStyle: "白色小号文字",
    accent: "个别关键字用荧光黄(#FFFF00)突出",
    composition: "标题斜放约5度倾斜，打破规则感，副标题水平排列在底部"
  },
  {
    name: "极简黑白",
    bg: "Pure white background, nothing else",
    titleStyle: "超大号纯黑加粗字体，占画面70%面积，震撼有力",
    subtitleStyle: "极小号灰色文字，与巨大标题形成强烈大小对比",
    accent: "无任何彩色，纯黑白灰",
    composition: "标题充满画面中央，副标题缩在右下角，极致对比"
  },
];

const THEME_COPY: Record<string, { hook: string; title: string; bottom: string }> = {
  "觉醒": { 
    hook: "除夕夜 别人在数红包", 
    title: "你还在想\n为什么我总赚不到钱？", 
    bottom: "马上觉醒" 
  },
  "发财": { 
    hook: "同样24小时", 
    title: "为什么别人越来越有钱\n你却越来越焦虑？", 
    bottom: "马上发财" 
  },
  "回血": { 
    hook: "亏过的钱 错过的人", 
    title: "都是你\n蜕变前的代价", 
    bottom: "马上回血" 
  },
  "看见": { 
    hook: "你不是缺能力", 
    title: "你只是没看见\n卡住你的那堵墙", 
    bottom: "马上看见" 
  },
  "破局": { 
    hook: "一直努力 一直没突破？", 
    title: "问题不在勤奋\n在认知", 
    bottom: "马上破局" 
  },
  "翻身": { 
    hook: "人生低谷不可怕", 
    title: "可怕的是\n在低谷里躺平", 
    bottom: "马上翻身" 
  },
  "出发": { 
    hook: "想了一百次", 
    title: "不如\n迈出第一步", 
    bottom: "马上出发" 
  },
};

// Export style names for frontend reference
const STYLE_NAMES = XHS_STYLES.map(s => s.name);

function buildPrompt(theme: string, customText?: { hook?: string; title?: string; bottom?: string }, styleName?: string): string {
  // Use custom text or fall back to theme defaults
  const defaultCopy = THEME_COPY[theme] || { hook: "", title: "", bottom: "" };
  const copy = {
    hook: customText?.hook || defaultCopy.hook,
    title: customText?.title || defaultCopy.title,
    bottom: customText?.bottom || defaultCopy.bottom,
  };
  
  // Use specified style or random
  let style;
  if (styleName) {
    style = XHS_STYLES.find(s => s.name === styleName) || XHS_STYLES[Math.floor(Math.random() * XHS_STYLES.length)];
  } else {
    style = XHS_STYLES[Math.floor(Math.random() * XHS_STYLES.length)];
  }
  
  return `Design a viral Xiaohongshu (小红书) cover image. 3:4 portrait ratio (1080x1440px).

DESIGN STYLE: "${style.name}"
- Background: ${style.bg}
- Main title: ${style.titleStyle}
- Subtitle: ${style.subtitleStyle}  
- Color accent: ${style.accent}
- Layout: ${style.composition}

TEXT CONTENT (must render ALL text accurately in Chinese):
- Top hook line (small): "${copy.hook}"
- Main title (HUGE, dominant): "${copy.title}"
- Bottom tag (medium, bold): "${copy.bottom}"

CRITICAL RULES:
1. TEXT IS EVERYTHING. The image is purely typographic — no illustrations, no photos, no icons, no decorative elements, no animals, no people.
2. The main title must be MASSIVE — it should dominate 50-70% of the visual space.
3. Strong contrast between text and background for instant readability.
4. Clean breathing space — generous margins and line spacing.
5. This must look like a top-performing Xiaohongshu text poster that makes people STOP scrolling.
6. Render all Chinese characters precisely and clearly.
7. ABSOLUTELY DO NOT add any text that is not listed above. No extra words, no slogans, no dates, no times, no course names, no watermarks, no additional Chinese or English text whatsoever. ONLY render the exact 3 text elements specified above (hook, title, bottom tag) and NOTHING ELSE.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support listing available styles
    if (body.action === "list-styles") {
      return new Response(
        JSON.stringify({ styles: STYLE_NAMES, themes: Object.keys(THEME_COPY) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { theme, customText, styleName } = body;

    if (!theme) {
      return new Response(
        JSON.stringify({ error: "缺少主题参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Allow custom themes with custom text
    if (!THEME_COPY[theme] && !customText) {
      return new Response(
        JSON.stringify({ error: `未知主题且未提供自定义文案，可选主题: ${Object.keys(THEME_COPY).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = buildPrompt(theme, customText, styleName);
    console.log(`生成小红书封面: ${theme}, 风格: ${styleName || '随机'}, prompt长度: ${prompt.length}`);

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
