import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI服务未配置" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "未登录" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "未登录" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { action, partner_id, copy_type, context, copy_id } = await req.json();

    if (!partner_id) {
      return new Response(JSON.stringify({ error: "缺少 partner_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify access
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = callerRoles?.some((r: any) => r.role === "admin");
    let isAuthorized = isAdmin;

    if (!isAdmin) {
      const isPartnerAdmin = callerRoles?.some((r: any) => r.role === "partner_admin");
      if (isPartnerAdmin) {
        const { data: binding } = await adminClient
          .from("partner_admin_bindings")
          .select("id")
          .eq("user_id", user.id)
          .eq("partner_id", partner_id)
          .maybeSingle();
        isAuthorized = !!binding;
      }
      // Also check if user is the partner owner
      if (!isAuthorized) {
        const { data: partner } = await adminClient
          .from("partners")
          .select("user_id")
          .eq("id", partner_id)
          .single();
        isAuthorized = partner?.user_id === user.id;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "无权操作" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: generate
    if (action === "generate") {
      if (!copy_type || !context) {
        return new Response(JSON.stringify({ error: "请选择文案类型并提供产品信息" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get partner info for context
      const { data: partner } = await adminClient
        .from("partners")
        .select("partner_code, company_name, traffic_source")
        .eq("id", partner_id)
        .single();

      const typePrompts: Record<string, string> = {
        wechat_moment: "朋友圈推广文案，要求：简洁有力，3-5行，带emoji，有号召力，适合转发。不需要配图说明。",
        xiaohongshu: "小红书笔记文案，要求：标题吸引眼球（带emoji），正文分段清晰，有个人体验感，带话题标签(#)，800字左右。",
        short_video: "短视频口播脚本，要求：开头3秒抓注意力，中间讲痛点和方案，结尾引导行动。标注【画面】和【口播】。时长约60秒。",
        poster_text: "海报/传单文案，要求：主标题（8字以内）、副标题、3个核心卖点（每个10字以内）、行动号召语。格式清晰分段。",
      };

      const systemPrompt = `你是一位资深营销文案专家，擅长为教育/个人成长类产品撰写高转化率的推广文案。
请基于用户提供的产品/服务信息，生成专业的营销文案。
${partner?.company_name ? `品牌/公司名: ${partner.company_name}` : ""}
要求：
- 文案要有温度、有共鸣，避免硬广感
- 突出用户价值和痛点解决
- 语言自然流畅，适合目标平台的阅读习惯
- 直接输出文案内容，不要加"以下是文案"等前缀`;

      const userPrompt = `请为以下产品/服务生成${typePrompts[copy_type] || "推广文案"}

产品/服务信息：
${context}`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
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
          return new Response(JSON.stringify({ error: "AI服务繁忙，请稍后再试" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const generatedContent = aiData.choices?.[0]?.message?.content || "";

      if (!generatedContent) {
        return new Response(JSON.stringify({ error: "AI生成失败，请重试" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save to DB
      const { data: saved, error: saveError } = await adminClient
        .from("partner_marketing_copies")
        .insert({
          partner_id,
          copy_type,
          content: generatedContent,
          metadata: { context, model: "gemini-3-flash-preview" },
          created_by: user.id,
        })
        .select("id, content, copy_type, created_at")
        .single();

      if (saveError) console.error("Save copy error:", saveError);

      return new Response(JSON.stringify({ content: generatedContent, saved }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list
    if (action === "list") {
      const { data: copies } = await adminClient
        .from("partner_marketing_copies")
        .select("id, copy_type, title, content, is_favorite, created_at")
        .eq("partner_id", partner_id)
        .order("created_at", { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({ copies: copies || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: delete
    if (action === "delete" && copy_id) {
      await adminClient
        .from("partner_marketing_copies")
        .delete()
        .eq("id", copy_id)
        .eq("partner_id", partner_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: toggle_favorite
    if (action === "toggle_favorite" && copy_id) {
      const { data: current } = await adminClient
        .from("partner_marketing_copies")
        .select("is_favorite")
        .eq("id", copy_id)
        .single();

      await adminClient
        .from("partner_marketing_copies")
        .update({ is_favorite: !current?.is_favorite })
        .eq("id", copy_id);

      return new Response(JSON.stringify({ success: true, is_favorite: !current?.is_favorite }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "未知操作" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-partner-copy error:", err);
    return new Response(JSON.stringify({ error: err.message || "服务器错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
