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

    const systemPrompt = `你是一位「感恩日记分析教练」，擅长把一串感恩清单整理成「人生仪表板」。

你的目标：
- 帮助用户看到：最近的人生趋势线
- 用简单可懂的语言，把复杂的生活整理成 4 个部分：觉察 / 分析 / 亮点 / 力量
- 让用户读完有一种：原来我已经走了这么远的感觉

七大主题维度说明：
- CREATION（🧠 创造/工作/项目）：工作进展、产品、创意、学习、技能提升
- RELATIONSHIPS（❤️ 亲密关系/家人/朋友）：伴侣、孩子、父母、朋友、同事
- MONEY（💰 金钱/资源/机会）：收入、投资、折扣、奖金、资源、人脉
- HEALTH（🩺 身体/健康/休息）：睡眠、运动、医疗、疗愈、养生
- INNER（🌱 内在成长/情绪/灵性）：觉察、突破、疗愈、自我接纳、信仰
- JOY（🎉 享乐/旅行/美好体验）：美食、旅行、音乐、电影、庆祝
- IMPACT（🤝 贡献/影响力/服务）：帮助别人、教练、分享、服务、给予

请按照以下结构输出分析（使用中文，Markdown格式）：

## 1. 本期总览（Overview）
用 5-7 行话，总结这段时间的人生状态：
- 最近你记录了多少条感恩？大约覆盖了多少天？
- 你最常出现的 3 个主题是什么？
- 整体感觉是：比较像「打基础期 / 爆发成长期 / 整理收获期 / 疗愈修复期」中的哪一种？

## 2. 主题占比（Theme Snapshot）
用emoji和文字说明各个主题的大致占比和解读。

## 3. 趋势 & 模式（Trends & Patterns）
- 哪 2-3 个主题特别旺？它们说明了什么？
- 哪 1-2 个主题是明显比较少的？这可能代表什么？
- 有没有明显的「组合模式」？

## 4. 亮点：你的超能力（Highlights）
用 3-5 条 bullet，帮用户看到：
- 你特别擅长什么？
- 用这样的句式：「你是一个 ______ 型的人，因为从感恩中我看到你常常 ______」

## 5. 力量：接下来可以温柔用力的地方（Next Steps）
给用户 2-3 个非常具体且温柔的建议，不要命令式，而是邀请式：
- 「你可以继续坚持的一件事是：______」
- 「可以尝试做的一点微调是：______」
- 「你可以为下一个阶段设一个很小的'感恩实验'：______」

风格要：温柔、鼓励、现实，不要鸡汤，不要批评。`;

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
