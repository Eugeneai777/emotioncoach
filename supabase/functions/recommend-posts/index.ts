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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("缺少环境变量");
      return new Response(
        JSON.stringify({ recommendedPostIds: [], strategy: "config_error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract userId from JWT token for security
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "未授权", recommendedPostIds: [], strategy: "auth_error" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || supabaseKey);
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("认证失败:", authError);
      return new Response(
        JSON.stringify({ error: "认证失败", recommendedPostIds: [], strategy: "auth_error" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log("开始推荐，用户ID:", userId);
    
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    // 获取用户的点赞历史 - 优化查询速度，只取最近15条
    const { data: likes, error: likesError } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15);

    if (likesError) {
      console.error("获取点赞历史失败:", likesError);
    }

    // 获取用户的评论历史 - 优化查询速度，只取最近15条
    const { data: comments, error: commentsError } = await supabase
      .from("post_comments")
      .select("post_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15);

    if (commentsError) {
      console.error("获取评论历史失败:", commentsError);
    }

    console.log("用户历史数据 - 点赞:", likes?.length || 0, "评论:", comments?.length || 0);

    // 如果没有足够的历史数据，返回热门帖子
    if ((!likes || likes.length < 3) && (!comments || comments.length < 3)) {
      console.log("历史数据不足，返回热门帖子");
      const { data: popularPosts, error: popularError } = await supabase
        .from("community_posts")
        .select("id")
        .order("likes_count", { ascending: false })
        .limit(10);

      if (popularError) {
        console.error("获取热门帖子失败:", popularError);
        throw new Error("获取热门帖子失败");
      }

      return new Response(
        JSON.stringify({
          recommendedPostIds: popularPosts?.map(p => p.id) || [],
          strategy: "popular"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 获取点赞和评论的帖子详情
    const likedPostIds = likes?.map(l => l.post_id) || [];
    const commentedPostIds = comments?.map(c => c.post_id) || [];
    const allInteractedPostIds = [...new Set([...likedPostIds, ...commentedPostIds])];

    let interactedPosts: any[] = [];
    if (allInteractedPostIds.length > 0) {
      const { data: posts } = await supabase
        .from("community_posts")
        .select("id, post_type, emotion_theme")
        .in("id", allInteractedPostIds.slice(0, 20)); // 限制数量
      interactedPosts = posts || [];
    }

    // 如果没有配置 Lovable AI，使用简单推荐策略
    if (!lovableApiKey) {
      console.log("未配置AI，使用简单推荐策略");
      // 提取用户喜欢的内容类型
      const likedTypes = new Map<string, number>();
      const likedThemes = new Map<string, number>();

      interactedPosts.forEach((post: any) => {
        const type = post.post_type;
        const theme = post.emotion_theme;
        likedTypes.set(type, (likedTypes.get(type) || 0) + 1);
        if (theme) likedThemes.set(theme, (likedThemes.get(theme) || 0) + 1);
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
    console.log("使用AI推荐");
    
    // 简化用户行为数据
    const typeMap = new Map<string, number>();
    const themeMap = new Map<string, number>();
    
    interactedPosts.forEach((post: any) => {
      typeMap.set(post.post_type, (typeMap.get(post.post_type) || 0) + 1);
      if (post.emotion_theme) {
        themeMap.set(post.emotion_theme, (themeMap.get(post.emotion_theme) || 0) + 1);
      }
    });
    
    const preferredTypes = Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
    
    const preferredThemes = Array.from(themeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
    
    const userBehavior = { preferredTypes, preferredThemes };

    // 获取候选帖子（减少数量和字段以提高速度）
    const { data: candidatePosts } = await supabase
      .from("community_posts")
      .select("id, post_type, emotion_theme, likes_count")
      .order("created_at", { ascending: false })
      .limit(20); // 减少到20条

    console.log("候选帖子数量:", candidatePosts?.length);

    // 添加超时控制的 AI 调用 - 减少到5秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("AI调用超时，中止请求");
      controller.abort();
    }, 5000); // 5秒超时

    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite", // 使用更快的模型
          messages: [
            {
              role: "system",
              content: "你是推荐专家。基于用户偏好，从候选帖子中选择10个最匹配的帖子ID。只返回帖子ID数组。"
            },
            {
              role: "user",
              content: `用户偏好：类型=${userBehavior.preferredTypes.join(',')}，主题=${userBehavior.preferredThemes.join(',')}。候选：${JSON.stringify(candidatePosts?.map(p => ({id: p.id, t: p.post_type, e: p.emotion_theme})))}。选10个。`
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

      clearTimeout(timeoutId);

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`AI API error: ${aiResponse.status}`, errorText);
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      console.log("AI响应成功");
      
      const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
      let aiRecommendedIds = toolCall
        ? JSON.parse(toolCall.function.arguments).postIds
        : [];
      
      // 🚨 强制包含最新的3条帖子，确保新内容及时展示
      const latestPostIds = candidatePosts?.slice(0, 3).map(p => p.id) || [];
      
      // 合并：最新帖子优先 + AI推荐（去重）
      const mergedIds = [...new Set([...latestPostIds, ...aiRecommendedIds])].slice(0, 10);
      
      console.log("推荐的帖子数量:", mergedIds.length, "（含最新3条）");
      
      return new Response(
        JSON.stringify({
          recommendedPostIds: mergedIds,
          strategy: "ai"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (aiError) {
      clearTimeout(timeoutId);
      
      // 区分不同类型的错误
      if (aiError instanceof Error && aiError.name === 'AbortError') {
        console.error("AI调用超时，使用回退策略");
      } else {
        console.error("AI调用失败，使用回退策略:", aiError);
      }
      
      // AI失败时回退到基于like_count的推荐
      const fallbackIds = candidatePosts?.slice(0, 10).map(p => p.id) || [];
      return new Response(
        JSON.stringify({
          recommendedPostIds: fallbackIds,
          strategy: "ai_fallback"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("推荐失败:", error);
    
    // 发生错误时返回空数组而不是500错误，让前端使用本地数据
    // 这样即使网络问题也不会导致页面崩溃
    return new Response(
      JSON.stringify({
        recommendedPostIds: [],
        strategy: "error_graceful",
        message: "推荐服务暂时不可用"
      }),
      { 
        status: 200, // 返回200而非500，避免前端崩溃
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
