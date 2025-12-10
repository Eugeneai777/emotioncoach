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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { entryId, content } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch theme definitions for keywords
    const { data: themes } = await supabase
      .from("gratitude_theme_definitions")
      .select("id, name, keywords")
      .order("display_order");

    const themeInfo = themes?.map(t => `- ${t.id}: ${t.name} (关键词: ${t.keywords?.slice(0, 8).join(', ')})`).join('\n') || '';

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `你是感恩日记分析助手。请为这条感恩记录打上1-3个最相关的主题标签。

可选标签：
${themeInfo}

规则：
1. 只选择1-3个最相关的标签
2. 按相关度从高到低排序
3. 如果内容涉及多个维度，选择最核心的几个
4. 返回纯JSON格式，不要有其他文字

返回格式：{"themes": ["RELATIONSHIPS", "JOY"]}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `请分析这条感恩记录：\n\n"${content}"` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", aiContent);

    // Parse the JSON response
    let analyzedThemes: string[] = [];
    try {
      // Extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        analyzedThemes = parsed.themes || [];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: try to extract theme names directly
      const validThemes = ['CREATION', 'RELATIONSHIPS', 'MONEY', 'HEALTH', 'INNER', 'JOY', 'IMPACT'];
      analyzedThemes = validThemes.filter(t => aiContent.includes(t));
    }

    // Update the entry if entryId is provided
    if (entryId) {
      const { error: updateError } = await supabase
        .from("gratitude_entries")
        .update({
          themes: analyzedThemes,
          ai_analyzed: true,
        })
        .eq("id", entryId);

      if (updateError) {
        console.error("Update error:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ themes: analyzedThemes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-gratitude-entry:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
