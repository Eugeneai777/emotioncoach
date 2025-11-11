import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "未授权访问" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "身份验证失败" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { emotion_theme, insight, briefing_content } = await req.json();

    if (!emotion_theme) {
      return new Response(JSON.stringify({ error: "缺少情绪主题参数" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const musicPrompt = `你是一位专业的音乐疗愈师。根据用户的情绪状态，推荐5首适合的音乐。

用户的情绪主题：${emotion_theme}
${insight ? `用户的洞察：${insight}` : ''}
${briefing_content ? `简报内容：${briefing_content}` : ''}

请推荐5首音乐，每首音乐包含：
1. 歌曲名称（中文或英文）
2. 艺术家/演唱者
3. 音乐类型（如：轻音乐、古典、流行、爵士等）
4. 推荐理由（30-50字，说明这首歌如何帮助用户的情绪）

请以JSON格式返回：
{
  "recommendations": [
    {
      "song_name": "歌曲名",
      "artist": "艺术家",
      "genre": "类型",
      "reason": "推荐理由",
      "mood_tag": "情绪标签（如：舒缓、治愈、激励、平静等）"
    }
  ],
  "overall_suggestion": "一段温柔的音乐聆听建议（60-80字）"
}

要求：
- 推荐真实存在的歌曲和艺术家
- 考虑用户的情绪状态，如果是负面情绪，推荐舒缓治愈类音乐；如果是积极情绪，可以推荐更激励的音乐
- 推荐理由要温柔、具体，与用户情绪产生共鸣
- 音乐类型多样化，包含不同风格

请确保返回纯JSON格式。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: musicPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error("AI推荐失败:", response.status);
      return new Response(JSON.stringify({ error: "推荐服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const recommendationText = aiResponse.choices[0].message.content;
    
    let recommendations;
    try {
      recommendations = JSON.parse(recommendationText);
    } catch {
      const jsonMatch = recommendationText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析AI返回的推荐结果");
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      ...recommendations
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("推荐错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "推荐过程出现错误，请稍后再试 🌿" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
