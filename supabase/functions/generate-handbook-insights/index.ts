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
  type: "male_vitality" | "emotion_health" | "women_competitiveness" | "midlife_awakening";
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

const FALLBACK_FULL_READING_WOMEN_COMP =
  "你不是输给了年龄，也不是输给了 95 后。雷达上的几个分数说的是同一件事——你已经太久没把自己手里的牌摆到桌面上。" +
  "凌晨 1 点改完方案，地铁里看到 95 后笑得轻松，朋友圈不敢发观点怕被嘲，谈薪那一刻突然喉咙发紧。" +
  "你以为是'35 岁不香了'，其实是身边没人替你说一句'你已经很厉害了'。" +
  "这 7 天不催你卷得更猛，先陪你把 35 岁后真正长出来的肌肉一项项摆出来——存款、人脉、专业、判断力，每一样都是你的筹码。" +
  "先看见盘面，再决定下一步要不要重新出牌。";

const FALLBACK_FULL_READING_MIDLIFE =
  "你不是没动力，也不是不想再来一次。雷达上的分数说的是同一件事——你脑子里那个圈一直在转，事情还没发生，先在心里跑了 50 圈。" +
  "晚上躺下后想起一件没做的事，又翻来覆去；想做的事拆到一半就放下，怕自己撑不住一年。" +
  "你以为是中年没劲了，其实是'再来一次'被你自己想得太重。这 7 天不催你立 flag，只把'再来一次'缩到今晚就能做完的 5 分钟动作。" +
  "先做完那 5 分钟，你会发现下半场没你想得那么远。";

const COVER_BY_TYPE: Record<Body["type"], string> = {
  male_vitality: "这 7 天，先不解决问题，先让你看清自己卡在哪。",
  emotion_health: "这 7 天，先不催你做任何决定，先让你被自己温柔地接住。",
  women_competitiveness: "这 7 天，不卷年轻、不比赛道，先把你已有的筹码摆出来。",
  midlife_awakening: "这 7 天，不喊口号，先把'再来一次'缩到今晚就能做完的 5 分钟。",
};

const DAY7_BY_TYPE: Record<Body["type"], string> = {
  male_vitality: "回头看 7 天前的你，再决定下一步怎么走——可以一个人继续，也可以让顾问陪你走下一程。",
  emotion_health: "你已经走过 7 天了。下一程，不必一个人扛。",
  women_competitiveness: "回头看 Day 1 的你，下一步可以一个人继续出牌，也可以让一群同代人陪你看着。",
  midlife_awakening: "你已经做完 7 天的小动作。下半场，不必一个人扛。",
};

const FULL_BY_TYPE: Record<Body["type"], string> = {
  male_vitality: FALLBACK_FULL_READING_MALE,
  emotion_health: FALLBACK_FULL_READING_FEMALE,
  women_competitiveness: FALLBACK_FULL_READING_WOMEN_COMP,
  midlife_awakening: FALLBACK_FULL_READING_MIDLIFE,
};

const FALLBACK = (type: Body["type"]) => ({
  coverNote: COVER_BY_TYPE[type],
  clusterInsights: {} as Record<string, string>,
  day7Reflection: DAY7_BY_TYPE[type],
  fullReading: FULL_BY_TYPE[type],
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

  const ALLOWED_TYPES: Body["type"][] = [
    "male_vitality",
    "emotion_health",
    "women_competitiveness",
    "midlife_awakening",
  ];
  if (!ALLOWED_TYPES.includes(body.type)) {
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

  const TONE_BY_TYPE: Record<Body["type"], string> = {
    male_vitality:
      "你是一个 38 岁中年男性的同龄朋友，话糙理不糙，不端不装，不讲道理只讲场景。",
    emotion_health:
      "你是 35+ 女性的姐姐，温柔但不哄，戳得到却不戳痛。说人话，不堆专业术语。",
    women_competitiveness:
      "你是 35+ 女性的同代姐姐，洞察她'已有筹码 vs 自我贬低'的撕扯。语气温柔笃定，不卷年轻、不说教、不灌'你可以的'。把已有的资产摆出来给她看。",
    midlife_awakening:
      "你是 40+ 中年的同代朋友，看穿'内耗循环 vs 行动停滞'的死结。语气克制冷静，不灌鸡汤、不喊口号、不立 flag。把'再来一次'缩到 5 分钟可执行动作。",
  };

  const VOCAB_BY_TYPE: Record<Body["type"], string> = {
    male_vitality:
      "可借用的男性日常画面（挑 1-2 个）：凌晨醒来盯天花板、电话振动那一秒肩膀收紧、应酬完在地库里多坐十分钟才上楼、孩子叫'爸爸'时心里那一下、肩颈/腰、'再扛一下'、'撑住就是赢'。",
    emotion_health:
      "可借用的 35+ 女性日常画面（挑 1-2 个）：清晨睁眼第一口气是叹的、深夜手机亮屏的几分钟属于自己、家人需要你时你才像'在'、对镜子说'我没事'、把疲惫翻译成'还行'、'先把所有人安顿好'、月经周期/更年期身体的变化、自我消失感。",
    women_competitiveness:
      "可借用的 35+ 职业女性日常画面（挑 1-2 个）：凌晨 1 点改完方案、地铁上看到 95 后笑得轻松、朋友圈不敢发观点怕被嘲、谈薪那一刻喉咙发紧、面试官问'你都 35 了'、看着同代人的近况自己却说不上来、'酒香不怕巷子深'、不敢报价、把无形资产白送出去。",
    midlife_awakening:
      "可借用的 40+ 中年日常画面（挑 1-2 个）：晚上躺下后想起一件没做的事翻来覆去、想做的事拆到一半就放下、同代人的近况一眼就知道自己却说不上来这一年、'再来一次'被想得太重、孩子升学/父母身体/工作天花板同时压来、'撑住就是赢'但不知道在赢什么、5 分钟动作总被'想清楚'拖住。",
  };

  const tonePrompt = TONE_BY_TYPE[body.type];
  const vocabularyAnchors = VOCAB_BY_TYPE[body.type];

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
      fullReading:
        sanitize(parsed.fullReading) || FALLBACK(body.type).fullReading,
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
