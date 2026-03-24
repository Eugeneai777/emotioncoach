import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { habit_title, streak, checkin_id } = await req.json();

    if (!habit_title) {
      return new Response(JSON.stringify({ error: "habit_title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ encouragement: `坚持${habit_title}第${streak || 1}天，你很棒！继续加油 💪` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `你是一个温暖有趣的生活教练AI。用户刚完成了"${habit_title}"的每日打卡，已连续坚持${streak || 1}天。

请给出一句简短的鼓励话语（15-30字），要求：
1. 温暖、真诚、有趣，不要太鸡汤
2. 如果连续天数较高（>7天），要特别表扬坚持
3. 如果是第1天，要鼓励开始的勇气
4. 可以适当加一个emoji
5. 只返回鼓励语本身，不要任何其他内容`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "user", content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 100,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fallback
      return new Response(JSON.stringify({ encouragement: `坚持${habit_title}第${streak || 1}天，继续加油！💪` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const encouragement = aiData.choices?.[0]?.message?.content?.trim() || `${habit_title}打卡成功，继续加油！`;

    return new Response(JSON.stringify({ encouragement }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
