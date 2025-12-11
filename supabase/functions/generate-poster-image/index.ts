import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateKey, prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数：prompt" }),
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

    console.log(`正在生成海报背景图，模板: ${templateKey}`);
    console.log(`提示词: ${prompt}`);

    // 扣费 - 图片生成固定扣 5 点
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
        
        const { error: deductError } = await supabaseClient.functions.invoke('deduct-quota', {
          headers: {
            'Authorization': authHeader,
          },
          body: {
            feature_key: 'image_generation',
            source: 'generate_poster_image',
            amount: 5, // 显式指定扣费金额
            metadata: { templateKey }
          }
        });
        
        if (deductError) {
          console.error('扣费失败:', deductError);
        } else {
          console.log(`✅ 海报背景图生成扣费成功: 5 点`);
        }
      } catch (e) {
        console.error('扣费调用异常:', e);
      }
    }

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
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI服务繁忙，请稍后重试" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI额度不足，请充值后重试" }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`AI API 返回错误: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI 响应成功");

    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error("AI响应中没有图片数据:", JSON.stringify(aiData));
      throw new Error("AI 响应中没有图片数据");
    }

    console.log("图片生成成功，准备上传到存储桶");

    // 将 base64 转换为 Blob
    const base64Data = imageBase64.split(",")[1];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // 上传到 Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `poster-${templateKey}-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
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
    const { data: { publicUrl } } = supabase.storage
      .from("community-images")
      .getPublicUrl(uploadData.path);

    return new Response(
      JSON.stringify({
        imageUrl: publicUrl,
        message: "海报背景图生成成功",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("生成海报背景图失败:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "生成海报失败",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
