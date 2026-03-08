import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { copy_content, copy_type, partner_id } = await req.json();

    if (!copy_content || !partner_id) {
      return new Response(JSON.stringify({ error: "缺少必要参数" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeLabels: Record<string, string> = {
      wechat_moment: "微信朋友圈配图",
      xiaohongshu: "小红书笔记封面图",
      short_video: "短视频封面图",
      poster_text: "营销海报",
    };

    const imageType = typeLabels[copy_type] || "营销配图";

    const prompt = `请根据以下营销文案内容，生成一张精美的${imageType}。要求：
1. 图片风格：现代、温暖、专业，适合心理健康/个人成长领域
2. 色调以暖色为主（橙色、粉色、金色渐变）
3. 包含简洁的文字标题（从文案中提取核心卖点，不超过10个中文字）
4. 适合社交媒体分享的构图
5. 不要包含真实人脸

文案内容：
${copy_content.substring(0, 500)}`;

    console.log("Generating image for partner:", partner_id, "type:", copy_type);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI 请求频率超限，请稍后重试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度不足，请充值后重试" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI 图片生成失败");
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      throw new Error("AI 未返回图片数据");
    }

    // Extract base64 and upload to storage
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("无效的图片格式");
    }

    const imageFormat = base64Match[1]; // png, jpeg, etc.
    const base64Content = base64Match[2];
    const imageBytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));

    const fileName = `partner-images/${partner_id}/${Date.now()}.${imageFormat}`;

    const { error: uploadError } = await supabase.storage
      .from("partner-assets")
      .upload(fileName, imageBytes, {
        contentType: `image/${imageFormat}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("图片上传失败");
    }

    const { data: urlData } = supabase.storage
      .from("partner-assets")
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({
      image_url: urlData.publicUrl,
      message: "配图生成成功",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-partner-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
