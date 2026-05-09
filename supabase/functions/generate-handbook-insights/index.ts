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

const FALLBACK_FULL_READING_MALE =
  "你现在不是不行，只是太久没让自己真正歇过。雷达上的几个分数说的是同一件事——你已经把'撑住'练成了本能，连自己累不累都懒得问了。" +
  "凌晨醒来盯天花板，电话振动那一秒肩膀先收紧，应酬完开车回家在地库里能多坐十分钟才上楼。你以为这只是这阵子忙，其实是身体在用最小声的方式提醒你：" +
  "再这么扛下去，赢的不是你。这 7 天，不用你立刻改变什么，先把'我必须再扛一下'这句话放下来一格。先看清自己卡在哪，再决定下一步要不要继续一个人走。";

const FALLBACK_FULL_READING_FEMALE =
  "你不是矫情，也不是太敏感。雷达上的这几个分数，说的是同一件事——你已经太久把自己放在最后一个被照顾的人。" +
  "清晨睁眼第一口气是叹的，深夜手机亮屏才有几分钟属于自己，家人需要你的时候你才像'在'，对着镜子说'我没事'已经成了肌肉记忆。" +
  "你把所有疲惫都翻译成了'还行'，把所有委屈都收进了'算了'。这 7 天，不催你做任何决定，也不让你立刻变好。" +
  "只是先让你被自己温柔地接住——允许有一刻不必先安顿别人，允许把'应该'放下一格。先回到自己，再谈下一步。";

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
  fullReading:
    type === "male_vitality" ? FALLBACK_FULL_READING_MALE : FALLBACK_FULL_READING_FEMALE,
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

  const vocabularyAnchors =
    body.type === "male_vitality"
      ? "可借用的男性日常画面（不要堆砌，挑 1-2 个就好）：凌晨醒来盯天花板、电话振动那一秒肩膀收紧、应酬完在地库里多坐十分钟才上楼、孩子叫'爸爸'时心里那一下、肩颈/腰、'再扛一下'、'撑住就是赢'。"
      : "可借用的 35+ 女性日常画面（不要堆砌，挑 1-2 个就好）：清晨睁眼第一口气是叹的、深夜手机亮屏的几分钟属于自己、家人需要你时你才像'在'、对镜子说'我没事'、把疲惫翻译成'还行'、'先把所有人安顿好'、月经周期/更年期身体的变化、自我消失感。";

  const systemPrompt = `${tonePrompt}
你正在为一份 7 天伴随手册写文字。要求：
- coverNote / clusterInsights / day7Reflection：每段不超过 60 字，像在跟朋友说话
- fullReading（这是重头戏）：300-450 字一段，分 3 个层次：
  ① 看见此刻——结合 TA 的雷达分数，说回 TA 的某个日常画面，让 TA 感觉"这写的就是我"
  ② 命名困住 TA 的那条隐形规则（例如"必须先把所有人安顿好"或"撑住就是赢"），把它说出来
  ③ 递一句不催促的下一步，自然过渡到"这 7 天先做什么"，不喊口号、不'你可以的/加油'
- 整体禁用：emoji、列条目、专业术语堆砌、空洞励志语
${vocabularyAnchors}
返回严格的 JSON：{"coverNote": string, "clusterInsights": {<clusterKey>: string}, "day7Reflection": string, "fullReading": string}`;

  const userPrompt = `用户：${body.displayName || "TA"}
最弱维度：${body.weakestLabel || body.weakestKey || "未知"}
总分：${body.totalScore ?? "未知"}
场景簇答题摘要：
${clusters.map((c) => `- [${c.key}] ${c.title}：${c.summary}`).join("\n")}

请输出：
1. coverNote：1 段开场白（≤60 字），让 TA 感觉"被看见"
2. clusterInsights：对每个簇 key 写 1 段心里话（≤60 字）
3. day7Reflection：1 段第 7 天的话（≤60 字），自然过渡到"下一步可以让顾问陪 TA 走"
4. fullReading：300-450 字的完整心里话（按上面 3 个层次写）`;

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
