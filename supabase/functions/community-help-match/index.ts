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
    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "request_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch the help request
    const { data: request, error: reqError } = await supabase
      .from("community_help_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqError || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch community user skills for matching
    const { data: skills } = await supabase
      .from("community_user_skills")
      .select("user_id, skill_tag, description")
      .neq("user_id", request.user_id)
      .limit(100);

    // Build AI prompt for matching
    const skillsSummary = (skills || [])
      .map((s: any) => `- 用户${s.user_id.slice(0, 8)}: ${s.skill_tag}${s.description ? `(${s.description})` : ""}`)
      .join("\n");

    const aiPrompt = `你是社区邻里互助AI匹配助手。根据以下求助信息，给出匹配建议和实用提示。

求助信息：
- 标题：${request.title}
- 描述：${request.description || "无"}
- 分类：${request.category}
- 紧急程度：${request.urgency}
- 位置：${request.location_hint || "未提供"}

社区成员技能：
${skillsSummary || "暂无登记的技能信息"}

请以JSON格式返回：
{
  "suggestion": "一句话匹配建议（30字以内）",
  "tips": "一条实用小贴士（40字以内）",
  "category_advice": "针对这类求助的通用建议（40字以内）"
}

只返回JSON，不要其他内容。`;

    // Call AI via Lovable gateway
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    let matchResult: any = {
      suggestion: "已发布到社区，等待热心邻居响应",
      tips: `试试在标题中加上具体时间和地点，更容易获得帮助`,
      category_advice: "",
    };

    if (lovableKey) {
      try {
        const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "你是社区互助匹配AI，只返回JSON格式。" },
              { role: "user", content: aiPrompt },
            ],
            temperature: 0.7,
            max_tokens: 300,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            matchResult = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error("AI matching error:", e);
      }
    }

    // Update the request with AI match result
    await supabase
      .from("community_help_requests")
      .update({ ai_match_result: matchResult })
      .eq("id", request_id);

    return new Response(JSON.stringify({ success: true, match: matchResult }), {
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
