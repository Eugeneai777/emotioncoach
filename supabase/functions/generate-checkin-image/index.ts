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
    const { title, emotionTheme, campName, day } = await req.json();

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

    // 构建生成提示词
    const prompt = `生成一张温暖治愈风格的情绪日记打卡头图，内容要求：
主题：${title}
情绪基调：${emotionTheme || "积极向上"}
训练营：${campName || "情绪日记"}第${day || "1"}天

风格要求：
- 简约温暖的插画风格
- 柔和的色彩搭配
- 适合社交媒体分享
- 体现成长和正能量
- 横向构图，比例 16:9

请生成一张符合上述要求的精美头图。`;

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
