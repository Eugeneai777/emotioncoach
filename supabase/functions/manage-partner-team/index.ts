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

    // Authenticate caller using getClaims
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "未登录" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "未登录" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { action, partner_id, phone, country_code = "+86", user_id_to_remove } = await req.json();

    if (!partner_id) {
      return new Response(JSON.stringify({ error: "缺少 partner_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is authorized (admin or bound partner_admin)
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = callerRoles?.some((r: any) => r.role === "admin");
    let isAuthorizedPartnerAdmin = false;

    if (!isAdmin) {
      const isPartnerAdmin = callerRoles?.some((r: any) => r.role === "partner_admin");
      if (isPartnerAdmin) {
        const { data: binding } = await adminClient
          .from("partner_admin_bindings")
          .select("id")
          .eq("user_id", userId)
          .eq("partner_id", partner_id)
          .maybeSingle();
        isAuthorizedPartnerAdmin = !!binding;
      }
    }

    if (!isAdmin && !isAuthorizedPartnerAdmin) {
      return new Response(JSON.stringify({ error: "无权操作此合伙人" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list
    if (action === "list") {
      const { data: bindings } = await adminClient
        .from("partner_admin_bindings")
        .select("user_id, created_at")
        .eq("partner_id", partner_id);

      if (!bindings || bindings.length === 0) {
        return new Response(JSON.stringify({ members: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userIds = bindings.map((b: any) => b.user_id);
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, display_name, nickname, phone")
        .in("id", userIds);

      const members = bindings.map((b: any) => {
        const profile = profiles?.find((p: any) => p.id === b.user_id);
        return {
          user_id: b.user_id,
          display_name: profile?.display_name || profile?.nickname || "未设置",
          phone: profile?.phone || "",
          bound_at: b.created_at,
        };
      });

      return new Response(JSON.stringify({ members }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: add
    if (action === "add") {
      if (!phone) {
        return new Response(JSON.stringify({ error: "请提供手机号" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by phone
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, display_name, nickname, phone")
        .eq("phone", phone.trim())
        .limit(1);

      if (!profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ error: "未找到该手机号对应的用户" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const targetUserId = profiles[0].id;

      // Check if already bound
      const { data: existing } = await adminClient
        .from("partner_admin_bindings")
        .select("id")
        .eq("user_id", targetUserId)
        .eq("partner_id", partner_id)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "该用户已是此合伙人的团队成员" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add partner_admin role if not exists
      await adminClient
        .from("user_roles")
        .upsert(
          { user_id: targetUserId, role: "partner_admin" },
          { onConflict: "user_id,role" }
        );

      // Create binding
      const { error: bindError } = await adminClient
        .from("partner_admin_bindings")
        .insert({ user_id: targetUserId, partner_id });

      if (bindError) {
        return new Response(JSON.stringify({ error: "绑定失败: " + bindError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `已添加 ${profiles[0].display_name || profiles[0].nickname || phone}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: remove
    if (action === "remove") {
      if (!user_id_to_remove) {
        return new Response(JSON.stringify({ error: "缺少要移除的用户ID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Cannot remove yourself
      if (user_id_to_remove === user.id) {
        return new Response(JSON.stringify({ error: "不能移除自己" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Remove binding
      await adminClient
        .from("partner_admin_bindings")
        .delete()
        .eq("user_id", user_id_to_remove)
        .eq("partner_id", partner_id);

      // Check if user has other bindings
      const { data: otherBindings } = await adminClient
        .from("partner_admin_bindings")
        .select("id")
        .eq("user_id", user_id_to_remove);

      // If no other bindings, remove partner_admin role
      if (!otherBindings || otherBindings.length === 0) {
        await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", user_id_to_remove)
          .eq("role", "partner_admin");
      }

      return new Response(JSON.stringify({ success: true, message: "已移除成员" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "未知操作: " + action }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("manage-partner-team error:", err);
    return new Response(JSON.stringify({ error: err.message || "服务器错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
