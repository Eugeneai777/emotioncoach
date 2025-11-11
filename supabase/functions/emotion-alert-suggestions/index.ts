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

    const { consecutive_days, avg_intensity, recent_emotions } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const promptText = `你是一位专业且温柔的心理健康顾问。用户最近${consecutive_days}天的情绪强度持续较高（平均${avg_intensity}/10分），主要情绪包括：${recent_emotions.join('、')}。

请提供温柔、实用的应对建议，帮助用户更好地照顾自己。

以JSON格式返回：
{
  "immediate_actions": [
    "3-5个立即可以采取的具体行动，每条20-40字"
  ],
  "self_care_tips": [
    "3-4个自我照顾的温柔建议，每条20-40字"
  ],
  "when_to_seek_help": "一段关于何时应该寻求专业心理咨询帮助的建议（60-80字）",
  "encouraging_message": "一段温暖、鼓励的话语，肯定用户的勇气和努力（60-80字）"
}

要求：
- 语气温柔、不评判、充满接纳
- 建议具体、可操作
- 考虑用户的情绪状态，不要过于乐观或轻描淡写
- 强调自我照顾和寻求支持的重要性
- 鼓励用户的勇气，看到他们的努力

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
          { role: "user", content: promptText }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("AI建议生成失败:", response.status);
      return new Response(JSON.stringify({ error: "建议服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const suggestionsText = aiResponse.choices[0].message.content;
    
    let suggestions;
    try {
      suggestions = JSON.parse(suggestionsText);
    } catch {
      const jsonMatch = suggestionsText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析AI返回的建议");
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      suggestions
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("生成建议错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "生成建议过程出现错误，请稍后再试 🌿" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
