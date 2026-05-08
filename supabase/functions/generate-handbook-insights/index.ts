import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sanitize = (s: unknown): string => {
  if (!s) return "";
  return String(s).replace(/[\u0000-\u001F\u200B-\u200D\uFEFF]/g, "").trim();
};

interface ClusterInput {
  key: string;
  title: string;
  /** 这个簇里用户答案的简明摘要文本 */
  summary: string;
}

interface Body {
  recordId: string;
  type: "male_vitality" | "emotion_health";
  /** 主导维度 / 主反应模式 key（如 energy / exhaustion） */
  weakestKey?: string | null;
  /** 主导维度的中文名 */
  weakestLabel?: string | null;
  /** 显示用昵称（脱敏后） */
  displayName?: string | null;
  /** 5 / 4 个簇的摘要 */
  clusters: ClusterInput[];
  /** 总分 / 关键指标 */
  totalScore?: number | null;
}

const FALLBACK = (type: Body["type"]) => ({
  coverNote:
    type === "male_vitality"
      ? "这 7 天，先不解决问题，先让你看清自己卡在哪。"
      : "这 7 天，先不催你做任何决定，先让你被自己温柔地接住。",
  clusterInsights: {} as Record<string, string>,
  day7Reflection:
    type === "male_vitality"
      ? "回头看 7 天前的你，再决定下一步怎么走——可以一个人继续，也可以让顾问陪你走下一程。"
      : "你已经走过 7 天了。下一程，不必一个人扛。",
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "无效的请求体" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body.recordId || typeof body.recordId !== "string") {
    return new Response(JSON.stringify({ error: "缺少 recordId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (body.type !== "male_vitality" && body.type !== "emotion_health") {
    return new Response(JSON.stringify({ error: "type 不合法" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clusters = Array.isArray(body.clusters) ? body.clusters.slice(0, 8) : [];

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ recordId: body.recordId, insights: FALLBACK(body.type) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const tonePrompt =
    body.type === "male_vitality"
      ? "你是一个 38 岁中年男性的同龄朋友，话糙理不糙，不端不装，不讲道理只讲场景。"
      : "你是 35+ 女性的姐姐，温柔但不哄，戳得到却不戳痛。说人话，不堆专业术语。";

  const systemPrompt = `${tonePrompt}
你正在为一份 7 天伴随手册写"心里话"片段。要求：
- 不超过 60 字一段，像在跟朋友说话
- 不喊口号、不写"加油"、"你可以的"
- 不要 emoji
- 不要列条目，写连贯的一句话或两句话
返回严格的 JSON：{"coverNote": string, "clusterInsights": {<clusterKey>: string}, "day7Reflection": string}`;

  const userPrompt = `用户：${body.displayName || "TA"}
最弱维度：${body.weakestLabel || body.weakestKey || "未知"}
总分：${body.totalScore ?? "未知"}
场景簇答题摘要：
${clusters.map((c) => `- [${c.key}] ${c.title}：${c.summary}`).join("\n")}

请：
1. coverNote：1 段开场白，让 TA 感觉"被看见"
2. clusterInsights：对每个簇 key 写 1 段心里话
3. day7Reflection：1 段第 7 天的话，自然过渡到"下一步可以让顾问陪你走"`;

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text().catch(() => "");
      console.error("[generate-handbook-insights] AI gateway error", aiRes.status, txt);
      return new Response(
        JSON.stringify({ recordId: body.recordId, insights: FALLBACK(body.type), degraded: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ai = await aiRes.json();
    const raw = ai?.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      parsed = {};
    }

    const insights = {
      coverNote: sanitize(parsed.coverNote) || FALLBACK(body.type).coverNote,
      clusterInsights: Object.fromEntries(
        clusters.map((c) => [
          c.key,
          sanitize(parsed?.clusterInsights?.[c.key]) ||
            "这一格还在你手里，先别急着动它。",
        ]),
      ),
      day7Reflection:
        sanitize(parsed.day7Reflection) || FALLBACK(body.type).day7Reflection,
    };

    return new Response(
      JSON.stringify({ recordId: body.recordId, insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[generate-handbook-insights] Exception", e);
    return new Response(
      JSON.stringify({ recordId: body.recordId, insights: FALLBACK(body.type), degraded: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
