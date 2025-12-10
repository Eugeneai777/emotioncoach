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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use anon key with auth header for user context
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reportType = "weekly", startDate, endDate } = await req.json();

    // Calculate date range based on report type
    let start: string, end: string;
    const now = new Date();
    
    if (startDate && endDate) {
      start = startDate;
      end = endDate;
    } else if (reportType === "daily") {
      start = now.toISOString().split("T")[0];
      end = start;
    } else if (reportType === "weekly") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      start = weekAgo.toISOString().split("T")[0];
      end = now.toISOString().split("T")[0];
    } else if (reportType === "monthly") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      start = monthAgo.toISOString().split("T")[0];
      end = now.toISOString().split("T")[0];
    } else {
      start = now.toISOString().split("T")[0];
      end = start;
    }

    // Fetch entries for the date range
    const { data: entries, error: entriesError } = await supabase
      .from("gratitude_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", `${start}T00:00:00`)
      .lte("created_at", `${end}T23:59:59`)
      .order("created_at", { ascending: false });

    if (entriesError) {
      console.error("Entries fetch error:", entriesError);
      return new Response(JSON.stringify({ error: "Failed to fetch entries" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No entries found",
        message: "这段时间没有感恩记录，请先记录一些感恩的事情" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate theme statistics
    const themeStats: Record<string, number> = {
      CREATION: 0,
      RELATIONSHIPS: 0,
      MONEY: 0,
      HEALTH: 0,
      INNER: 0,
      JOY: 0,
      IMPACT: 0,
    };

    entries.forEach(entry => {
      const themes = entry.themes || [];
      themes.forEach((theme: string) => {
        if (themeStats[theme] !== undefined) {
          themeStats[theme]++;
        }
      });
    });

    // Prepare entries for AI analysis
    const entriesText = entries.map((e, i) => {
      const date = new Date(e.created_at).toLocaleDateString("zh-CN");
      const themes = (e.themes || []).join(", ");
      return `${date}｜${e.content}${themes ? ` [${themes}]` : ""}`;
    }).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `你是一位「幸福仪表盘分析师」，擅长把感恩记录整理成「人生幸福仪表盘」。

请按照以下精确结构输出分析（使用中文，Markdown格式）：

# 🌟 幸福仪表盘 · 分析结果

## 1. 幸福总览（Overview）
- 本期共有 X 条感恩记录，覆盖 Y 天。
- 幸福主要来源：……（列出前3个维度）
- 当前属于：「成长期 / 稳定期 / 创造爆发期 / 疗愈整合期 / 关系滋养期」中的某一种，并简要说明原因。

## 2. 幸福构成（幸福七维占比 Snapshot）
根据统计数据，用百分比展示各维度占比：
- 🧠 创造幸福（Creation）：…% — 一句话解读
- ❤️ 关系幸福（Relationships）：…% — 一句话解读
- 💰 财富幸福（Money）：…% — 一句话解读
- 🩺 健康幸福（Health）：…% — 一句话解读
- 🌱 内在幸福（Inner Growth）：…% — 一句话解读
- 🎉 体验幸福（Joy）：…% — 一句话解读
- 🤝 贡献幸福（Impact）：…% — 一句话解读

> 用自然语言总结这些比例意味着什么。

## 3. 幸福趋势（Trends）
- 📈 上升维度：哪些幸福维度特别旺？说明什么？
- 📉 下降维度：哪些维度比较少？需要什么温柔提醒？
- 🔗 组合模式：是否出现某种幸福组合模式？（例如：旅行时会同时有关系+体验+内在）

## 4. 幸福亮点（Your Happiness Strengths）
总结 3–5 条用户独特的幸福能力：
- 「你很会在小事中找到快乐……」
- 「你特别会透过服务获得幸福……」
- 「你的情绪觉察能力很强……」
- ……

## 5. 幸福下一步（Next Steps）
提供 2–3 个具体幸福行动建议：
- ✅ 继续做的：……
- 📈 可以加强的：……
- 🧪 可以尝试的小实验：……
- 🔍 幸福盲区的补强方式：……

七大幸福维度说明：
- CREATION（创造幸福）：工作进展、产品、创意、学习、技能提升
- RELATIONSHIPS（关系幸福）：伴侣、孩子、父母、朋友、同事
- MONEY（财富幸福）：收入、投资、折扣、奖金、资源、人脉
- HEALTH（健康幸福）：睡眠、运动、医疗、疗愈、养生
- INNER（内在幸福）：觉察、突破、疗愈、自我接纳、信仰
- JOY（体验幸福）：美食、旅行、音乐、电影、庆祝
- IMPACT（贡献幸福）：帮助别人、教练、分享、服务、给予

风格：温柔、鼓励、具体可行、不要鸡汤。`;

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
          { role: "user", content: `请分析以下${entries.length}条感恩记录（${start} 到 ${end}）：\n\n${entriesText}\n\n主题统计：${JSON.stringify(themeStats)}` },
        ],
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
    const analysisContent = aiData.choices?.[0]?.message?.content || "";

    // Select top 10 highlights (most recent entries with themes)
    const highlights = entries
      .filter(e => e.themes && e.themes.length > 0)
      .slice(0, 10)
      .map(e => ({
        id: e.id,
        content: e.content,
        themes: e.themes,
        date: e.created_at,
      }));

    // Save the report
    const { data: report, error: saveError } = await supabase
      .from("gratitude_reports")
      .insert({
        user_id: user.id,
        report_type: reportType,
        start_date: start,
        end_date: end,
        total_entries: entries.length,
        theme_stats: themeStats,
        analysis_content: analysisContent,
        highlights: highlights,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save report error:", saveError);
    }

    return new Response(
      JSON.stringify({
        reportId: report?.id,
        reportType,
        startDate: start,
        endDate: end,
        totalEntries: entries.length,
        themeStats,
        analysisContent,
        highlights,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-gratitude-dashboard:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
