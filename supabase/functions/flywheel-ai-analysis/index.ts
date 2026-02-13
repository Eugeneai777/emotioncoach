import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    // Check admin role using service role
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);

    if (!roleData || roleData.length === 0) {
      // Check if user is a partner (for partner-level access)
      const { data: partnerData } = await serviceClient
        .from("partners")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1);

      const isPartner = partnerData && partnerData.length > 0;
      if (!isPartner) {
        return new Response(JSON.stringify({ error: "Access denied" }), { status: 403, headers: corsHeaders });
      }
    }

    const isAdmin = roleData && roleData.length > 0;
    const { mode, partner_id } = await req.json();

    // If partner is calling, force filter to their own data
    let effectivePartnerId = partner_id;
    if (!isAdmin) {
      const { data: myPartner } = await serviceClient
        .from("partners")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      effectivePartnerId = myPartner?.[0]?.id;
    }

    // Fetch 7-day data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Build campaign query with optional partner filter
    let campaignQuery = serviceClient
      .from("campaigns")
      .select("*")
      .eq("status", "active");
    if (effectivePartnerId) {
      campaignQuery = campaignQuery.eq("partner_id", effectivePartnerId);
    }

    let eventsQuery = serviceClient
      .from("conversion_events")
      .select("event_type, created_at, campaign_id")
      .gte("created_at", sevenDaysAgo);

    const [eventsRes, ordersRes, campaignsRes] = await Promise.all([
      eventsQuery,
      serviceClient
        .from("orders")
        .select("amount, status, created_at, package_name")
        .gte("created_at", sevenDaysAgo)
        .eq("status", "paid"),
      campaignQuery,
    ]);

    const campaigns = campaignsRes.data || [];
    const campaignIds = campaigns.map((c: any) => c.id);
    
    // Filter events to partner's campaigns if applicable
    let events = eventsRes.data || [];
    if (effectivePartnerId && campaignIds.length > 0) {
      events = events.filter((e: any) => campaignIds.includes(e.campaign_id));
    } else if (effectivePartnerId && campaignIds.length === 0) {
      events = [];
    }
    
    const orders = ordersRes.data || [];

    // Calculate funnel stats
    const funnelStats = {
      impressions: events.filter(e => e.event_type === "click" || e.event_type === "page_view").length,
      clicks: events.filter(e => e.event_type === "click").length,
      start_test: events.filter(e => e.event_type === "start_test").length,
      complete_test: events.filter(e => e.event_type === "complete_test").length,
      ai_round_5: events.filter(e => e.event_type === "ai_round_5").length,
      consult_click: events.filter(e => e.event_type === "consult_click").length,
      payment: orders.length,
      total_revenue: orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0),
      total_promotion_cost: campaigns.reduce((sum, c) => sum + (Number(c.promotion_cost) || 0), 0),
    };

    const systemPrompt = mode === "weekly_report"
      ? `你是一个增长数据分析师，请根据以下7天数据生成周报。
周报格式：
1. 本周数据概要（表格形式）
2. 漏斗分析（每一步转化率）
3. 收入与ROI分析
4. 合伙人裂变情况
5. 本周亮点与问题
6. 下周优化建议（3-5条）

请用中文回答，使用Markdown格式。`
      : `你是一个增长优化专家。请根据以下7天转化漏斗数据，完成分析任务。请用中文回答。`;

    const userPrompt = `以下是本周转化数据：

漏斗数据：
- 曝光/页面访问：${funnelStats.impressions}
- 点击：${funnelStats.clicks}
- 开始测评：${funnelStats.start_test}
- 完成测评：${funnelStats.complete_test}
- AI对话≥5轮：${funnelStats.ai_round_5}
- 咨询点击：${funnelStats.consult_click}
- 成交：${funnelStats.payment}

收入数据：
- 总收入：¥${funnelStats.total_revenue}
- 推广成本：¥${funnelStats.total_promotion_cost}
- ROI：${funnelStats.total_promotion_cost > 0 ? (funnelStats.total_revenue / funnelStats.total_promotion_cost).toFixed(2) : "N/A"}

活跃Campaign数量：${campaigns.length}

产品分布：
${orders.reduce((acc: Record<string, number>, o) => {
  acc[o.package_name || "未知"] = (acc[o.package_name || "未知"] || 0) + 1;
  return acc;
}, {} as Record<string, number>) ? Object.entries(orders.reduce((acc: Record<string, number>, o) => {
  acc[o.package_name || "未知"] = (acc[o.package_name || "未知"] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([k, v]) => `  - ${k}: ${v}笔`).join("\n") : "无数据"}

${mode !== "weekly_report" ? `请完成：
1. 找出当前最弱环节
2. 找出最优流量来源
3. 给出3个具体优化建议
4. 提供2个AB测试方向
5. 判断是否需要调整价格或产品结构
6. 预测下周增长趋势` : ""}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI请求过于频繁，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI额度不足，请充值" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, text);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const analysisContent = aiData.choices?.[0]?.message?.content || "分析生成失败";

    return new Response(JSON.stringify({
      analysis: analysisContent,
      funnel_stats: funnelStats,
      generated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("flywheel-ai-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
