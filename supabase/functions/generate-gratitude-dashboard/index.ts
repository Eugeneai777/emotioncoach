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
- 本期共有 X 条感恩记录，覆盖 Y 天
- 幸福主要来源：……（列出前3个维度）
- 幸福期类型：「🌱成长期 / 🌿稳定期 / ⚡创造爆发期 / 🌸疗愈整合期 / 💝关系滋养期」中的某一种，并简要说明原因

## 2. 幸福构成（Composition）
用一句话总结整体幸福构成特点，例如：
"你的幸福主要来自关系和体验，创造维度正在觉醒中"
不要列出具体百分比数字，雷达图已经直观展示了比例。

## 3. 幸福趋势（Trends）

### 📈 上升维度
列出表现较好的1-2个维度，解释为什么旺，这说明什么。

### ⚠️ 需要关注的维度
列出占比最低的1-2个维度，为每个维度提供：
- 维度名称
- 可能原因（一句话）
- 💡 具体提升行动（2-3个可执行的小步骤）
- 🧪 幸福实验：一个简单有趣的尝试建议

### 🔗 幸福组合洞察

**🎯 你的幸福组合模式**
描述用户独特的幸福组合场景，用具体场景 + emoji维度标签的方式：
例如："周末家庭聚餐 = ❤️关系 + 🎉体验 + 🤝贡献"
找出1-2个这样的高频组合场景

**🧠 这说明什么**
用一句话解读这个组合背后的核心需求：
例如："你特别重视联结感，通过共同体验获得深层滋养"

**✅ 你可以这样做**
提供一个非常具体的行动建议，包含时间+场景+具体行为：
例如："下周五晚上，约家人一起做顿饭，享受这份'幸福复利'"

## 4. 幸福亮点（Your Happiness Strengths）
总结 3-5 条用户独特的幸福能力，直接输出内容，不要在开头加emoji：
- 你很会在小事中找到快乐……
- 你特别会透过服务获得幸福……
- 你的情绪觉察能力很强……

## 5. 幸福下一步（Next Steps）
基于分析结果，提供分类明确的行动建议，每条建议开头使用对应的emoji：
- ✅ 继续保持：当前做得好的1个具体行为
- 📈 可以加强：有潜力但不够的1个维度 + 具体行动
- 🧪 幸福实验：针对最低维度的1个趣味尝试
- 🔍 盲区探索：可能被忽略的幸福来源 + 如何觉察

维度专属提升建议参考：
- 创造幸福低 → 学一个新技能、完成一个小项目、写一篇文章
- 关系幸福低 → 主动联系一位朋友、给家人写张卡片、约一次深度聊天
- 财富幸福低 → 记录一笔意外收入、盘点已有资源、发现省钱的小确幸
- 健康幸福低 → 今天散步10分钟、早睡30分钟、喝够8杯水
- 内在幸福低 → 5分钟正念冥想、写下一个自我肯定、允许自己休息
- 体验幸福低 → 尝试一家新餐厅、听一首新歌、看一部期待的电影
- 贡献幸福低 → 帮助一个人、分享一个好消息、为他人做一件小事

七大幸福维度说明：
- CREATION（创造幸福）：工作进展、产品、创意、学习、技能提升
- RELATIONSHIPS（关系幸福）：伴侣、孩子、父母、朋友、同事
- MONEY（财富幸福）：收入、投资、折扣、奖金、资源、人脉
- HEALTH（健康幸福）：睡眠、运动、医疗、疗愈、养生
- INNER（内在幸福）：觉察、突破、疗愈、自我接纳、信仰
- JOY（体验幸福）：美食、旅行、音乐、电影、庆祝
- IMPACT（贡献幸福）：帮助别人、教练、分享、服务、给予

风格要求：
- 温柔鼓励，不要鸡汤
- 具体可执行，避免空泛建议
- 对于低维度，用关怀而非批评的语气
- 每个建议都要有明确的行动步骤
- 幸福亮点和幸福下一步的列表项不要重复添加emoji前缀`;

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
