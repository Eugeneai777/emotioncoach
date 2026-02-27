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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claimsData.claims.sub;
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "partner_admin"])
      .limit(1);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { mode, ...params } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (mode) {
      case "match_product": {
        systemPrompt = `你是一个增长产品策略专家。根据用户提供的目标人群、痛点和投放渠道，推荐最适合的引流产品。

可选产品层级：
- L1 测评 & 工具（免费~¥9.9）：情绪健康测评、SCL-90、财富卡点测评
- L2 有劲训练营（¥299）：21天情绪日记训练营、财富觉醒训练营、青少年困境突破营
- L3 绽放训练营（更高价位）：绽放合伙人体系
- L4 有劲合伙人（¥792~¥4950）：初级/高级/钻石合伙人

请用JSON格式返回，包含：matched_product（推荐产品名）、level（L1-L4）、reason（推荐理由，50字以内）、expected_conversion（预期转化率描述）`;

        userPrompt = `目标人群：${params.target_audience || "未指定"}
痛点：${(params.pain_points || []).join("、") || "未指定"}
关注话题：${(params.topics || []).join("、") || "未指定"}
投放渠道：${params.channel || "未指定"}
预计投放量：${params.volume || "未指定"}`;
        break;
      }

      case "generate": {
        systemPrompt = `你是一个高转化落地页文案专家。根据产品信息和目标人群，生成两个版本的落地页文案（A版和B版），用于AB测试。

每个版本包含：
- title：主标题（10-20字，直击痛点）
- subtitle：副标题（15-30字，描述价值）
- selling_points：3-5个卖点（每个15-25字）
- cta_text：CTA按钮文字（4-8字）
- cta_subtext：CTA辅助文字（10-20字）

两个版本风格要有明显差异：A版偏理性/数据驱动，B版偏感性/故事驱动。
请用JSON格式返回 { content_a: {...}, content_b: {...} }`;

        userPrompt = `产品：${params.matched_product || "未指定"}
层级：${params.level || "未指定"}
目标人群：${params.target_audience || "未指定"}
痛点：${(params.pain_points || []).join("、") || "未指定"}
投放渠道：${params.channel || "未指定"}`;
        break;
      }

      case "optimize": {
        systemPrompt = `你是一个落地页优化专家。根据用户的修改意见，优化现有的落地页文案。保持JSON格式输出，包含：title、subtitle、selling_points、cta_text、cta_subtext。只返回优化后的完整内容JSON。`;

        userPrompt = `当前文案：
${JSON.stringify(params.current_content, null, 2)}

用户修改意见：${params.user_message || ""}

对话历史：
${(params.conversation_history || []).map((m: any) => `${m.role}: ${m.content}`).join("\n")}`;
        break;
      }

      case "analyze": {
        systemPrompt = `你是一个数字营销分析师。请根据以下活动数据进行分析，并与行业标准对比。

行业参考基准：
- 落地页访问→测评完成：15-25%
- 测评完成→付费转化：3-8%
- 整体ROI：2-5倍

请提供：
1. 数据概要（表格）
2. 各环节转化率与行业对比
3. 最弱环节诊断
4. 3条具体优化建议
5. AB测试方向建议

使用中文，Markdown格式。`;

        userPrompt = `触达人数：${params.reach || 0}
转化人数：${params.conversions || 0}
成交金额：¥${params.revenue || 0}
推广成本：¥${params.cost || 0}
ROI：${params.cost > 0 ? (params.revenue / params.cost).toFixed(2) : "N/A"}
当前层级：${params.level || "未指定"}
投放渠道：${params.channel || "未指定"}`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
        return new Response(JSON.stringify({ error: "AI请求过于频繁，请稍后再试" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI额度不足" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, text);
      throw new Error("AI request failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Try to parse JSON from content
    let parsedResult: any = content;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Keep as string if not valid JSON
    }

    return new Response(JSON.stringify({ result: parsedResult, raw: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("flywheel-landing-page-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
