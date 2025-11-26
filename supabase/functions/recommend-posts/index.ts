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
    const { userId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取用户的点赞历史
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id, community_posts(post_type, emotion_theme, title, content)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // 获取用户的评论历史
    const { data: comments } = await supabase
      .from("post_comments")
      .select("post_id, community_posts(post_type, emotion_theme, title, content)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // 如果没有足够的历史数据，返回热门帖子
    if ((!likes || likes.length < 3) && (!comments || comments.length < 3)) {
      const { data: popularPosts } = await supabase
        .from("community_posts")
        .select("id")
        .order("likes_count", { ascending: false })
        .limit(10);

      return new Response(
        JSON.stringify({
          recommendedPostIds: popularPosts?.map(p => p.id) || [],
          strategy: "popular"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 如果没有配置 Lovable AI，使用简单推荐策略
    if (!lovableApiKey) {
      // 提取用户喜欢的内容类型
      const likedTypes = new Map<string, number>();
      const likedThemes = new Map<string, number>();

      likes?.forEach((like: any) => {
        if (like.community_posts) {
          const type = like.community_posts.post_type;
          const theme = like.community_posts.emotion_theme;
          likedTypes.set(type, (likedTypes.get(type) || 0) + 1);
          if (theme) likedThemes.set(theme, (likedThemes.get(theme) || 0) + 1);
        }
      });

      comments?.forEach((comment: any) => {
        if (comment.community_posts) {
          const type = comment.community_posts.post_type;
          const theme = comment.community_posts.emotion_theme;
          likedTypes.set(type, (likedTypes.get(type) || 0) + 1);
          if (theme) likedThemes.set(theme, (likedThemes.get(theme) || 0) + 1);
        }
      });

      // 获取最喜欢的类型
      const preferredType = Array.from(likedTypes.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      // 基于偏好推荐
      let query = supabase
        .from("community_posts")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (preferredType) {
        query = query.eq("post_type", preferredType);
      }

      const { data: recommendedPosts } = await query;

      return new Response(
        JSON.stringify({
          recommendedPostIds: recommendedPosts?.map(p => p.id) || [],
          strategy: "simple"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 使用 Lovable AI 进行智能推荐
    const userBehavior = {
      likedPosts: likes?.map((like: any) => ({
        type: like.community_posts?.post_type,
        theme: like.community_posts?.emotion_theme,
        title: like.community_posts?.title,
      })) || [],
      commentedPosts: comments?.map((comment: any) => ({
        type: comment.community_posts?.post_type,
        theme: comment.community_posts?.emotion_theme,
        title: comment.community_posts?.title,
      })) || [],
    };

    // 获取候选帖子
    const { data: candidatePosts } = await supabase
      .from("community_posts")
      .select("id, post_type, emotion_theme, title, content, likes_count")
      .order("created_at", { ascending: false })
      .limit(50);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "你是一个社区内容推荐专家。基于用户的点赞和评论历史，从候选帖子中选择最符合用户兴趣的10个帖子ID。只返回帖子ID数组，不要其他内容。"
          },
          {
            role: "user",
            content: `用户行为数据：\n${JSON.stringify(userBehavior, null, 2)}\n\n候选帖子：\n${JSON.stringify(candidatePosts, null, 2)}\n\n请选择最适合推荐给该用户的10个帖子ID（优先考虑用户感兴趣的主题和类型）。`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_posts",
              description: "返回推荐的帖子ID列表",
              parameters: {
                type: "object",
                properties: {
                  postIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "推荐的帖子ID数组"
                  }
                },
                required: ["postIds"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "recommend_posts" } }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const recommendedIds = toolCall
      ? JSON.parse(toolCall.function.arguments).postIds
      : candidatePosts?.slice(0, 10).map(p => p.id) || [];

    return new Response(
      JSON.stringify({
        recommendedPostIds: recommendedIds,
        strategy: "ai"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("推荐失败:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "推荐失败" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
