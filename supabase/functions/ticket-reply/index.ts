import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 鉴权 + 取调用者 user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 校验 admin 角色
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { ticket_id, content, mark_status } = body;

    if (!ticket_id || !content || typeof content !== "string" || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: "ticket_id and content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 拉工单 → 拿 user_id 用于推送
    const { data: ticket, error: tErr } = await supabase
      .from("customer_tickets")
      .select("id, user_id, ticket_no, subject")
      .eq("id", ticket_id)
      .maybeSingle();
    if (tErr || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 写消息（触发器自动 +unread_user_count、刷新 last_message_at）
    const { error: insErr } = await supabase.from("customer_ticket_messages").insert({
      ticket_id,
      sender_type: "admin",
      sender_id: user.id,
      content: content.trim(),
    });
    if (insErr) {
      console.error("Insert message error:", insErr);
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 可选：变更工单状态
    if (mark_status && ["in_progress", "resolved", "closed"].includes(mark_status)) {
      await supabase
        .from("customer_tickets")
        .update({
          status: mark_status,
          ...(mark_status === "resolved" || mark_status === "closed"
            ? { resolved_by: user.id, resolved_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", ticket_id);
      // 系统状态消息
      const label =
        mark_status === "in_progress" ? "客服已认领，处理中" :
        mark_status === "resolved" ? "客服已标记解决" : "工单已关闭";
      await supabase.from("customer_ticket_messages").insert({
        ticket_id,
        sender_type: "system",
        content: label,
      });
    }

    // 异步触发微信模板消息（失败不影响主流程）
    if (ticket.user_id) {
      try {
        await supabase.functions.invoke("send-wechat-template-message", {
          body: {
            user_id: ticket.user_id,
            template_type: "default",
            data: {
              first: { value: "您的工单有新回复", color: "#1AA37A" },
              keyword1: { value: ticket.ticket_no },
              keyword2: { value: content.trim().slice(0, 40) },
              remark: { value: "点击查看完整回复" },
            },
            page: `/my-tickets/${ticket_id}`,
          },
        });
      } catch (e) {
        console.warn("Template push failed (non-fatal):", e);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("ticket-reply error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
