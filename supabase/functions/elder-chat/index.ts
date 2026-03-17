import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `你是"大劲AI"的AI陪伴助手，名字叫"大劲"。你的角色是一个温暖、耐心、善解人意的年轻晚辈。

核心人设：
- 你像一个贴心的孙子/孙女，说话温和、亲切、简单易懂
- 称呼用户为"您"或"叔叔/阿姨"、"爷爷/奶奶"
- 语气温暖但不矫情，真诚但不做作

沟通风格：
- 用短句，不用复杂词汇
- 每次回复不超过100字
- 多用关心的语气："您今天感觉怎么样呀？"
- 适当使用温暖的表情：🌿 ☀️ 💛 😊
- 不用网络用语、不用英文

你可以做的事：
- 陪聊天、听故事、聊回忆
- 关心身体状况和日常生活
- 给予鼓励和温暖的回应
- 提醒注意休息、喝水、吃药

禁止：
- 不提供医疗诊断建议
- 不说消极、恐吓性的话
- 不催促、不说教
- 不讨论政治敏感话题`;

const PHOTO_GUIDE = `

【照片互动引导策略】
当你收到家人相册的照片描述时，请按以下方式自然地引导对话：
- 用温暖的开放性问题提及照片，例如："我看到相册里有一张特别温馨的照片，里面有个小朋友在笑，那是谁呀？😊"
- 引导老人聊快乐回忆："您和她/他最快乐的记忆是什么呢？那时候是什么感觉？"
- 用好奇和欣赏的语气："看起来好温馨呀！能给我讲讲那天发生了什么吗？"
- 每次只提一张照片的内容，不要一次说完所有照片
- 如果老人愿意聊回忆，继续深入追问细节和感受
- 如果老人不想聊某张照片，自然转换到其他话题
- 不要假设照片中人物的身份，用开放性问题让老人自己告诉你
- 在对话的前几轮自然提起照片，不要每条消息都说照片`;

async function analyzePhotos(photoUrls: string[], apiKey: string): Promise<string[]> {
  const descriptions: string[] = [];
  
  for (const url of photoUrls.slice(0, 5)) {
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "请用一句简短的中文描述这张照片里的人物和场景，不超过30个字。只描述你看到的内容，不要猜测人物关系。",
                },
                {
                  type: "image_url",
                  image_url: { url },
                },
              ],
            },
          ],
          max_tokens: 100,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const desc = data.choices?.[0]?.message?.content?.trim();
        if (desc) descriptions.push(desc);
      }
    } catch (e) {
      console.error("Photo analysis error:", e);
    }
  }

  return descriptions;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userId, photoUrls, photoDescriptions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let finalDescriptions: string[] = photoDescriptions || [];

    // If we have photoUrls but no cached descriptions, analyze them
    if ((!finalDescriptions.length) && photoUrls?.length) {
      finalDescriptions = await analyzePhotos(photoUrls, LOVABLE_API_KEY);
    }

    // If we have a userId but no photos were passed, try fetching from DB
    if (!finalDescriptions.length && userId && !photoUrls?.length) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data } = await supabase
            .from("family_photos")
            .select("photo_url")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5);

          if (data?.length) {
            const urls = data.map((p: any) => p.photo_url);
            finalDescriptions = await analyzePhotos(urls, LOVABLE_API_KEY);
          }
        }
      } catch (e) {
        console.error("DB fetch error:", e);
      }
    }

    // Build system prompt with photo context
    let systemPrompt = SYSTEM_PROMPT;
    if (finalDescriptions.length) {
      const photoList = finalDescriptions.map((d, i) => `${i + 1}. ${d}`).join("\n");
      systemPrompt += PHOTO_GUIDE + `\n\n【家人相册近照】\n${photoList}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求太频繁，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "服务额度不足" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI服务暂时不可用" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return photo descriptions in a custom header so frontend can cache them
    const respHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
    };
    if (finalDescriptions.length) {
      respHeaders["X-Photo-Descriptions"] = encodeURIComponent(JSON.stringify(finalDescriptions));
    }

    return new Response(response.body, { headers: respHeaders });
  } catch (e) {
    console.error("elder-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
