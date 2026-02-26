import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error_id, error_table, error_data } = await req.json();
    if (!error_id || !error_table || !error_data) {
      throw new Error("Missing required fields: error_id, error_table, error_data");
    }

    // Only allow our monitor tables
    const allowedTables = ["monitor_frontend_errors", "monitor_api_errors"];
    if (!allowedTables.includes(error_table)) {
      throw new Error("Invalid table name");
    }

    // Build context for AI
    const isFrontend = error_table === "monitor_frontend_errors";
    const contextParts = [
      `错误类型: ${error_data.error_type}`,
      `错误信息: ${error_data.message}`,
      `页面: ${error_data.page || "未知"}`,
      `平台: ${error_data.platform || "未知"}`,
    ];

    if (isFrontend) {
      if (error_data.stack) contextParts.push(`堆栈:\n${error_data.stack.slice(0, 1500)}`);
      if (error_data.resource_url) contextParts.push(`资源URL: ${error_data.resource_url}`);
      if (error_data.request_info) contextParts.push(`请求: ${error_data.request_info}`);
    } else {
      contextParts.push(`URL: ${error_data.url || ""}`);
      contextParts.push(`状态码: ${error_data.status_code || ""}`);
      contextParts.push(`方法: ${error_data.method || ""}`);
      contextParts.push(`响应时间: ${error_data.response_time || ""}ms`);
      if (error_data.response_body) contextParts.push(`响应体: ${String(error_data.response_body).slice(0, 500)}`);
      if (error_data.model_name) contextParts.push(`模型: ${error_data.model_name}`);
    }

    const systemPrompt = `你是一位资深全栈开发工程师，专注于 Web/移动端/微信小程序的前端和接口异常诊断。
请根据提供的异常信息，输出以下两部分（使用中文）：

## 诊断分析
分析错误的根本原因（2-4句话），包括可能的触发条件和影响范围。

## 修复建议
给出 3-5 条具体、可操作的修复建议，按优先级排序。每条建议包含：
- 具体操作步骤
- 预期效果

注意：建议应面向开发/运维人员，具体且可执行。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextParts.join("\n") },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI 服务请求频率过高，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 服务额度不足" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Split into diagnosis and fix_suggestion
    let diagnosis = content;
    let fixSuggestion = "";

    const fixIdx = content.indexOf("## 修复建议");
    if (fixIdx !== -1) {
      const diagIdx = content.indexOf("## 诊断分析");
      diagnosis = content.slice(diagIdx !== -1 ? diagIdx + 8 : 0, fixIdx).trim();
      fixSuggestion = content.slice(fixIdx + 7).trim();
    }

    // Update DB record
    const { error: updateError } = await supabase
      .from(error_table)
      .update({
        status: "diagnosed",
        diagnosis,
        fix_suggestion: fixSuggestion,
        diagnosed_at: new Date().toISOString(),
      })
      .eq("id", error_id);

    if (updateError) {
      console.error("DB update error:", updateError);
      throw new Error("Failed to save diagnosis");
    }

    return new Response(
      JSON.stringify({ success: true, diagnosis, fix_suggestion: fixSuggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("monitor-diagnose error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
