import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhook_url, test, contact_name, alert_type, alert_level, message, details } = await req.json();

    if (!webhook_url) {
      throw new Error("Missing webhook_url");
    }

    let content: Record<string, unknown>;

    if (test) {
      content = {
        msgtype: "markdown",
        markdown: {
          content: `## 🔔 告警测试通知\n\n> 联系人：**${contact_name || "未知"}**\n> 时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}\n\n✅ 企业微信告警通道连通正常`,
        },
      };
    } else {
      const levelEmoji: Record<string, string> = {
        critical: "🔴",
        high: "🟠",
        medium: "🟡",
      };
      const emoji = levelEmoji[alert_level] || "⚠️";

      content = {
        msgtype: "markdown",
        markdown: {
          content: `## ${emoji} 系统告警通知\n\n> **级别**：${alert_level?.toUpperCase() || "UNKNOWN"}\n> **类型**：${alert_type || "未知"}\n> **时间**：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}\n\n**问题描述**：\n${message || "无详细描述"}\n\n${details ? `**详细信息**：\n${details}` : ""}`,
        },
      };
    }

    const resp = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`WeChat Work API failed [${resp.status}]: ${text}`);
    }

    const result = await resp.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Emergency alert error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
