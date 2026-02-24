import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. 验证用户身份
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const userId = claimsData.claims.sub as string;

    // 2. Service role client for data queries
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const since = fourteenDaysAgo.toISOString();

    // 3. 获取用户的对话ID
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId);
    const convoIds = (convos || []).map((c: any) => c.id);

    // 4. 并行查询所有数据源 + 课程目录
    const [
      briefingsRes,
      commBriefingsRes,
      parentRes,
      vibrantRes,
      emotionLogsRes,
      checkinRes,
      journalRes,
      watchHistoryRes,
      coursesRes,
    ] = await Promise.all([
      // 教练简报
      convoIds.length > 0
        ? supabase
            .from("briefings")
            .select("emotion_theme, emotion_intensity, insight, action")
            .in("conversation_id", convoIds)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] }),
      convoIds.length > 0
        ? supabase
            .from("communication_briefings")
            .select(
              "communication_theme, communication_difficulty, growth_insight, micro_action"
            )
            .in("conversation_id", convoIds)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] }),
      supabase
        .from("parent_coaching_sessions")
        .select("summary, micro_action")
        .eq("user_id", userId)
        .not("briefing_id", "is", null)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(3),
      convoIds.length > 0
        ? supabase
            .from("vibrant_life_sage_briefings")
            .select("user_issue_summary, reasoning")
            .in("conversation_id", convoIds)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] }),
      // 情绪快速记录
      supabase
        .from("emotion_quick_logs")
        .select("emotion_intensity, note, created_at")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10),
      // 打卡数据
      supabase
        .from("camp_daily_progress")
        .select(
          "is_checked_in, reflection_completed, video_learning_completed, progress_date"
        )
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(14),
      // 日记
      supabase
        .from("wealth_journal_entries")
        .select("emotion_block, belief_block, behavior_block")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5),
      // 观看历史
      supabase
        .from("video_watch_history")
        .select("video_id")
        .eq("user_id", userId),
      // 课程目录
      supabase.from("video_courses").select("*"),
    ]);

    const courses = coursesRes.data || [];
    if (courses.length === 0) {
      return new Response(
        JSON.stringify({ summary: "", recommendations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. 组装用户画像
    const watchedIds = new Set(
      (watchHistoryRes.data || []).map((w: any) => w.video_id)
    );

    const profileParts: string[] = [];

    // 教练简报
    const allBriefings = [
      ...(briefingsRes.data || []).map(
        (b: any) =>
          `情绪主题:${b.emotion_theme}, 强度:${b.emotion_intensity}, 洞察:${b.insight || ""}`
      ),
      ...(commBriefingsRes.data || []).map(
        (b: any) =>
          `沟通主题:${b.communication_theme}, 难度:${b.communication_difficulty}, 洞察:${b.growth_insight || ""}`
      ),
      ...(parentRes.data || []).map(
        (b: any) => `亲子摘要:${b.summary || ""}, 行动:${b.micro_action || ""}`
      ),
      ...(vibrantRes.data || []).map(
        (b: any) =>
          `生活问题:${b.user_issue_summary || ""}, 分析:${(b.reasoning || "").substring(0, 100)}`
      ),
    ];
    if (allBriefings.length > 0) {
      profileParts.push(`【教练简报】\n${allBriefings.join("\n")}`);
    }

    // 日记
    const journals = journalRes.data || [];
    if (journals.length > 0) {
      const journalTexts = journals
        .map(
          (j: any) =>
            [j.emotion_block, j.belief_block, j.behavior_block]
              .filter(Boolean)
              .join("; ") || ""
        )
        .filter(Boolean);
      if (journalTexts.length > 0) {
        profileParts.push(`【日记】\n${journalTexts.join("\n")}`);
      }
    }

    // 情绪记录
    const emotions = emotionLogsRes.data || [];
    if (emotions.length > 0) {
      const avgIntensity = (
        emotions.reduce(
          (sum: number, e: any) => sum + (e.emotion_intensity || 0),
          0
        ) / emotions.length
      ).toFixed(1);
      const notes = emotions
        .filter((e: any) => e.note)
        .map((e: any) => e.note)
        .slice(0, 3);
      profileParts.push(
        `【情绪记录】共${emotions.length}条，平均强度${avgIntensity}${notes.length > 0 ? `，备注: ${notes.join("; ")}` : ""}`
      );
    }

    // 打卡数据
    const checkins = checkinRes.data || [];
    if (checkins.length > 0) {
      const checkedIn = checkins.filter((c: any) => c.is_checked_in).length;
      const reflected = checkins.filter(
        (c: any) => c.reflection_completed
      ).length;
      profileParts.push(
        `【打卡数据】近14天${checkins.length}条记录，打卡率${Math.round((checkedIn / checkins.length) * 100)}%，反思完成率${Math.round((reflected / checkins.length) * 100)}%`
      );
    }

    // 检查是否有足够数据
    if (profileParts.length === 0) {
      return new Response(
        JSON.stringify({
          summary: "",
          recommendations: [],
          no_data: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userProfile = profileParts.join("\n\n");

    // 6. 准备课程列表（排除已看过的）
    const availableCourses = courses.filter(
      (c: any) => !watchedIds.has(c.id)
    );
    const courseList = availableCourses
      .map(
        (c: any, i: number) =>
          `${i}. [${c.category || "其他"}] ${c.title} - ${(c.description || "").substring(0, 60)}`
      )
      .join("\n");

    // 7. 一次 AI 调用
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `你是一个成长课程推荐专家。根据用户的全方位成长画像，从课程库中推荐5-8个最匹配的课程。

## 用户成长画像
${userProfile}

## 可用课程（共${availableCourses.length}个，已排除用户看过的${watchedIds.size}个）
${courseList}

请返回JSON格式，包含一句话用户成长摘要和推荐列表：
{
  "summary": "一句话总结用户当前成长状态（如：最近关注焦虑管理和亲子沟通，情绪强度偏高）",
  "recommendations": [
    {
      "course_index": 课程编号(0-based，对应上面的编号),
      "reason": "2-3句推荐理由，引用具体数据（如：你最近3次情绪记录显示焦虑强度平均7.2，这门课教你...）",
      "match_score": 匹配度(0-100),
      "data_sources": ["情绪记录", "教练简报"]
    }
  ]
}

要求：
1. 推荐理由必须引用用户的具体数据，说明"为什么推荐"
2. data_sources 从以下选择：教练简报、日记、情绪记录、打卡数据
3. 按匹配度从高到低排序
4. 只返回JSON，不要其他文字`;

    // 扣费一次
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")!}/functions/v1/deduct-quota`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feature_key: "course_recommendation_v2",
          source: "recommend_courses_v2",
        }),
      });
    } catch (e) {
      console.error("扣费失败:", e);
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI额度不足，请充值" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse AI response:", aiContent);
      return new Response(
        JSON.stringify({ summary: "", recommendations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // 8. 映射课程详情
    const recommendations = (parsed.recommendations || [])
      .map((rec: any) => {
        const course = availableCourses[rec.course_index];
        if (!course) return null;
        return {
          id: course.id,
          title: course.title,
          video_url: course.video_url,
          description: course.description,
          category: course.category,
          source: course.source,
          reason: rec.reason,
          match_score: rec.match_score,
          data_sources: rec.data_sources || [],
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    console.log(
      `✅ recommend-courses-v2: ${recommendations.length} recommendations for user ${userId}`
    );

    return new Response(
      JSON.stringify({
        summary: parsed.summary || "",
        recommendations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("recommend-courses-v2 error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        summary: "",
        recommendations: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
