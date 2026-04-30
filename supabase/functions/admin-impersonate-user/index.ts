import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const SITE_URL =
  Deno.env.get("VITE_PRODUCTION_URL") ||
  "https://feel-name-transform-coach.lovable.app";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "未登录,请刷新后重试" }, 401);
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } =
      await supabaseAdmin.auth.getUser(jwt);

    if (authError || !user) {
      return jsonResponse({ error: "认证失败" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action || "search";

    // ====== end action: 任何登录用户均可调用,标记结束自己被模拟会话 ======
    if (action === "end") {
      const token = String(body?.token || "");
      if (!token) {
        return jsonResponse({ error: "缺少 token" }, 400);
      }
      const { error: uErr } = await supabaseAdmin
        .from("admin_impersonation_logs")
        .update({ ended_at: new Date().toISOString() })
        .eq("magic_link_token", token)
        .is("ended_at", null);
      if (uErr) console.error("[impersonate] end error", uErr);
      return jsonResponse({ success: true });
    }

    // ====== 以下 action 需 admin 权限 ======
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return jsonResponse({ error: "需要管理员权限" }, 403);
    }

    // ====== search ======
    if (action === "search") {
      const query = String(body?.query || "").trim();
      if (!query) {
        return jsonResponse({ error: "请输入昵称或手机号" }, 400);
      }

      const phoneClean = query.replace(/[\s\-]/g, "");
      const isPhone = /^\d{4,}$/.test(phoneClean);

      let qb = supabaseAdmin
        .from("profiles")
        .select(
          "id, display_name, avatar_url, phone, phone_country_code, deleted_at"
        )
        .is("deleted_at", null)
        .limit(20);

      if (isPhone) {
        qb = qb.ilike("phone", `%${phoneClean}%`);
      } else {
        qb = qb.ilike("display_name", `%${query}%`);
      }

      const { data: profiles, error: pErr } = await qb;
      if (pErr) {
        return jsonResponse({ error: `搜索失败: ${pErr.message}` }, 500);
      }

      return jsonResponse({
        success: true,
        candidates: (profiles || []).map((p: any) => ({
          userId: p.id,
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
          phone: p.phone,
          phoneCountryCode: p.phone_country_code,
        })),
      });
    }

    // ====== generate ======
    if (action === "generate") {
      const targetUserId = String(body?.targetUserId || "");
      const reason = String(body?.reason || "").trim();
      const openedVia = String(body?.openedVia || "web");

      if (!targetUserId) {
        return jsonResponse({ error: "缺少目标用户ID" }, 400);
      }
      if (!reason || reason.length < 4) {
        return jsonResponse({ error: "请填写排查原因(至少4个字)" }, 400);
      }

      // 不允许模拟其他 admin
      const { data: targetRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId)
        .eq("role", "admin");
      if (targetRoles && targetRoles.length > 0) {
        return jsonResponse({ error: "不允许模拟其他管理员账号" }, 403);
      }

      const { data: targetAuth, error: tErr } =
        await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (tErr || !targetAuth?.user) {
        return jsonResponse({ error: "目标用户不存在" }, 404);
      }
      const targetEmail = targetAuth.user.email;
      if (!targetEmail) {
        return jsonResponse(
          { error: "目标用户无邮箱,无法生成登录链接" },
          400
        );
      }

      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("display_name, phone")
        .eq("id", targetUserId)
        .maybeSingle();

      const { data: linkData, error: linkErr } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: targetEmail,
          options: {
            redirectTo: `${SITE_URL}/?impersonating=1`,
          },
        });

      if (linkErr || !linkData) {
        console.error("[impersonate] generateLink error", linkErr);
        return jsonResponse(
          { error: `生成链接失败: ${linkErr?.message || "unknown"}` },
          500
        );
      }

      const actionLink =
        (linkData as any)?.properties?.action_link ||
        (linkData as any)?.action_link ||
        null;

      if (!actionLink) {
        return jsonResponse({ error: "未能获取登录链接" }, 500);
      }

      const tokenMatch = actionLink.match(/[?&]token=([^&]+)/);
      const token = tokenMatch?.[1] || null;

      const adminIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
      const adminUa = req.headers.get("user-agent") || null;

      const { error: logErr } = await supabaseAdmin
        .from("admin_impersonation_logs")
        .insert({
          admin_user_id: user.id,
          target_user_id: targetUserId,
          target_display_name: targetProfile?.display_name || null,
          target_phone: targetProfile?.phone || null,
          reason,
          magic_link_token: token,
          opened_via: openedVia,
          admin_ip: adminIp,
          admin_user_agent: adminUa,
        });

      if (logErr) {
        console.error("[impersonate] audit log error", logErr);
      }

      return jsonResponse({
        success: true,
        actionLink,
        token,
        targetUserId,
        targetDisplayName: targetProfile?.display_name || null,
        targetPhone: targetProfile?.phone || null,
      });
    }

    // ====== history ======
    if (action === "history") {
      const { data: logs, error: lErr } = await supabaseAdmin
        .from("admin_impersonation_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);
      if (lErr) {
        return jsonResponse({ error: lErr.message }, 500);
      }
      return jsonResponse({ success: true, logs: logs || [] });
    }

    return jsonResponse({ error: "未知 action" }, 400);
  } catch (e: any) {
    console.error("[impersonate] fatal", e);
    return jsonResponse({ error: e?.message || "服务器错误" }, 500);
  }
});
