import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `你是一位专业的小红书爆款海报设计师助手。用户会通过对话告诉你他们想要什么样的海报。

你的工作流程：
1. 理解用户需求（文案内容、风格偏好、用途等）
2. 当你有足够信息时，调用 generate_poster 工具来生成海报
3. 生成后告诉用户结果，并询问是否需要调整

对话风格：
- 简短、专业、有创意
- 主动给出建议，比如文案优化、风格推荐
- 如果用户给的信息太少，先问清楚再生成
- 用中文交流

你可以生成的海报风格包括：暗黑大字报、红底白字冲击、奶油温柔风、深蓝高级感、荧光撞色、极简黑白，或者让AI自由发挥。

重要：当用户表达了明确的文案和意图时，直接调用工具生成，不要过度询问。`;

const GENERATE_TOOL = {
  type: "function",
  function: {
    name: "generate_poster",
    description: "生成一张小红书爆款海报图片。当用户提供了文案内容后调用此工具。",
    parameters: {
      type: "object",
      properties: {
        text_content: {
          type: "string",
          description: "海报上要展示的所有文案内容，直接写出来，不分段不分区"
        },
        style_hint: {
          type: "string",
          description: "风格描述，如：暗黑大字报、红底白字、奶油温柔、深蓝高级、荧光撞色、极简黑白，或自由描述"
        },
        design_notes: {
          type: "string",
          description: "额外的设计要求或注意事项"
        }
      },
      required: ["text_content"],
      additionalProperties: false
    }
  }
};

function buildImagePrompt(textContent: string, styleHint?: string, designNotes?: string): string {
  const styleDesc = styleHint 
    ? `设计风格要求：${styleHint}` 
    : "请自由选择最适合内容的小红书爆款风格";

  return `你是一位小红书爆款海报设计大师。请设计一张3:4竖版（1080x1440px）的小红书爆款封面图。

${styleDesc}

需要呈现的文案内容：${textContent}

${designNotes ? `额外要求：${designNotes}` : ''}

请像小红书上那些10万+点赞的爆款封面一样来设计这张海报。你可以自由决定排版、字体大小、文字层次、留白和构图方式。关键是让人看到的第一眼就想点进来。

要求：
- 纯文字排版设计，不要任何插图、照片、人物、图标或装饰元素
- 主要文案要大、要醒目、要有冲击力
- 文字层次分明，有呼吸感
- 只使用我提供的文案内容，不要自己添加任何额外的文字
- 所有中文字符必须清晰准确`;
}

async function generateImage(LOVABLE_API_KEY: string, textContent: string, styleHint?: string, designNotes?: string): Promise<string> {
  const prompt = buildImagePrompt(textContent, styleHint, designNotes);
  const models = ["google/gemini-3-pro-image-preview", "google/gemini-2.5-flash-image"];
  
  for (const model of models) {
    console.log(`尝试模型: ${model}`);
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI API 错误 (${model}):`, aiResponse.status, errorText);
      if (aiResponse.status === 429) throw new Error("AI服务繁忙，请稍后重试");
      if (aiResponse.status === 402) throw new Error("AI额度不足");
      continue;
    }

    const aiData = await aiResponse.json();
    const choiceError = aiData.choices?.[0]?.error?.message;
    if (choiceError) {
      console.error(`模型 ${model} 内联错误: ${choiceError}`);
      continue;
    }
    
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (imageBase64) {
      console.log(`模型 ${model} 生成成功`);
      return imageBase64;
    }
    console.error(`模型 ${model} 无图片:`, JSON.stringify(aiData).slice(0, 300));
  }
  throw new Error("图片生成失败，请重试");
}

async function uploadImage(imageBase64: string): Promise<string> {
  const base64Data = imageBase64.split(",")[1];
  const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const fileName = `xiaohongshu/chat-${Date.now()}.png`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("community-images")
    .upload(fileName, binaryData, { contentType: "image/png", upsert: false });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("community-images")
    .getPublicUrl(uploadData.path);

  return publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "缺少 messages 参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: Call text model with tool calling
    const chatResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools: [GENERATE_TOOL],
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("Chat AI error:", chatResponse.status, errorText);
      if (chatResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI服务繁忙，请稍后重试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (chatResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI额度不足" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI 服务异常");
    }

    const chatData = await chatResponse.json();
    const choice = chatData.choices?.[0];
    const message = choice?.message;

    // Check if the model wants to call the generate tool
    const toolCall = message?.tool_calls?.[0];
    
    if (toolCall && toolCall.function?.name === "generate_poster") {
      // Parse tool arguments
      const args = JSON.parse(toolCall.function.arguments);
      console.log("生成海报:", args);

      // Generate the image
      const imageBase64 = await generateImage(
        LOVABLE_API_KEY, 
        args.text_content, 
        args.style_hint, 
        args.design_notes
      );
      
      // Upload to storage
      const publicUrl = await uploadImage(imageBase64);
      console.log("✅ 海报生成成功:", publicUrl);

      // Get a follow-up message from the AI
      const followUpText = message?.content || "海报已生成！看看效果如何？如果需要调整风格或文案，随时告诉我 ✨";

      return new Response(
        JSON.stringify({
          reply: followUpText,
          imageUrl: publicUrl,
          toolUsed: "generate_poster",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No tool call - just a text reply
    return new Response(
      JSON.stringify({
        reply: message?.content || "抱歉，我没理解你的意思，能再说一遍吗？",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("处理失败:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "处理失败" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
