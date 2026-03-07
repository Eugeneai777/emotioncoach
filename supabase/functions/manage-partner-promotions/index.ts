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
    const body = await req.json();
    const { action, partner_id } = body;

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

    if (action === "list") {
      const { data: promotions } = await adminClient
        .from("partner_promotions")
        .select("*")
        .eq("partner_id", partner_id)
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ promotions: promotions || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { title, promotion_type, description, original_price, promo_price, max_participants, starts_at, ends_at, promo_code } = body;

      const { data, error } = await adminClient
        .from("partner_promotions")
        .insert({
          partner_id,
          title,
          promotion_type: promotion_type || "flash_sale",
          description: description || null,
          original_price: original_price || null,
          promo_price,
          max_participants: max_participants || null,
          starts_at,
          ends_at,
          promo_code: promo_code || null,
          status: "draft",
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ promotion: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_status") {
      const { promotion_id, status } = body;
      await adminClient
        .from("partner_promotions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", promotion_id)
        .eq("partner_id", partner_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "未知操作" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("manage-partner-promotions error:", err);
    return new Response(JSON.stringify({ error: err.message || "服务器错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
