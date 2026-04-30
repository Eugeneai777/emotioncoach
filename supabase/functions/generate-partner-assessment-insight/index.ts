import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize service-role client outside try/catch so it persists
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, serviceKey);

interface InsightRequest {
  dimensionScores?: Array<{ label: string; score: number; maxScore: number; emoji?: string }>;
  primaryPattern?: string;
  totalScore?: number;
  maxScore?: number;
  aiInsightPrompt?: string;
  title?: string;
  meta?: Record<string, any>;
  userId?: string;
  resultId?: string;
  assessmentKey?: string;
}

async function buildUserContext(userId?: string, currentAssessmentKey?: string) {
  if (!userId) return { profileLine: "", ordersLine: "", historyLine: "" };

  const [profileRes, ordersRes, historyRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, gender, avatar_url, age_range")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("package_key, package_name, amount, paid_at")
      .eq("user_id", userId)
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(10),
    supabase
      .from("partner_assessment_results")
      .select("template_id, primary_pattern, created_at, partner_assessment_templates!inner(assessment_key,title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const profile = profileRes.data as any;
  const nickname = profile?.display_name || "朋友";
  const gender = profile?.gender ? `性别:${profile.gender}` : "";
  const age = profile?.age_range ? `年龄段:${profile.age_range}` : "";
  const profileLine = `用户昵称:${nickname}${gender ? "  " + gender : ""}${age ? "  " + age : ""}`;

  const orders = (ordersRes.data || []) as any[];
  const ordersLine = orders.length
    ? `已购买项目(共${orders.length}单):${orders.map((o) => o.package_name || o.package_key).filter(Boolean).slice(0, 5).join("、")}`
    : "尚未购买任何付费项目（可适度引导）";

  const history = (historyRes.data || []) as any[];
  const historyOther = history.filter(
    (h) => h.partner_assessment_templates?.assessment_key !== currentAssessmentKey
  );
  const historyLine = historyOther.length
    ? `近期还做过的测评:${historyOther
        .slice(0, 3)
        .map((h) => `${h.partner_assessment_templates?.title}(主要模式:${h.primary_pattern || "未知"})`)
        .join("、")}`
    : "这是TA最近做的第一份测评";

  return { profileLine, ordersLine, historyLine, nickname };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = (await req.json()) as InsightRequest;
    const {
      dimensionScores,
      primaryPattern,
      totalScore,
      maxScore,
      aiInsightPrompt,
      title,
      userId,
      resultId,
      assessmentKey,
    } = body;

    console.log("[insight] start", { userId, resultId, assessmentKey, title });

    const isMaleMidlifeVitality =
      String(title || "").includes("有劲") || String(title || "").includes("男性");

    const ctx = await buildUserContext(userId, assessmentKey);
    const nickname = (ctx as any).nickname || "朋友";

    const baseSystem =
      aiInsightPrompt ||
      `你是劲老师，一位温暖专业的心理教练。请基于测评结果与用户画像提供高度个性化的建议。
要求：
1. 第一句必须使用昵称直接称呼，例如"${nickname}，..."
2. 用 1-2 句温暖地概括 TA 的状态特点（结合主要模式）
3. 给出 3 条具体可执行的改善建议（每条 30 字内，使用动词开头）
4. 如果 TA 之前做过其他测评或购买过项目，自然地引用一次（不堆砌）
5. 末尾推荐 1 个最匹配 TA 当前状态的下一步动作（训练营/教练/小练习）
6. 语气温暖、像朋友聊天、不说教、不出现"作为AI"
7. 输出纯文本（可换行），不使用 Markdown 符号`;

    const userPrompt = `【用户画像】
${ctx.profileLine}
${ctx.ordersLine}
${ctx.historyLine}

【本次测评】
测评名称：${title || "综合测评"}
${
  isMaleMidlifeVitality
    ? "重要评分说明：本测评原始分是\"恢复阻力分\"，低分代表当前状态更稳，高分代表恢复阻力更高。解读时请转译为\"有劲状态\"。"
    : ""
}
- 主要模式：${primaryPattern || "未知"}
- 综合得分：${totalScore}/${maxScore}
- 各维度得分：${(dimensionScores || []).map((d) => `${d.label} ${d.score}/${d.maxScore}`).join("、")}

请给出针对 ${nickname} 的个性化洞察。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: baseSystem },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[insight] gateway error", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited", code: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required", code: "payment_required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || "";

    if (!insight) {
      throw new Error("Empty insight returned");
    }

    // Persist to DB via service role (bypass RLS, eliminate frontend race)
    if (resultId) {
      const { error: updateErr } = await supabase
        .from("partner_assessment_results")
        .update({ ai_insight: insight })
        .eq("id", resultId);
      if (updateErr) {
        console.error("[insight] db update failed", updateErr);
      } else {
        console.log("[insight] persisted ok", { resultId });
      }
    }

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[insight] error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
